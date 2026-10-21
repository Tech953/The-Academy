/**
 * CourseWeaver — Phase 4. Differential coursework generation.
 *
 * Given a student's actual progress record, CourseWeaver analyzes
 * skill standings, picks weak targets, and weaves assignments for
 * that student alone: items drawn from the governed store plus fresh
 * ItemForge variants generated from a PER-STUDENT seed (student id +
 * skill + attempt number). Two students with different histories get
 * measurably different, target-appropriate coursework; the same
 * student with the same history gets the same assignment — the
 * differential-processing rule from the engram design, applied to
 * coursework.
 *
 * The lifecycle is real: assignments are pending until submitted,
 * submission grades through the Phase 2 engine, and the grade is
 * recorded into the student's curriculum progress through the same
 * recordQuizAttempt path lesson quizzes use (Phase 0's honest
 * measurement) — submission → grade → progress, closed loop.
 *
 * Difficulty adaptation revives the phase-1 HomeworkEngine's model:
 * struggle lowers the tier mix toward foundational, success lets it
 * climb. The pure core here takes struggle counts as data; the UI
 * layer feeds them from HomeworkEngine's per-student history.
 */
import type { GEDPracticeQuestion, QuestionDifficulty } from '@shared/schema';
import type { StudentCurriculumProgress, GEDSubjectKey } from '@shared/schema';
import { KAPLAN_GED_CURRICULUM, GED_CODE_TO_SKILL, recordQuizAttempt, PASSING_QUIZ_SCORE } from './gedCurriculum';
import { gradeResponse, gradeExtendedResponse } from './itemGrading';
import { forgeItem, mulberry32, seedFromString } from './itemForge';
import { skillGraph } from './academy-engine/phase1/skillGraph';

// ─────────────────────────────────────────────────────────────────────────────
// SKILL STANDINGS — what the progress record says about each skill.
// ─────────────────────────────────────────────────────────────────────────────

export type SkillStatus = 'unseen' | 'struggling' | 'developing' | 'mastered';

export interface SkillStanding {
  skillNodeId: string;
  subject: string;
  lessonCodes: string[];       // lessons whose dominant skill this is
  anchorLessonCode: string;    // lesson with the most items for this skill
  attempts: number;
  bestScore: number | null;    // best quiz percent across its lessons
  mastery: number;             // 0..1 (bestScore/100 when attempted)
  status: SkillStatus;
}

/** Lessons grouped by dominant skill (GED_CODE_TO_SKILL), with item counts. */
function skillLessons(): Map<string, { subject: string; codes: Array<{ code: string; items: number }> }> {
  const map = new Map<string, { subject: string; codes: Array<{ code: string; items: number }> }>();
  for (const book of KAPLAN_GED_CURRICULUM) {
    for (const ch of book.chapters) {
      for (const lesson of ch.lessons ?? []) {
        const skill = GED_CODE_TO_SKILL[lesson.gedCode];
        if (!skill) continue;
        if (!map.has(skill)) map.set(skill, { subject: book.subject, codes: [] });
        map.get(skill)!.codes.push({ code: lesson.gedCode, items: lesson.practiceQuestions.length });
      }
    }
  }
  return map;
}

