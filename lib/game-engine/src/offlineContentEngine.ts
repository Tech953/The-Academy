/**
 * ═══════════════════════════════════════════════════════════
 *  THE ACADEMY — OFFLINE CONTENT ENGINE
 *  Unified orchestration layer: seed + template → content
 *  Zero API calls. Fully deterministic. Offline-first.
 *
 *  Architecture:
 *    SeededRandom  →  picks template variants
 *    Templates      →  provide rich language pools
 *    Engine         →  assembles, fills, and returns
 * ═══════════════════════════════════════════════════════════
 */

import {
  SeededRandom,
  fillTemplate,
  entitySeed,
  temporalSeed,
  hashString,
} from './seededRandom';

import {
  DIALOGUE_TEMPLATES,
  RELATIONSHIP_PREFIX,
  RELATIONSHIP_SUFFIX,
  Archetype,
  EmotionState,
  RelationshipTier,
  DialogueTemplate,
} from './dialogueTemplates';

import {
  EVENT_TEMPLATES,
  ALL_EVENTS,
  matchEventsByTags,
  WorldEventTemplate,
  EventCategory,
} from './eventTemplates';

import type { ContentPack, ContentPackEvent } from './contentPack';

import {
  STUDY_QUESTIONS,
  ALL_QUESTIONS,
  STUDY_PROMPTS,
  getQuestions,
  GEDSubjectKey,
  StudyQuestion,
} from './studyTemplates';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface OfflineDialogueLine {
  speaker: string;
  text: string;
  type: 'opening' | 'response' | 'question' | 'farewell';
  relationshipTier: RelationshipTier;
}

export interface OfflineConversation {
  npcId: string;
  npcName: string;
  archetype: Archetype;
  emotionState: EmotionState;
  relationshipTier: RelationshipTier;
  lines: OfflineDialogueLine[];
  topicSuggestions: string[];
}

export interface OfflineWorldEvent {
  id: string;
  instanceId: string;       // Unique per-occurrence
  template: WorldEventTemplate;
  startDay: number;
  title: string;
  description: string;
  activeNpcReaction: string;
  activePlayerHook: string;
}

export interface OfflineQuizSet {
  subject: GEDSubjectKey;
  questions: StudyQuestion[];
  seed: string;
}

export interface ContentPackSummary {
  version: string;
  generatedAt: number;
  worldSeed: number;
  activeEvents: OfflineWorldEvent[];
  npcMoodOverrides: Record<string, EmotionState>;
  featuredQuizSets: OfflineQuizSet[];
}

// ─────────────────────────────────────────────────────────────────
// DIALOGUE GENERATOR
// ─────────────────────────────────────────────────────────────────

/**
 * Generate a full offline conversation for an NPC.
 * Deterministic: same inputs → same output, always.
 */
