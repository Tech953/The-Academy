/**
 * Examwright — Phase 6. Timed full-length GED exam simulation.
 *
 * Examwright assembles official-volume practice exams from the SAME
 * governed store the Auditor gates (Phase 3): Kaplan lesson items +
 * textbook items, one bank, no fabricated content. Assembly is seeded
 * per student (student id + subject + attempt number, the Phase 4
 * differential rule): the same student retaking gets a fresh draw,
 * two students get measurably different exams, and any draw is
 * reproducible from its seed for review.
 *
 * Domain stratification mirrors the Auditor's own domain map and mix
 * tolerances, so every assembled exam is a miniature of the full-test
 * blueprint the bank itself passes: Math quantitative 45% / algebraic
 * 55% (±12pp), RLA literary share of reading 25% (±12pp), and
 * proportional coverage of the Science and Social Studies domains.
 * Where a bank stratum is smaller than the official blueprint would
 * ideally draw, the shortfall is REPORTED on the assembled exam
 * (exam.strata) — never silently filled with invented items.
 *
 * Sittings run on the official clock: RLA 150 min, Math 115 min,
 * Science 90 min, Social Studies 70 min. The timer is a pure function
 * of (startedAt, now) so the UI, tests, and review all agree.
 *
 * Grading runs entirely through the Phase 2 engine (itemGrading):
 * objective items at 1 point, Extended Response at its SIMULATED
 * rubric fraction (total/7), labeled simulated wherever it surfaces.
 * The percent maps through gedScale (Phase 0) to the 100–200 scaled
 * score and official readiness band.
 *
 * A graded exam records through the same attempt path lesson quizzes
 * use (recordQuizAttempt, via the per-skill anchor lessons the exam
 * sampled) — submission → grade → progress, the Phase 4 closed loop —
 * so CourseWeaver standings and NoteSmith respond to exam evidence.
 */
import type { GEDPracticeQuestion } from '@shared/schema';
import type { StudentCurriculumProgress, GEDSubjectKey } from '@shared/schema';
import { FULL_TEST_VOLUME, OFFICIAL_DOMAINS } from './auditor';
import { KAPLAN_GED_CURRICULUM, GED_CODE_TO_SKILL, recordQuizAttempt } from './gedCurriculum';
import { gradeResponse, gradeExtendedResponse } from './itemGrading';
import { mulberry32, seedFromString } from './itemForge';
import { percentToScaledScore, scaledScoreBand, type GedBand } from './gedScale';

// collectStoreItems lives in the Auditor; re-deriving the unified
// store here would duplicate its lesson/textbook walk, so import it.
import { collectStoreItems } from './auditor';

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL EXAM SPECS — durations and volumes from the GED framework.
// ─────────────────────────────────────────────────────────────────────────────

export interface ExamSpec {
  subject: GEDSubjectKey;
  /** Official sitting length in minutes (GED Testing Service). */
  durationMinutes: number;
  /** Full-test item volume (the Auditor's FULL_TEST_VOLUME). */
  volume: number;
}

export const EXAM_SPECS: Record<GEDSubjectKey, ExamSpec> = {
  'Language Arts': { subject: 'Language Arts', durationMinutes: 150, volume: FULL_TEST_VOLUME['Language Arts'] },
  'Mathematical Reasoning': { subject: 'Mathematical Reasoning', durationMinutes: 115, volume: FULL_TEST_VOLUME['Mathematical Reasoning'] },
  'Science': { subject: 'Science', durationMinutes: 90, volume: FULL_TEST_VOLUME['Science'] },
  'Social Studies': { subject: 'Social Studies', durationMinutes: 70, volume: FULL_TEST_VOLUME['Social Studies'] },
};