export function analyzeProgress(progress: StudentCurriculumProgress): SkillStanding[] {
  const standings: SkillStanding[] = [];
  for (const [skill, info] of skillLessons()) {
    let attempts = 0;
    let best: number | null = null;
    for (const { code } of info.codes) {
      const lp = progress.lessonProgress[code];
      if (lp && lp.attempts > 0) {
        attempts += lp.attempts;
        if (lp.quizScore !== undefined) best = Math.max(best ?? 0, lp.quizScore);
      }
    }
    const mastery = best === null ? 0 : best / 100;
    const status: SkillStatus =
      attempts === 0 ? 'unseen' :
      mastery >= 0.85 ? 'mastered' :
      mastery >= PASSING_QUIZ_SCORE / 100 ? 'developing' : 'struggling';
    const anchor = [...info.codes].sort((a, b) => b.items - a.items)[0];
    standings.push({
      skillNodeId: skill, subject: info.subject,
      lessonCodes: info.codes.map(c => c.code),
      anchorLessonCode: anchor.code,
      attempts, bestScore: best, mastery, status,
    });
  }
  return standings;
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM SOURCING — governed store items by skill, ItemForge by template.
// ─────────────────────────────────────────────────────────────────────────────

/** Which ItemForge templates can generate fresh variants for a skill. */
export const SKILL_TEMPLATES: Record<string, string[]> = {
  'MATH.ARITH.001': ['arith-ops', 'order-values'],
  'MATH.FRAC.002': ['fraction-ops', 'decimal-ops'],
  'MATH.RATIO.003': ['percent-of'],
  'MATH.STAT.011': ['mean-median'],
  'MATH.PROB.012': ['probability'],
  'MATH.ALGE.005': ['linear-eq', 'eval-expr'],
  'MATH.LINEQ.006': ['linear-eq', 'slope'],
  'SCI.PHYS.004': ['force-ma', 'wave-speed'],
  'SCI.BIO.001': ['punnett'],
  'LANG.READ.001': ['fiction-reading'],
  'LANG.MAIN.002': ['fiction-reading'],
  'LANG.PARA.007': ['transition-choice'],
  'LANG.SENT.006': ['transition-choice', 'sv-agreement', 'vocab-cloze'],
  'LANG.GRAM.005': ['sv-agreement'],
  'LANG.VOCAB.004': ['vocab-cloze'],
  'LANG.ESSAY.008': ['essay-order'],
  'REAS.CRIT.001': ['source-analysis'],
  'SOC.USHIST.001': ['chrono-order'],
};

function storeItemsForSkill(skillNodeId: string): GEDPracticeQuestion[] {
  const out: GEDPracticeQuestion[] = [];
  for (const book of KAPLAN_GED_CURRICULUM) {
    for (const ch of book.chapters) {
      for (const lesson of ch.lessons ?? []) {
        for (const q of lesson.practiceQuestions) {
          if (q.skillNodeId === skillNodeId) out.push(q);
        }
      }
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// WOVEN ASSIGNMENTS — the lifecycle model (extends the shared
// curriculum AssignmentData shape with items and grading).
// ─────────────────────────────────────────────────────────────────────────────

export type WovenStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface WovenAssignment {
  id: string;
  studentId: string;
  title: string;
  subject: string;
  skillNodeId: string;
  lessonCode: string;          // anchor lesson — grades record here
  items: GEDPracticeQuestion[];
  status: WovenStatus;
  createdAt: string;           // ISO
  dueAt: string;               // ISO
  maxPoints: number;
  attemptNumber: number;
  seed: number;
  grade?: number;              // raw percent, set on completion
  completedAt?: string;
}

/** The per-student seed: same student + skill + attempt → same items. */
export function studentSeed(studentId: string, skillNodeId: string, attemptNumber: number): number {
  return seedFromString(`${studentId}|${skillNodeId}|${attemptNumber}`);
}

const ITEMS_PER_ASSIGNMENT = 5;
const DUE_DAYS = 2;

function difficultyPlan(standing: SkillStanding, struggleCount: number): QuestionDifficulty[] {
  // HomeworkEngine's smoothing, as data: heavy struggle pins the set
  // to foundational; developing work is standard with an extended cap.
  if (standing.status === 'struggling' || struggleCount >= 2) {
    return ['foundational', 'foundational', 'standard', 'foundational', 'standard'];
  }
  if (standing.status === 'developing') {
    return ['standard', 'standard', 'extended', 'standard', 'standard'];
  }
  return ['foundational', 'standard', 'foundational', 'standard', 'standard']; // unseen: gentle on-ramp
}

function assembleItems(
  studentId: string, standing: SkillStanding, attemptNumber: number, struggleCount: number,
): GEDPracticeQuestion[] {
  const seed = studentSeed(studentId, standing.skillNodeId, attemptNumber);
  const rng = mulberry32(seed);
  const plan = difficultyPlan(standing, struggleCount);
  const store = storeItemsForSkill(standing.skillNodeId);
  const templates = SKILL_TEMPLATES[standing.skillNodeId] ?? [];

  const shuffleWith = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const items: GEDPracticeQuestion[] = [];
  const usedIds = new Set<string>();

  // Slots alternate store / forge so every set mixes governed content
  // with fresh per-student variants (when both sources exist).
  for (let slot = 0; slot < ITEMS_PER_ASSIGNMENT; slot++) {
    const wantDifficulty = plan[slot];
    const preferForge = slot % 2 === 1 && templates.length > 0;
    let item: GEDPracticeQuestion | undefined;

    if (!preferForge) {
      const pool = shuffleWith(store.filter(q => !usedIds.has(q.id)));
      item = pool.find(q => q.difficulty === wantDifficulty) ?? pool[0];
    }
    if (!item && templates.length > 0) {
      const template = templates[slot % templates.length];
      const forged = forgeItem(template, seed + slot * 7919, {
        gedCode: standing.anchorLessonCode,
        skillNodeId: standing.skillNodeId,
        difficulty: wantDifficulty,
      });
      if (!usedIds.has(forged.id)) item = forged;
    }
    if (!item) {
      const pool = shuffleWith(store.filter(q => !usedIds.has(q.id)));
      item = pool[0];
    }
    if (item) { items.push(item); usedIds.add(item.id); }
  }
  return items;
}

/**
 * Choose target skills for new coursework, weakest first:
 * struggling → developing → unseen frontier (prerequisites not
 * struggling and at least attempted-or-root). Skills with an active
 * woven assignment are skipped.
 */
export function pickTargets(
  standings: SkillStanding[], activeSkills: Set<string>, struggle: Map<string, number>, count: number,
): SkillStanding[] {
  const bySkill = new Map(standings.map(s => [s.skillNodeId, s]));
  const eligible = (s: SkillStanding): boolean => {
    if (activeSkills.has(s.skillNodeId)) return false;
    if (s.status === 'struggling' || s.status === 'developing') return true;
    if (s.status === 'unseen') {
      const node = skillGraph.getNode(s.skillNodeId);
      if (!node) return true;
      return node.prerequisites.every(p => {
        const ps = bySkill.get(p);
        // A prerequisite with no lessons in the store cannot block;
        // a lesson-bearing prereq must be at least developing.
        if (!ps) return true;
        return ps.status === 'developing' || ps.status === 'mastered';
      });
    }
    return false; // mastered: no coursework (spaced review is Phase 5 territory)
  };
  const rank = (s: SkillStanding): number =>
    s.status === 'struggling' ? 0 : s.status === 'developing' ? 1 : 2;
  return standings
    .filter(eligible)
    .sort((a, b) =>
      rank(a) - rank(b) ||
      a.mastery - b.mastery ||
      (struggle.get(b.skillNodeId) ?? 0) - (struggle.get(a.skillNodeId) ?? 0) ||
      a.skillNodeId.localeCompare(b.skillNodeId))
    .slice(0, count);
}

export interface WeaveOptions {
  studentId: string;
  progress: StudentCurriculumProgress;
  existing: WovenAssignment[];
  now: Date;
  count?: number;                          // new assignments to weave (default 3)
  struggle?: Map<string, number>;          // HomeworkEngine history, as data
}

export function weaveAssignments(opts: WeaveOptions): WovenAssignment[] {
  const standings = analyzeProgress(opts.progress);
  const activeSkills = new Set(
    opts.existing.filter(a => a.status === 'pending' || a.status === 'in_progress').map(a => a.skillNodeId),
  );
  const struggle = opts.struggle ?? new Map<string, number>();
  const targets = pickTargets(standings, activeSkills, struggle, opts.count ?? 3);
  const woven: WovenAssignment[] = [];
  for (const standing of targets) {
    const attemptNumber =
      opts.existing.filter(a => a.skillNodeId === standing.skillNodeId).length + 1;
    const items = assembleItems(opts.studentId, standing, attemptNumber, struggle.get(standing.skillNodeId) ?? 0);
    if (items.length < 3) continue; // never weave a stub set
    const due = new Date(opts.now.getTime() + DUE_DAYS * 24 * 3600 * 1000);
    const node = skillGraph.getNode(standing.skillNodeId);
    woven.push({
      id: `CW.${standing.skillNodeId}.${studentSeed(opts.studentId, standing.skillNodeId, attemptNumber).toString(36)}`,
      studentId: opts.studentId,
      title: `${node?.name ?? standing.skillNodeId} — targeted practice`,
      subject: standing.subject,
      skillNodeId: standing.skillNodeId,
      lessonCode: standing.anchorLessonCode,
      items,
      status: 'pending',
      createdAt: opts.now.toISOString(),
      dueAt: due.toISOString(),
      maxPoints: items.length * 10,
      attemptNumber,
      seed: studentSeed(opts.studentId, standing.skillNodeId, attemptNumber),
    });
  }
  return woven;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMISSION → GRADE → PROGRESS (the closed loop)
// ─────────────────────────────────────────────────────────────────────────────

export interface WovenGradeResult {
  assignment: WovenAssignment;             // completed copy
  scorePercent: number;                    // raw score (Phase 0 honesty)
  perItem: Array<{ itemId: string; earned: number }>;  // earned: 0..1
  xpEarned: number;
  passed: boolean;
}

export function gradeWovenAssignment(
  assignment: WovenAssignment,
  responses: Record<string, string>,
  now: Date,
): { assignment: WovenAssignment; scorePercent: number; perItem: Array<{ itemId: string; earned: number }> } {
  const perItem = assignment.items.map(q => {
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
  return {
    assignment: {
      ...assignment,
      status: 'completed',
      grade: scorePercent,
      completedAt: now.toISOString(),
    },
    scorePercent,
    perItem,
  };
}

/**
 * Record a graded woven assignment into curriculum progress through
 * the same path as lesson quizzes — this is what makes the next
 * weave differential: the grade changes the standings.
 */
export function applyWovenGrade(
  progress: StudentCurriculumProgress,
  graded: WovenAssignment,
): { xpEarned: number; passed: boolean } {
  if (graded.grade === undefined) throw new Error('applyWovenGrade: assignment has no grade');
  const result = recordQuizAttempt(
    progress, graded.lessonCode, graded.grade, graded.subject as GEDSubjectKey,
  );
  return { xpEarned: result.xpEarned, passed: result.passed };
}

/** Pending / missed (overdue) / completed — lists derived from data. */
export function classifyAssignments(
  assignments: WovenAssignment[], now: Date,
): { pending: WovenAssignment[]; overdue: WovenAssignment[]; completed: WovenAssignment[] } {
  const pending: WovenAssignment[] = [];
  const overdue: WovenAssignment[] = [];
  const completed: WovenAssignment[] = [];
  for (const a of assignments) {
    if (a.status === 'completed') completed.push(a);
    else if (new Date(a.dueAt).getTime() < now.getTime()) overdue.push(a);
    else pending.push(a);
  }
  const byDue = (x: WovenAssignment, y: WovenAssignment) => x.dueAt.localeCompare(y.dueAt);
  pending.sort(byDue); overdue.sort(byDue);
  completed.sort((x, y) => (y.completedAt ?? '').localeCompare(x.completedAt ?? ''));
  return { pending, overdue, completed };
}
