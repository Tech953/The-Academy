/**
 * ═══════════════════════════════════════════════════════════
 *  THE ACADEMY — CONTENT PACK SCHEMA
 *  Shared between server (generation) and client (consumption).
 *  Generated weekly by cron, distributed to all installs.
 * ═══════════════════════════════════════════════════════════
 */
import { focusSubjectKey } from './studyTemplates';

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

/** One week in milliseconds */
export const PACK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** localStorage / AsyncStorage key for the client-cached pack */
export const CONTENT_PACK_STORAGE_KEY = 'academy-content-pack-v1';

/** API endpoint */
export const CONTENT_PACK_ENDPOINT = '/api/content-pack';

/**
 * Representative server payload used by cross-package contract tests.
 *
 * Keeping this fixture beside the runtime contract makes it possible to test
 * the exact JSON boundary without importing an API server or native provider.
 */
export function createContentPackContractFixture(
  generatedAt = Date.now(),
): ContentPack {
  return {
    version: 'pack-contract-fixture',
    generatedAt,
    expiresAt: generatedAt + PACK_TTL_MS,
    worldSeed: 12345,
    weeklyTheme: 'A week of careful preparation',
    themeContext: 'The Academy is quiet before a demanding week. Small choices now will shape what happens next.',
    activeEvents: [
      {
        id: 'contract-library-archives',
        title: 'The Library Archives Reopen',
        description: 'A sealed archive has been opened for a limited study window.',
        npcReaction: 'The catalog has been waiting for someone patient enough to read it.',
        playerHook: 'Review the newly available records before access closes.',
        category: 'discovery',
        durationDays: 2,
        tags: ['library', 'archive', 'study'],
      },
      {
        id: 'contract-practice-session',
        title: 'Practice Session Announced',
        description: 'Students organize a focused review session ahead of assessments.',
        npcReaction: 'A good plan makes the difficult parts feel possible.',
        playerHook: 'Join the session and help classmates compare strategies.',
        category: 'academic',
        durationDays: 3,
        tags: ['assessment', 'study', 'academic'],
      },
      {
        id: 'contract-campus-forum',
        title: 'Campus Forum Opens',
        description: 'Students and faculty gather to discuss a change to campus routines.',
        npcReaction: 'Everyone has a proposal, but not every proposal has been tested.',
        playerHook: 'Listen carefully and add a practical recommendation.',
        category: 'institutional',
        durationDays: 1,
        tags: ['campus', 'forum', 'community'],
      },
    ],
    npcMoodShifts: [
      {
        npcId: 'the-scholar',
        npcName: 'The Scholar',
        emotionState: 'focused',
        reason: 'a promising pattern in the archives',
      },
      {
        npcId: 'the-rebel',
        npcName: 'The Rebel',
        emotionState: 'anxious',
        reason: 'an unresolved question about the forum',
      },
      {
        npcId: 'the-mentor',
        npcName: 'The Mentor',
        emotionState: 'happy',
        reason: 'students are supporting one another',
      },
      {
        npcId: 'the-optimist',
        npcName: 'The Optimist',
        emotionState: 'excited',
        reason: 'a new week of possibilities',
      },
    ],
    gedFocusAreas: [
      {
        subject: 'math',
        topic: 'Ratios & Proportions',
        whyNow: 'The practice session calls for comparing quantities carefully.',
      },
      {
        subject: 'science',
        topic: 'Interpreting Data Tables',
        whyNow: 'The archive records reward careful reading of evidence.',
      },
    ],
    generatedBy: 'gpt',
    rssHeadlines: [
      'Library archives reopen for student research',
      'Students prepare for assessment week',
      'Campus forum draws practical proposals',
    ],
    eventsRepaired: false,
  };
}

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
  return (
    typeof focus.subject === 'string' &&
    focusSubjectKey(focus.subject) !== null &&
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

export type ContentPackValidationIssueCode =
  | 'pack'
  | 'version'
  | 'generatedAt'
  | 'expiresAt'
  | 'worldSeed'
  | 'weeklyTheme'
  | 'themeContext'
  | 'activeEvents'
  | 'activeEventIds'
  | 'npcMoodShifts'
  | 'npcMoodIds'
  | 'gedFocusAreas'
  | 'generatedBy'
  | 'rssHeadlines'
  | 'eventsRepaired';

/**
 * Return stable field-level categories for an unusable pack.
 *
 * This intentionally reports no values, indexes, or generated text. It is safe
 * to use in server logs and client diagnostics at an untrusted JSON boundary.
 */
export function getContentPackValidationIssues(
  value: unknown,
  now = Date.now(),
): ContentPackValidationIssueCode[] {
  if (!value || typeof value !== 'object') return ['pack'];

  const pack = value as Partial<ContentPack>;
  const issues: ContentPackValidationIssueCode[] = [];
  const events = pack.activeEvents;
  const moods = pack.npcMoodShifts;
  const focusAreas = pack.gedFocusAreas;

  if (!isNonEmptyString(pack.version)) issues.push('version');
  if (!isFiniteNumber(pack.generatedAt)) issues.push('generatedAt');
  if (
    !isFiniteNumber(pack.expiresAt) ||
    !isFiniteNumber(pack.generatedAt) ||
    pack.expiresAt <= pack.generatedAt ||
    pack.expiresAt <= now
  ) {
    issues.push('expiresAt');
  }
  if (!isFiniteNumber(pack.worldSeed)) issues.push('worldSeed');
  if (!isNonEmptyString(pack.weeklyTheme)) issues.push('weeklyTheme');
  if (!isNonEmptyString(pack.themeContext)) issues.push('themeContext');

  if (
    !Array.isArray(events) ||
    events.length !== PACK_ACTIVE_EVENT_LIMIT ||
    !events.every(isDisplayableContentPackEvent)
  ) {
    issues.push('activeEvents');
  } else if (!hasUniqueIdentities(events.map(event => event.id))) {
    issues.push('activeEventIds');
  }

  if (
    !Array.isArray(moods) ||
    moods.length !== PACK_NPC_MOOD_LIMIT ||
    !moods.every(isDisplayablePackNpcMood)
  ) {
    issues.push('npcMoodShifts');
  } else if (!hasUniqueIdentities(moods.map(mood => mood.npcId))) {
    issues.push('npcMoodIds');
  }

  if (
    !Array.isArray(focusAreas) ||
    focusAreas.length !== PACK_GED_FOCUS_LIMIT ||
    !focusAreas.every(isDisplayablePackGEDFocus)
  ) {
    issues.push('gedFocusAreas');
  }

  if (pack.generatedBy !== 'gpt' && pack.generatedBy !== 'deterministic') {
    issues.push('generatedBy');
  }
  if (
    pack.rssHeadlines !== undefined &&
    (!Array.isArray(pack.rssHeadlines) ||
      !pack.rssHeadlines.every(isNonEmptyString))
  ) {
    issues.push('rssHeadlines');
  }
  if (
    pack.eventsRepaired !== undefined &&
    typeof pack.eventsRepaired !== 'boolean'
  ) {
    issues.push('eventsRepaired');
  }

  return issues;
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
  return getContentPackValidationIssues(value, now).length === 0;
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
