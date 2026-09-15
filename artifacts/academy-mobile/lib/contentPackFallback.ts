import {
  CONTENT_PACK_STORAGE_KEY,
  generateOfflineContentPack,
  isDisplayableContentPackEvent as isSharedDisplayableContentPackEvent,
} from "@workspace/game-engine";

import type { ContentPack, ContentPackEvent } from "./api";

export const BULLETIN_EVENT_LIMIT = 3;
export { CONTENT_PACK_STORAGE_KEY };

export interface ContentPackStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Runtime validation for event records received from the content-pack API.
 * TypeScript types do not protect the app from malformed JSON at this boundary.
 */
export function isDisplayableContentPackEvent(
  value: unknown,
): value is ContentPackEvent {
  return isSharedDisplayableContentPackEvent(value);
}

function eventIdentity(event: ContentPackEvent): string {
  return event.id.trim().toLowerCase();
}

function uniqueDisplayableEvents(events: unknown[]): ContentPackEvent[] {
  const seen = new Set<string>();
  const validEvents: ContentPackEvent[] = [];

  for (const event of events) {
    if (!isDisplayableContentPackEvent(event)) continue;
    const identity = eventIdentity(event);
    if (seen.has(identity)) continue;
    seen.add(identity);
    validEvents.push(event);
  }

  return validEvents;
}

function safeHeadlines(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((headline): headline is string => typeof headline === "string")
    : [];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function hasUsableMoodShift(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.npcId) &&
    isNonEmptyString(value.npcName) &&
    isNonEmptyString(value.emotionState) &&
    isNonEmptyString(value.reason)
  );
}

function hasUsableFocusArea(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.subject) &&
    isNonEmptyString(value.topic) &&
    isNonEmptyString(value.whyNow)
  );
}

/**
 * Validate the complete shape needed by the mobile bulletin and study views.
 * This is intentionally stricter than event-only repair because cached JSON
 * must not be allowed to crash consumers through malformed metadata.
 */
export function isUsableContentPack(
  value: unknown,
  now = Date.now(),
): value is ContentPack {
  if (!isRecord(value)) return false;

  const pack = value as Partial<ContentPack>;
  const events = Array.isArray(pack.activeEvents) ? pack.activeEvents : [];
  const uniqueEvents = uniqueDisplayableEvents(events);

  return (
    isNonEmptyString(pack.version) &&
    isFiniteNumber(pack.generatedAt) &&
    isFiniteNumber(pack.expiresAt) &&
    pack.expiresAt > now &&
    isFiniteNumber(pack.worldSeed) &&
    isNonEmptyString(pack.weeklyTheme) &&
    isNonEmptyString(pack.themeContext) &&
    events.length >= BULLETIN_EVENT_LIMIT &&
    uniqueEvents.length === events.length &&
    Array.isArray(pack.npcMoodShifts) &&
    pack.npcMoodShifts.every(hasUsableMoodShift) &&
    Array.isArray(pack.gedFocusAreas) &&
    pack.gedFocusAreas.length > 0 &&
    pack.gedFocusAreas.every(hasUsableFocusArea) &&
    (pack.generatedBy === "gpt" || pack.generatedBy === "deterministic")
    && (pack.eventsRepaired === undefined || typeof pack.eventsRepaired === "boolean")
  );
}

export function parseCachedContentPack(
  raw: string | null,
  now = Date.now(),
): ContentPack | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isUsableContentPack(parsed, now) ? parsed : null;
  } catch {
    return null;
  }
}

export async function readCachedContentPack(
  storage: ContentPackStorage,
  now = Date.now(),
): Promise<ContentPack | null> {
  try {
    return parseCachedContentPack(
      await storage.getItem(CONTENT_PACK_STORAGE_KEY),
      now,
    );
  } catch {
    return null;
  }
}

export async function writeCachedContentPack(
  storage: ContentPackStorage,
  pack: ContentPack,
  now = Date.now(),
): Promise<boolean> {
  if (!isUsableContentPack(pack, now)) return false;

  try {
    await storage.setItem(CONTENT_PACK_STORAGE_KEY, JSON.stringify(pack));
    return true;
  } catch {
    return false;
  }
}

/**
 * Keep a remote bulletin displayable without trusting its JSON shape.
 *
 * Valid remote events retain their order and object identity. Invalid or
 * duplicate records are removed, then deterministic events fill the remaining
 * bulletin slots without introducing duplicate IDs.
 */
export function ensureUsableContentPack(
  pack: ContentPack,
  day: number,
): ContentPack {
  const rawPack = pack as ContentPack & {
    activeEvents?: unknown;
    rssHeadlines?: unknown;
  };
  const remoteEvents = Array.isArray(rawPack.activeEvents)
    ? uniqueDisplayableEvents(rawPack.activeEvents)
    : [];
  const needsFallback = remoteEvents.length < BULLETIN_EVENT_LIMIT;

  if (!needsFallback) {
    return {
      ...pack,
      activeEvents: remoteEvents.slice(0, BULLETIN_EVENT_LIMIT),
      eventsRepaired: false,
    };
  }

  const fallback = generateOfflineContentPack(day, safeHeadlines(rawPack.rssHeadlines));
  const mergedEvents = uniqueDisplayableEvents([
    ...remoteEvents,
    ...fallback.activeEvents,
  ]).slice(0, BULLETIN_EVENT_LIMIT);

  return {
    ...pack,
    activeEvents: mergedEvents,
    generatedBy: "deterministic",
    eventsRepaired: true,
  };
}

export function fallbackAfterRefreshFailure(
  cachedPack: ContentPack | null,
  day: number,
): ContentPack {
  return cachedPack ?? generateOfflineContentPack(day);
}