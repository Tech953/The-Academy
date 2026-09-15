import { generateOfflineContentPack } from "@workspace/game-engine";

import type { ContentPack, ContentPackEvent } from "./api";

export const BULLETIN_EVENT_LIMIT = 3;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Runtime validation for event records received from the content-pack API.
 * TypeScript types do not protect the app from malformed JSON at this boundary.
 */
export function isDisplayableContentPackEvent(
  value: unknown,
): value is ContentPackEvent {
  if (!value || typeof value !== "object") return false;

  const event = value as Partial<ContentPackEvent>;
  return (
    isNonEmptyString(event.id) &&
    isNonEmptyString(event.title) &&
    isNonEmptyString(event.description) &&
    isNonEmptyString(event.npcReaction) &&
    isNonEmptyString(event.playerHook) &&
    isNonEmptyString(event.category) &&
    typeof event.durationDays === "number" &&
    Number.isFinite(event.durationDays) &&
    event.durationDays > 0 &&
    Array.isArray(event.tags) &&
    event.tags.length > 0 &&
    event.tags.every(isNonEmptyString)
  );
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
  };
}