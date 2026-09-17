/**
 * Offline Fallback Tests
 *
 * Guards the core offline-first promise:
 *
 *   1. api.ts functions (describe / npcReply) throw when the network is
 *      down — both for missing config and for fetch failures/timeouts.
 *
 *   2. gameFallbacks.ts (the production fallback layer used by GameContext)
 *      returns { source: "offline" } usable content whenever the api
 *      functions throw — tested by mocking the api module so any future
 *      change to GameContext's wiring is caught here.
 *
 *   3. The offline content engine (generateNPCLine, generateOfflineConversation,
 *      generateQuizSet, etc.) always returns valid content with zero network
 *      access.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RateLimitError } from '@workspace/api-client-react';

// ── lib under test ─────────────────────────────────────────────────────────
import {
  fetchLocationDescription,
  fetchExamineDescription,
  fetchNpcDialogue,
  hasApiConfig,
} from '../lib/api';

import {
  resolveLocationDescription,
  resolveExamineDescription,
  resolveNpcReply,
} from '../lib/gameFallbacks';
import {
  BULLETIN_EVENT_LIMIT,
  createContentPackWriteQueue,
  createContentPackWriteQueueWithResult,
  ensureUsableContentPack,
  fallbackAfterRefreshFailure,
  getContentPackStorageStatus,
  isDisplayableContentPackEvent,
  isUsableContentPack,
  parseCachedContentPack,
  readCachedContentPack,
  retainVisibleContentPack,
  resolveContentPackRefresh,
  writeCachedContentPack,
  writeCachedContentPackResult,
} from '../lib/contentPackFallback';

import {
  generateNPCLine,
  generateOfflineConversation,
  generateQuizSet,
  generateDailyEvents,
  generateBulletinEvents,
  generateContentPack,
  generateOfflineContentPack,
  focusSubjectKey,
  isQuestionFocusMatched,
  topicMatchesFocus,
  inferEmotionState,
  scoreToRelationshipTier,
  analyzeDialogueTone,
  matchEventsToHeadlines,
  EVENT_TEMPLATES,
  validateEventTemplateTags,
  validateEventTemplates,
  createEventTemplateValidationScope,
  assertValidEventTemplates,
  type WorldEventTemplate,
  type OfflineWorldEvent,
  type ContentPack,
  type ContentPackEvent,
} from '@workspace/game-engine';

// ─────────────────────────────────────────────────────────────────────────────
// Shared NPC dialogue params fixture
// ─────────────────────────────────────────────────────────────────────────────

const NPC_PARAMS = {
  npcName: 'Ms. Torres',
  npcTitle: 'Librarian',
  npcRole: 'Faculty',
  npcBackstory: 'Veteran educator.',
  playerMessage: 'Hello',
  playerName: 'Alex',
  locationName: 'Library',
  conversationHistory: [] as Array<{ isFromPlayer: boolean; content: string }>,
};

const LOCATION_PARAMS = {
  locationName: 'Library',
  locationDescription: 'A quiet space lined with books.',
  npcsPresent: ['Ms. Torres'],
  interactables: ['Notice Board'],
};

const EXAMINE_PARAMS = {
  target: 'Notice Board',
  locationName: 'Library',
  locationDescription: 'A quiet space lined with books.',
};

// ─────────────────────────────────────────────────────────────────────────────
// API: offline detection (no EXPO_PUBLIC_DOMAIN)
// ─────────────────────────────────────────────────────────────────────────────

describe('api.ts — no backend configured', () => {
  let originalDomain: string | undefined;

  beforeEach(() => {
    originalDomain = process.env.EXPO_PUBLIC_DOMAIN;
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  afterEach(() => {
    if (originalDomain !== undefined) {
      process.env.EXPO_PUBLIC_DOMAIN = originalDomain;
    } else {
      delete process.env.EXPO_PUBLIC_DOMAIN;
    }
  });

  it('hasApiConfig() returns false when EXPO_PUBLIC_DOMAIN is unset', () => {
    expect(hasApiConfig()).toBe(false);
  });

  it('fetchLocationDescription throws when EXPO_PUBLIC_DOMAIN is unset', async () => {
    await expect(fetchLocationDescription(LOCATION_PARAMS)).rejects.toThrow(/No backend configured/i);
  });

  it('fetchExamineDescription throws when EXPO_PUBLIC_DOMAIN is unset', async () => {
    await expect(fetchExamineDescription(EXAMINE_PARAMS)).rejects.toThrow(/No backend configured/i);
  });

  it('fetchNpcDialogue throws when EXPO_PUBLIC_DOMAIN is unset', async () => {
    await expect(fetchNpcDialogue(NPC_PARAMS)).rejects.toThrow(/No backend configured/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API: network failure (fetch rejects / AbortError)
// ─────────────────────────────────────────────────────────────────────────────

describe('api.ts — fetch fails (network down or timed out)', () => {
  let originalDomain: string | undefined;

  beforeEach(() => {
    originalDomain = process.env.EXPO_PUBLIC_DOMAIN;
    process.env.EXPO_PUBLIC_DOMAIN = 'test.replit.dev';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalDomain !== undefined) {
      process.env.EXPO_PUBLIC_DOMAIN = originalDomain;
    } else {
      delete process.env.EXPO_PUBLIC_DOMAIN;
    }
  });

  it('fetchLocationDescription throws on fetch rejection', async () => {
    await expect(fetchLocationDescription(LOCATION_PARAMS)).rejects.toThrow();
  });

  it('fetchExamineDescription throws on fetch rejection', async () => {
    await expect(fetchExamineDescription(EXAMINE_PARAMS)).rejects.toThrow();
  });

  it('fetchNpcDialogue throws on fetch rejection', async () => {
    await expect(fetchNpcDialogue(NPC_PARAMS)).rejects.toThrow();
  });

  it('fetchLocationDescription throws on AbortError (timeout)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(Object.assign(new Error('AbortError'), { name: 'AbortError' })),
    );
    await expect(fetchLocationDescription(LOCATION_PARAMS)).rejects.toThrow();
  });

  it('fetchExamineDescription throws on AbortError (timeout)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(Object.assign(new Error('AbortError'), { name: 'AbortError' })),
    );
    await expect(fetchExamineDescription(EXAMINE_PARAMS)).rejects.toThrow();
  });

  it('fetchNpcDialogue throws on AbortError (timeout)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(Object.assign(new Error('AbortError'), { name: 'AbortError' })),
    );
    await expect(fetchNpcDialogue(NPC_PARAMS)).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveLocationDescription — production fallback wiring
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveLocationDescription() — production fallback (gameFallbacks.ts)', () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  it('returns source:"offline" and the bundled text when API throws (no backend)', async () => {
    const fallback = 'A quiet space lined with books.';
    const result = await resolveLocationDescription(LOCATION_PARAMS, fallback);

    expect(result.source).toBe('offline');
    expect(result.text).toBe(fallback);
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('returns source:"offline" when fetch rejects', async () => {
    process.env.EXPO_PUBLIC_DOMAIN = 'test.replit.dev';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const fallback = 'Squeaky floors and motivational posters.';
    const result = await resolveLocationDescription(
      { ...LOCATION_PARAMS, locationName: 'Gym', locationDescription: fallback },
      fallback,
    );

    expect(result.source).toBe('offline');
    expect(result.text).toBe(fallback);
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  it('keeps bundled text and reports a safe rate-limited source', async () => {
    process.env.EXPO_PUBLIC_DOMAIN = 'test.replit.dev';
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ error: 'raw middleware detail' }), {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'retry-after': '0',
        },
      }),
    );
    vi.stubGlobal('fetch', fetcher);

    const fallback = 'Squeaky floors and motivational posters.';
    const result = await resolveLocationDescription(
      { ...LOCATION_PARAMS, locationName: 'Gym', locationDescription: fallback },
      fallback,
    );

    expect(result).toEqual({ source: 'rate_limited', text: fallback });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(new RateLimitError('/ai/describe', 0).message).not.toContain(
      'raw middleware detail',
    );
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  it('returns source:"online" when fetch succeeds', async () => {
    process.env.EXPO_PUBLIC_DOMAIN = 'test.replit.dev';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ description: 'AI-generated description of the library.' }),
      }),
    );

    const result = await resolveLocationDescription(LOCATION_PARAMS, 'fallback');

    expect(result.source).toBe('online');
    expect(result.text).toBe('AI-generated description of the library.');
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveExamineDescription — production fallback wiring
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveExamineDescription() — production fallback (gameFallbacks.ts)', () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  it('returns source:"offline" and bundled text when API throws (no backend)', async () => {
    const fallback = 'A cork board covered in flyers and announcements.';
    const result = await resolveExamineDescription(EXAMINE_PARAMS, fallback);

    expect(result.source).toBe('offline');
    expect(result.text).toBe(fallback);
  });

  it('returns source:"offline" when fetch rejects (network down)', async () => {
    process.env.EXPO_PUBLIC_DOMAIN = 'test.replit.dev';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const fallback = 'A dusty old bulletin board.';
    const result = await resolveExamineDescription(EXAMINE_PARAMS, fallback);

    expect(result.source).toBe('offline');
    expect(result.text).toBe(fallback);
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  it('returns source:"offline" when fetch times out (AbortError)', async () => {
    process.env.EXPO_PUBLIC_DOMAIN = 'test.replit.dev';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(Object.assign(new Error('AbortError'), { name: 'AbortError' })),
    );

    const fallback = 'A bulletin board with many layers of flyers.';
    const result = await resolveExamineDescription(EXAMINE_PARAMS, fallback);

    expect(result.source).toBe('offline');
    expect(result.text).toBe(fallback);
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  it('returns source:"online" when fetch succeeds', async () => {
    process.env.EXPO_PUBLIC_DOMAIN = 'test.replit.dev';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ description: 'AI-generated examine text.' }),
      }),
    );

    const result = await resolveExamineDescription(EXAMINE_PARAMS, 'fallback');

    expect(result.source).toBe('online');
    expect(result.text).toBe('AI-generated examine text.');
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveNpcReply — production fallback wiring
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveNpcReply() — production fallback (gameFallbacks.ts)', () => {
  const offlineFallback = () =>
    generateNPCLine({
      npcId: 'npc_torres',
      npcName: 'Ms. Torres',
      archetype: 'mentor',
      emotionState: 'neutral',
      lineType: 'response',
      playerName: 'Alex',
      dayOffset: 0,
    });

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  it('returns source:"offline" with bundled NPC line when API throws (no backend)', async () => {
    const result = await resolveNpcReply(NPC_PARAMS, offlineFallback);

    expect(result.source).toBe('offline');
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.text).toBe(offlineFallback());
  });

  it('returns source:"offline" when fetch rejects (network down)', async () => {
    process.env.EXPO_PUBLIC_DOMAIN = 'test.replit.dev';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await resolveNpcReply(NPC_PARAMS, offlineFallback);

    expect(result.source).toBe('offline');
    expect(result.text.length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  it('returns source:"offline" when fetch times out (AbortError)', async () => {
    process.env.EXPO_PUBLIC_DOMAIN = 'test.replit.dev';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(Object.assign(new Error('AbortError'), { name: 'AbortError' })),
    );

    const result = await resolveNpcReply(NPC_PARAMS, offlineFallback);

    expect(result.source).toBe('offline');
    expect(result.text.length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  it('offline fallback is deterministic — same inputs produce the same line', async () => {
    const result1 = await resolveNpcReply(NPC_PARAMS, offlineFallback);
    const result2 = await resolveNpcReply(NPC_PARAMS, offlineFallback);

    expect(result1.source).toBe('offline');
    expect(result1.text).toBe(result2.text);
  });

  it('returns source:"online" when fetch succeeds', async () => {
    process.env.EXPO_PUBLIC_DOMAIN = 'test.replit.dev';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: 'The AI-powered NPC reply.' }),
      }),
    );

    const result = await resolveNpcReply(NPC_PARAMS, offlineFallback);

    expect(result.source).toBe('online');
    expect(result.text).toBe('The AI-powered NPC reply.');
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });

  it('offline fallback thunk is only called when online path fails', async () => {
    process.env.EXPO_PUBLIC_DOMAIN = 'test.replit.dev';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: 'Live reply.' }),
      }),
    );

    const spy = vi.fn().mockReturnValue('This should not be used');
    const result = await resolveNpcReply(NPC_PARAMS, spy);

    expect(result.source).toBe('online');
    expect(spy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_DOMAIN;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateQuizSet — valid quiz with no network
// ─────────────────────────────────────────────────────────────────────────────

describe('generateQuizSet() — produces a valid quiz with no network', () => {
  const subjects = ['math', 'language_arts', 'science', 'social_studies'] as const;

  it.each(subjects)('generates a non-empty quiz for subject: %s', (subject) => {
    const quiz = generateQuizSet(subject, `test-seed-${subject}`, 5);

    expect(quiz.subject).toBe(subject);
    expect(quiz.questions.length).toBeGreaterThan(0);
    expect(quiz.questions.length).toBeLessThanOrEqual(5);
  });

  it('each question has all required fields', () => {
    const quiz = generateQuizSet('math', 'field-check-seed', 5);
    for (const q of quiz.questions) {
      expect(typeof q.id).toBe('string');
      expect(q.id.length).toBeGreaterThan(0);
      expect(typeof q.question).toBe('string');
      expect(q.question.length).toBeGreaterThan(0);
      expect(typeof q.answer).toBe('string');
      expect(q.answer.length).toBeGreaterThan(0);
      expect(typeof q.explanation).toBe('string');
      expect(q.subject).toBe('math');
    }
  });

  it('is deterministic — same subject + seed = same questions', () => {
    const a = generateQuizSet('science', 'determinism-test', 5);
    const b = generateQuizSet('science', 'determinism-test', 5);
    expect(a.questions.map((q) => q.id)).toEqual(b.questions.map((q) => q.id));
  });

  it('different seeds produce different question sets', () => {
    const a = generateQuizSet('math', 'seed-alpha', 5);
    const b = generateQuizSet('math', 'seed-beta', 5);
    expect(a.questions.map((q) => q.id)).not.toEqual(b.questions.map((q) => q.id));
  });

  it('puts matching focus topics first while retaining general subject questions', () => {
    const quiz = generateQuizSet('math', 'focus-seed', 5, ['Linear Equations']);
    const focusedCount = quiz.questions.filter(
      question => question.topic === 'Linear Equations',
    ).length;

    expect(focusedCount).toBeGreaterThan(0);
    expect(quiz.questions.slice(0, focusedCount).every(
      question => question.topic === 'Linear Equations',
    )).toBe(true);
    expect(quiz.questions.slice(focusedCount).some(
      question => question.topic !== 'Linear Equations',
    )).toBe(true);
  });

  it.each([
    { subject: 'math', contentLabel: 'Math Reasoning', focusTopic: 'Linear Equations' },
    { subject: 'language_arts', contentLabel: 'Language Arts', focusTopic: 'Evidence and Claims' },
    { subject: 'science', contentLabel: 'Science', focusTopic: 'Scientific Method' },
    { subject: 'social_studies', contentLabel: 'Social Studies', focusTopic: 'US Government' },
  ] as const)(
    'prioritizes focus questions for $subject and preserves general questions',
    ({ subject, contentLabel, focusTopic }) => {
      expect(focusSubjectKey(contentLabel)).toBe(subject);

      const quiz = generateQuizSet(subject, `focus-${subject}`, 5, [focusTopic]);
      const focusedCount = quiz.questions.filter(
        question => topicMatchesFocus(question.topic, focusTopic),
      ).length;

      expect(focusedCount).toBeGreaterThan(0);
      expect(quiz.questions.slice(0, focusedCount).every(
        question => topicMatchesFocus(question.topic, focusTopic),
      )).toBe(true);
      expect(quiz.questions.slice(focusedCount).some(
        question => !topicMatchesFocus(question.topic, focusTopic),
      )).toBe(true);
      expect(generateQuizSet(subject, `focus-${subject}`, 5, [focusTopic])).toEqual(quiz);
    },
  );

  it('maps every subject label emitted by weekly offline focus packs', () => {
    const expectedSubjects = new Map([
      ['Math Reasoning', 'math'],
      ['Language Arts', 'language_arts'],
      ['Science', 'science'],
      ['Social Studies', 'social_studies'],
    ]);

    for (const day of [1, 8, 15, 22]) {
      const pack = generateOfflineContentPack(day);
      for (const focus of pack.gedFocusAreas) {
        expect(focusSubjectKey(focus.subject)).toBe(expectedSubjects.get(focus.subject));
      }
    }
  });

  it('connects every weekly focus topic to prioritized bundled questions', () => {
    for (const day of [1, 8, 15, 22]) {
      const pack = generateOfflineContentPack(day);

      for (const focus of pack.gedFocusAreas) {
        const subject = focusSubjectKey(focus.subject);
        expect(subject).not.toBeNull();

        const quiz = generateQuizSet(
          subject!,
          `weekly-focus-${day}-${focus.topic}`,
          5,
          [focus.topic],
        );
        const focusedCount = quiz.questions.filter(question =>
          isQuestionFocusMatched(question, [focus.topic]),
        ).length;

        expect(focusedCount, `${focus.subject}: ${focus.topic}`).toBeGreaterThan(0);
        expect(
          quiz.questions.slice(0, focusedCount).every(question =>
            isQuestionFocusMatched(question, [focus.topic]),
          ),
        ).toBe(true);
        expect(
          quiz.questions.slice(focusedCount).some(question =>
            !isQuestionFocusMatched(question, [focus.topic]),
          ),
        ).toBe(true);
      }
    }
  });

  it('keeps focus-prioritized quiz order deterministic', () => {
    const focusTopics = ['Ratios & Proportions'];
    const first = generateQuizSet('math', 'focus-deterministic', 5, focusTopics);
    const second = generateQuizSet('math', 'focus-deterministic', 5, focusTopics);

    expect(first).toEqual(second);
  });

  it('does not call fetch — works with zero network access', () => {
    const spy = vi.fn().mockRejectedValue(new Error('fetch must not be called'));
    vi.stubGlobal('fetch', spy);

    const quiz = generateQuizSet('social_studies', 'no-network-seed', 3);
    expect(quiz.questions.length).toBeGreaterThan(0);
    expect(spy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateOfflineConversation — full conversation, no network
// ─────────────────────────────────────────────────────────────────────────────

describe('generateOfflineConversation() — full conversation with no network', () => {
  it('produces a conversation with opening and farewell lines', () => {
    const convo = generateOfflineConversation({
      npcId: 'npc_torres',
      npcName: 'Ms. Torres',
      archetype: 'mentor',
      emotionState: 'happy',
      relationshipTier: 'friend',
      playerName: 'Alex',
      location: 'Library',
    });

    expect(convo.npcId).toBe('npc_torres');
    expect(convo.lines.length).toBeGreaterThanOrEqual(2);
    expect(convo.lines[0].type).toBe('opening');
    expect(convo.lines[convo.lines.length - 1].type).toBe('farewell');
    expect(convo.topicSuggestions.length).toBeGreaterThan(0);
  });

  it('is deterministic across all 10 archetypes', () => {
    const archetypes = [
      'scholar', 'rebel', 'leader', 'nurturer', 'perfectionist',
      'socialite', 'loner', 'optimist', 'cynic', 'mentor',
    ] as const;

    for (const archetype of archetypes) {
      const opts = {
        npcId: `npc_${archetype}`,
        npcName: 'Test NPC',
        archetype,
        emotionState: 'neutral' as const,
        relationshipTier: 'acquaintance' as const,
      };
      const c1 = generateOfflineConversation(opts);
      const c2 = generateOfflineConversation(opts);
      expect(c1.lines.map((l) => l.text)).toEqual(c2.lines.map((l) => l.text));
    }
  });

  it('all lines have non-empty text', () => {
    const convo = generateOfflineConversation({
      npcId: 'npc_rebel',
      npcName: 'Jordan',
      archetype: 'rebel',
      emotionState: 'angry',
      relationshipTier: 'stranger',
    });
    for (const line of convo.lines) {
      expect(line.text.trim().length).toBeGreaterThan(0);
    }
  });

  it('occasionally references the weekly theme deterministically', () => {
    const theme = 'Community Outreach Drive';
    const options = {
      npcId: 'npc_torres',
      npcName: 'Ms. Torres',
      archetype: 'mentor' as const,
      emotionState: 'neutral' as const,
      relationshipTier: 'friend' as const,
      weeklyTheme: theme,
    };
    const firstPass = Array.from({ length: 21 }, (_, dayOffset) =>
      generateNPCLine({
        ...options,
        lineType: 'response',
        dayOffset,
      }),
    );
    const secondPass = Array.from({ length: 21 }, (_, dayOffset) =>
      generateNPCLine({
        ...options,
        lineType: 'response',
        dayOffset,
      }),
    );

    expect(firstPass).toEqual(secondPass);
    expect(firstPass.some((line) => line.includes(theme))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateOfflineContentPack — campus bulletin fallback
// ─────────────────────────────────────────────────────────────────────────────

describe('generateOfflineContentPack() — valid pack with no network', () => {
  it('returns a pack with all required ContentPack fields', () => {
    const pack = generateOfflineContentPack(5);

    expect(typeof pack.version).toBe('string');
    expect(pack.version.length).toBeGreaterThan(0);
    expect(typeof pack.generatedAt).toBe('number');
    expect(typeof pack.expiresAt).toBe('number');
    expect(pack.expiresAt).toBeGreaterThan(pack.generatedAt);
    expect(typeof pack.weeklyTheme).toBe('string');
    expect(pack.weeklyTheme.length).toBeGreaterThan(0);
    expect(pack.generatedBy).toBe('deterministic');
    expect(Array.isArray(pack.activeEvents)).toBe(true);
    expect(Array.isArray(pack.gedFocusAreas)).toBe(true);
    expect(pack.gedFocusAreas.length).toBeGreaterThan(0);
    expect(isUsableContentPack(pack, pack.generatedAt + 1)).toBe(true);
  });

  it('active events have all required ContentPackEvent fields', () => {
    const pack = generateOfflineContentPack(3);
    for (const event of pack.activeEvents) {
      expect(typeof event.id).toBe('string');
      expect(typeof event.title).toBe('string');
      expect(typeof event.description).toBe('string');
      expect(typeof event.npcReaction).toBe('string');
      expect(typeof event.playerHook).toBe('string');
      expect(typeof event.category).toBe('string');
      expect(Array.isArray(event.tags)).toBe(true);
    }
  });
});

describe('ensureUsableContentPack() — malformed remote bulletin fallback', () => {
  const day = 12;
  const remoteEvent: ContentPackEvent = {
    id: 'remote-campus-survey',
    title: 'Campus Survey Opens',
    description: 'Students can share priorities for the next term.',
    npcReaction: 'Everyone has an opinion about what should change.',
    playerHook: 'Read the proposals and add your own response.',
    category: 'institutional',
    durationDays: 3,
    tags: ['survey', 'campus'],
  };

  function basePack(): ContentPack {
    return {
      ...generateOfflineContentPack(day),
      activeEvents: [remoteEvent],
      generatedBy: 'gpt',
    };
  }

  it('accepts every field in a server-approved pack', () => {
    const serverPack: ContentPack = {
      ...generateOfflineContentPack(day),
      version: 'pack-server-approved',
      generatedBy: 'gpt',
      eventsRepaired: false,
    };

    expect(isUsableContentPack(serverPack, serverPack.generatedAt + 1)).toBe(true);
  });

  it.each([
    {
      label: 'mood shift',
      mutate: (pack: ContentPack) => ({
        ...pack,
        npcMoodShifts: pack.npcMoodShifts.map((mood, index) =>
          index === 0 ? { ...mood, reason: '' } : mood,
        ),
      }),
    },
    {
      label: 'GED focus area',
      mutate: (pack: ContentPack) => ({
        ...pack,
        gedFocusAreas: pack.gedFocusAreas.map((focus, index) =>
          index === 0 ? { ...focus, subject: 'history' } : focus,
        ),
      }),
    },
    {
      label: 'expiry',
      mutate: (pack: ContentPack) => ({
        ...pack,
        expiresAt: pack.generatedAt,
      }),
    },
  ])('rejects malformed $label metadata before it can be cached', async ({ mutate }) => {
    const malformedPack = mutate(basePack());
    const now = malformedPack.generatedAt + 1;

    expect(isUsableContentPack(malformedPack, now)).toBe(false);
    await expect(
      resolveContentPackRefresh(async () => malformedPack, null, day),
    ).resolves.toMatchObject({
      source: 'offline',
      pack: { generatedBy: 'deterministic' },
    });
  });

  it('rejects duplicate event IDs in the shared contract while repairing them for display', () => {
    const pack = basePack();
    const duplicatePack = {
      ...pack,
      activeEvents: [pack.activeEvents[0], pack.activeEvents[0], pack.activeEvents[2]],
    };

    expect(isUsableContentPack(duplicatePack, pack.generatedAt + 1)).toBe(false);
    const repaired = ensureUsableContentPack(duplicatePack, day);
    expect(repaired.eventsRepaired).toBe(true);
    expect(new Set(repaired.activeEvents.map(event => event.id)).size)
      .toBe(BULLETIN_EVENT_LIMIT);
  });

  function expectDisplayableUniqueBulletin(events: unknown[]) {
    expect(events).toHaveLength(BULLETIN_EVENT_LIMIT);
    expect(new Set(
      events
        .filter(isDisplayableContentPackEvent)
        .map((event) => event.id.trim().toLowerCase()),
    ).size).toBe(BULLETIN_EVENT_LIMIT);
    events.forEach((event) => {
      expect(isDisplayableContentPackEvent(event)).toBe(true);
    });
  }

  it('keeps a connected study pack when the enrichment request succeeds', async () => {
    const connectedPack: ContentPack = {
      ...generateOfflineContentPack(day),
      version: 'connected-pack',
      generatedBy: 'gpt',
      eventsRepaired: false,
    };

    await expect(
      resolveContentPackRefresh(
        async () => connectedPack,
        null,
        day,
      ),
    ).resolves.toEqual({
      pack: connectedPack,
      source: 'online',
    });
  });

  it('keeps cached or deterministic study content when enrichment fails', async () => {
    const cachedPack = generateOfflineContentPack(day);

    await expect(
      resolveContentPackRefresh(
        async () => {
          throw new Error('AI service unavailable');
        },
        cachedPack,
        day + 1,
      ),
    ).resolves.toEqual({
      pack: cachedPack,
      source: 'offline',
    });

    await expect(
      resolveContentPackRefresh(
        async () => {
          throw new Error('AI service unavailable');
        },
        null,
        day + 1,
      ),
    ).resolves.toMatchObject({
      source: 'offline',
      pack: { generatedBy: 'deterministic' },
    });
  });

  it('keeps the visible bulletin while a superseded refresh is in flight', async () => {
    const makeUsablePack = (version: string): ContentPack => ({
      ...generateOfflineContentPack(day),
      version,
      generatedBy: 'gpt',
      eventsRepaired: false,
    });
    const visiblePack = makeUsablePack('visible-pack');
    const earlierPack = makeUsablePack('earlier-pack');
    const latestPack = makeUsablePack('latest-pack');
    let releaseEarlier!: (pack: ContentPack) => void;
    let releaseLatest!: (pack: ContentPack) => void;
    const earlierFetch = new Promise<ContentPack>((resolve) => {
      releaseEarlier = resolve;
    });
    const latestFetch = new Promise<ContentPack>((resolve) => {
      releaseLatest = resolve;
    });
    let activeRequest = 1;
    let renderedPack: ContentPack | null = visiblePack;

    const earlierRefresh = resolveContentPackRefresh(
      () => earlierFetch,
      null,
      day,
    ).then((result) => {
      if (activeRequest === 1) renderedPack = result.pack;
      return result;
    });

    activeRequest = 2;
    renderedPack = retainVisibleContentPack(renderedPack, null);
    expect(renderedPack).toBe(visiblePack);

    const latestRefresh = resolveContentPackRefresh(
      () => latestFetch,
      null,
      day,
    ).then((result) => {
      if (activeRequest === 2) renderedPack = result.pack;
      return result;
    });

    expect(renderedPack).toBe(visiblePack);
    releaseLatest(latestPack);
    await expect(latestRefresh).resolves.toMatchObject({
      pack: latestPack,
      source: 'online',
    });
    expect(renderedPack).toMatchObject({ version: 'latest-pack' });

    releaseEarlier(earlierPack);
    await expect(earlierRefresh).resolves.toMatchObject({
      pack: earlierPack,
      source: 'online',
    });
    expect(renderedPack).toMatchObject({ version: 'latest-pack' });
  });

  it('replaces a missing activeEvents array with deterministic displayable events', () => {
    const malformedPack = {
      ...basePack(),
      activeEvents: undefined,
      rssHeadlines: undefined,
    } as unknown as ContentPack;

    const result = ensureUsableContentPack(malformedPack, day);

    expect(result.generatedBy).toBe('deterministic');
    expect(result.eventsRepaired).toBe(true);
    expectDisplayableUniqueBulletin(result.activeEvents);
  });

  it('keeps valid remote events and replaces duplicate or partial records', () => {
    const malformedPack = {
      ...basePack(),
      activeEvents: [
        remoteEvent,
        { ...remoteEvent, title: 'Duplicate copy' },
        { ...remoteEvent, id: 'partial-event', description: '', tags: undefined },
      ],
      rssHeadlines: ['Exam assessment study'],
    } as unknown as ContentPack;

    const result = ensureUsableContentPack(malformedPack, day);

    expect(result.activeEvents[0]).toBe(remoteEvent);
    expect(result.activeEvents.filter((event) => event.id === remoteEvent.id)).toHaveLength(1);
    expect(result.generatedBy).toBe('deterministic');
    expect(result.eventsRepaired).toBe(true);
    expectDisplayableUniqueBulletin(result.activeEvents);
  });

  it('keeps a fresh valid cache and rejects expired or malformed cache JSON', async () => {
    const pack = generateOfflineContentPack(day);
    const now = pack.generatedAt + 1;
    const storage = new Map<string, string>();
    const storageAdapter = {
      getItem: async (key: string) => storage.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        storage.set(key, value);
      },
    };

    expect(await writeCachedContentPack(storageAdapter, pack, now)).toBe(true);
    const raw = storage.values().next().value as string;
    expect(parseCachedContentPack(raw, now)).toEqual(pack);
    await expect(readCachedContentPack(storageAdapter, now)).resolves.toEqual(pack);

    const restartedStorageAdapter = {
      getItem: async (key: string) => storage.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        storage.set(key, value);
      },
    };
    await expect(readCachedContentPack(restartedStorageAdapter, now)).resolves.toEqual(pack);

    expect(parseCachedContentPack(
      JSON.stringify({ ...pack, expiresAt: now }),
      now,
    )).toBeNull();
    expect(parseCachedContentPack(
      JSON.stringify({ ...pack, activeEvents: [pack.activeEvents[0]] }),
      now,
    )).toBeNull();
    expect(parseCachedContentPack('{not-json', now)).toBeNull();
  });

  it('reports rejected and unavailable storage writes without exposing raw errors', async () => {
    const pack = generateOfflineContentPack(day);
    const rejectedStorage = {
      getItem: async () => null,
      setItem: async () => {
        throw new Error('permission denied: private storage detail');
      },
    };
    const unavailableStorage = {
      getItem: async () => null,
    } as unknown as Parameters<typeof writeCachedContentPack>[0];

    await expect(
      writeCachedContentPackResult(rejectedStorage, pack),
    ).resolves.toEqual({ status: 'failed', reason: 'storage' });
    await expect(
      writeCachedContentPackResult(unavailableStorage, pack),
    ).resolves.toEqual({ status: 'failed', reason: 'storage' });
    expect(
      getContentPackStorageStatus({ status: 'failed', reason: 'storage' }),
    ).toBe('write-failed');
    expect(
      getContentPackStorageStatus({ status: 'written' }),
    ).toBe('stored');
    expect(
      getContentPackStorageStatus({ status: 'skipped' }),
    ).toBe('unknown');
    await expect(writeCachedContentPack(rejectedStorage, pack)).resolves.toBe(false);
  });

  it('persists a remote bulletin through AsyncStorage across a relaunch fixture', async () => {
    const values = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
      clear: () => {
        values.clear();
      },
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() {
        return values.size;
      },
    };

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { localStorage },
    });

    try {
      const remotePack: ContentPack = {
        ...generateOfflineContentPack(day),
        version: 'pack-remote-relaunch',
        generatedBy: 'gpt',
        eventsRepaired: false,
      };
      const now = remotePack.generatedAt + 1;

      await expect(writeCachedContentPack(AsyncStorage, remotePack, now)).resolves.toBe(true);

      // A fresh provider instance gets the same device-backed value before any
      // network refresh is attempted.
      await expect(readCachedContentPack(AsyncStorage, now)).resolves.toEqual(remotePack);

      localStorage.setItem(
        'academy-content-pack-v1',
        JSON.stringify({ ...remotePack, expiresAt: now }),
      );
      await expect(readCachedContentPack(AsyncStorage, now)).resolves.toBeNull();

      localStorage.setItem('academy-content-pack-v1', '{not-json');
      await expect(readCachedContentPack(AsyncStorage, now)).resolves.toBeNull();
      expect(fallbackAfterRefreshFailure(null, day).generatedBy).toBe('deterministic');
    } finally {
      delete (globalThis as { window?: unknown }).window;
    }
  });

  it('prefers the last usable cached bulletin after a refresh failure', () => {
    const cachedPack = generateOfflineContentPack(day);
    expect(fallbackAfterRefreshFailure(cachedPack, day + 1)).toBe(cachedPack);

    const generated = fallbackAfterRefreshFailure(null, day + 1);
    expect(generated.generatedBy).toBe('deterministic');
    expectDisplayableUniqueBulletin(generated.activeEvents);
  });

  it('skips a superseded queued write before it can replace a newer cache', async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: async (key: string) => values.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const writeQueue = createContentPackWriteQueue(storage);
    const oldPack = { ...generateOfflineContentPack(day), version: 'pack-old' };
    const newPack = { ...generateOfflineContentPack(day), version: 'pack-new' };
    let oldRequestCurrent = true;

    const oldWrite = writeQueue(oldPack, () => oldRequestCurrent);
    oldRequestCurrent = false;
    const newWrite = writeQueue(newPack, () => true);

    await expect(oldWrite).resolves.toBe(false);
    await expect(newWrite).resolves.toBe(true);
    await expect(readCachedContentPack(storage)).resolves.toMatchObject({
      version: 'pack-new',
    });
  });

  it('leaves the newer pack last when an older storage write finishes slowly', async () => {
    const values = new Map<string, string>();
    let releaseOldWrite = () => {};
    const oldWriteBlocked = new Promise<void>((resolve) => {
      releaseOldWrite = resolve;
    });
    const storage = {
      getItem: async (key: string) => values.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        const pack = JSON.parse(value) as ContentPack;
        if (pack.version === 'pack-old') await oldWriteBlocked;
        values.set(key, value);
      },
    };
    const writeQueue = createContentPackWriteQueue(storage);
    const oldPack = { ...generateOfflineContentPack(day), version: 'pack-old' };
    const newPack = { ...generateOfflineContentPack(day), version: 'pack-new' };
    const oldWrite = writeQueue(oldPack, () => true);
    await Promise.resolve();
    const newWrite = writeQueue(newPack, () => true);

    releaseOldWrite();
    await expect(oldWrite).resolves.toBe(true);
    await expect(newWrite).resolves.toBe(true);
    await expect(readCachedContentPack(storage)).resolves.toMatchObject({
      version: 'pack-new',
    });
  });

  it('recovers a newer write after an older storage operation rejects', async () => {
    const values = new Map<string, string>();
    let shouldReject = true;
    const storage = {
      getItem: async (key: string) => values.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        if (shouldReject) {
          shouldReject = false;
          throw new Error('storage unavailable');
        }
        values.set(key, value);
      },
    };
    const writeQueue = createContentPackWriteQueueWithResult(storage);
    const oldPack = { ...generateOfflineContentPack(day), version: 'pack-old' };
    const newPack = { ...generateOfflineContentPack(day), version: 'pack-new' };

    await expect(writeQueue(oldPack, () => true)).resolves.toEqual({
      status: 'failed',
      reason: 'storage',
    });
    expect(
      getContentPackStorageStatus(
        await writeQueue(newPack, () => true),
      ),
    ).toBe('stored');
    await expect(readCachedContentPack(storage)).resolves.toMatchObject({
      version: 'pack-new',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Support utilities — all offline
// ─────────────────────────────────────────────────────────────────────────────

describe('matchEventsToHeadlines() — offline RSS enrichment', () => {
  const now = new Date('2026-09-14T12:00:00Z');
  const day = Math.floor(now.getTime() / 86_400_000);
  const headlineFixtures = [
    {
      category: 'academic',
      templateId: 'exam-week',
      expectedTag: 'exam',
      headline: 'Exam assessment and study pressure rises across campus',
    },
    {
      category: 'social',
      templateId: 'talent-showcase',
      expectedTag: 'performance',
      headline: 'Student performance and community culture event draws a crowd',
    },
    {
      category: 'discovery',
      templateId: 'astronomical-event',
      expectedTag: 'astronomy',
      headline: 'Astronomy observation opens a rare space window',
    },
    {
      category: 'mystery',
      templateId: 'strange-pattern',
      expectedTag: 'conspiracy',
      headline: 'Investigation reveals a conspiracy and a strange pattern',
    },
    {
      category: 'crisis',
      templateId: 'power-outage',
      expectedTag: 'emergency',
      headline: 'Emergency power outage leaves the campus in the dark',
    },
    {
      category: 'competition',
      templateId: 'academic-olympiad',
      expectedTag: 'olympiad',
      headline: 'Academic olympiad brings teams from across the region to campus',
    },
    {
      category: 'institutional',
      templateId: 'inspection',
      expectedTag: 'inspection',
      headline: 'External inspection reviews standards and accountability at the academy',
    },
    {
      category: 'seasonal',
      templateId: 'term-opening',
      expectedTag: 'new term',
      headline: 'New term arrival welcomes students back to the academy',
    },
  ] as const;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.stubGlobal('fetch', vi.fn(() => {
      throw new Error('Headline matching must remain offline');
    }));
  });

  afterEach(() => {
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function expectValidEvent(
    event: OfflineWorldEvent,
    instanceKind: 'rss' | 'daily' | 'either' = 'rss',
  ) {
    for (const field of ['id', 'instanceId', 'title', 'description', 'activeNpcReaction', 'activePlayerHook'] as const) {
      expect(typeof event[field]).toBe('string');
      expect(event[field].trim().length).toBeGreaterThan(0);
    }
    expect(event.startDay).toBe(day);
    const expectedInstanceIds =
      instanceKind === 'rss'
        ? [`${event.id}-rss-day${day}`]
        : instanceKind === 'daily'
          ? [`${event.id}-day${day}`]
          : [`${event.id}-rss-day${day}`, `${event.id}-day${day}`];
    expect(expectedInstanceIds).toContain(event.instanceId);
    expect(event.id).toBe(event.template.id);
    expect(event.title).toBe(event.template.title);
    expect(event.description).toBe(event.template.description);
    expect(event.template.npcReactions).toContain(event.activeNpcReaction);
    expect(event.template.playerHooks).toContain(event.activePlayerHook);
    expect(['academic', 'social', 'crisis', 'discovery', 'competition', 'institutional', 'seasonal', 'mystery'])
      .toContain(event.template.category);
    expect(['hours', 'days', 'weeks']).toContain(event.template.duration);
    for (const field of ['effects', 'npcReactions', 'playerHooks', 'tags'] as const) {
      expect(event.template[field].length).toBeGreaterThan(0);
      for (const value of event.template[field]) {
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  }

  it('keeps the complete event-template library ready for headline matching', () => {
    expect(validateEventTemplateTags()).toEqual([]);
    expect(validateEventTemplates()).toEqual([]);
  });

  it('validates a shared registry once per scope', () => {
    const scope = createEventTemplateValidationScope();

    assertValidEventTemplates(undefined, scope);
    assertValidEventTemplates(undefined, scope);

    expect(scope.validated).toBe(true);
  });

  it('reports malformed tags with template identity and category', () => {
    const sourceTemplate = EVENT_TEMPLATES.academic[0];
    const issues = validateEventTemplateTags([
      {
        ...sourceTemplate,
        id: 'malformed-tag-fixture',
        tags: ['', '   ', ' Math ', 'math', 'MATH'],
      },
    ]);

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        templateId: 'malformed-tag-fixture',
        category: 'academic',
        tagIndex: 0,
        reason: 'blank',
      }),
      expect.objectContaining({
        templateId: 'malformed-tag-fixture',
        category: 'academic',
        tagIndex: 1,
        reason: 'whitespace-only',
      }),
      expect.objectContaining({
        templateId: 'malformed-tag-fixture',
        category: 'academic',
        tagIndex: 2,
        reason: 'untrimmed',
      }),
      expect.objectContaining({
        templateId: 'malformed-tag-fixture',
        category: 'academic',
        tagIndex: 2,
        reason: 'not-lowercase',
      }),
      expect.objectContaining({
        templateId: 'malformed-tag-fixture',
        category: 'academic',
        tagIndex: 3,
        reason: 'duplicate',
        normalizedTag: 'math',
      }),
    ]));
  });

  it.each([
    ['title', { title: '' }, 'blank'],
    ['description', { description: '   ' }, 'whitespace-only'],
    ['npcReactions', { npcReactions: [] }, 'empty-array'],
    ['playerHooks', { playerHooks: [''] }, 'blank'],
    ['duration', { duration: 'months' }, 'invalid'],
  ] as const)(
    'reports malformed narrative field %s with template identity, category, and reason',
    (field, override, reason) => {
      const sourceTemplate = EVENT_TEMPLATES.academic[0];
      const fixture = {
        ...sourceTemplate,
        ...override,
        id: `malformed-${field}-fixture`,
      } as WorldEventTemplate;

      const issues = validateEventTemplates([fixture]);

      expect(issues).toEqual(expect.arrayContaining([
        expect.objectContaining({
          templateId: `malformed-${field}-fixture`,
          category: 'academic',
          field,
          reason,
        }),
      ]));
    },
  );

  it('fails offline generation before malformed narrative fields reach players', () => {
    const sourceTemplate = EVENT_TEMPLATES.academic[0];
    const originalTemplate = { ...sourceTemplate };
    const malformedFixtures: Array<{
      field: string;
      value: unknown;
      reason: string;
    }> = [
      { field: 'title', value: '', reason: 'blank' },
      { field: 'description', value: '   ', reason: 'whitespace-only' },
      { field: 'npcReactions', value: [], reason: 'empty-array' },
      { field: 'playerHooks', value: [''], reason: 'blank' },
      { field: 'duration', value: 'months', reason: 'invalid' },
    ];

    try {
      for (const fixture of malformedFixtures) {
        Object.assign(sourceTemplate, { [fixture.field]: fixture.value });
        expect(() => generateDailyEvents(42)).toThrow(
          new RegExp(
            `template "exam-week".*category "academic".*field "${fixture.field}".*${fixture.reason}`,
          ),
        );
        Object.assign(sourceTemplate, originalTemplate);
      }
    } finally {
      Object.assign(sourceTemplate, originalTemplate);
    }
  });

  it('returns an empty array for an empty headline list', () => {
    expect(matchEventsToHeadlines([])).toEqual([]);
  });

  it('fails fast when malformed tags reach offline headline generation', () => {
    const sourceTemplate = EVENT_TEMPLATES.academic[0];
    const originalTags = sourceTemplate.tags;
    sourceTemplate.tags = [...originalTags, ' Malformed '];

    try {
      const generators = [
        () => generateDailyEvents(42),
        () => matchEventsToHeadlines(['exam assessment']),
        () => generateBulletinEvents(42, ['exam assessment']),
        () => generateContentPack(42),
        () => generateOfflineContentPack(42, ['exam assessment']),
      ];

      for (const generate of generators) {
        expect(generate).toThrow(
          /Malformed event template tags: template "exam-week" in category "academic" tag " Malformed " is untrimmed/,
        );
      }
    } finally {
      sourceTemplate.tags = originalTags;
    }
  });

  it('rechecks registry edits after a prior valid generation', () => {
    const sourceTemplate = EVENT_TEMPLATES.academic[0];
    const originalTags = sourceTemplate.tags;

    generateDailyEvents(42);
    sourceTemplate.tags = [...originalTags, ' Malformed '];

    try {
      expect(() => generateDailyEvents(42)).toThrow(
        /template "exam-week".*untrimmed.*field "tags"/,
      );
    } finally {
      sourceTemplate.tags = originalTags;
    }
  });

  it.each(['', '   ', '!!!', 'the', 'and', 'xylophonicallyunmatchable'])(
    'returns no matches for no-signal headline %j without throwing',
    (headline) => {
      expect(matchEventsToHeadlines([headline])).toEqual([]);
    },
  );

  it.each(['this', 'today', 'news', 'school'])('handles the common word %j safely', (headline) => {
    const events = matchEventsToHeadlines([headline]);
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeLessThanOrEqual(3);
    events.forEach(event => expectValidEvent(event));
  });

  it('produces complete events for matching headlines', () => {
    const events = matchEventsToHeadlines(['Exam assessment study academic pressure']);
    expect(events.length).toBeGreaterThan(0);
    expect(events.map(event => event.id)).toContain('exam-week');
    events.forEach(event => expectValidEvent(event));
  });

  it('deduplicates repeated headlines without crowding out a second useful match', () => {
    const headlines = [
      ...Array(10).fill('Exam assessment study academic pressure'),
      'Astronomy observation opens a rare space window',
      'the and news',
    ];
    const events = generateBulletinEvents(day, headlines, 3);

    expect(events.map(event => event.id)).toContain('exam-week');
    expect(events.map(event => event.id)).toContain('astronomical-event');
    expect(new Set(events.map(event => event.id)).size).toBe(events.length);
    events.forEach(event => expectValidEvent(event, 'either'));
  });

  it('fills an all-noise feed with deterministic daily events', () => {
    const events = generateBulletinEvents(
      day,
      ['the and news', 'xylophonicallyunmatchable', '!!!'],
      3,
    );
    const fallback = generateDailyEvents(day, 3);

    expect(events).toEqual(fallback);
    expect(events.length).toBeGreaterThan(0);
    expect(new Set(events.map(event => event.id)).size).toBe(events.length);
    events.forEach(event => expectValidEvent(event, 'daily'));
  });

  it('keeps the offline content pack populated with mixed and noisy headlines', () => {
    const pack = generateOfflineContentPack(day, [
      ...Array(8).fill('Exam assessment study academic pressure'),
      'not useful noise',
    ]);

    expect(pack.activeEvents.length).toBeGreaterThan(0);
    expect(new Set(pack.activeEvents.map(event => event.id)).size).toBe(pack.activeEvents.length);
    expect(pack.activeEvents.map(event => event.id)).toContain('exam-week');
  });

  it.each(headlineFixtures)(
    'keeps the $category headline vocabulary connected to its template',
    ({ category, templateId, expectedTag, headline }) => {
      const template = EVENT_TEMPLATES[category].find(event => event.id === templateId);

      expect(template).toBeDefined();
      expect(template?.category).toBe(category);
      expect(template?.tags).toContain(expectedTag);

      const events = matchEventsToHeadlines([headline]);
      expect(events.map(event => event.id)).toContain(templateId);
    },
  );

  it('normalizes casing and punctuation', () => {
    expect(matchEventsToHeadlines(['EXAM! ASSESSMENT, STUDY: ACADEMIC PRESSURE.']))
      .toEqual(matchEventsToHeadlines(['exam assessment study academic pressure']));
  });

  it('matches accented and punctuation-heavy tags case-insensitively', () => {
    const sourceTemplate = EVENT_TEMPLATES.academic[0];
    const originalTags = sourceTemplate.tags;
    sourceTemplate.tags = [...originalTags, 'café', 'c++'];

    try {
      const accentedAndPunctuated = matchEventsToHeadlines(['CAFÉ / C++ workshop']);
      const repeatedMatch = matchEventsToHeadlines(['café / c++ workshop']);

      expect(accentedAndPunctuated).toEqual(repeatedMatch);
      expect(accentedAndPunctuated.map(event => event.id)).toContain('exam-week');
    } finally {
      sourceTemplate.tags = originalTags;
    }
  });

  it('identifies the template and Unicode tag when casing is malformed', () => {
    const sourceTemplate = EVENT_TEMPLATES.academic[0];
    const issues = validateEventTemplateTags([{
      ...sourceTemplate,
      id: 'unicode-tag-fixture',
      tags: ['Café'],
    }]);

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        templateId: 'unicode-tag-fixture',
        tag: 'Café',
        reason: 'not-lowercase',
        normalizedTag: 'café',
      }),
    ]));
  });

  it('caps matches at three and avoids duplicate event instances', () => {
    const events = matchEventsToHeadlines(Array(10).fill('exam assessment study science lecture mystery'));
    expect(events).toHaveLength(3);
    expect(new Set(events.map(event => event.instanceId)).size).toBe(events.length);
    events.forEach(event => expectValidEvent(event));
  });

  it('is deterministic within the same day', () => {
    const headlines = ['Science lecture and exam assessment'];
    expect(matchEventsToHeadlines(headlines)).toEqual(matchEventsToHeadlines(headlines));
  });
});

describe('inferEmotionState() — offline emotion mapping', () => {
  it('returns "angry" when anger is dominant', () => {
    expect(inferEmotionState({ anger: 8 })).toBe('angry');
  });
  it('returns "anxious" when anxiety is dominant', () => {
    expect(inferEmotionState({ anxiety: 8 })).toBe('anxious');
  });
  it('returns "happy" when happiness is high and enthusiasm is moderate (≤7)', () => {
    expect(inferEmotionState({ happiness: 9, enthusiasm: 6 })).toBe('happy');
  });
  it('returns "excited" when enthusiasm is dominant (>7)', () => {
    expect(inferEmotionState({ enthusiasm: 8 })).toBe('excited');
  });
  it('returns "neutral" by default', () => {
    expect(inferEmotionState({})).toBe('neutral');
  });
});

describe('scoreToRelationshipTier() — offline tier mapping', () => {
  it('maps 0 → stranger', () => expect(scoreToRelationshipTier(0)).toBe('stranger'));
  it('maps 10 → acquaintance', () => expect(scoreToRelationshipTier(10)).toBe('acquaintance'));
  it('maps 50 → friend', () => expect(scoreToRelationshipTier(50)).toBe('friend'));
  it('maps 90 → trusted', () => expect(scoreToRelationshipTier(90)).toBe('trusted'));
});

describe('analyzeDialogueTone() — offline tone analysis', () => {
  it('warm message → positive delta + happy emotion', () => {
    const tone = analyzeDialogueTone('Thank you so much, I really appreciate your help!');
    expect(tone.sentiment).toBe('warm');
    expect(tone.delta).toBeGreaterThan(0);
    expect(tone.emotion).toBe('happy');
  });

  it('hostile message → negative delta + angry emotion', () => {
    const tone = analyzeDialogueTone('You are so stupid and useless!');
    expect(tone.sentiment).toBe('hostile');
    expect(tone.delta).toBeLessThan(0);
    expect(tone.emotion).toBe('angry');
  });

  it('question → curious sentiment + positive delta', () => {
    const tone = analyzeDialogueTone('What do you think about the upcoming exam?');
    expect(tone.sentiment).toBe('curious');
    expect(tone.delta).toBeGreaterThan(0);
  });

  it('neutral message → neutral sentiment + small positive drift', () => {
    const tone = analyzeDialogueTone('I was just walking by.');
    expect(tone.sentiment).toBe('neutral');
    expect(tone.delta).toBeGreaterThanOrEqual(0);
  });
});
