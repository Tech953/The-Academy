import { beforeEach, describe, it, expect } from 'vitest';
import { toRadiantMemories } from './memory';
import { openCastChat, recordCastExchange } from './chat';
import { generateEngram } from './generator';
import { getRelationshipReport, loadNPCLog } from '../npcMemoryStore';

// Map-backed localStorage stub (node has none); see chat.test.ts.
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

describe('toRadiantMemories — read-side unification (§6)', () => {
  it('maps conversation entries to MemoryEntry without inventing feeling or salience', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const session = openCastChat('student-a', 'npc-1', 'Peer One', engram, 'sess-1');
    recordCastExchange(session, 'I love the library', 'It is quiet here.', { topic: 'library' });
    const log = loadNPCLog('student-a', 'npc-1');
    expect(log).not.toBeNull();
    const memories = toRadiantMemories(log!);
    expect(memories).toHaveLength(2);
    expect(memories[0].type).toBe('interaction');
    expect(memories[0].subject).toBe('library');
    expect(memories[0].description).toBe('I love the library');
    // Never inferred: neutral impact, minimal importance, zero decay.
    for (const memory of memories) {
      expect(memory.emotionalImpact).toBe(0);
      expect(memory.importance).toBe(1);
      expect(memory.decay).toBe(0);
    }
  });

  it('is pure: same log gives the same view', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const session = openCastChat('student-a', 'npc-1', 'Peer One', engram, 'sess-1');
    recordCastExchange(session, 'Hello', 'Hi.');
    const log = loadNPCLog('student-a', 'npc-1');
    expect(JSON.stringify(toRadiantMemories(log!))).toBe(JSON.stringify(toRadiantMemories(log!)));
  });
});

describe('getRelationshipReport — per-student relationship state (existing API)', () => {
  it('reports no history with no log', () => {
    const report = getRelationshipReport('student-a', 'npc-1', 'Peer One');
    expect(report.hasHistory).toBe(false);
    expect(report.sessionCount).toBe(0);
  });

  it('reports observed counts, topics, and sessions', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const s1 = openCastChat('student-a', 'npc-1', 'Peer One', engram, 'sess-1');
    recordCastExchange(s1, 'Talk about math', 'Math is fun.', { topic: 'math' });
    const s2 = openCastChat('student-a', 'npc-1', 'Peer One', engram, 'sess-2');
    recordCastExchange(s2, 'Talk about science', 'Science is fun.', { topic: 'science' });
    const report = getRelationshipReport('student-a', 'npc-1', 'Peer One');
    expect(report.sessionCount).toBe(2);
    expect(report.topicsDiscussed).toEqual(['math', 'science']);
  });
});

describe('per-student divergence — acceptance §9.1', () => {
  it('same NPC, two students, three sessions each: demonstrably different memory and relationship state', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const scripts: Record<string, [string, string, string][]> = {
      'student-a': [
        ['I want to study math', 'Math club meets at 15:00.', 'math'],
        ['Tell me about chess', 'Chess club is in the Club Room.', 'chess'],
        ['I am nervous about exams', 'You have got this.', 'exams'],
      ],
      'student-b': [
        ['I love drama club', 'Drama rehearses on Fridays.', 'drama'],
        ['What is on the lunch menu?', 'Something with potatoes.', 'lunch'],
        ['Can we talk about music?', 'I play a little.', 'music'],
      ],
    };
    for (const [studentId, sessions] of Object.entries(scripts)) {
      sessions.forEach(([player, npc, topic], i) => {
        const session = openCastChat(studentId, 'npc-1', 'Peer One', engram, `sess-${studentId}-${i}`);
        recordCastExchange(session, player, npc, { topic });
      });
    }

    const logA = loadNPCLog('student-a', 'npc-1');
    const logB = loadNPCLog('student-b', 'npc-1');
    expect(logA).not.toBeNull();
    expect(logB).not.toBeNull();
    // Different memory: different entries, different topics.
    expect(JSON.stringify(logA!.entries)).not.toBe(JSON.stringify(logB!.entries));
    expect(logA!.topicsDiscussed).toEqual(['math', 'chess', 'exams']);
    expect(logB!.topicsDiscussed).toEqual(['drama', 'lunch', 'music']);
    expect(logA!.sessionCount).toBe(3);
    expect(logB!.sessionCount).toBe(3);
    // Different relationship state, same NPC.
    const relA = getRelationshipReport('student-a', 'npc-1', 'Peer One');
    const relB = getRelationshipReport('student-b', 'npc-1', 'Peer One');
    expect(relA.topicsDiscussed).not.toEqual(relB.topicsDiscussed);
    // Different radiant views too.
    expect(JSON.stringify(toRadiantMemories(logA!))).not.toBe(
      JSON.stringify(toRadiantMemories(logB!)),
    );
  });
});
