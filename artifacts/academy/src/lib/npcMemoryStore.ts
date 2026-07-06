// NPC Persistent Memory Store
// Full-playthrough conversation history and relationship tracking, persisted to localStorage.
// Each NPC has a memory log keyed by characterId + npcId.

const STORAGE_KEY = 'academy-npc-mem-v1';
const MAX_ENTRIES_PER_NPC = 200; // safety cap to prevent localStorage overflow

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConversationEntry {
  isFromPlayer: boolean;
  content: string;
  timestamp: number;
  topic?: string;
  location?: string;
  sessionId?: string;
}

export interface NPCMemoryLog {
  npcId: string;
  npcName: string;
  entries: ConversationEntry[];
  firstMet: number;
  lastInteraction: number;
  topicsDiscussed: string[];
  totalExchanges: number;
  sessionCount: number;
  currentSessionId: string;
  locations: string[];
}

type CharacterMemories = Record<string, NPCMemoryLog>;
type MemoryStore = Record<string, CharacterMemories>;

// ── Storage helpers ────────────────────────────────────────────────────────────

function loadStore(): MemoryStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(store: MemoryStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage quota exceeded — trim oldest entries per NPC
    trimAndSave(store);
  }
}

function trimAndSave(store: MemoryStore): void {
  for (const charId of Object.keys(store)) {
    for (const npcId of Object.keys(store[charId])) {
      const log = store[charId][npcId];
      if (log.entries.length > 60) {
        log.entries = log.entries.slice(-60);
      }
    }
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // If still failing, clear old memories gracefully
  }
}

