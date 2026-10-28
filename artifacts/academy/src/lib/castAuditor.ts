/**
 * CastAuditor — Phase 7 gate (brief §7), sibling of auditor.ts.
 *
 * Pure and deterministic: it reads a generated engram and returns a
 * pass/fail report. It changes nothing. A failure is reported, never
 * silently fixed and never redefined.
 *
 * Two rules need caller context and report `pending` when it is absent:
 * determinism needs a `regenerate` function (the gate does not know a
 * bank's student ids — the caller that generated the bank does), and
 * resolves needs the bank's cast ids. A bank is fully gated only when
 * every report has `passed && complete`.
 *
 * Gate criteria (brief §7, frozen per phase):
 * 1. Schema-valid against §4, all required fields present.
 * 2. Deterministic: regenerating from the recorded seed reproduces it
 *    byte-for-byte.
 * 3. No id collision with any faculty seed.
 * 4. No GED content embedded: no lesson text, no item bank, no answer
 *    keys inside an engram.
 * 5. Voice profile is a descriptor — no audio, no voice-clone
 *    reference, no performer data.
 * 6. Schedule + anchor resolve to real Academy locations; relationships
 *    reference real cast ids.
 */
import { facultyIds } from './cast/seeds/faculty/slots';
import { ACADEMY_LOCATIONS } from './cast/locations';
import type { CastEngram } from './cast/schema';
import { validateEngramSchema } from './cast/schema';

export type CastRuleId =
  | 'schema'
  | 'determinism'
  | 'id-collision'
  | 'no-ged-content'
  | 'voice-descriptor'
  | 'resolves';

export type CastRuleStatus = 'pass' | 'fail' | 'pending';

export interface CastRuleResult {
  rule: CastRuleId;
  status: CastRuleStatus;
  detail: string;
}

export interface CastAuditFailure {
  rule: CastRuleId;
  message: string;
}

export interface CastAuditReport {
  engramId: string;
  results: CastRuleResult[];
  failures: CastAuditFailure[];
  /** True only when every rule passes. */
  passed: boolean;
  /** True only when every rule was evaluated (none pending). */
  complete: boolean;
}

/** Keys that must never appear inside an engram (rule 4). */
export const FORBIDDEN_GED_KEYS = [
  'lessonText',
  'itemBank',
  'answerKey',
  'answerKeys',
  'assessmentItems',
  'curriculum',
];

/** Keys that would make a voice profile more than a descriptor (rule 5). */
export const FORBIDDEN_VOICE_KEYS = [
  'audio',
  'audioUrl',
  'clip',
  'clipUrl',
  'sample',
  'sampleUrl',
  'recording',
  'recordingUrl',
  'voiceCloneRef',
  'cloneRef',
  'performer',
  'performerId',
  'referencePack',
];

/** Collect every own key in a value, recursively (cycle-safe). */
function collectKeys(value: unknown, seen: Set<object>, out: Set<string>): void {
  if (typeof value !== 'object' || value === null) return;
  if (seen.has(value)) return;
  seen.add(value);
  for (const key of Object.keys(value)) {
    out.add(key);
    collectKeys((value as Record<string, unknown>)[key], seen, out);
  }
}

function findForbiddenKeys(value: unknown, forbidden: readonly string[]): string[] {
  const keys = new Set<string>();
  collectKeys(value, new Set(), keys);
  return forbidden.filter((key) => keys.has(key));
}

export interface AuditCastOptions {
  /** Faculty ids to check collisions against (defaults to the slots). */
  facultyIds?: string[];
  /**
   * Regenerate an engram from its recorded inputs, for the determinism
   * rule. The gate cannot know a bank's student ids, so the caller that
   * generated the bank supplies this. Absent → determinism is pending.
   * Return null when regeneration is not possible for this engram.
   */
  regenerate?: (engram: CastEngram) => CastEngram | null;
  /**
   * Ids of the cast bank being gated, for the resolves rule. Faculty
   * ids are always accepted as well. Absent → resolves is pending.
   */
  castIds?: string[];
}

/**
 * Audit one engram against the §7 gate. Pure: reads the engram and the
 * faculty id list, changes nothing.
 */
