import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface GameContext {
  currentLocation: string;
  locationDescription: string;
  availableExits: string[];
  npcsPresent: string[];
  interactables: string[];
  characterName: string;
  characterClass: string;
  characterRace: string;
  characterFaction: string;
  inventory: string[];
  energy: number;
  lastTalkedNpc?: string;
  npcTopics?: string[];
}

export interface ParsedCommand {
  action: string;
  target?: string;
  confidence: number;
  reasoning: string;
  alternativeActions?: string[];
  correction?: string;
}

const GAME_COMMANDS = {
  movement: ['north', 'south', 'east', 'west', 'up', 'down', 'enter', 'go'],
  observation: ['look', 'examine', 'inspect', 'search', 'check'],
  interaction: ['talk', 'speak', 'ask', 'tell', 'greet', 'converse'],
  inventory: ['inventory', 'items', 'possessions'],
  status: ['status', 'stats', 'character', 'self'],
  social: ['list', 'who', 'people', 'characters'],
  academic: ['grades', 'transcript', 'schedule', 'gpa', 'read', 'chapter', 'lecture', 'attend', 'enroll', 'courses', 'study', 'textbook', 'assignments', 'progress', 'graduation', 'graduate', 'ged'],
  meta: ['help', 'save', 'load', 'quit', 'exit', 'time', 'score', 'clear'],
};

// ─── Fuzzy matching helpers ───────────────────────────────────────────────────

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export interface FuzzyMatch {
  value: string;
  distance: number;
  score: number;
}

export function fuzzyMatch(
  query: string,
  candidates: string[],
  maxDistance = 3
): FuzzyMatch | null {
  if (!query || candidates.length === 0) return null;
  const q = query.toLowerCase();
  let best: FuzzyMatch | null = null;

  for (const candidate of candidates) {
    const c = candidate.toLowerCase();
    if (c === q) return { value: candidate, distance: 0, score: 1 };

    const dist = levenshteinDistance(q, c);
    const score = 1 - dist / Math.max(q.length, c.length);

    if (dist <= maxDistance && (!best || dist < best.distance)) {
      best = { value: candidate, distance: dist, score };
    }
  }
  return best;
}

export function fuzzyMatchNPC(
  query: string,
  npcNames: string[],
  maxDistance = 3
): FuzzyMatch | null {
  const q = query.toLowerCase();

  // First try: exact first-name match
  for (const name of npcNames) {
    if (name.toLowerCase().split(' ')[0] === q) {
      return { value: name, distance: 0, score: 1 };
    }
  }

  // Second try: fuzzy against full name
  const fullMatch = fuzzyMatch(query, npcNames, maxDistance);
  if (fullMatch) return fullMatch;

  // Third try: fuzzy against first names only
  const firstNames = npcNames.map(n => n.split(' ')[0]);
  const firstMatch = fuzzyMatch(query, firstNames, maxDistance);
  if (firstMatch) {
    const fullName = npcNames.find(n => n.split(' ')[0].toLowerCase() === firstMatch.value.toLowerCase());
    if (fullName) return { value: fullName, distance: firstMatch.distance, score: firstMatch.score };
  }

  return null;
}

const DIRECTION_ALIASES: Record<string, string> = {
  n: 'north', s: 'south', e: 'east', w: 'west',
  ne: 'northeast', se: 'southeast', nw: 'northwest', sw: 'southwest',
  u: 'up', d: 'down',
  norht: 'north', nroth: 'north', sooth: 'south', soath: 'south',
  esat: 'east', waest: 'west', wesat: 'west',
};

const ACTION_ALIASES: Record<string, string> = {
  go: 'look', l: 'look', looks: 'look', loot: 'look',
  exam: 'examine', examne: 'examine', examin: 'examine', exmaine: 'examine', insepct: 'inspect',
  tk: 'talk', tlak: 'talk', tak: 'talk', talkto: 'talk', talek: 'talk', spek: 'speak', speek: 'speak',
  inv: 'inventory', inven: 'inventory',
  stat: 'status', stats: 'status',
  hlep: 'help', halp: 'help',
  savge: 'save',
};

