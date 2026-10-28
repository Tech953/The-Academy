import { beforeEach, describe, it, expect } from 'vitest';
import { buildCastPrompt, loadCastLog, openCastChat, recordCastExchange } from './chat';
import { generateEngram } from './generator';
import { loadNPCLog } from '../npcMemoryStore';
import { validEngram } from './fixtures';

// npcMemoryStore is localStorage-backed; node has none. Provide a
// minimal Map-backed localStorage so the 7.3 wiring is tested for real.
const backing = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (key: string) => backing.get(key) ?? null,
  setItem: (key: string, value: string) => {
    backing.set(key, value);
  },
  removeItem: (key: string) => {
    backing.delete(key);
  },
  clear: () => backing.clear(),
};

beforeEach(() => backing.clear());

describe('buildCastPrompt — pure prompt builder (D3 proposed default)', () => {
  it('is pure: same inputs give the same prompt', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    expect(buildCastPrompt(engram)).toBe(buildCastPrompt(engram));
  });

  it('carries drives, baseline, voice descriptor, anchor, and schedule', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const prompt = buildCastPrompt(engram, { displayName: 'Peer One' });
    expect(prompt).toContain('Peer One');
    expect(prompt).toContain('What moves you:');
    expect(prompt).toContain('Personality (0-10)');
    expect(prompt).toContain('Voice (descriptor only)');
    expect(prompt).toContain(engram.anchor.location);
    expect(prompt).toContain('Daily rhythm:');
  });

  it('includes memory summary and recent exchanges when supplied', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const prompt = buildCastPrompt(engram, {
      memorySummary: 'Your relationship history: 3 conversations.',
      recentExchanges: [{ isFromPlayer: true, content: 'Hello there' }],
    });
    expect(prompt).toContain('Your relationship history: 3 conversations.');
    expect(prompt).toContain('Student: Hello there');
  });

  it('bakes in the guardrails: no scoring, audited store only, consent', () => {
    const prompt = buildCastPrompt(validEngram());
    expect(prompt).toContain('chat never scores');
    expect(prompt).toContain('audited store');
    expect(prompt).toContain('Consent matters');
  });

  it('is the same entry point for faculty engrams', () => {
    const faculty = validEngram({ kind: 'faculty', provenance: 'authored:owner' });
    const prompt = buildCastPrompt(faculty, { displayName: 'Mentor' });
    expect(prompt).toContain('Mentor');
    expect(prompt).toContain('faculty at the Academy');
  });
});

describe('openCastChat + recordCastExchange — one entry point, wired to the log', () => {
  it('opens with an empty log and builds a prompt', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const session = openCastChat('student-a', 'npc-1', 'Peer One', engram, 'sess-1');
    expect(session.log.entries).toEqual([]);
    expect(session.prompt).toContain('Peer One');
    expect(session.sessionId).toBe('sess-1');
  });

  it('records exchanges and later sessions see the history', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const first = openCastChat('student-a', 'npc-1', 'Peer One', engram, 'sess-1');
    recordCastExchange(first, 'Hi, how are you?', 'Doing well, thanks!', { topic: 'greeting' });
    const log = loadCastLog(first);
    expect(log?.entries).toHaveLength(2);
    expect(log?.entries[0].content).toBe('Hi, how are you?');
    expect(log?.entries[1].content).toBe('Doing well, thanks!');
    const second = openCastChat('student-a', 'npc-1', 'Peer One', engram, 'sess-2');
    expect(second.prompt).toContain('Hi, how are you?');
  });

  it('keeps per-student logs isolated (no view leaks)', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const sessionA = openCastChat('student-a', 'npc-1', 'Peer One', engram, 'sess-a');
    recordCastExchange(sessionA, 'Secret for A only', 'Noted.');
    expect(loadNPCLog('student-b', 'npc-1')).toBeNull();
    const sessionB = openCastChat('student-b', 'npc-1', 'Peer One', engram, 'sess-b');
    expect(sessionB.prompt).not.toContain('Secret for A only');
  });
});
