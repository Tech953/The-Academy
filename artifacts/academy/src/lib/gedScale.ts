/**
 * GED scaled-score engine (Phase 0 — honest measurement).
 *
 * The official GED reports each subject on a 100–200 scale:
 *   145–164  Passing (High School Equivalency)
 *   165–174  College Ready
 *   175–200  College Ready + Credit
 *   below 145  Below Passing
 *
 * The real scale is produced by GED Testing Service's equating process and is
 * NOT a linear function of percent correct. This module is a transparent
 * simulation: a piecewise-linear map anchored so the sim's percent-correct
 * milestones land on the official thresholds —
 *
 *   0% → 100 · 60% → 145 · 75% → 165 · 85% → 175 · 100% → 200
 *
 * The 60% anchor preserves the Academy's long-standing internal bar
 * (60% = quiz pass, PASSING_QUIZ_SCORE) as the official passing score, with
 * the College Ready bands above it. Treat every output as an estimate for
 * rehearsal feedback — never as a prediction of an official score.
 *
 * Pure functions only: no IO, no state. Same input, same score.
 */

export const GED_SCALED_MIN = 100;
export const GED_SCALED_MAX = 200;
export const GED_PASSING_SCORE = 145;
export const GED_COLLEGE_READY_SCORE = 165;
export const GED_COLLEGE_READY_CREDIT_SCORE = 175;

export type GedBand =
  | 'Below Passing'
  | 'Passing'
  | 'College Ready'
  | 'College Ready + Credit';

/** [percentCorrect, scaledScore] anchor points, ascending. */
const ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [0, GED_SCALED_MIN],
  [60, GED_PASSING_SCORE],
  [75, GED_COLLEGE_READY_SCORE],
  [85, GED_COLLEGE_READY_CREDIT_SCORE],
  [100, GED_SCALED_MAX],
];

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Map a percent-correct (0–100) to the simulated GED scaled score (100–200). */
export function percentToScaledScore(percent: number): number {
  const p = clamp(percent, 0, 100);
  for (let i = 1; i < ANCHORS.length; i++) {
    const [p1, s1] = ANCHORS[i];
    if (p <= p1) {
      const [p0, s0] = ANCHORS[i - 1];
      const t = (p - p0) / (p1 - p0);
      return Math.round(s0 + t * (s1 - s0));
    }
  }
  return GED_SCALED_MAX;
}

/** Official readiness band for a scaled score. */
export function scaledScoreBand(scaled: number): GedBand {
  if (scaled >= GED_COLLEGE_READY_CREDIT_SCORE) return 'College Ready + Credit';
  if (scaled >= GED_COLLEGE_READY_SCORE) return 'College Ready';
  if (scaled >= GED_PASSING_SCORE) return 'Passing';
  return 'Below Passing';
}

/** Convenience: official band directly from a percent-correct. */
export function bandForPercent(percent: number): GedBand {
  return scaledScoreBand(percentToScaledScore(percent));
}
