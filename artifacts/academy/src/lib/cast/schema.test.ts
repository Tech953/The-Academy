import { describe, it, expect } from 'vitest';
import type { CastEngram } from './schema';
import { validateEngramSchema } from './schema';
import { validEngram } from './fixtures';

describe('validateEngramSchema — §4 shape + ranges', () => {
  it('accepts a valid generated engram', () => {
    expect(validateEngramSchema(validEngram())).toEqual([]);
  });

  it('accepts a faculty-shaped record (same schema, authored provenance)', () => {
    expect(
      validateEngramSchema(
        validEngram({ kind: 'faculty', provenance: 'authored:owner' }),
      ),
    ).toEqual([]);
  });

  it('rejects a missing id', () => {
    const errors = validateEngramSchema(validEngram({ id: '' }));
    expect(errors.some((e) => e.includes('id'))).toBe(true);
  });

  it('rejects an unknown kind', () => {
    const errors = validateEngramSchema(
      validEngram({ kind: 'teacher' as CastEngram['kind'] }),
    );
    expect(errors.some((e) => e.includes('kind'))).toBe(true);
  });

  it('rejects a non-integer seed', () => {
    const errors = validateEngramSchema(validEngram({ seed: 1.5 }));
    expect(errors.some((e) => e.includes('seed'))).toBe(true);
  });

  it('rejects an out-of-range personality trait', () => {
    const bad = validEngram();
    bad.baseline.openness = 11;
    const errors = validateEngramSchema(bad);
    expect(errors.some((e) => e.includes('baseline.openness'))).toBe(true);
  });

  it('rejects a schedule hour outside 0-23', () => {
    const bad = validEngram();
    bad.schedule = [
      { hour: 24, activity: 'Study', location: 'Library', priority: 1, interruptible: true },
    ];
    const errors = validateEngramSchema(bad);
    expect(errors.some((e) => e.includes('schedule[0].hour'))).toBe(true);
  });

  it('rejects a relationship affinity outside -100-100', () => {
    const bad = validEngram();
    bad.relationships = [
      {
        targetId: 'npc-other',
        targetName: 'Other',
        type: 'friendship',
        affinity: 101,
        trust: 50,
        respect: 50,
        history: [],
        lastInteraction: 0,
      },
    ];
    const errors = validateEngramSchema(bad);
    expect(errors.some((e) => e.includes('affinity'))).toBe(true);
  });

  it('rejects a memory emotionalImpact outside -10-10', () => {
    const bad = validEngram();
    bad.memory = [
      {
        id: 'mem-1',
        timestamp: 0,
        type: 'interaction',
        subject: 'npc-other',
        description: 'Said hello',
        emotionalImpact: -11,
        importance: 5,
        decay: 0.1,
      },
    ];
    const errors = validateEngramSchema(bad);
    expect(errors.some((e) => e.includes('emotionalImpact'))).toBe(true);
  });

  it('rejects a non-object outright', () => {
    expect(validateEngramSchema(null)).toHaveLength(1);
    expect(validateEngramSchema('nope')).toHaveLength(1);
  });
});