export function generateOfflineConversation(opts: {
  npcId: string;
  npcName: string;
  archetype: Archetype;
  emotionState: EmotionState;
  relationshipTier: RelationshipTier;
  playerName?: string;
  location?: string;
  faction?: string;
  topic?: string;
  dayOffset?: number;
}): OfflineConversation {
  const {
    npcId, npcName, archetype, emotionState, relationshipTier,
    playerName = 'stranger', location = 'the Academy',
    faction = 'unaffiliated', topic, dayOffset = 0
  } = opts;

  const rng = new SeededRandom(temporalSeed(npcId, dayOffset));

  // Fall back to scholar if archetype not in library
  const safeArchetype: Archetype = DIALOGUE_TEMPLATES[archetype] ? archetype : 'scholar';
  const template: DialogueTemplate = DIALOGUE_TEMPLATES[safeArchetype][emotionState];

  const vars: Record<string, string> = {
    name: npcName,
    player: playerName,
    location,
    faction,
    topic: topic ?? rng.pick(template.topics),
    subject: rng.pick(['mathematics', 'language arts', 'science', 'social studies']),
    goal: rng.pick(['passing the GED', 'earning a scholarship', 'understanding the truth', 'finding my place']),
    day: `day ${dayOffset + 1}`,
  };

  const tierPrefix = rng.pick(RELATIONSHIP_PREFIX[relationshipTier]);
  const tierSuffix = rng.pick(RELATIONSHIP_SUFFIX[relationshipTier]);

  const lines: OfflineDialogueLine[] = [];

  // Opening — prefix on stranger/acquaintance
  const openingText = rng.pick(template.opening);
  const finalOpening = (relationshipTier === 'stranger' || relationshipTier === 'acquaintance')
    ? `${tierPrefix} ${fillTemplate(openingText, vars)}`
    : fillTemplate(openingText, vars);

  lines.push({ speaker: npcName, text: finalOpening, type: 'opening', relationshipTier });

  // Response pool
  const numResponses = rng.int(1, 2);
  for (let i = 0; i < numResponses; i++) {
    const response = rng.pick(template.responses);
    lines.push({ speaker: npcName, text: fillTemplate(response, vars), type: 'response', relationshipTier });
  }

  // Optional question
  if (template.questions.length > 0 && rng.bool(0.6)) {
    const question = rng.pick(template.questions);
    lines.push({ speaker: npcName, text: fillTemplate(question, vars), type: 'question', relationshipTier });
  }

  // Farewell — suffix on close/trusted
  const farewellText = rng.pick(template.farewell);
  const finalFarewell = (relationshipTier === 'close' || relationshipTier === 'trusted')
    ? `${fillTemplate(farewellText, vars)} ${tierSuffix}`
    : fillTemplate(farewellText, vars);

  lines.push({ speaker: npcName, text: finalFarewell, type: 'farewell', relationshipTier });

  return {
    npcId, npcName, archetype, emotionState, relationshipTier,
    lines,
    topicSuggestions: rng.sample(template.topics, 3),
  };
}

/**
 * Generate a single NPC line without building a full conversation.
 * Used for ambient dialogue, world flavor text, etc.
 */
export function generateNPCLine(opts: {
  npcId: string;
  npcName: string;
  archetype: Archetype;
  emotionState: EmotionState;
  lineType: 'opening' | 'response' | 'question' | 'farewell';
  playerName?: string;
  topic?: string;
  dayOffset?: number;
}): string {
  const { npcId, npcName, archetype, emotionState, lineType, playerName = 'you', topic, dayOffset = 0 } = opts;
  const rng = new SeededRandom(temporalSeed(npcId, dayOffset) ^ hashString(lineType));
  const safeArchetype: Archetype = DIALOGUE_TEMPLATES[archetype] ? archetype : 'scholar';
  const template = DIALOGUE_TEMPLATES[safeArchetype][emotionState];

  const pool: string[] = template[lineType === 'farewell' ? 'farewell'
    : lineType === 'opening' ? 'opening'
    : lineType === 'question' ? 'questions'
    : 'responses'];

  const vars: Record<string, string> = {
    name: npcName, player: playerName,
    topic: topic ?? rng.pick(template.topics),
    subject: 'the subject',
    goal: 'your goal',
    location: 'the Academy',
    faction: 'the Academy',
    day: `day ${dayOffset + 1}`,
  };

  return fillTemplate(rng.pick(pool), vars);
}

// ─────────────────────────────────────────────────────────────────
// WORLD EVENT GENERATOR
// ─────────────────────────────────────────────────────────────────

/**
 * Generate the active world events for a given in-game day.
 * Deterministic: same day number → same events, always.
 */
