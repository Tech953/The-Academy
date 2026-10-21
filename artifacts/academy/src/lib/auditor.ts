/**
 * The Auditor — Phase 3. The gate of the Seed → Generator → Auditor
 * architecture: it audits the unified content store (Kaplan lessons +
 * textbook chapters) against the official GED framework and reports
 * coverage, volume, format, mix, and item-integrity findings.
 *
 * Pure and deterministic: auditStore() reads the store as data and
 * returns a report; it changes nothing. Acceptance (roadmap Phase 3):
 * every official domain assessed, mixes within tolerance, bank at or
 * above full-test volume per subject, no integrity problems.
 */
import type { GEDPracticeQuestion, QuestionType } from '@shared/schema';
import { KAPLAN_GED_CURRICULUM } from './gedCurriculumData';
import { GED_TEXTBOOKS } from './gedContent';
import { gradeResponse } from './itemGrading';
import { skillGraph } from './academy-engine/phase1/skillGraph';

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL FRAMEWORK CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Full-test item volumes per subject (GED Testing Service). */
export const FULL_TEST_VOLUME: Record<string, number> = {
  'Language Arts': 46,
  'Mathematical Reasoning': 46,
  'Science': 34,
  'Social Studies': 35,
};

export const OFFICIAL_DOMAINS: Record<string, string[]> = {
  'Mathematical Reasoning': ['Basic Math', 'Geometry', 'Basic Algebra', 'Graphs & Functions'],
  'Language Arts': ['Reading — Informational', 'Reading — Literary', 'Language', 'Writing'],
  'Science': ['Life Science', 'Physical Science', 'Earth & Space Science', 'Science Practices'],
  'Social Studies': ['Civics & Government', 'U.S. History', 'Economics', 'Geography & the World', 'Social Studies Practices'],
};

