/**
 * Item grading — Phase 2 (format completeness).
 *
 * Pure, deterministic graders for every GED item format in the unified
 * content store. The quiz UI (AssignmentsPortal QuizView) delegates all
 * correctness decisions here so formats grade identically everywhere.
 *
 * Extended Response scoring is a SIMULATED rubric score: transparent
 * heuristics mapped to the textbook's own rubric traits (see
 * gedContent.ts, Extended Response chapter). Only GED Testing Service
 * scorers are authoritative; the UI labels these scores as simulated.
 */
import type { GEDPracticeQuestion } from '@shared/schema';

// ─────────────────────────────────────────────────────────────────────────────
// TEXT NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────

/** Lowercase, collapse whitespace, unify quotes/dashes, trim edge punctuation. */
export function normalizeAnswerText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .replace(/^\.(?!\d)/, '')   // edge period, but never a decimal point ('.5')
    .replace(/(?<!\d)\.$/, '')
    .trim();
}

/**
 * Parse a numeric answer: plain numbers, fractions ('3/4'), percents
 * ('50%' → 0.5), with optional '$', commas, and a leading '-'.
 * Returns null when the text is not a single numeric value.
 */
export function parseNumericAnswer(s: string): number | null {
  let t = normalizeAnswerText(s).replace(/[$,]/g, '').trim();
  if (!t) return null;
  let percent = false;
  if (t.endsWith('%')) { percent = true; t = t.slice(0, -1).trim(); }
  let value: number | null = null;
  const NUM = '-?(?:\\d+(?:\\.\\d+)?|\\.\\d+)';
  const frac = t.match(new RegExp(`^(${NUM})\\s*\\/\\s*(${NUM})$`));
  if (frac) {
    const denom = parseFloat(frac[2]);
    if (denom === 0) return null;
    value = parseFloat(frac[1]) / denom;
  } else if (new RegExp(`^${NUM}$`).test(t)) {
    value = parseFloat(t);
  }
  if (value === null) return null;
  return percent ? value / 100 : value;
}

function textMatches(response: string, candidate: string): boolean {
  const r = normalizeAnswerText(response);
  const c = normalizeAnswerText(candidate);
  if (r === c) return true;
  // Numeric equivalence: '0.5' answers '1/2', '50%' answers '0.5', etc.
  const rn = parseNumericAnswer(response);
  const cn = parseNumericAnswer(candidate);
  if (rn !== null && cn !== null) return Math.abs(rn - cn) < 1e-9;
  return false;
}

function matchesAny(response: string, candidates: string[]): boolean {
  return candidates.some(c => textMatches(response, c));
}

// ─────────────────────────────────────────────────────────────────────────────
// PER-FORMAT GRADERS
// ─────────────────────────────────────────────────────────────────────────────

function gradeFillIn(q: GEDPracticeQuestion, response: string): boolean {
  return matchesAny(response, [q.answer, ...(q.answerAliases ?? [])]);
}

function gradeShortAnswer(q: GEDPracticeQuestion, response: string): boolean {
  if (matchesAny(response, [q.answer, ...(q.answerAliases ?? [])])) return true;
  const groups = q.answerKeywords ?? [];
  if (groups.length === 0) return false; // nothing machine-gradable authored
  const r = normalizeAnswerText(response);
  return groups.every(group =>
    group.split('|').some(alt => r.includes(normalizeAnswerText(alt)))
  );
}

function gradeDragDrop(q: GEDPracticeQuestion, response: string): boolean {
  const got = response.split('|').map(normalizeAnswerText).filter(Boolean);
  const want = q.answer.split('|').map(normalizeAnswerText).filter(Boolean);
  return got.length === want.length && got.every((t, i) => t === want[i]);
}

/** Grade any non-ER item (and ER via its pass threshold). */
export function gradeResponse(q: GEDPracticeQuestion, response: string | undefined): boolean {
  if (response === undefined || response.trim() === '') return false;
  switch (q.type) {
    case 'mcq': return response === q.answer;
    case 'fill_in': return gradeFillIn(q, response);
    case 'drop_down': return matchesAny(response, [q.answer, ...(q.answerAliases ?? [])]);
    case 'drag_drop': return gradeDragDrop(q, response);
    case 'hot_spot': return response === q.answer;
    case 'short_answer': return gradeShortAnswer(q, response);
    case 'extended_response': return gradeExtendedResponse(q, response).total >= ER_PASS_TOTAL;
    default: return response === q.answer;
  }
}

