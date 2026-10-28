/**
 * CastForge schema — Phase 7.0. The generated-engram record (brief §4).
 *
 * One generated engram = one record, versioned, with seed + provenance.
 * The schema reuses the radiant engine's physiology types (radiantAI.ts)
 * for the baseline, schedule, relationships, and memory — full
 * integration, not replacement.
 *
 * Faculty seeds use this same schema, but their provenance reads
 * `authored:<owner>` and their content is hand-written, never generated.
 * Faculty and generated engrams must never share an id; the CastAuditor
 * gate rejects collisions (brief §4, §7 rule 3).
 *
 * Honesty limits (brief §8), enforced by the gate, not by this file:
 * voice profiles are descriptors only (tone, cadence, register tags);
 * no GED content (lesson text, item bank, answer keys) lives inside an
 * engram. This module validates shape and ranges only.
 */
import type {
  MemoryEntry,
  NPCEmotions,
  NPCPersonality,
  NPCRelationship,
  ScheduleEntry,
} from '../radiantAI';

export type EngramKind = 'student' | 'ambient' | 'faculty';

/** What moves this person (BSP seed pattern). Strength is 0–10. */
export interface Drive {
  id: string;
  label: string;
  description: string;
  strength: number;
}

/**
 * Voice profile, descriptor only. Tone, cadence, and register tags —
 * never audio, never a voice-clone reference, never performer data.
 * The CastAuditor (rule 5) rejects audio-bearing keys.
 */
export interface VoiceProfile {
  tone: string;
  cadence: string;
  register: string[];
}

/** Where this person lives in the Academy world. */
export interface EnvironmentAnchor {
  location: string;
  description: string;
}

export interface CastEngram {
  id: string;
  kind: EngramKind;
  /** Reproduces this engram exactly (generator input). */
  seed: number;
  /** Generator version + inputs, for audit. Faculty: `authored:<owner>`. */
  provenance: string;
  drives: Drive[];
  /** radiantAI.ts physiology: Big Five + emotional baseline + decay params. */
  baseline: NPCPersonality & NPCEmotions;
  voiceProfile: VoiceProfile;
  anchor: EnvironmentAnchor;
  schedule: ScheduleEntry[];
  /** Seeded defaults; per-student overrides live in the memory log (§6). */
  relationships: NPCRelationship[];
  /** Starts empty; grows per student (§6). */
  memory: MemoryEntry[];
}

/** A generated (non-faculty) engram. */
export type GeneratedEngram = CastEngram & { kind: 'student' | 'ambient' };

/** A hand-authored faculty seed. Content is authored, never generated. */
export type FacultySeed = CastEngram & {
  kind: 'faculty';
  provenance: `authored:${string}`;
};

// ── Shape + range validation (gate rule 1) ────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isNumberInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

const PERSONALITY_KEYS = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
] as const;
const EMOTION_KEYS = ['happiness', 'stress', 'confidence', 'trust', 'curiosity'] as const;
const RELATIONSHIP_TYPES = ['friendship', 'rivalry', 'mentorship', 'acquaintance', 'stranger'];
const MEMORY_TYPES = ['interaction', 'observation', 'event', 'rumor'];

/**
 * Validate an unknown candidate against the §4 schema: required fields
 * present, correct shapes, values in range. Returns a list of error
 * strings; empty means schema-valid. Pure and deterministic. This checks
 * shape only — GED-content and voice-audio rules are the CastAuditor's.
 */
