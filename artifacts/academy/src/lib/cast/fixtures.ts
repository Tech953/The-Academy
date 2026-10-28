/**
 * Shared fixtures for CastForge tests. Not a test file itself — vitest
 * only picks up *.test.ts, so this helper is never run as a suite.
 */
import type { CastEngram } from './schema';

export function validEngram(overrides: Partial<CastEngram> = {}): CastEngram {
  return {
    id: 'npc-student-001',
    kind: 'student',
    seed: 12345,
    provenance: 'castforge/7.1 (studentSeed)',
    drives: [
      {
        id: 'drive-curiosity',
        label: 'Curiosity',
        description: 'Wants to understand how things work',
        strength: 7,
      },
    ],
    baseline: {
      openness: 7,
      conscientiousness: 5,
      extraversion: 4,
      agreeableness: 6,
      neuroticism: 3,
      happiness: 6,
      stress: 2,
      confidence: 5,
      trust: 5,
      curiosity: 8,
    },
    voiceProfile: { tone: 'warm', cadence: 'unhurried', register: ['casual', 'encouraging'] },
    anchor: { location: 'Library', description: 'A corner table by the window' },
    schedule: [
      { hour: 9, activity: 'Study hall', location: 'Library', priority: 5, interruptible: true },
    ],
    relationships: [],
    memory: [],
    ...overrides,
  };
}
