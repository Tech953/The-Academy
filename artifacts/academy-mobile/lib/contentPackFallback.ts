import {
  CONTENT_PACK_STORAGE_KEY,
  generateOfflineContentPack,
  PACK_ACTIVE_EVENT_LIMIT,
  getContentPackValidationIssues as getSharedContentPackValidationIssues,
  isDisplayableContentPackEvent as isSharedDisplayableContentPackEvent,
  isUsableContentPack as isSharedUsableContentPack,
} from "@workspace/game-engine";

import type {
  ContentPack,
  ContentPackEvent,
  ContentPackValidationIssueCode,
} from "@workspace/game-engine";
import { isRateLimitError } from "@workspace/api-client-react";
import type { ContentSource } from "./enrichmentStatus";

export const BULLETIN_EVENT_LIMIT = PACK_ACTIVE_EVENT_LIMIT;
export { CONTENT_PACK_STORAGE_KEY };

export interface ContentPackStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export type ContentPackWriteQueue = (
  pack: ContentPack,
  isCurrent: () => boolean,
) => Promise<boolean>;

export type ContentPackWriteResult =
  | { status: "written" }
  | { status: "skipped" }
  | { status: "failed"; reason: "invalid-pack" | "storage" };

export type ContentPackStorageStatus = "unknown" | "stored" | "write-failed";

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

/**
 * Validate the complete shape needed by the mobile bulletin and study views.
 * This is intentionally stricter than event-only repair because cached JSON
 * must not be allowed to crash consumers through malformed metadata.
 */
export function isUsableContentPack(
  value: unknown,
  now = Date.now(),
): value is ContentPack {
  return isSharedUsableContentPack(value, now);
}

export type ContentPackCacheIssueCode =
  | ContentPackValidationIssueCode
  | "empty-cache"
  | "invalid-json";

/**
 * Safe diagnostics for persisted or remote JSON. Only stable categories leave
 * this boundary; malformed values and generated text are never returned.
 */
export function getCachedContentPackIssueCodes(
  raw: string | null,
  now = Date.now(),
): ContentPackCacheIssueCode[] {
  if (!raw) return ["empty-cache"];

  try {
    return getSharedContentPackValidationIssues(JSON.parse(raw), now);
  } catch {
    return ["invalid-json"];
  }
}

export function parseCachedContentPack(
  raw: string | null,
  now = Date.now(),
): ContentPack | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return getCachedContentPackIssueCodes(raw, now).length === 0
      ? parsed as ContentPack
      : null;
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
  const result = await writeCachedContentPackResult(storage, pack, now);
  return result.status === "written";
}

export async function writeCachedContentPackResult(
  storage: ContentPackStorage,
  pack: ContentPack,
  now = Date.now(),
): Promise<ContentPackWriteResult> {
  if (!isUsableContentPack(pack, now)) {
    return { status: "failed", reason: "invalid-pack" };
  }

  try {
    await storage.setItem(CONTENT_PACK_STORAGE_KEY, JSON.stringify(pack));
    return { status: "written" };
  } catch {
    return { status: "failed", reason: "storage" };
  }
}

export function getContentPackStorageStatus(
  result: ContentPackWriteResult,
): ContentPackStorageStatus {
  return result.status === "written"
    ? "stored"
    : result.status === "failed"
      ? "write-failed"
      : "unknown";
}

/**
 * Serialize cache writes and re-check request ownership immediately before
 * each mutation. A request can be superseded while an earlier AsyncStorage
 * operation is still pending, so checking only before enqueueing is not enough.
 */
export function createContentPackWriteQueue(
  storage: ContentPackStorage,
): ContentPackWriteQueue {
  const detailedQueue = createContentPackWriteQueueWithResult(storage);

  return async (pack, isCurrent) =>
    (await detailedQueue(pack, isCurrent)).status === "written";
}

export function createContentPackWriteQueueWithResult(
  storage: ContentPackStorage,
): (
  pack: ContentPack,
  isCurrent: () => boolean,
) => Promise<ContentPackWriteResult> {
  let tail: Promise<void> = Promise.resolve();

  return (pack, isCurrent) => {
    const operation = tail
      .catch(() => undefined)
      .then(async () => {
        if (!isCurrent()) return { status: "skipped" } as const;
        return writeCachedContentPackResult(storage, pack);
      });

    tail = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  };
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

/**
 * Keep the last usable bulletin visible while a refresh is waiting on the
 * network. A fresh cache can replace it immediately; an unavailable cache
 * must not clear an already-rendered bulletin.
 */
export function retainVisibleContentPack(
  visiblePack: ContentPack | null,
  cachedPack: ContentPack | null,
): ContentPack | null {
  return cachedPack ?? visiblePack;
}

export interface ContentPackRefreshResult {
  pack: ContentPack;
  source: ContentSource;
}

/**
 * Resolve one connected content-pack refresh without letting a failed request
 * remove the study bulletin. The caller supplies the fetcher so this boundary
 * can be tested without a device or network.
 */
export async function resolveContentPackRefresh(
  fetcher: () => Promise<ContentPack>,
  cachedPack: ContentPack | null,
  day: number,
): Promise<ContentPackRefreshResult> {
  try {
    const pack = ensureUsableContentPack(await fetcher(), day);
    if (!isUsableContentPack(pack)) {
      throw new Error("Content pack was not usable after normalization");
    }
    return { pack, source: "online" };
  } catch (error) {
    return {
      pack: fallbackAfterRefreshFailure(cachedPack, day),
      source: isRateLimitError(error) ? "rate_limited" : "offline",
    };
  }
}