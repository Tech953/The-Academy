import { describe, it, expect } from 'vitest';
import { ACADEMY_LOCATIONS, castSeed, generateCastBank, generateEngram } from './generator';
import { validateEngramSchema } from './schema';

describe('castSeed — brief §6 seed shape', () => {
  it('is stable for the same inputs', () => {
    expect(castSeed('student-a', 'npc-1', 0)).toBe(castSeed('student-a', 'npc-1', 0));
  });

  it('differs across students, npcs, and generations', () => {
    const base = castSeed('student-a', 'npc-1', 0);
    expect(castSeed('student-b', 'npc-1', 0)).not.toBe(base);
    expect(castSeed('student-a', 'npc-2', 0)).not.toBe(base);
    expect(castSeed('student-a', 'npc-1', 1)).not.toBe(base);
  });
});

describe('generateEngram — determinism (brief §7 rule 2, §9.3)', () => {
  it('reproduces byte-for-byte from the same inputs', () => {
    const a = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const b = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });

  it('reproduces byte-for-byte across many calls (no wall-clock or Math.random leak)', () => {
    const first = JSON.stringify(
      generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' }),
    );
    for (let i = 0; i < 20; i++) {
      expect(
        JSON.stringify(generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' })),
      ).toBe(first);
    }
  });

  it('diverges per student for the same npc (differential processing, §6)', () => {
    const a = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const b = generateEngram({ studentId: 'student-b', npcId: 'npc-1', kind: 'student' });
    expect(JSON.stringify(b)).not.toBe(JSON.stringify(a));
    expect(a.id).toBe(b.id);
    expect(a.seed).not.toBe(b.seed);
  });

  it('produces schema-valid engrams', () => {
    for (const kind of ['student', 'ambient'] as const) {
      const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind });
      expect(validateEngramSchema(engram)).toEqual([]);
    }
  });

  it('starts memory empty and embeds no GED content', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    expect(engram.memory).toEqual([]);
    const blob = JSON.stringify(engram);
    for (const key of ['lessonText', 'itemBank', 'answerKey', 'assessmentItems']) {
      expect(blob).not.toContain(key);
    }
  });

  it('records seed + provenance for audit', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    expect(engram.seed).toBe(castSeed('student-a', 'npc-1', 0));
    expect(engram.provenance).toContain('castforge/7.1');
    expect(engram.provenance).toContain('student=student-a');
  });

  it('seeds peer relationships only from caller-supplied peers', () => {
    const noPeers = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    expect(noPeers.relationships).toEqual([]);
    const withPeers = generateEngram({
      studentId: 'student-a',
      npcId: 'npc-1',
      kind: 'student',
      peers: [{ id: 'npc-2', name: 'Peer Two' }],
    });
    expect(withPeers.relationships).toHaveLength(1);
    expect(withPeers.relationships[0].targetId).toBe('npc-2');
    expect(withPeers.relationships[0].targetName).toBe('Peer Two');
  });

  it('anchors and schedules resolve to real Academy locations', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    expect(ACADEMY_LOCATIONS).toContain(engram.anchor.location);
    for (const entry of engram.schedule) {
      expect(ACADEMY_LOCATIONS).toContain(entry.location);
    }
  });
});

describe('generateCastBank', () => {
  it('generates one engram per npc id, deterministically', () => {
    const a = generateCastBank('student-a', ['npc-1', 'npc-2'], 'student');
    const b = generateCastBank('student-a', ['npc-1', 'npc-2'], 'student');
    expect(a).toHaveLength(2);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    expect(a.map((e) => e.id)).toEqual(['npc-1', 'npc-2']);
  });
});
