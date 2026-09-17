/**
 * ═══════════════════════════════════════════════════════════
 *  THE ACADEMY — CONTENT PACK SCHEMA
 *  Shared between server (generation) and client (consumption).
 *  Generated weekly by cron, distributed to all installs.
 * ═══════════════════════════════════════════════════════════
 */

export interface PackWorldEvent {
  id: string;
  title: string;
  description: string;
  npcReaction: string;
  playerHook: string;
  category: string;
  durationDays: number;
  tags: string[];
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Runtime boundary for event records crossing the content-pack API.
 *
 * Keep this rule in the shared engine so server responses and mobile fallback
 * handling agree on the minimum event shape required by bulletin screens.
 */
export function isDisplayableContentPackEvent(
  value: unknown,
): value is PackWorldEvent {
  if (!value || typeof value !== 'object') return false;

  const event = value as Partial<PackWorldEvent>;
  return (
    isNonEmptyString(event.id) &&
    isNonEmptyString(event.title) &&
    isNonEmptyString(event.description) &&
    isNonEmptyString(event.npcReaction) &&
    isNonEmptyString(event.playerHook) &&
    isNonEmptyString(event.category) &&
    typeof event.durationDays === 'number' &&
    Number.isFinite(event.durationDays) &&
    event.durationDays > 0 &&
    Array.isArray(event.tags) &&
    event.tags.length > 0 &&
    event.tags.every(isNonEmptyString)
  );
}

/** Alias for PackWorldEvent — used by the offline content engine. */
export type ContentPackEvent = PackWorldEvent;

export interface PackNpcMood {
  npcId: string;
  npcName: string;
  emotionState: string;
  reason: string;            // Short flavor reason: "anxious about the exam"
}

export interface PackGEDFocus {
  subject: string;           // 'math' | 'language_arts' | 'science' | 'social_studies'
  topic: string;
  whyNow: string;            // Flavor text connecting it to weekly theme
}

export interface ContentPack {
  version: string;           // "pack-2026-W11"
  generatedAt: number;       // Unix ms
  expiresAt: number;         // Unix ms (generatedAt + 7 days)
  worldSeed: number;         // Always 12345 for deterministic fallback
  weeklyTheme: string;       // "A week of unexpected discoveries"
  themeContext: string;      // 2–3 sentence flavor paragraph
  activeEvents: PackWorldEvent[];
  npcMoodShifts: PackNpcMood[];
  gedFocusAreas: PackGEDFocus[];
  generatedBy: 'gpt' | 'deterministic';
  rssHeadlines?: string[];   // Real-world headlines that seeded this week's events
  eventsRepaired?: boolean;  // True when malformed/missing remote events were replaced offline
}

export const PACK_ACTIVE_EVENT_LIMIT = 3;
export const PACK_NPC_MOOD_LIMIT = 4;
export const PACK_GED_FOCUS_LIMIT = 2;

const PACK_GED_SUBJECTS = new Set([
  'math',
  'math_reasoning',
  'language_arts',
  'science',
  'social_studies',
]);

/** One week in milliseconds */
export const PACK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** localStorage / AsyncStorage key for the client-cached pack */
export const CONTENT_PACK_STORAGE_KEY = 'academy-content-pack-v1';

/** API endpoint */
export const CONTENT_PACK_ENDPOINT = '/api/content-pack';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const normalizedIdentity = (value: string): string =>
  value.trim().toLowerCase();

export function isDisplayablePackNpcMood(
  value: unknown,
): value is PackNpcMood {
  if (!value || typeof value !== 'object') return false;

  const mood = value as Partial<PackNpcMood>;
  return (
    isNonEmptyString(mood.npcId) &&
    isNonEmptyString(mood.npcName) &&
    isNonEmptyString(mood.emotionState) &&
    isNonEmptyString(mood.reason)
  );
}

export function isDisplayablePackGEDFocus(
  value: unknown,
): value is PackGEDFocus {
  if (!value || typeof value !== 'object') return false;

  const focus = value as Partial<PackGEDFocus>;
  const normalizedSubject =
    typeof focus.subject === 'string'
      ? focus.subject.trim().toLowerCase().replace(/[-\s]+/g, '_')
      : '';
  return (
    PACK_GED_SUBJECTS.has(normalizedSubject) &&
    isNonEmptyString(focus.topic) &&
    isNonEmptyString(focus.whyNow)
  );
}

function hasUniqueIdentities(
  values: readonly string[],
): boolean {
  const identities = values.map(normalizedIdentity);
  return new Set(identities).size === identities.length;
}

/**
 * Shared runtime contract for content packs crossing the API/cache boundary.
 *
 * The server uses this before caching or returning generated data, while
 * mobile uses it before accepting remote or persisted JSON. Keep this stricter
 * than the TypeScript interfaces: both callers receive untrusted runtime data.
 */
export function isUsableContentPack(
  value: unknown,
  now = Date.now(),
): value is ContentPack {
  if (!value || typeof value !== 'object') return false;

  const pack = value as Partial<ContentPack>;
  const events = pack.activeEvents;
  const moods = pack.npcMoodShifts;
  const focusAreas = pack.gedFocusAreas;

  if (
    !isNonEmptyString(pack.version) ||
    !isFiniteNumber(pack.generatedAt) ||
    !isFiniteNumber(pack.expiresAt) ||
    pack.expiresAt <= pack.generatedAt ||
    pack.expiresAt <= now ||
    !isFiniteNumber(pack.worldSeed) ||
    !isNonEmptyString(pack.weeklyTheme) ||
    !isNonEmptyString(pack.themeContext) ||
    !Array.isArray(events) ||
    events.length !== PACK_ACTIVE_EVENT_LIMIT ||
    !events.every(isDisplayableContentPackEvent) ||
    !hasUniqueIdentities(events.map(event => event.id)) ||
    !Array.isArray(moods) ||
    moods.length !== PACK_NPC_MOOD_LIMIT ||
    !moods.every(isDisplayablePackNpcMood) ||
    !hasUniqueIdentities(moods.map(mood => mood.npcId)) ||
    !Array.isArray(focusAreas) ||
    focusAreas.length !== PACK_GED_FOCUS_LIMIT ||
    !focusAreas.every(isDisplayablePackGEDFocus) ||
    (pack.generatedBy !== 'gpt' && pack.generatedBy !== 'deterministic') ||
    (pack.rssHeadlines !== undefined &&
      (!Array.isArray(pack.rssHeadlines) ||
        !pack.rssHeadlines.every(isNonEmptyString))) ||
    (pack.eventsRepaired !== undefined &&
      typeof pack.eventsRepaired !== 'boolean')
  ) {
    return false;
  }

  return true;
}

/** Is a pack still valid (not expired)? */
export function isPackFresh(pack: ContentPack): boolean {
  return Date.now() < pack.expiresAt;
}

/** ISO week string like "2026-W11" */
export function currentWeekKey(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
