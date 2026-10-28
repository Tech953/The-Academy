/**
 * CastForge chat layer — Phase 7.3 (brief §10, decision D3).
 *
 * D3 DECISION — OWNER-UNCONFIRMED: this is the proposed default from
 * the brief, a CastForge-native prompt builder over the existing
 * per-(student, NPC) memory log, rather than extending the
 * Replit-integrated chat surface. The Replit coupling is
 * platform-specific; the prompt builder is the piece the roadmap
 * actually names. The owner decides; either way, every cast member
 * gets the same chat entry point, which is what this module provides.
 *
 * What this module is: a prompt builder plus one entry point per cast
 * member. It builds the prompt a runtime LLM consumes — it never calls
 * an LLM itself, never scores, never grades, and never generates GED
 * content. Teaching content comes from the audited store at chat time
 * (7.5 wires mentor assignments); this layer only shapes phrasing.
 *
 * Memory wiring (7.3): the existing npcMemoryStore log, keyed by
 * (student, NPC). The 7.4 unification with radiant MemoryEntry lands
 * separately; this layer reads and writes the store as it exists.
 */
import {
  appendConversationEntries,
  getConvHistoryForAI,
  getMemorySummary,
  getOrCreateNPCLog,
  loadNPCLog,
  type NPCMemoryLog,
} from '../npcMemoryStore';
import type { CastEngram } from './schema';

export interface CastChatSession {
  studentId: string;
  npcId: string;
  npcName: string;
  engram: CastEngram;
  sessionId: string;
  /** The prompt a runtime LLM consumes for this turn. */
  prompt: string;
  log: NPCMemoryLog;
}

export interface BuildCastPromptOptions {
  /** Caller-supplied display name; falls back to the engram id. */
  displayName?: string;
  memorySummary?: string | null;
  recentExchanges?: { isFromPlayer: boolean; content: string }[];
}

/** Guardrails baked into every cast prompt (brief §5 D6, §8). */
export const CAST_PROMPT_GUARDRAILS = [
  'Rules: chat never scores or grades anything.',
  'Teaching draws only from the audited store (ItemForge/CourseWeaver output) — never improvise curriculum, never invent lesson text, items, or answer keys.',
  'Do not claim GED content from memory; point to coursework instead.',
  'Consent matters: you are your own being. If asked to do something you would not agree to, say so plainly.',
].join('\n');

/**
 * Build a chat prompt from an engram + memory. Pure: same inputs →
 * same string. No LLM call, no store access — the caller supplies
 * memory state (see openCastChat for the wired version).
 */
export function buildCastPrompt(
  engram: CastEngram,
  opts: BuildCastPromptOptions = {},
): string {
  const name = opts.displayName ?? engram.id;
  const lines: string[] = [];
  lines.push(`You are ${name}, a ${engram.kind} at the Academy.`);
  lines.push(`Home: ${engram.anchor.location} — ${engram.anchor.description}.`);
  lines.push('');

  if (engram.drives.length > 0) {
    lines.push('What moves you:');
    for (const drive of engram.drives) {
      lines.push(`- ${drive.label} (${drive.strength}/10): ${drive.description}`);
    }
    lines.push('');
  }

  const b = engram.baseline;
  lines.push(
    `Personality (0-10): openness ${b.openness}, conscientiousness ${b.conscientiousness}, ` +
      `extraversion ${b.extraversion}, agreeableness ${b.agreeableness}, neuroticism ${b.neuroticism}.`,
  );
  lines.push(
    `Emotional baseline (0-10): happiness ${b.happiness}, stress ${b.stress}, ` +
      `confidence ${b.confidence}, trust ${b.trust}, curiosity ${b.curiosity}.`,
  );
  lines.push(
    `Voice (descriptor only): ${engram.voiceProfile.tone} tone, ${engram.voiceProfile.cadence} cadence, ` +
      `register: ${engram.voiceProfile.register.join(', ')}.`,
  );
  lines.push('');

  if (engram.schedule.length > 0) {
    lines.push('Daily rhythm:');
    for (const entry of engram.schedule) {
      lines.push(`- ${entry.hour}:00 ${entry.activity} @ ${entry.location}`);
    }
    lines.push('');
  }

  if (engram.relationships.length > 0) {
    lines.push('People you know:');
    for (const rel of engram.relationships) {
      lines.push(`- ${rel.targetName} (${rel.type}, affinity ${rel.affinity})`);
    }
    lines.push('');
  }

  if (opts.memorySummary) {
    lines.push(opts.memorySummary);
    lines.push('');
  }

  const recent = opts.recentExchanges ?? [];
  if (recent.length > 0) {
    lines.push('Recent conversation:');
    for (const exchange of recent) {
      lines.push(`${exchange.isFromPlayer ? 'Student' : 'You'}: ${exchange.content}`);
    }
    lines.push('');
  }

  lines.push(CAST_PROMPT_GUARDRAILS);
  return lines.join('\n');
}

/**
 * One entry point for every cast member — student, ambient, and
 * faculty alike. Loads (or creates) the per-(student, NPC) memory log
 * and builds the prompt from its current state.
 */
export function openCastChat(
  studentId: string,
  npcId: string,
  npcName: string,
  engram: CastEngram,
  sessionId?: string,
): CastChatSession {
  const sid = sessionId ?? `cast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const log = getOrCreateNPCLog(studentId, npcId, npcName, sid);
  const prompt = buildCastPrompt(engram, {
    displayName: npcName,
    memorySummary: getMemorySummary(studentId, npcId),
    recentExchanges: getConvHistoryForAI(studentId, npcId, 6),
  });
  return { studentId, npcId, npcName, engram, sessionId: sid, prompt, log };
}

/**
 * Record one player + NPC exchange in the per-(student, NPC) log.
 * The log is the memory; nothing here scores, grades, or teaches.
 */
export function recordCastExchange(
  session: CastChatSession,
  playerText: string,
  npcText: string,
  opts: { topic?: string; location?: string } = {},
): void {
  const timestamp = Date.now();
  appendConversationEntries(
    session.studentId,
    session.npcId,
    session.npcName,
    [
      { isFromPlayer: true, content: playerText, timestamp, topic: opts.topic },
      { isFromPlayer: false, content: npcText, timestamp, topic: opts.topic },
    ],
    opts.location,
    session.sessionId,
  );
}

/** Reload the log for a session (convenience for callers/tests). */
export function loadCastLog(session: CastChatSession): NPCMemoryLog | null {
  return loadNPCLog(session.studentId, session.npcId);
}