export function generateDailyEvents(dayNumber: number, count = 2): OfflineWorldEvent[] {
  const rng = new SeededRandom(temporalSeed('world-events', dayNumber));

  // Weight event categories by day modulo patterns
  const categories: EventCategory[] = ['academic', 'social', 'discovery', 'mystery', 'competition', 'institutional', 'seasonal', 'crisis'];
  const weights = [3, 2, 2, 2, 1, 1, 1, 0.5]; // academic and social are most common

  const events: OfflineWorldEvent[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const category = rng.weighted(categories, weights);
    const pool = EVENT_TEMPLATES[category];
    let template = rng.pick(pool);

    // Avoid duplicate events on the same day
    let attempts = 0;
    while (usedIds.has(template.id) && attempts < 10) {
      template = rng.pick(pool);
      attempts++;
    }
    usedIds.add(template.id);

    const instanceRng = new SeededRandom(entitySeed(template.id, dayNumber));
    events.push({
      id: template.id,
      instanceId: `${template.id}-day${dayNumber}`,
      template,
      startDay: dayNumber,
      title: template.title,
      description: template.description,
      activeNpcReaction: instanceRng.pick(template.npcReactions),
      activePlayerHook: instanceRng.pick(template.playerHooks),
    });
  }

  return events;
}

/**
 * Match world events to real-world RSS headline tags.
 * Used when the content pack server delivers topic hints.
 */
export function matchEventsToHeadlines(headlines: string[]): OfflineWorldEvent[] {
  const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return matchEventsToHeadlinesForDay(headlines, dayNumber);
}

function matchEventsToHeadlinesForDay(
  headlines: string[],
  dayNumber: number,
): OfflineWorldEvent[] {
  const rng = new SeededRandom(temporalSeed('rss-match', dayNumber));

  const uniqueHeadlines = [
    ...new Map(
      headlines
        .map(headline => headline.trim())
        .filter(Boolean)
        .map(headline => [headline.toLowerCase(), headline] as const),
    ).values(),
  ];
  const allTags = uniqueHeadlines.flatMap(h =>
    h.toLowerCase().split(/\W+/).filter(w => w.length > 3)
  );

  const matches = matchEventsByTags(allTags, 3);
  return matches.map((template, i) => ({
    id: template.id,
    instanceId: `${template.id}-rss-day${dayNumber}`,
    template,
    startDay: dayNumber,
    title: template.title,
    description: template.description,
    activeNpcReaction: rng.pick(template.npcReactions),
    activePlayerHook: rng.pick(template.playerHooks),
  }));
}

/**
 * Build bulletin events from headline matches first, then fill remaining
 * slots with deterministic daily events. Headlines are enrichment, not a
 * requirement for a usable bulletin.
 */
export function generateBulletinEvents(
  dayNumber: number,
  headlines: string[] = [],
  count = 3,
): OfflineWorldEvent[] {
  const desiredCount = Math.max(0, Math.floor(count));
  if (desiredCount === 0) return [];

  const matchedEvents = matchEventsToHeadlinesForDay(headlines, dayNumber);
  const fallbackEvents = generateDailyEvents(dayNumber, desiredCount);
  const events: OfflineWorldEvent[] = [];
  const seenIds = new Set<string>();

  for (const event of [...matchedEvents, ...fallbackEvents]) {
    if (seenIds.has(event.id)) continue;
    seenIds.add(event.id);
    events.push(event);
    if (events.length === desiredCount) break;
  }

  return events;
}

// ─────────────────────────────────────────────────────────────────
// QUIZ GENERATOR
// ─────────────────────────────────────────────────────────────────

/**
 * Generate a seeded quiz set for a subject.
 * Same subject + seed = same questions, always.
 */
export function generateQuizSet(subject: GEDSubjectKey, seed: string, count = 5): OfflineQuizSet {
  const rng = SeededRandom.fromEntity(seed);
  const pool = STUDY_QUESTIONS[subject];
  const questions = rng.sample(pool, Math.min(count, pool.length));
  return { subject, questions, seed };
}

/**
 * Generate a daily study session across all four GED subjects.
 * Rotates focus areas based on day number.
 */
