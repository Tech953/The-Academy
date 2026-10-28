/**
 * CastForge generator — Phase 7.1. Seeded generation of student/ambient
 * engrams from radiantAI physiology (brief §3, §6).
 *
 * Pure and deterministic: the same (studentId, npcId, castGeneration)
 * always yields the same engram, byte-for-byte. The only randomness is
 * the seeded RNG (game-engine mulberry32 via SeededRandom). No
 * Math.random, no Date.now, no LLM anywhere in this path — runtime LLM
 * is for chat phrasing only (7.3), never for generation.
 *
 * Seed shape follows the studentSeed / examSeed precedent:
 * pipe-joined ids hashed to a 32-bit seed.
 *
 * What this does NOT do (kept out deliberately):
 * - No names are invented: the schema carries no name field, and peer
 *   relationship names are caller-supplied only (see GenerateOptions).
 * - No GED content: drives, voice, anchor, and schedule are character
 *   data only. Teaching content comes from the audited store at chat
 *   time, never from the cast bank.
 * - No faculty generation: faculty seeds are hand-authored only (D1).
 *   This generator produces student/ambient engrams exclusively.
 */
import { hashString, SeededRandom } from '@workspace/game-engine';
import { STUDENT_SCHEDULE } from '../radiantAI';
import { ACADEMY_LOCATIONS } from './locations';
import type {
  Drive,
  GeneratedEngram,
  NPCRelationship,
  ScheduleEntry,
  VoiceProfile,
} from './schema';

/** Cast seed = hash(studentId, npcId, castGeneration) — brief §6. */
export function castSeed(studentId: string, npcId: string, castGeneration = 0): number {
  return hashString(`${studentId}|${npcId}|${castGeneration}`);
}

/** Re-exported so existing import sites keep working. */
export { ACADEMY_LOCATIONS } from './locations';

/** Fixed drive catalog: what moves a person. Picker is seeded, never free. */
export const DRIVE_CATALOG: ReadonlyArray<Pick<Drive, 'id' | 'label' | 'description'>> = [
  { id: 'drive-curiosity', label: 'Curiosity', description: 'Wants to understand how things work' },
  { id: 'drive-mastery', label: 'Mastery', description: 'Wants to get genuinely good at something' },
  { id: 'drive-belonging', label: 'Belonging', description: 'Wants a place and people to belong to' },
  { id: 'drive-recognition', label: 'Recognition', description: 'Wants their work to be noticed' },
  { id: 'drive-steadiness', label: 'Steadiness', description: 'Wants routine, calm, and reliability' },
  { id: 'drive-play', label: 'Play', description: 'Wants fun, games, and lightness' },
  { id: 'drive-service', label: 'Service', description: 'Wants to be useful to others' },
  { id: 'drive-independence', label: 'Independence', description: 'Wants to do things their own way' },
  { id: 'drive-craft', label: 'Craft', description: 'Wants to make things well' },
  { id: 'drive-story', label: 'Story', description: 'Wants a life worth telling about' },
];

const TONES = ['warm', 'dry', 'bright', 'steady', 'soft-spoken', 'brisk'] as const;
const CADENCES = ['unhurried', 'rapid', 'measured', 'lilting'] as const;
const REGISTERS = ['casual', 'formal', 'playful', 'direct', 'encouraging', 'wry', 'earnest'] as const;

const ANCHOR_DESCRIPTIONS = [
  'A regular spot they return to between classes',
  'Where they do their best thinking',
  'Their corner of the Academy world',
  'A place they chose, not one they were assigned',
] as const;

/** Peer records the generator may seed relationships against. Names are caller-supplied. */
export interface GeneratePeer {
  id: string;
  name: string;
}

export interface GenerateOptions {
  studentId: string;
  npcId: string;
  kind: 'student' | 'ambient';
  /** Regeneration counter; bumps the seed without changing identity. */
  castGeneration?: number;
  /** Peers to seed default relationships against (default: none). */
  peers?: GeneratePeer[];
}

function pickVoice(rng: SeededRandom): VoiceProfile {
  return {
    tone: rng.pick(TONES),
    cadence: rng.pick(CADENCES),
    register: rng.sample(REGISTERS, 2),
  };
}

function pickDrives(rng: SeededRandom): Drive[] {
  const count = rng.int(2, 3);
  return rng.sample(DRIVE_CATALOG, count).map((drive) => ({
    ...drive,
    strength: rng.int(3, 9),
  }));
}

function pickSchedule(rng: SeededRandom, kind: 'student' | 'ambient'): ScheduleEntry[] {
  const base = STUDENT_SCHEDULE.map((entry) => ({ ...entry }));
  if (kind === 'ambient') {
    // Ambient cast keep the school-day shape but drift at the free slots.
    for (const entry of base) {
      if (entry.hour === 15 || entry.hour === 17 || entry.hour === 21) {
        entry.location = rng.pick(ACADEMY_LOCATIONS);
      }
    }
  }
  return base;
}

function pickRelationships(rng: SeededRandom, peers: GeneratePeer[]): NPCRelationship[] {
  return peers.map((peer) => ({
    targetId: peer.id,
    targetName: peer.name,
    type: rng.pick(['friendship', 'acquaintance', 'rivalry', 'stranger'] as const),
    affinity: rng.int(-40, 80),
    trust: rng.int(20, 90),
    respect: rng.int(20, 90),
    history: [],
    lastInteraction: 0,
  }));
}

/**
 * Generate one engram. Pure: same options → byte-for-byte same record.
 * Memory starts empty; it grows per student through the memory log (§6).
 */
export function generateEngram(opts: GenerateOptions): GeneratedEngram {
  const generation = opts.castGeneration ?? 0;
  const seed = castSeed(opts.studentId, opts.npcId, generation);
  const rng = new SeededRandom(seed);
  const peers = opts.peers ?? [];

  return {
    id: opts.npcId,
    kind: opts.kind,
    seed,
    provenance: `castforge/7.1 seed=${seed} student=${opts.studentId} npc=${opts.npcId} gen=${generation}`,
    drives: pickDrives(rng),
    baseline: {
      openness: rng.int(1, 9),
      conscientiousness: rng.int(1, 9),
      extraversion: rng.int(1, 9),
      agreeableness: rng.int(1, 9),
      neuroticism: rng.int(1, 9),
      happiness: rng.int(1, 9),
      stress: rng.int(1, 9),
      confidence: rng.int(1, 9),
      trust: rng.int(1, 9),
      curiosity: rng.int(1, 9),
    },
    voiceProfile: pickVoice(rng),
    anchor: {
      location: rng.pick(ACADEMY_LOCATIONS),
      description: rng.pick(ANCHOR_DESCRIPTIONS),
    },
    schedule: pickSchedule(rng, opts.kind),
    relationships: pickRelationships(rng, peers),
    memory: [],
  };
}

/** Generate a whole cast bank for one student, deterministically. */
export function generateCastBank(
  studentId: string,
  npcIds: string[],
  kind: 'student' | 'ambient',
  castGeneration = 0,
): GeneratedEngram[] {
  return npcIds.map((npcId) => generateEngram({ studentId, npcId, kind, castGeneration }));
}