function generateSessionId(): string {
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Load the memory log for a specific NPC and character.
 * Returns null if no history exists.
 */
export function loadNPCLog(characterId: string, npcId: string): NPCMemoryLog | null {
  const store = loadStore();
  return store[characterId]?.[npcId] ?? null;
}

/**
 * Get or create an NPC log. Bumps sessionCount when the NPC hasn't been
 * spoken to in the current session.
 */
export function getOrCreateNPCLog(
  characterId: string,
  npcId: string,
  npcName: string,
  currentSessionId: string,
): NPCMemoryLog {
  const store = loadStore();
  if (!store[characterId]) store[characterId] = {};

  const existing = store[characterId][npcId];
  if (existing) {
    const isNewSession = existing.currentSessionId !== currentSessionId;
    if (isNewSession) {
      existing.sessionCount += 1;
      existing.currentSessionId = currentSessionId;
    }
    return existing;
  }

  const fresh: NPCMemoryLog = {
    npcId,
    npcName,
    entries: [],
    firstMet: Date.now(),
    lastInteraction: Date.now(),
    topicsDiscussed: [],
    totalExchanges: 0,
    sessionCount: 1,
    currentSessionId,
    locations: [],
  };
  store[characterId][npcId] = fresh;
  saveStore(store);
  return fresh;
}

/**
 * Append conversation entries (player + NPC) to an NPC's persistent log.
 * Automatically updates metadata (topics, exchange count, locations).
 */
export function appendConversationEntries(
  characterId: string,
  npcId: string,
  npcName: string,
  entries: Omit<ConversationEntry, 'sessionId'>[],
  location?: string,
  currentSessionId?: string,
): void {
  const store = loadStore();
  if (!store[characterId]) store[characterId] = {};

  const sessId = currentSessionId ?? generateSessionId();
  const log = store[characterId][npcId] ?? {
    npcId,
    npcName,
    entries: [],
    firstMet: Date.now(),
    lastInteraction: Date.now(),
    topicsDiscussed: [],
    totalExchanges: 0,
    sessionCount: 1,
    currentSessionId: sessId,
    locations: [],
  };

  const stamped = entries.map(e => ({
    ...e,
    sessionId: sessId,
    location: location || e.location,
  }));

  log.entries.push(...stamped);
  log.lastInteraction = Date.now();
  log.totalExchanges += Math.floor(entries.filter(e => !e.isFromPlayer).length);

  if (location && !log.locations.includes(location)) {
    log.locations.push(location);
  }
  entries.forEach(e => {
    if (e.topic && !log.topicsDiscussed.includes(e.topic)) {
      log.topicsDiscussed.push(e.topic);
    }
  });

  // Cap to prevent localStorage bloat
  if (log.entries.length > MAX_ENTRIES_PER_NPC) {
    log.entries = log.entries.slice(-MAX_ENTRIES_PER_NPC);
  }

  store[characterId][npcId] = log;
  saveStore(store);
}

/**
 * Return the last N messages formatted for the OpenAI messages array.
 * Uses all-time history, most recent first (but returned oldest-first for OpenAI).
 */
export function getConvHistoryForAI(
  characterId: string,
  npcId: string,
  maxMessages = 30,
): { isFromPlayer: boolean; content: string }[] {
  const log = loadNPCLog(characterId, npcId);
  if (!log) return [];
  return log.entries.slice(-maxMessages).map(e => ({
    isFromPlayer: e.isFromPlayer,
    content: e.content,
  }));
}

/**
 * Generate a concise long-term memory summary for injection into the NPC's
 * system prompt. Returns null if there is no prior history.
 */
export function getMemorySummary(
  characterId: string,
  npcId: string,
  playerName?: string,
): string | null {
  const log = loadNPCLog(characterId, npcId);
  if (!log || log.entries.length === 0) return null;

  const lines: string[] = [];
  const who = playerName || 'this student';

  lines.push(`Your relationship history with ${who}:`);

  const sessions = log.sessionCount;
  const exchanges = log.totalExchanges;
  const sessWord = sessions === 1 ? 'conversation' : 'conversations';
  lines.push(`- You've had ${sessions} ${sessWord} with ${exchanges} total exchanges.`);

  const now = Date.now();
  const firstAgo = formatTimeAgo(now - log.firstMet);
  const lastAgo = formatTimeAgo(now - log.lastInteraction);
  lines.push(`- You first met ${firstAgo}.`);
  if (sessions > 1) lines.push(`- You last spoke ${lastAgo}.`);

  if (log.topicsDiscussed.length > 0) {
    const topics = log.topicsDiscussed
      .map(t => t.replace(/_/g, ' ').toUpperCase())
      .slice(0, 6)
      .join(', ');
    lines.push(`- Topics you've discussed: ${topics}.`);
  }

  if (log.locations.length > 1) {
    lines.push(`- You've spoken in: ${log.locations.slice(0, 3).join(', ')}.`);
  }

  // Extract a few salient player messages as memorable moments
  const playerMessages = log.entries.filter(e => e.isFromPlayer).slice(-6);
  const notableQuestions = playerMessages
    .map(e => e.content)
    .filter(c => c.length > 30)
    .slice(0, 2);
  if (notableQuestions.length > 0) {
    lines.push(`- ${who} has asked about: "${notableQuestions[0].slice(0, 80)}${notableQuestions[0].length > 80 ? '...' : ''}"`);
  }

  // Overall relationship tone from exchange count
  if (exchanges >= 10) {
    lines.push(`- You know each other reasonably well by now.`);
  } else if (exchanges >= 5) {
    lines.push(`- You've had a few meaningful conversations.`);
  } else {
    lines.push(`- Your relationship is still in early stages.`);
  }

  return lines.join('\n');
}

/**
 * Check if an NPC has any prior interaction with a character.
 */
export function hasMemoryOf(characterId: string, npcId: string): boolean {
  const log = loadNPCLog(characterId, npcId);
  return !!log && log.entries.length > 0;
}

/**
 * Get a brief "first meeting vs returning" status for the terminal greeting.
 * Returns null on first meeting, or a brief memory note on subsequent meetings.
 */
export function getEncounterNote(
  characterId: string,
  npcId: string,
  npcFirstName: string,
  currentSessionId: string,
): string | null {
  const log = loadNPCLog(characterId, npcId);
  if (!log || log.entries.length === 0) return null;
  if (log.currentSessionId === currentSessionId) return null; // same session, already greeted

  const exchanges = log.totalExchanges;
  const sessions = log.sessionCount;
  const lastAgo = formatTimeAgo(Date.now() - log.lastInteraction);

  if (sessions >= 3 && exchanges >= 8) {
    return `[ ${npcFirstName} remembers you well — you've spoken ${sessions} times before. ]`;
  } else if (sessions >= 2) {
    return `[ ${npcFirstName} recognises you — last spoke ${lastAgo}. ]`;
  } else {
    return `[ ${npcFirstName} recalls meeting you before. ]`;
  }
}

/**
 * Get a full relationship report for display (e.g., in a status window or NPC directory).
 */
export function getRelationshipReport(
  characterId: string,
  npcId: string,
  npcName: string,
): {
  hasHistory: boolean;
  sessionCount: number;
  totalExchanges: number;
  topicsDiscussed: string[];
  firstMet: number | null;
  lastInteraction: number | null;
  locations: string[];
} {
  const log = loadNPCLog(characterId, npcId);
  if (!log) {
    return { hasHistory: false, sessionCount: 0, totalExchanges: 0, topicsDiscussed: [], firstMet: null, lastInteraction: null, locations: [] };
  }
  return {
    hasHistory: log.entries.length > 0,
    sessionCount: log.sessionCount,
    totalExchanges: log.totalExchanges,
    topicsDiscussed: log.topicsDiscussed,
    firstMet: log.firstMet,
    lastInteraction: log.lastInteraction,
    locations: log.locations,
  };
}

/**
 * Clear all memory for a specific character (e.g., on new game).
 */
export function clearCharacterMemories(characterId: string): void {
  const store = loadStore();
  delete store[characterId];
  saveStore(store);
}

/**
 * Get all NPC IDs that a character has spoken to, with interaction counts.
 */
export function getAllInteractions(
  characterId: string,
): { npcId: string; npcName: string; exchanges: number; lastInteraction: number }[] {
  const store = loadStore();
  const charMem = store[characterId] ?? {};
  return Object.values(charMem)
    .filter(log => log.entries.length > 0)
    .map(log => ({
      npcId: log.npcId,
      npcName: log.npcName,
      exchanges: log.totalExchanges,
      lastInteraction: log.lastInteraction,
    }))
    .sort((a, b) => b.lastInteraction - a.lastInteraction);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTimeAgo(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}