export const EXAM_SUBJECTS = Object.keys(EXAM_SPECS) as GEDSubjectKey[];

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN MAP — mirrored from the Auditor (both code keyspaces: Kaplan
// lesson codes + textbook target codes). The Auditor keeps its copy
// private; this mirror is asserted identical by examwright.test.ts,
// which runs the Auditor over assembled exams.
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

/** Official domain for a governed item (longest-prefix, both keyspaces). */
export function examDomainFor(subject: string, gedCode: string | undefined): string | null {
  if (!gedCode) return null;
  const map = DOMAIN_MAP[subject];
  if (!map) return null;
  if (map[gedCode]) return map[gedCode];
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (gedCode === k || gedCode.startsWith(k + '.')) return map[k];
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STRATIFICATION — official-blueprint domain quotas per subject.
// Math honors the Auditor's mix targets (quant 45% / algebraic 55%);
// RLA honors the literary share of reading (25%); Science and Social
// Studies follow the published content-area shares. Practices domains
// are assessed across the real test rather than as a separate block,
// so they ride in the unstratified remainder.
// ─────────────────────────────────────────────────────────────────────────────

const DOMAIN_QUOTAS: Record<GEDSubjectKey, Record<string, number>> = {
  // 46 items: quant (Basic Math + Geometry) 21 = 45.7%, algebraic 25 = 54.3%
  'Mathematical Reasoning': { 'Basic Math': 14, 'Geometry': 7, 'Basic Algebra': 12, 'Graphs & Functions': 13 },
  // 46 items: reading 23 (informational 17 + literary 6 → literary share 26.1%), language 14, writing 9
  'Language Arts': { 'Reading — Informational': 17, 'Reading — Literary': 6, 'Language': 14, 'Writing': 9 },
  // 34 items: life 40% / physical 40% / earth & space 20% of the content block
  'Science': { 'Life Science': 11, 'Physical Science': 11, 'Earth & Space Science': 5 },
  // 35 items: civics 50% / U.S. history 20% / economics 15% / geography 15% of the content block
  'Social Studies': { 'Civics & Government': 15, 'U.S. History': 6, 'Economics': 4, 'Geography & the World': 5 },
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSEMBLED EXAM
// ─────────────────────────────────────────────────────────────────────────────

export interface ExamStratum {
  domain: string;
  quota: number;        // blueprint draw for this domain
  drawn: number;        // items actually drawn
  bankAvailable: number;
  shortfall: boolean;   // bank could not fill the quota
}

export interface AssembledExam {
  id: string;
  studentId: string;
  subject: GEDSubjectKey;
  attemptNumber: number;
  seed: number;
  durationMinutes: number;
  items: GEDPracticeQuestion[];
  strata: ExamStratum[];
  /** Domains the Auditor requires that this exam samples zero of. */
  missingDomains: string[];
  assembledAt: string;  // ISO
}

/** The per-student exam seed: same student + subject + attempt → same exam. */
export function examSeed(studentId: string, subject: string, attemptNumber: number): number {
  return seedFromString(`${studentId}|exam|${subject}|${attemptNumber}`);
}

function shuffled<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Assemble a full-length exam for one student from the governed bank.
 * Deterministic in (studentId, subject, attemptNumber, now date is
 * stamped but does not affect the draw).
 */
export function assembleExam(
  studentId: string, subject: GEDSubjectKey, attemptNumber: number, now: Date = new Date(),
): AssembledExam {
  const spec = EXAM_SPECS[subject];
  const seed = examSeed(studentId, subject, attemptNumber);
  const rng = mulberry32(seed);

  const pool = collectStoreItems()
    .filter(i => i.subject === subject)
    .map(i => i.q);
  const byDomain = new Map<string, GEDPracticeQuestion[]>();
  const domainless: GEDPracticeQuestion[] = [];
  for (const q of pool) {
    const d = examDomainFor(subject, q.gedCode);
    if (d) {
      if (!byDomain.has(d)) byDomain.set(d, []);
      byDomain.get(d)!.push(q);
    } else {
      domainless.push(q);
    }
  }

  const quotas = DOMAIN_QUOTAS[subject];
  const used = new Set<string>();
  const strata: ExamStratum[] = [];
  const drawn: GEDPracticeQuestion[] = [];

  // 1) Stratified draw: fill each domain quota from its shuffled pool.
  for (const domain of Object.keys(quotas)) {
    const domainPool = shuffled(byDomain.get(domain) ?? [], rng);
    const quota = quotas[domain];
    const take = domainPool.slice(0, quota);
    for (const q of take) { drawn.push(q); used.add(q.id); }
    strata.push({
      domain, quota, drawn: take.length,
      bankAvailable: domainPool.length,
      shortfall: take.length < quota,
    });
  }

  // 2) RLA formal rule: exactly one Extended Response prompt per
  //    sitting. The Writing quota may draw 0 or 2+; normalize to one
  //    and backfill from the Writing pool (short answers first).
  if (subject === 'Language Arts') {
    const ers = drawn.filter(q => q.type === 'extended_response');
    if (ers.length > 1) {
      const keep = ers[0];
      for (const extra of ers.slice(1)) {
        drawn.splice(drawn.indexOf(extra), 1);
        used.delete(extra.id);
      }
      void keep;
    }
    if (drawn.filter(q => q.type === 'extended_response').length === 0) {
      const erPool = shuffled(
        (byDomain.get('Writing') ?? []).filter(q => q.type === 'extended_response' && !used.has(q.id)), rng,
      );
      if (erPool.length > 0) {
        const er = erPool[0];
        drawn.push(er); used.add(er.id);
        const st = strata.find(s => s.domain === 'Writing');
        if (st) st.drawn += 1;
      }
    }
    // Trim or backfill the Writing stratum back to its quota.
    const writingQuota = quotas['Writing'];
    let writing = drawn.filter(q => examDomainFor(subject, q.gedCode) === 'Writing');
    if (writing.length > writingQuota) {
      const droppable = writing.filter(q => q.type !== 'extended_response');
      for (const q of droppable.slice(0, writing.length - writingQuota)) {
        drawn.splice(drawn.indexOf(q), 1);
        used.delete(q.id);
      }
      writing = drawn.filter(q => examDomainFor(subject, q.gedCode) === 'Writing');
    }
    if (writing.length < writingQuota) {
      const backfill = shuffled(
        (byDomain.get('Writing') ?? []).filter(q => !used.has(q.id)), rng,
      );
      for (const q of backfill.slice(0, writingQuota - writing.length)) {
        drawn.push(q); used.add(q.id);
      }
      const st = strata.find(s => s.domain === 'Writing');
      if (st) st.drawn = drawn.filter(q => examDomainFor(subject, q.gedCode) === 'Writing').length;
    }
  }

  // 3) Remainder: fill to official volume from every leftover item in
  //    the subject (other domains + domainless), shuffled.
  const rest = shuffled(pool.filter(q => !used.has(q.id)), rng);
  for (const q of rest) {
    if (drawn.length >= spec.volume) break;
    drawn.push(q); used.add(q.id);
  }
  // Record non-quota domains that contributed (practices, overflow).
  const counted = new Set(strata.map(s => s.domain));
  for (const domain of OFFICIAL_DOMAINS[subject]) {
    if (counted.has(domain)) continue;
    const n = drawn.filter(q => examDomainFor(subject, q.gedCode) === domain).length;
    strata.push({
      domain, quota: 0, drawn: n,
      bankAvailable: (byDomain.get(domain) ?? []).length,
      shortfall: false,
    });
  }

  // 4) Deterministic sitting order (ER last for RLA, as on the real test).
  const ordered = shuffled(drawn, rng);
  if (subject === 'Language Arts') {
    const erIdx = ordered.findIndex(q => q.type === 'extended_response');
    if (erIdx >= 0) {
      const [er] = ordered.splice(erIdx, 1);
      ordered.push(er);
    }
  }

  const present = new Set(ordered.map(q => examDomainFor(subject, q.gedCode)).filter(Boolean));
  const missingDomains = OFFICIAL_DOMAINS[subject].filter(d => !present.has(d));

  return {
    id: `EX.${subject.replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase()}.${seed.toString(36)}`,
    studentId,
    subject,
    attemptNumber,
    seed,
    durationMinutes: spec.durationMinutes,
    items: ordered,
    strata,
    missingDomains,
    assembledAt: now.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMER — pure functions of the sitting clock.
// ─────────────────────────────────────────────────────────────────────────────

export interface ExamTimer {
  startedAt: number;      // epoch ms
  durationMs: number;
  deadline: number;       // epoch ms
}

export function startTimer(exam: AssembledExam, now: Date): ExamTimer {
  const startedAt = now.getTime();
  const durationMs = exam.durationMinutes * 60 * 1000;
  return { startedAt, durationMs, deadline: startedAt + durationMs };
}

/** Milliseconds left on the clock; never negative. */
export function remainingMs(timer: ExamTimer, now: Date): number {
  return Math.max(0, timer.deadline - now.getTime());
}

export function timerExpired(timer: ExamTimer, now: Date): boolean {
  return now.getTime() >= timer.deadline;
}

/** HH:MM:SS / MM:SS rendering for the runner header. */
export function formatRemaining(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GRADING — through the Phase 2 engine only.
// ─────────────────────────────────────────────────────────────────────────────

export interface ExamDomainResult {
  domain: string;
  items: number;
  earned: number;         // points earned (ER fractional)
  scorePercent: number;
}

export interface ExamResult {
  exam: AssembledExam;
  scorePercent: number;
  scaledScore: number;
  band: GedBand;
  perItem: Array<{ itemId: string; earned: number }>;
  perDomain: ExamDomainResult[];
  /** The Extended Response outcome, surfaced separately because its
   *  rubric score is SIMULATED (see itemGrading). Null when the exam
   *  carried no ER item. */
  extendedResponse: { itemId: string; total: number; maxTotal: number; simulated: true } | null;
  submittedAt: string;    // ISO
  expired: boolean;       // true when the sitting auto-submitted on the clock
}

export function gradeExam(
  exam: AssembledExam,
  responses: Record<string, string>,
  now: Date,
  expired = false,
): ExamResult {
  const perItem = exam.items.map(q => {
    const response = responses[q.id] ?? '';
    let earned = 0;
    if (q.type === 'extended_response') {
      earned = gradeExtendedResponse(q, response).total / 7;
    } else {
      earned = gradeResponse(q, response) ? 1 : 0;
    }
    return { itemId: q.id, earned };
  });
  const raw = perItem.reduce((s, p) => s + p.earned, 0) / Math.max(1, perItem.length);
  const scorePercent = Math.round(raw * 100);

  const byId = new Map(exam.items.map(q => [q.id, q]));
  const domainAgg = new Map<string, { items: number; earned: number }>();
  for (const p of perItem) {
    const q = byId.get(p.itemId)!;
    const domain = examDomainFor(exam.subject, q.gedCode) ?? 'General';
    const agg = domainAgg.get(domain) ?? { items: 0, earned: 0 };
    agg.items += 1; agg.earned += p.earned;
    domainAgg.set(domain, agg);
  }
  const perDomain = [...domainAgg.entries()]
    .map(([domain, agg]) => ({
      domain,
      items: agg.items,
      earned: Math.round(agg.earned * 100) / 100,
      scorePercent: agg.items > 0 ? Math.round((agg.earned / agg.items) * 100) : 0,
    }))
    .sort((a, b) => a.domain.localeCompare(b.domain));

  const erItem = exam.items.find(q => q.type === 'extended_response');
  let extendedResponse: ExamResult['extendedResponse'] = null;
  if (erItem) {
    const er = gradeExtendedResponse(erItem, responses[erItem.id] ?? '');
    extendedResponse = { itemId: erItem.id, total: er.total, maxTotal: er.maxTotal, simulated: true };
  }

  return {
    exam,
    scorePercent,
    scaledScore: percentToScaledScore(scorePercent),
    band: scaledScoreBand(percentToScaledScore(scorePercent)),
    perItem,
    perDomain,
    extendedResponse,
    submittedAt: now.toISOString(),
    expired,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORD → PROGRESS — the same attempt path lesson quizzes use.
// ─────────────────────────────────────────────────────────────────────────────

export interface ExamRecordEntry {
  lessonCode: string;
  skillNodeId: string;
  scorePercent: number;
}

/**
 * Per-skill recording entries for a graded exam: each represented
 * skill's score = the student's percent across the exam items tagged
 * with that skill (ER counts fractionally). Anchor = the lesson the
 * skill maps to via its items' dominant lesson code, falling back to
 * the skill's CourseWeaver anchor convention (lesson with the skill's
 * items). Entries are the contract applyExamGrade and the portal UI
 * both consume, so lib and UI record identically.
 */
/** All real lesson codes in the curriculum (anchor candidates). */
function lessonCodeSet(): Set<string> {
  const codes = new Set<string>();
  for (const book of KAPLAN_GED_CURRICULUM) {
    for (const ch of book.chapters) {
      for (const lesson of ch.lessons ?? []) codes.add(lesson.gedCode);
    }
  }
  return codes;
}

export function examRecordEntries(result: ExamResult): ExamRecordEntry[] {
  const lessonCodes = lessonCodeSet();
  const earnedByItem = new Map(result.perItem.map(p => [p.itemId, p.earned]));
  const bySkill = new Map<string, { earned: number; count: number; lessonCounts: Map<string, number> }>();
  for (const q of result.exam.items) {
    if (!q.skillNodeId) continue;
    const agg = bySkill.get(q.skillNodeId) ?? { earned: 0, count: 0, lessonCounts: new Map() };
    agg.earned += earnedByItem.get(q.id) ?? 0;
    agg.count += 1;
    // Lesson items carry their lesson's own gedCode — a valid anchor.
    // Textbook items carry target codes (not lessons), so they fall
    // back to the skill's dominant lesson below.
    if (q.gedCode && lessonCodes.has(q.gedCode)) {
      agg.lessonCounts.set(q.gedCode, (agg.lessonCounts.get(q.gedCode) ?? 0) + 1);
    }
    bySkill.set(q.skillNodeId, agg);
  }
  const entries: ExamRecordEntry[] = [];
  for (const [skillNodeId, agg] of bySkill) {
    let anchor: string | null = null;
    let best = -1;
    for (const [code, n] of agg.lessonCounts) {
      if (n > best) { best = n; anchor = code; }
    }
    if (!anchor) anchor = dominantLessonForSkill(skillNodeId);
    if (!anchor) continue; // skill with no lesson home — cannot record honestly
    entries.push({
      lessonCode: anchor,
      skillNodeId,
      scorePercent: Math.round((agg.earned / Math.max(1, agg.count)) * 100),
    });
  }
  return entries.sort((a, b) => a.lessonCode.localeCompare(b.lessonCode));
}

/**
 * The lesson carrying the most governed items for a skill — the
 * CourseWeaver anchor convention, used for skills an exam sampled
 * only through textbook items.
 */
function dominantLessonForSkill(skillNodeId: string): string | null {
  let best: string | null = null;
  let bestN = -1;
  for (const book of KAPLAN_GED_CURRICULUM) {
    for (const ch of book.chapters) {
      for (const lesson of ch.lessons ?? []) {
        if (GED_CODE_TO_SKILL[lesson.gedCode] !== skillNodeId) continue;
        const n = lesson.practiceQuestions.filter(q => q.skillNodeId === skillNodeId).length;
        if (n > bestN) { best = lesson.gedCode; bestN = n; }
      }
    }
  }
  return best;
}

/**
 * Record a graded exam into curriculum progress through the same
 * path as lesson quizzes. Returns XP earned across the anchor
 * lessons and whether the exam percent clears the passing bar.
 */
export function applyExamGrade(
  progress: StudentCurriculumProgress,
  result: ExamResult,
): { xpEarned: number; passed: boolean; recordedLessons: string[] } {
  let xpEarned = 0;
  const recordedLessons: string[] = [];
  for (const entry of examRecordEntries(result)) {
    const r = recordQuizAttempt(progress, entry.lessonCode, entry.scorePercent, result.exam.subject);
    xpEarned += r.xpEarned;
    recordedLessons.push(entry.lessonCode);
  }
  return {
    xpEarned,
    passed: result.scorePercent >= 60,
    recordedLessons,
  };
}