/** Human-readable form of an item's correct answer, for reveal panels. */
export function displayAnswer(q: GEDPracticeQuestion): string {
  if (q.type === 'hot_spot' && q.hotSpot) {
    return q.hotSpot.zones.find(z => z.id === q.answer)?.label ?? q.answer;
  }
  if (q.type === 'drag_drop') return q.answer.split('|').map(s => s.trim()).join(' → ');
  if (q.type === 'mcq' && q.choices) {
    const letter = q.answer as 'A' | 'B' | 'C' | 'D';
    return q.choices[letter] ? `${letter}. ${q.choices[letter]}` : q.answer;
  }
  return q.answer;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED RESPONSE — SIMULATED RUBRIC SCORING
//
// Traits mirror the textbook chapter (gedContent.ts, "Extended Response:
// Argument Writing"): Trait 1 — Creation of Arguments and Use of
// Evidence (0–3); Trait 2 — Development of Ideas and Organizational
// Structure (0–2); Trait 3 — Clarity and Command of Standard English
// Conventions (0–2). Every point is earned by a named, inspectable
// signal; the per-trait notes say which signals fired.
// ─────────────────────────────────────────────────────────────────────────────

export const ER_TRAIT_MAX = { trait1: 3, trait2: 2, trait3: 2 } as const;
export const ER_MAX_TOTAL = 7;
export const ER_PASS_TOTAL = 4;

export interface ExtendedResponseScore {
  trait1: number;
  trait2: number;
  trait3: number;
  total: number;
  maxTotal: number;
  simulated: true;
  notes: string[];
}

const STANCE_MARKERS = [
  'stronger argument', 'better supported', 'more convincing', 'stronger case',
  'presents the stronger', 'i argue', 'should be adopted', 'is more persuasive',
  'better evidence', 'stronger position',
];
const COUNTER_MARKERS = [
  'however', 'although', 'on the other hand', 'opponents', 'critics argue',
  'while some', 'admittedly', 'counterargument', 'the other text', 'the opposing',
];
const TRANSITIONS = [
  'first', 'second', 'third', 'furthermore', 'moreover', 'additionally',
  'however', 'in contrast', 'as a result', 'for example', 'in conclusion',
  'overall', 'finally', 'therefore',
];

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/** Distinctive content words of a text (len ≥ 5, not stopwords). */
function distinctiveWords(text: string): Set<string> {
  const stop = new Set(['which', 'their', 'there', 'these', 'those', 'would', 'could', 'should', 'about', 'because', 'through', 'between', 'against', 'without', 'within', 'where', 'while', 'being', 'other', 'after', 'before', 'under', 'over', 'such', 'than', 'then', 'them', 'they', 'this', 'that', 'with', 'from', 'have', 'has', 'the', 'and', 'for', 'are', 'but', 'not', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'you', 'your']);
  return new Set(
    normalizeAnswerText(text).replace(/[^a-z\s-]/g, ' ').split(/\s+/)
      .filter(w => w.length >= 5 && !stop.has(w))
  );
}

export function gradeExtendedResponse(q: GEDPracticeQuestion, response: string): ExtendedResponseScore {
  const notes: string[] = [];
  const r = normalizeAnswerText(response);
  const words = wordCount(response);
  const sources = q.stimulus ?? [];

  // ── Trait 1: argument + evidence (0–3) ──
  let trait1 = 0;
  if (STANCE_MARKERS.some(m => r.includes(m))) {
    trait1 += 1; notes.push('T1: takes a clear position on which text is stronger.');
  } else {
    notes.push('T1: no clear position statement found.');
  }
  if (sources.length >= 2) {
    const drawsOn = sources.map(src => {
      const distinctive = distinctiveWords(src.text);
      let hits = 0;
      distinctive.forEach(w => { if (r.includes(w)) hits += 1; });
      return hits >= 2;
    });
    if (drawsOn.every(Boolean)) {
      trait1 += 1; notes.push('T1: draws evidence from BOTH sources.');
    } else {
      notes.push('T1: evidence from both sources not detected.');
    }
  }
  if (COUNTER_MARKERS.some(m => r.includes(m))) {
    trait1 += 1; notes.push('T1: addresses the opposing view.');
  } else {
    notes.push('T1: opposing view not addressed.');
  }

  // ── Trait 2: development + organization (0–2) ──
  let trait2 = 0;
  const paragraphs = response.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).length;
  if (words >= 80 && paragraphs >= 3) {
    trait2 += 1; notes.push('T2: organized in multiple paragraphs.');
  } else {
    notes.push('T2: needs 3+ paragraphs (introduction / body / conclusion).');
  }
  const transitionsUsed = TRANSITIONS.filter(t => r.includes(t));
  if (transitionsUsed.length >= 2) {
    trait2 += 1; notes.push(`T2: uses transitions (${transitionsUsed.slice(0, 3).join(', ')}…).`);
  } else {
    notes.push('T2: add transitions between ideas.');
  }

  // ── Trait 3: clarity + conventions (0–2) ──
  const sentences = response.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const punctuated = (response.match(/[.!?](?=\s|$)/g) ?? []).length;
  const punctRatio = sentences.length > 0 ? punctuated / sentences.length : 0;
  const avgLen = sentences.length > 0 ? words / sentences.length : 0;
  let trait3 = 0;
  if (sentences.length >= 5 && punctRatio >= 0.9 && avgLen >= 8 && avgLen <= 30) trait3 = 2;
  else if (sentences.length >= 3 && punctRatio >= 0.6) trait3 = 1;
  notes.push(`T3: ${sentences.length} sentences, ${Math.round(punctRatio * 100)}% end-punctuated, ~${Math.round(avgLen)} words/sentence.`);
  if (words < 40) { trait1 = 0; trait2 = 0; trait3 = 0; notes.push('Response too short to score (under 40 words).'); }

  const total = trait1 + trait2 + trait3;
  return { trait1, trait2, trait3, total, maxTotal: ER_MAX_TOTAL, simulated: true, notes };
}