// ─── Main NLP entry point ─────────────────────────────────────────────────────

export async function processNaturalLanguage(
  userInput: string,
  context: GameContext
): Promise<ParsedCommand> {
  try {
    const lastNpcClause = context.lastTalkedNpc
      ? `\nLast NPC spoken to: ${context.lastTalkedNpc}${context.npcTopics?.length ? ` (topics: ${context.npcTopics.join(', ')})` : ''}`
      : '';

    const topicInstructions = context.lastTalkedNpc
      ? `\nSPECIAL RULE — TOPIC SHORTCUTS: If the player types just a single word/phrase that matches one of the NPC topics listed above (e.g. "STUDIES", "INTRODUCTION") and does NOT match any NPC name, treat it as: action "talk", target "${context.lastTalkedNpc} [that_topic]". This handles the case where they reply with just the topic after seeing the topic list.`
      : '';

    const systemPrompt = `You are a command interpreter for a text-based RPG game called "The Academy". Interpret player input and convert to game commands. Be tolerant of typos, abbreviations, and natural phrasing.

AVAILABLE COMMANDS:
- Movement: north/n, south/s, east/e, west/w, up/u, down/d, enter [place]
- Observation: look, examine [object]
- Interaction: talk [npc], talk [npc] [topic]
- Inventory: inventory
- Status: status
- Social: list (who's here?)
- Academic: grades, transcript, schedule, gpa, read [book], chapter [book] [#], lecture [book] [week], attend [class], enroll [class], courses, study, assignments, progress, graduation
- Meta: help, save, time, score, clear

CURRENT CONTEXT:
Location: ${context.currentLocation}
Available exits: ${context.availableExits.join(', ') || 'none'}
NPCs present: ${context.npcsPresent.join(', ') || 'none'}
Objects: ${context.interactables.join(', ') || 'none'}
Character: ${context.characterName} (${context.characterRace} ${context.characterClass})${lastNpcClause}${topicInstructions}

INTERPRETATION RULES:
1. Be lenient with typos — match to the closest valid command/name
2. "go north" → north, "head east" → east, "n" → north
3. "talk to X about Y" → action: talk, target: "X Y"
4. "ask X about Y" → action: talk, target: "X Y"  
5. "what's here?" / "look around" → look
6. "who's here?" / "show people" → list
7. "what am I carrying?" → inventory
8. Single topic word after talking to an NPC → talk [lastNPC] [topic]
9. Typos in NPC names: match to closest NPC present
10. Typos in directions: match to closest direction

Respond ONLY with valid JSON:
{
  "action": "command",
  "target": "target or null",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "alternativeActions": ["alt1"],
  "correction": "if you corrected a typo, show: 'Interpreting: CORRECTED COMMAND'"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    const parsed = JSON.parse(content) as ParsedCommand;
    if (!parsed.action || parsed.confidence === undefined) throw new Error('Invalid AI response format');

    return parsed;
  } catch (error) {
    console.error('NLP processing error:', error);
    return fallbackParser(userInput, context);
  }
}

// ─── Enhanced fallback parser ─────────────────────────────────────────────────

function fallbackParser(input: string, context: GameContext): ParsedCommand {
  const raw = input.toLowerCase().trim();
  const words = raw.split(/\s+/);
  const firstWord = words[0];
  const rest = words.slice(1).join(' ');

  // ── Direction shortcuts & typo correction
  const directionMap: Record<string, string> = {
    north: 'north', south: 'south', east: 'east', west: 'west',
    up: 'up', down: 'down', northeast: 'northeast', northwest: 'northwest',
    southeast: 'southeast', southwest: 'southwest',
    ...DIRECTION_ALIASES,
  };
  if (directionMap[raw]) {
    return { action: directionMap[raw], confidence: 0.9, reasoning: 'Direction keyword' };
  }

  // Check first word against all directions with fuzzy matching
  const allDirections = [...context.availableExits.map(e => e.toLowerCase()), 'north', 'south', 'east', 'west', 'up', 'down'];
  const dirMatch = fuzzyMatch(firstWord, allDirections, 2);
  if (dirMatch && dirMatch.distance <= 2 && words.length === 1) {
    const correction = dirMatch.distance > 0 ? `Interpreting "${input}" as: ${dirMatch.value.toUpperCase()}` : undefined;
    return { action: dirMatch.value, confidence: 0.85 - dirMatch.distance * 0.1, reasoning: 'Fuzzy direction match', correction };
  }

  // ── Action aliases & typo correction
  const correctedAction = ACTION_ALIASES[firstWord];
  if (correctedAction) {
    return fallbackParser(`${correctedAction} ${rest}`.trim(), context);
  }

  // ── "go [direction]" or "go to [place]"
  if (firstWord === 'go' || firstWord === 'head' || firstWord === 'move' || firstWord === 'walk') {
    const dirResult = fuzzyMatch(rest, allDirections, 2);
    if (dirResult) {
      return { action: dirResult.value, confidence: 0.85, reasoning: 'Movement with direction' };
    }
    return { action: 'enter', target: rest, confidence: 0.7, reasoning: 'Movement to place' };
  }

  // ── LOOK
  if (firstWord === 'look' || firstWord === 'l' || raw.includes('look around') || raw.includes('what do i see') || raw.includes("what's here")) {
    if (rest) {
      return { action: 'examine', target: rest, confidence: 0.8, reasoning: 'Look at specific target' };
    }
    return { action: 'look', confidence: 0.9, reasoning: 'Look around' };
  }

  // ── EXAMINE
  if (firstWord === 'examine' || firstWord === 'inspect' || firstWord === 'check') {
    return { action: 'examine', target: rest || undefined, confidence: 0.85, reasoning: 'Examine object' };
  }

  // ── TALK / ASK / SPEAK
  if (firstWord === 'talk' || firstWord === 'speak' || firstWord === 'ask' || firstWord === 'greet' || firstWord === 'converse') {
    if (!rest) {
      return { action: 'talk', confidence: 0.4, reasoning: 'Talk without target', alternativeActions: ['list'] };
    }

    // Strip filler words: "to", "with", "the"
    const strippedRest = rest.replace(/^(to|with|the)\s+/i, '');
    const restWords = strippedRest.split(/\s+/);
    const candidateName = restWords[0];
    const remainingTopic = restWords.slice(1).join(' ');

    // Try to find NPC by fuzzy first name or full name
    const npcMatch = fuzzyMatchNPC(candidateName, context.npcsPresent, 3);

    if (npcMatch) {
      const firstName = npcMatch.value.split(' ')[0];
      const correction = npcMatch.distance > 0
        ? `Interpreting "${input}" as: TALK ${firstName}${remainingTopic ? ' ' + remainingTopic.toUpperCase() : ''}`
        : undefined;
      return {
        action: 'talk',
        target: remainingTopic ? `${firstName} ${remainingTopic}` : firstName,
        confidence: 0.9 - npcMatch.distance * 0.05,
        reasoning: npcMatch.distance > 0 ? `Fuzzy NPC name match (${npcMatch.value})` : 'NPC name match',
        correction,
      };
    }

    // No NPC name matched — check if the whole "rest" is a topic for the last NPC
    if (context.lastTalkedNpc && context.npcTopics) {
      const topicMatch = fuzzyMatch(strippedRest, context.npcTopics, 2);
      if (topicMatch) {
        const npcFirstName = context.lastTalkedNpc.split(' ')[0];
        return {
          action: 'talk',
          target: `${npcFirstName} ${topicMatch.value}`,
          confidence: 0.85,
          reasoning: `Topic shortcut for last-spoken NPC (${context.lastTalkedNpc})`,
          correction: `Talking to ${npcFirstName} about ${topicMatch.value.toUpperCase()}`,
        };
      }
    }

    return {
      action: 'talk',
      target: candidateName,
      confidence: 0.5,
      reasoning: 'Talk target, NPC not found nearby',
    };
  }

  // ── Bare topic word (no action verb) — check against last NPC topics
  if (words.length <= 2 && context.lastTalkedNpc && context.npcTopics && context.npcTopics.length > 0) {
    const topicMatch = fuzzyMatch(raw, context.npcTopics, 2);
    if (topicMatch && topicMatch.distance <= 2) {
      const npcFirstName = context.lastTalkedNpc.split(' ')[0];
      return {
        action: 'talk',
        target: `${npcFirstName} ${topicMatch.value}`,
        confidence: 0.8,
        reasoning: `Bare topic word matched to ${context.lastTalkedNpc} topics`,
        correction: `Talking to ${npcFirstName} about ${topicMatch.value.toUpperCase()}`,
      };
    }
  }

  // ── WHO / LIST
  if (firstWord === 'who' || firstWord === 'list' || raw.includes('people') || raw.includes("who's here") || raw.includes('anyone here')) {
    return { action: 'list', confidence: 0.8, reasoning: 'Social query' };
  }

  // ── INVENTORY
  if (firstWord === 'inventory' || firstWord === 'inv' || firstWord === 'i' || raw.includes('carrying') || raw.includes('my items') || raw.includes('my stuff')) {
    return { action: 'inventory', confidence: 0.9, reasoning: 'Inventory request' };
  }

  // ── STATUS
  if (firstWord === 'status' || firstWord === 'stats' || raw.includes('how am i') || raw.includes('check myself')) {
    return { action: 'status', confidence: 0.9, reasoning: 'Status request' };
  }

  // ── ACADEMIC
  if (firstWord === 'enroll' || raw.includes('sign up')) {
    const target = rest.replace(/^(in|for)\s+/i, '') || 'list';
    return { action: 'enroll', target, confidence: 0.85, reasoning: 'Enrollment request' };
  }
  if (firstWord === 'grades' || raw.includes('my grades')) return { action: 'grades', confidence: 0.9, reasoning: 'Grades request' };
  if (firstWord === 'transcript') return { action: 'transcript', confidence: 0.9, reasoning: 'Transcript request' };
  if (firstWord === 'schedule' || raw.includes('my classes')) return { action: 'schedule', confidence: 0.9, reasoning: 'Schedule request' };
  if (firstWord === 'gpa') return { action: 'gpa', confidence: 0.9, reasoning: 'GPA request' };
  if (firstWord === 'courses' || raw.includes('available courses') || raw.includes('classes available')) return { action: 'courses', confidence: 0.9, reasoning: 'Courses query' };
  if (firstWord === 'assignments' || firstWord === 'homework') return { action: 'assignments', confidence: 0.9, reasoning: 'Assignments request' };
  if (firstWord === 'study') return { action: 'study', target: rest || undefined, confidence: 0.85, reasoning: 'Study request' };
  if (firstWord === 'progress') return { action: 'progress', confidence: 0.9, reasoning: 'Progress request' };
  if (firstWord === 'read') return { action: 'read', target: rest || undefined, confidence: 0.85, reasoning: 'Read request' };
  if (firstWord === 'attend') return { action: 'attend', target: rest || undefined, confidence: 0.85, reasoning: 'Attend class' };
  if (firstWord === 'help' || raw === '?') return { action: 'help', confidence: 0.95, reasoning: 'Help request' };
  if (firstWord === 'save') return { action: 'save', confidence: 0.95, reasoning: 'Save request' };
  if (firstWord === 'time') return { action: 'time', confidence: 0.95, reasoning: 'Time request' };
  if (firstWord === 'clear' || firstWord === 'cls') return { action: 'clear', confidence: 0.95, reasoning: 'Clear terminal' };

  // ── Fuzzy fallback: try all known command words
  const allActions = Object.values(GAME_COMMANDS).flat();
  const actionMatch = fuzzyMatch(firstWord, allActions, 2);
  if (actionMatch && actionMatch.distance <= 2) {
    const correction = `Interpreting "${firstWord}" as: ${actionMatch.value.toUpperCase()}`;
    return fallbackParser(`${actionMatch.value} ${rest}`.trim(), { ...context });
  }

  return {
    action: 'help',
    confidence: 0.3,
    reasoning: 'Could not parse command',
    alternativeActions: ['look', 'status', 'list'],
  };
}