export function auditCastEngram(
  engram: CastEngram,
  opts: AuditCastOptions = {},
): CastAuditReport {
  const results: CastRuleResult[] = [];

  const schemaErrors = validateEngramSchema(engram);
  results.push({
    rule: 'schema',
    status: schemaErrors.length === 0 ? 'pass' : 'fail',
    detail:
      schemaErrors.length === 0
        ? 'schema-valid against §4'
        : `schema errors: ${schemaErrors.join('; ')}`,
  });

  results.push(
    opts.regenerate === undefined
      ? {
          rule: 'determinism',
          status: 'pending',
          detail: 'no regenerate function supplied; determinism cannot be evaluated',
        }
      : (() => {
          const regenerated = opts.regenerate(engram);
          if (regenerated === null) {
            return {
              rule: 'determinism',
              status: 'pending' as const,
              detail: 'regeneration not possible for this engram',
            };
          }
          const same = JSON.stringify(regenerated) === JSON.stringify(engram);
          return {
            rule: 'determinism',
            status: same ? ('pass' as const) : ('fail' as const),
            detail: same
              ? 'regeneration from recorded inputs reproduces it byte-for-byte'
              : 'regeneration differs from the recorded engram',
          };
        })(),
  );

  const faculty = opts.facultyIds ?? facultyIds();
  const collides = faculty.includes(engram.id);
  results.push({
    rule: 'id-collision',
    status: collides ? 'fail' : 'pass',
    detail: collides
      ? `id ${engram.id} collides with a faculty seed`
      : 'no faculty id collision',
  });

  const gedKeys = findForbiddenKeys(engram, FORBIDDEN_GED_KEYS);
  results.push({
    rule: 'no-ged-content',
    status: gedKeys.length === 0 ? 'pass' : 'fail',
    detail:
      gedKeys.length === 0
        ? 'no GED content keys present'
        : `GED content keys present: ${gedKeys.join(', ')}`,
  });

  const voiceKeys =
    engram.voiceProfile && typeof engram.voiceProfile === 'object'
      ? findForbiddenKeys(engram.voiceProfile, FORBIDDEN_VOICE_KEYS)
      : [];
  results.push({
    rule: 'voice-descriptor',
    status: voiceKeys.length === 0 ? 'pass' : 'fail',
    detail:
      voiceKeys.length === 0
        ? 'voice profile is a descriptor only'
        : `voice profile carries non-descriptor keys: ${voiceKeys.join(', ')}`,
  });

  if (opts.castIds === undefined) {
    results.push({
      rule: 'resolves',
      status: 'pending',
      detail: 'no cast id list supplied; relationship resolution cannot be evaluated',
    });
  } else {
    const known = new Set<string>([...opts.castIds, ...(opts.facultyIds ?? facultyIds())]);
    const problems: string[] = [];
    if (!ACADEMY_LOCATIONS.includes(engram.anchor.location as (typeof ACADEMY_LOCATIONS)[number])) {
      problems.push(`anchor location ${engram.anchor.location} is not a real Academy location`);
    }
    for (const entry of engram.schedule) {
      if (!ACADEMY_LOCATIONS.includes(entry.location as (typeof ACADEMY_LOCATIONS)[number])) {
        problems.push(`schedule location ${entry.location} is not a real Academy location`);
      }
    }
    for (const rel of engram.relationships) {
      if (!known.has(rel.targetId)) {
        problems.push(`relationship target ${rel.targetId} is not a known cast id`);
      }
    }
    results.push({
      rule: 'resolves',
      status: problems.length === 0 ? 'pass' : 'fail',
      detail:
        problems.length === 0
          ? 'anchor, schedule, and relationships resolve'
          : problems.join('; '),
    });
  }

  const failures: CastAuditFailure[] = results
    .filter((r) => r.status === 'fail')
    .map((r) => ({ rule: r.rule, message: r.detail }));

  return {
    engramId: engram.id,
    results,
    failures,
    passed: results.every((r) => r.status === 'pass'),
    complete: results.every((r) => r.status !== 'pending'),
  };
}

/**
 * Audit a whole generated bank (brief §9.3). Each engram is audited
 * with the same regenerate function and the bank's own ids as the
 * cast list, so relationship resolution is bank-relative.
 */
export function auditCastBank(
  engrams: CastEngram[],
  regenerate: (engram: CastEngram) => CastEngram | null,
  opts: Omit<AuditCastOptions, 'regenerate' | 'castIds'> = {},
): CastAuditReport[] {
  const castIds = engrams.map((e) => e.id);
  return engrams.map((engram) =>
    auditCastEngram(engram, { ...opts, regenerate, castIds }),
  );
}