export function generateDailyStudySession(dayNumber: number): OfflineQuizSet[] {
  const subjects: GEDSubjectKey[] = ['math', 'language_arts', 'science', 'social_studies'];
  return subjects.map(subject => generateQuizSet(subject, `daily-${subject}-day${dayNumber}`, 3));
}

/**
 * Get a daily study prompt for reflection or written response.
 */
export function getDailyStudyPrompt(dayNumber: number) {
  const rng = new SeededRandom(temporalSeed('study-prompt', dayNumber));
  return rng.pick(STUDY_PROMPTS);
}

// ─────────────────────────────────────────────────────────────────
// CONTENT PACK ASSEMBLER
// ─────────────────────────────────────────────────────────────────

/**
 * Generate a full content pack for a given game day.
 * This is what the weekly cron server will produce and distribute.
 * Locally, it can also be generated deterministically client-side.
 */
export function generateContentPack(dayNumber: number, npcIds: string[] = []): ContentPackSummary {
  const rng = new SeededRandom(temporalSeed('content-pack', dayNumber));

  // Generate active world events
  const activeEvents = generateDailyEvents(dayNumber, rng.int(1, 3));

  // Generate NPC mood overrides for the day
  const emotionStates: EmotionState[] = ['happy', 'neutral', 'sad', 'angry', 'anxious', 'excited', 'focused', 'distracted'];
  const npcMoodOverrides: Record<string, EmotionState> = {};
  for (const npcId of npcIds) {
    // Most NPCs stay neutral; some shift based on world events
    if (rng.bool(0.35)) {
      npcMoodOverrides[npcId] = rng.pick(emotionStates);
    }
  }

  // Generate featured quiz sets for the day
  const subjects: GEDSubjectKey[] = ['math', 'language_arts', 'science', 'social_studies'];
  const featuredSubjects = rng.sample(subjects, 2);
  const featuredQuizSets = featuredSubjects.map(s =>
    generateQuizSet(s, `featured-${s}-day${dayNumber}`, 4)
  );

  return {
    version: `pack-day${dayNumber}`,
    generatedAt: Date.now(),
    worldSeed: 12345,
    activeEvents,
    npcMoodOverrides,
    featuredQuizSets,
  };
}

// ─────────────────────────────────────────────────────────────────
// NPC EMOTION INFERENCE
// ─────────────────────────────────────────────────────────────────

/**
 * Infer an NPC's emotional state from their RadiantAI emotion scores.
 * Maps the 6 numeric emotion axes → one of 8 template emotion states.
 */
export function inferEmotionState(emotions: {
  happiness?: number;
  anxiety?: number;
  anger?: number;
  enthusiasm?: number;
  focus?: number;
  sociability?: number;
}): EmotionState {
  const h = emotions.happiness ?? 5;
  const a = emotions.anxiety ?? 3;
  const ag = emotions.anger ?? 2;
  const en = emotions.enthusiasm ?? 5;
  const f = emotions.focus ?? 5;

  if (ag > 7) return 'angry';
  if (a > 7) return 'anxious';
  if (en > 7) return 'excited';
  if (h < 3) return 'sad';
  if (f > 7) return 'focused';
  if (h > 7 && en > 5) return 'happy';
  if (f < 4 && h < 5) return 'distracted';
  return 'neutral';
}

// ─────────────────────────────────────────────────────────────────
// RELATIONSHIP TIER MAPPING
// ─────────────────────────────────────────────────────────────────

/**
 * Map a numeric relationship score (0–100) to a RelationshipTier.
 */
const RELATIONSHIP_TIER_BOUNDS: ReadonlyArray<{
  tier: RelationshipTier;
  startScore: number;
  endScore: number;
  nextTier: RelationshipTier | null;
}> = [
  { tier: 'stranger', startScore: 0, endScore: 10, nextTier: 'acquaintance' },
  { tier: 'acquaintance', startScore: 10, endScore: 30, nextTier: 'friendly' },
  { tier: 'friendly', startScore: 30, endScore: 50, nextTier: 'friend' },
  { tier: 'friend', startScore: 50, endScore: 70, nextTier: 'close' },
  { tier: 'close', startScore: 70, endScore: 90, nextTier: 'trusted' },
  { tier: 'trusted', startScore: 90, endScore: 100, nextTier: null },
];

