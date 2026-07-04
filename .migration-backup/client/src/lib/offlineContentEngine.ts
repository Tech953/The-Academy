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
  const rng = new SeededRandom(temporalSeed('rss-match', dayNumber));

  const allTags = headlines.flatMap(h =>
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
export function scoreToRelationshipTier(score: number): RelationshipTier {
  if (score >= 90) return 'trusted';
  if (score >= 70) return 'close';
  if (score >= 50) return 'friend';
  if (score >= 30) return 'friendly';
  if (score >= 10) return 'acquaintance';
  return 'stranger';
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