/** Formats expected per subject (extended_response is RLA-only). */
export const EXPECTED_FORMATS: Record<string, QuestionType[]> = {
  'Mathematical Reasoning': ['mcq', 'fill_in', 'drop_down', 'drag_drop', 'hot_spot', 'short_answer'],
  'Language Arts': ['mcq', 'fill_in', 'drop_down', 'drag_drop', 'hot_spot', 'short_answer', 'extended_response'],
  'Science': ['mcq', 'fill_in', 'drop_down', 'drag_drop', 'hot_spot', 'short_answer'],
  'Social Studies': ['mcq', 'fill_in', 'drop_down', 'drag_drop', 'hot_spot', 'short_answer'],
};

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN MAPPING — both code keyspaces (Kaplan lesson codes and the
// textbook target codes unified in Phase 1).
// ─────────────────────────────────────────────────────────────────────────────

const DOMAIN_MAP: Record<string, Record<string, string>> = {
  'Mathematical Reasoning': {
    'MATH.1': 'Basic Math', 'MATH.2': 'Basic Math', 'MATH.3': 'Basic Math', 'MATH.4': 'Basic Math',
    'MATH.5': 'Basic Algebra', 'MATH.6': 'Graphs & Functions', 'MATH.7': 'Geometry',
    'Q.1': 'Basic Math', 'Q.2': 'Basic Math', 'Q.3': 'Basic Math', 'Q.7': 'Basic Math', 'Q.8': 'Basic Math',
    'Q.4': 'Geometry', 'Q.5': 'Geometry', 'Q.6': 'Geometry',
    'A.1': 'Basic Algebra', 'A.2': 'Basic Algebra', 'A.3': 'Graphs & Functions', 'A.4': 'Graphs & Functions',
  },
  'Language Arts': {
    'RLA.1': 'Reading — Informational', 'RLA.2': 'Reading — Informational', 'RLA.3': 'Reading — Literary',
    'RLA.4': 'Language', 'RLA.5': 'Writing', 'RLA.6': 'Writing', 'RLA.7': 'Language',
    'RLA.8': 'Language', 'RLA.9': 'Language',
    'R.2': 'Reading — Informational', 'R.4': 'Reading — Informational', 'R.6': 'Reading — Informational',
    'R.8': 'Reading — Informational', 'R.9': 'Reading — Informational',
    'ER': 'Writing', 'L.1': 'Language', 'L.2': 'Language', 'L.3': 'Language',
  },
  'Science': {
    'SCI.1': 'Science Practices', 'SCI.2': 'Life Science', 'SCI.3': 'Earth & Space Science', 'SCI.4': 'Physical Science',
    'L.a': 'Life Science', 'L.b': 'Life Science', 'L.c': 'Life Science', 'L.e': 'Life Science', 'L.f': 'Life Science',
    'P.a': 'Physical Science', 'P.b': 'Physical Science', 'P.c': 'Physical Science',
    'ES.a': 'Earth & Space Science', 'ES.b': 'Earth & Space Science', 'SP.1': 'Science Practices',
  },
  'Social Studies': {
    'SS.1': 'Social Studies Practices', 'SS.2': 'U.S. History', 'SS.3': 'Civics & Government',
    'SS.4': 'Economics', 'SS.5': 'Geography & the World',
    'CG.a': 'Civics & Government', 'CG.b': 'Civics & Government', 'CG.c': 'Civics & Government', 'CG.d': 'Civics & Government',
    'USH.a': 'U.S. History', 'USH.b': 'U.S. History', 'E.a': 'Economics', 'E.b': 'Economics', 'E.c': 'Economics',
    'GW.a': 'Geography & the World', 'GW.b': 'Geography & the World', 'GW.c': 'Geography & the World',
  },
};

function domainFor(subject: string, gedCode: string | undefined): string | null {
  if (!gedCode) return null;
  const map = DOMAIN_MAP[subject];
  if (!map) return null;
  if (map[gedCode]) return map[gedCode];
  // Longest-prefix match: 'RLA.1.4' → 'RLA.1', 'R.2.5' → 'R.2', 'MATH.6.7' → 'MATH.6'
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (gedCode === k || gedCode.startsWith(k + '.')) return map[k];
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface MixResult {
  name: string;
  actualPct: number;
  targetPct: number;
  tolerancePct: number;
  ok: boolean;
}

export interface SubjectAudit {
  subject: string;
  total: number;
  lessonItems: number;
  textbookItems: number;
  volumeTarget: number;
  volumeOk: boolean;
  byFormat: Partial<Record<QuestionType, number>>;
  byDifficulty: Record<string, number>;
  byDomain: Record<string, number>;
  missingDomains: string[];
  formatGaps: QuestionType[];
  mixes: MixResult[];
}

export interface IntegrityProblem { itemId: string; problem: string }

export interface AuditReport {
  subjects: SubjectAudit[];
  integrityProblems: IntegrityProblem[];
  acceptance: {
    allDomainsAssessed: boolean;
    volumesOk: boolean;
    mixesWithinTolerance: boolean;
    formatsCovered: boolean;
    integrityClean: boolean;
    overall: boolean;
  };
}

interface StoreItem { q: GEDPracticeQuestion; subject: string; source: 'lesson' | 'textbook' }

export function collectStoreItems(): StoreItem[] {
  const items: StoreItem[] = [];
  for (const book of KAPLAN_GED_CURRICULUM) {
    for (const ch of book.chapters) {
      for (const lesson of ch.lessons ?? []) {
        for (const q of lesson.practiceQuestions) items.push({ q, subject: book.subject, source: 'lesson' });
      }
    }
  }
  for (const tb of GED_TEXTBOOKS) {
    for (const ch of tb.chapters) {
      for (const q of ch.practiceQuestions ?? []) items.push({ q, subject: tb.subject, source: 'textbook' });
    }
  }
  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRITY — every item must be gradable and self-consistent.
// ─────────────────────────────────────────────────────────────────────────────

function auditItem({ q, source }: StoreItem, seen: Set<string>, problems: IntegrityProblem[]): void {
  const fail = (problem: string) => problems.push({ itemId: q.id, problem });
  if (seen.has(q.id)) fail('duplicate item id');
  seen.add(q.id);
  if (q.skillNodeId && !skillGraph.getNode(q.skillNodeId)) {
    fail(`skillNodeId ${q.skillNodeId} is not a skill-graph node`);
  }
  switch (q.type) {
    case 'mcq': {
      if (!q.choices) { fail('mcq without choices'); break; }
      const letters = ['A', 'B', 'C', 'D'];
      if (!letters.includes(q.answer)) fail(`mcq answer '${q.answer}' is not A–D`);
      const texts = letters.map(l => q.choices![l as 'A']);
      if (new Set(texts).size !== 4) fail('mcq choices are not all distinct');
      break;
    }
    case 'fill_in':
      if (!q.answer.trim()) fail('fill_in without an answer');
      else if (!gradeResponse(q, q.answer)) fail('fill_in model answer does not grade correct');
      break;
    case 'drop_down':
      if (!(q.options ?? []).includes(q.answer)) fail('drop_down answer is not among options');
      else if (!gradeResponse(q, q.answer)) fail('drop_down model answer does not grade correct');
      break;
    case 'drag_drop': {
      const want = q.answer.split('|').map(s => s.trim()).sort();
      const got = [...(q.dragItems ?? [])].sort();
      if (JSON.stringify(want) !== JSON.stringify(got)) fail('drag_drop answer tokens differ from dragItems');
      else if (!gradeResponse(q, q.answer)) fail('drag_drop model answer does not grade correct');
      break;
    }
    case 'hot_spot':
      if (!q.hotSpot?.zones.some(z => z.id === q.answer)) fail('hot_spot answer is not a zone id');
      break;
    case 'short_answer':
      // Lesson items are machine-graded in quizzes, so they must carry a
      // key. Textbook items are self-check flashcards by design (exempt).
      if (source === 'lesson' && !(q.answerAliases?.length || q.answerKeywords?.length)) {
        fail('lesson short_answer has no answerAliases/answerKeywords — ungradable in a quiz');
      } else if (source === 'lesson' && !gradeResponse(q, q.answer) && !(q.answerKeywords?.length)) {
        fail('short_answer model answer does not grade correct');
      }
      break;
    case 'extended_response':
      if ((q.stimulus ?? []).length < 2) fail('extended_response should present two source texts');
      break;
    default:
      fail(`unknown question type '${(q as GEDPracticeQuestion).type}'`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// THE AUDIT
// ─────────────────────────────────────────────────────────────────────────────

function mix(name: string, actual: number, target: number, tol: number): MixResult {
  const actualPct = Math.round(actual * 1000) / 10;
  return { name, actualPct, targetPct: target, tolerancePct: tol, ok: Math.abs(actualPct - target) <= tol };
}

export function auditStore(): AuditReport {
  const items = collectStoreItems();
  const problems: IntegrityProblem[] = [];
  const seen = new Set<string>();
  for (const item of items) auditItem(item, seen, problems);

  const subjects: SubjectAudit[] = [];
  for (const subject of Object.keys(OFFICIAL_DOMAINS)) {
    const mine = items.filter(i => i.subject === subject);
    const byFormat: Partial<Record<QuestionType, number>> = {};
    const byDifficulty: Record<string, number> = {};
    const byDomain: Record<string, number> = {};
    for (const d of OFFICIAL_DOMAINS[subject]) byDomain[d] = 0;
    for (const { q } of mine) {
      byFormat[q.type] = (byFormat[q.type] ?? 0) + 1;
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1;
      const domain = domainFor(subject, q.gedCode);
      if (domain) byDomain[domain] = (byDomain[domain] ?? 0) + 1;
    }
    const missingDomains = OFFICIAL_DOMAINS[subject].filter(d => (byDomain[d] ?? 0) === 0);
    const formatGaps = EXPECTED_FORMATS[subject].filter(f => (byFormat[f] ?? 0) === 0);
    const mixes: MixResult[] = [];
    if (subject === 'Mathematical Reasoning' && mine.length > 0) {
      const quant = (byDomain['Basic Math'] + byDomain['Geometry']) / mine.length;
      mixes.push(mix('Quantitative share (Basic Math + Geometry)', quant, 45, 12));
      mixes.push(mix('Algebraic share (Basic Algebra + Graphs & Functions)', 1 - quant, 55, 12));
    }
    if (subject === 'Language Arts') {
      const reading = byDomain['Reading — Informational'] + byDomain['Reading — Literary'];
      if (reading > 0) mixes.push(mix('Literary share of reading', byDomain['Reading — Literary'] / reading, 25, 12));
    }
    subjects.push({
      subject,
      total: mine.length,
      lessonItems: mine.filter(i => i.source === 'lesson').length,
      textbookItems: mine.filter(i => i.source === 'textbook').length,
      volumeTarget: FULL_TEST_VOLUME[subject],
      volumeOk: mine.length >= FULL_TEST_VOLUME[subject],
      byFormat, byDifficulty, byDomain, missingDomains, formatGaps, mixes,
    });
  }

  const acceptance = {
    allDomainsAssessed: subjects.every(s => s.missingDomains.length === 0),
    volumesOk: subjects.every(s => s.volumeOk),
    mixesWithinTolerance: subjects.every(s => s.mixes.every(m => m.ok)),
    formatsCovered: subjects.every(s => s.formatGaps.length === 0),
    integrityClean: problems.length === 0,
    overall: false,
  };
  acceptance.overall =
    acceptance.allDomainsAssessed && acceptance.volumesOk &&
    acceptance.mixesWithinTolerance && acceptance.formatsCovered &&
    acceptance.integrityClean;

  return { subjects, integrityProblems: problems, acceptance };
}

/** Compact human-readable rendering of a report (for logs / the Auditor UI). */
export function formatAuditReport(report: AuditReport): string {
  const lines: string[] = ['═══ GED CONTENT AUDIT ═══'];
  for (const s of report.subjects) {
    lines.push(`\n${s.subject}: ${s.total} items (${s.lessonItems} lesson + ${s.textbookItems} textbook) — volume target ${s.volumeTarget}: ${s.volumeOk ? 'OK' : 'SHORT'}`);
    lines.push(`  domains: ${Object.entries(s.byDomain).map(([d, n]) => `${d}=${n}`).join(' · ')}`);
    if (s.missingDomains.length) lines.push(`  MISSING DOMAINS: ${s.missingDomains.join(', ')}`);
    lines.push(`  formats: ${Object.entries(s.byFormat).map(([f, n]) => `${f}=${n}`).join(' · ')}`);
    if (s.formatGaps.length) lines.push(`  FORMAT GAPS: ${s.formatGaps.join(', ')}`);
    for (const m of s.mixes) lines.push(`  mix: ${m.name}: ${m.actualPct}% (target ${m.targetPct}% ±${m.tolerancePct}) ${m.ok ? 'OK' : 'OUT OF TOLERANCE'}`);
  }
  lines.push(`\nintegrity problems: ${report.integrityProblems.length}`);
  for (const p of report.integrityProblems) lines.push(`  - ${p.itemId}: ${p.problem}`);
  const a = report.acceptance;
  lines.push(`\nacceptance: domains=${a.allDomainsAssessed} volumes=${a.volumesOk} mixes=${a.mixesWithinTolerance} formats=${a.formatsCovered} integrity=${a.integrityClean} → OVERALL ${a.overall ? 'PASS' : 'FAIL'}`);
  return lines.join('\n');
}