export function scoreToRelationshipTier(score: number): RelationshipTier {
  for (let i = RELATIONSHIP_TIER_BOUNDS.length - 1; i >= 0; i--) {
    if (score >= RELATIONSHIP_TIER_BOUNDS[i].startScore) {
      return RELATIONSHIP_TIER_BOUNDS[i].tier;
    }
  }
  return 'stranger';
}

export interface RelationshipProgress {
  score: number;
  tier: RelationshipTier;
  startScore: number;
  endScore: number;
  progress: number;
  nextTier: RelationshipTier | null;
}

/**
 * Describe where a score sits inside its current tier.
 * The returned progress is normalized from 0 to 1 and uses the same
 * thresholds as scoreToRelationshipTier, so UI hints cannot drift from
 * relationship behavior.
 */
export function getRelationshipProgress(score: number): RelationshipProgress {
  const normalizedScore = Number.isFinite(score)
    ? Math.max(0, Math.min(100, score))
    : 0;
  const tier = scoreToRelationshipTier(normalizedScore);
  const bounds = RELATIONSHIP_TIER_BOUNDS.find((entry) => entry.tier === tier)!;
  const range = bounds.endScore - bounds.startScore;

  return {
    score: normalizedScore,
    tier,
    startScore: bounds.startScore,
    endScore: bounds.endScore,
    progress: range === 0 ? 1 : (normalizedScore - bounds.startScore) / range,
    nextTier: bounds.nextTier,
  };
}

// ─────────────────────────────────────────────────────────────────
// DIALOGUE TONE ANALYSIS
// ─────────────────────────────────────────────────────────────────

export type DialogueSentiment = 'warm' | 'hostile' | 'curious' | 'neutral';

export interface DialogueTone {
  /** Signed relationship-score delta to apply for this line. */
  delta: number;
  /** Emotion the NPC shifts toward in reaction to the player's tone. */
  emotion: EmotionState;
  sentiment: DialogueSentiment;
}

const WARM_WORDS = [
  'thank', 'thanks', 'please', 'appreciate', 'grateful', 'glad', 'happy',
  'love', 'great', 'agree', 'help', 'friend', 'sorry', 'congrat', 'nice',
  'kind', 'respect', 'trust', 'good', 'wonderful', 'care', 'proud', 'welcome',
];

const HOSTILE_WORDS = [
  'hate', 'stupid', 'idiot', 'shut up', 'useless', 'liar', 'angry', 'threat',
  'kill', 'worst', 'terrible', 'awful', 'disgust', 'coward', 'fraud',
  'pathetic', 'fool', 'annoying', 'dumb', 'ugly', 'enemy', 'shut',
];

/**
 * Deterministically read the tone of a player's dialogue line so relationships
 * can rise AND fall. Warm language builds rapport, hostile language erodes it,
 * genuine questions earn a little engagement credit, and neutral chatter drifts
 * up very slightly. Fully offline — pure string inspection, no network.
 */
export function analyzeDialogueTone(message: string): DialogueTone {
  const text = message.toLowerCase();
  let warm = 0;
  let hostile = 0;
  for (const w of WARM_WORDS) if (text.includes(w)) warm += 1;
  for (const w of HOSTILE_WORDS) if (text.includes(w)) hostile += 1;

  if (hostile > warm) {
    return { delta: -(3 * (hostile - warm) + 1), emotion: 'angry', sentiment: 'hostile' };
  }
  if (warm > hostile) {
    return { delta: 2 * (warm - hostile) + 2, emotion: 'happy', sentiment: 'warm' };
  }
  if (text.trim().endsWith('?')) {
    return { delta: 2, emotion: 'focused', sentiment: 'curious' };
  }
  return { delta: 1, emotion: 'neutral', sentiment: 'neutral' };
}