export function validateEngramSchema(candidate: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(candidate)) return ['engram must be an object'];

  if (!isNonEmptyString(candidate.id)) errors.push('id must be a non-empty string');
  if (candidate.kind !== 'student' && candidate.kind !== 'ambient' && candidate.kind !== 'faculty') {
    errors.push('kind must be student, ambient, or faculty');
  }
  if (typeof candidate.seed !== 'number' || !Number.isInteger(candidate.seed)) {
    errors.push('seed must be an integer');
  }
  if (!isNonEmptyString(candidate.provenance)) {
    errors.push('provenance must be a non-empty string');
  }

  if (!Array.isArray(candidate.drives)) {
    errors.push('drives must be an array');
  } else {
    candidate.drives.forEach((drive, i) => {
      if (!isRecord(drive)) {
        errors.push(`drives[${i}] must be an object`);
        return;
      }
      if (!isNonEmptyString(drive.id)) errors.push(`drives[${i}].id must be a non-empty string`);
      if (!isNonEmptyString(drive.label)) errors.push(`drives[${i}].label must be a non-empty string`);
      if (!isNonEmptyString(drive.description)) {
        errors.push(`drives[${i}].description must be a non-empty string`);
      }
      if (!isNumberInRange(drive.strength, 0, 10)) {
        errors.push(`drives[${i}].strength must be a number 0-10`);
      }
    });
  }

  if (!isRecord(candidate.baseline)) {
    errors.push('baseline must be an object');
  } else {
    for (const key of [...PERSONALITY_KEYS, ...EMOTION_KEYS]) {
      if (!isNumberInRange(candidate.baseline[key], 0, 10)) {
        errors.push(`baseline.${key} must be a number 0-10`);
      }
    }
  }

  if (!isRecord(candidate.voiceProfile)) {
    errors.push('voiceProfile must be an object');
  } else {
    if (!isNonEmptyString(candidate.voiceProfile.tone)) {
      errors.push('voiceProfile.tone must be a non-empty string');
    }
    if (!isNonEmptyString(candidate.voiceProfile.cadence)) {
      errors.push('voiceProfile.cadence must be a non-empty string');
    }
    if (
      !Array.isArray(candidate.voiceProfile.register) ||
      !candidate.voiceProfile.register.every((r) => isNonEmptyString(r))
    ) {
      errors.push('voiceProfile.register must be an array of non-empty strings');
    }
  }

  if (!isRecord(candidate.anchor)) {
    errors.push('anchor must be an object');
  } else {
    if (!isNonEmptyString(candidate.anchor.location)) {
      errors.push('anchor.location must be a non-empty string');
    }
    if (!isNonEmptyString(candidate.anchor.description)) {
      errors.push('anchor.description must be a non-empty string');
    }
  }

  if (!Array.isArray(candidate.schedule)) {
    errors.push('schedule must be an array');
  } else {
    candidate.schedule.forEach((entry, i) => {
      if (!isRecord(entry)) {
        errors.push(`schedule[${i}] must be an object`);
        return;
      }
      if (typeof entry.hour !== 'number' || !Number.isInteger(entry.hour) || entry.hour < 0 || entry.hour > 23) {
        errors.push(`schedule[${i}].hour must be an integer 0-23`);
      }
      if (!isNonEmptyString(entry.activity)) {
        errors.push(`schedule[${i}].activity must be a non-empty string`);
      }
      if (!isNonEmptyString(entry.location)) {
        errors.push(`schedule[${i}].location must be a non-empty string`);
      }
      if (typeof entry.priority !== 'number' || !Number.isFinite(entry.priority)) {
        errors.push(`schedule[${i}].priority must be a number`);
      }
      if (typeof entry.interruptible !== 'boolean') {
        errors.push(`schedule[${i}].interruptible must be a boolean`);
      }
    });
  }

  if (!Array.isArray(candidate.relationships)) {
    errors.push('relationships must be an array');
  } else {
    candidate.relationships.forEach((rel, i) => {
      if (!isRecord(rel)) {
        errors.push(`relationships[${i}] must be an object`);
        return;
      }
      if (!isNonEmptyString(rel.targetId)) {
        errors.push(`relationships[${i}].targetId must be a non-empty string`);
      }
      if (!isNonEmptyString(rel.targetName)) {
        errors.push(`relationships[${i}].targetName must be a non-empty string`);
      }
      if (typeof rel.type !== 'string' || !RELATIONSHIP_TYPES.includes(rel.type)) {
        errors.push(`relationships[${i}].type must be a known relationship type`);
      }
      if (!isNumberInRange(rel.affinity, -100, 100)) {
        errors.push(`relationships[${i}].affinity must be a number -100-100`);
      }
      if (!isNumberInRange(rel.trust, 0, 100)) {
        errors.push(`relationships[${i}].trust must be a number 0-100`);
      }
      if (!isNumberInRange(rel.respect, 0, 100)) {
        errors.push(`relationships[${i}].respect must be a number 0-100`);
      }
      if (!isStringArray(rel.history)) {
        errors.push(`relationships[${i}].history must be an array of strings`);
      }
      if (typeof rel.lastInteraction !== 'number' || !Number.isFinite(rel.lastInteraction)) {
        errors.push(`relationships[${i}].lastInteraction must be a number`);
      }
    });
  }

  if (!Array.isArray(candidate.memory)) {
    errors.push('memory must be an array');
  } else {
    candidate.memory.forEach((entry, i) => {
      if (!isRecord(entry)) {
        errors.push(`memory[${i}] must be an object`);
        return;
      }
      if (!isNonEmptyString(entry.id)) errors.push(`memory[${i}].id must be a non-empty string`);
      if (typeof entry.timestamp !== 'number' || !Number.isFinite(entry.timestamp)) {
        errors.push(`memory[${i}].timestamp must be a number`);
      }
      if (typeof entry.type !== 'string' || !MEMORY_TYPES.includes(entry.type)) {
        errors.push(`memory[${i}].type must be a known memory type`);
      }
      if (!isNonEmptyString(entry.subject)) {
        errors.push(`memory[${i}].subject must be a non-empty string`);
      }
      if (!isNonEmptyString(entry.description)) {
        errors.push(`memory[${i}].description must be a non-empty string`);
      }
      if (!isNumberInRange(entry.emotionalImpact, -10, 10)) {
        errors.push(`memory[${i}].emotionalImpact must be a number -10-10`);
      }
      if (!isNumberInRange(entry.importance, 0, 10)) {
        errors.push(`memory[${i}].importance must be a number 0-10`);
      }
      if (typeof entry.decay !== 'number' || !Number.isFinite(entry.decay) || entry.decay < 0) {
        errors.push(`memory[${i}].decay must be a non-negative number`);
      }
    });
  }

  return errors;
}
