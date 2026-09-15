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
  generateNPCLine,
  generateOfflineConversation,
  generateQuizSet,
  generateDailyEvents,
  generateBulletinEvents,
  generateOfflineContentPack,
  inferEmotionState,
  scoreToRelationshipTier,
  analyzeDialogueTone,
  matchEventsToHeadlines,
  EVENT_TEMPLATES,
  type OfflineWorldEvent,
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

  it('returns an empty array for an empty headline list', () => {
    expect(matchEventsToHeadlines([])).toEqual([]);
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