// ─────────────────────────────────────────────────────────────────
// OFFLINE CONTENT PACK (mirrors the server's `/content-pack` shape)
// ─────────────────────────────────────────────────────────────────

const WEEKLY_THEMES = [
  'Midterm Momentum',
  'Campus Renewal Week',
  'Finals Countdown',
  'New Semester Energy',
  'Community Outreach Drive',
];

const WEEKLY_FOCUS_AREAS: Array<ContentPack['gedFocusAreas']> = [
  [
    { subject: 'Math Reasoning', topic: 'Ratios & Proportions', whyNow: 'Comes up often on the practice exam this week.' },
    { subject: 'Language Arts', topic: 'Reading for Argument', whyNow: "Ties into this week's campus events." },
  ],
  [
    { subject: 'Science', topic: 'Interpreting Data Tables', whyNow: 'The labs are running experiments students can follow along with.' },
    { subject: 'Math Reasoning', topic: 'Linear Equations', whyNow: 'A recurring stumbling block on recent quizzes.' },
  ],
  [
    { subject: 'Social Studies', topic: 'Reading Primary Sources', whyNow: 'History faculty are leaning into the archives this week.' },
    { subject: 'Language Arts', topic: 'Editing for Clarity', whyNow: 'Written responses are being graded harder right now.' },
  ],
  [
    { subject: 'Math Reasoning', topic: 'Geometry & Area', whyNow: 'The renovation projects make the shapes feel real.' },
    { subject: 'Science', topic: 'Cause & Effect', whyNow: 'Ties into the discoveries circulating on campus.' },
  ],
];

/** Convert an in-game day (1-indexed) into a 1-indexed week number. */
export function dayToWeek(day: number): number {
  return Math.floor((Math.max(1, day) - 1) / 7) + 1;
}

/**
 * Deterministically builds a `ContentPack` on-device from the bundled event
 * template library so the Campus Bulletin has something to show even when
 * there is no backend reachable. The weekly theme and GED focus areas are
 * keyed to the in-game *week* (so they stay stable as the day/week counter
 * advances within a week), while the active events rotate each *day*.
 */
export function generateOfflineContentPack(day: number, headlines: string[] = []): ContentPack {
  const week = dayToWeek(day);
  const weekRng = new SeededRandom(temporalSeed('content-pack-week', week));
  const theme = weekRng.pick(WEEKLY_THEMES);
  const gedFocusAreas = WEEKLY_FOCUS_AREAS[(week - 1) % WEEKLY_FOCUS_AREAS.length];

  const activeEvents: ContentPackEvent[] = generateBulletinEvents(day, headlines, 3).map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    npcReaction: event.activeNpcReaction,
    playerHook: event.activePlayerHook,
    category: event.template.category,
    durationDays: event.template.duration === 'hours' ? 1 : event.template.duration === 'days' ? 3 : 7,
    tags: event.template.tags,
  }));

  const now = Date.now();
  return {
    version: `offline-w${week}`,
    generatedAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000,
    worldSeed: hashString(`content-pack-${day}`),
    weeklyTheme: theme,
    themeContext: `Week ${week} at the Academy: ${theme.toLowerCase()}. Faculty and students alike are feeling the shift.`,
    activeEvents,
    npcMoodShifts: [],
    gedFocusAreas,
    generatedBy: 'deterministic',
  };
}

// ─────────────────────────────────────────────────────────────────
// CONVENIENCE EXPORTS
// ─────────────────────────────────────────────────────────────────

export {
  matchEventsByTags,
  getQuestions,
  ALL_EVENTS,
  ALL_QUESTIONS,
  STUDY_PROMPTS,
};
