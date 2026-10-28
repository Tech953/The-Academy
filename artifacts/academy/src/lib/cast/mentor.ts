/**
 * Mentor teaching wiring — Phase 7.5 (brief §6, acceptance §9.2).
 *
 * A faculty mentor assigns and grades through the EXISTING
 * CourseWeaver paths, and nothing else:
 * - assign: weaveAssignments (governed store + ItemForge variants —
 *   the audited store). The mentor never authors lesson content, never
 *   invents an item, never writes an answer key into the chat.
 * - grade: gradeWovenAssignment (itemGrading; Extended Response stays
 *   simulated) then applyWovenGrade (recordQuizAttempt — the same
 *   record lesson quizzes use). Chat never scores.
 *
 * Result: mentor-assigned work lands in the SAME mastery record
 * (analyzeProgress standings) as portal work, because it is the same
 * functions. There is no parallel mentor gradebook.
 *
 * Guardrails:
 * - Only a faculty seed may assign. A generated peer (student or
 *   ambient) is rejected — teaching authority is hand-authored only.
 * - Faculty slots are still EMPTY (7.0); callers pass the
 *   hand-authored FacultySeed the owner filled in. This module never
 *   invents a mentor name: display names are caller-supplied.
 * - Mentor subject scoping is NOT implemented here: the schema
 *   carries no subject field, and the weave picks weakest targets
 *   regardless of mentor. When the owner fills the slots, subject
 *   scoping can be added on top of this wiring.
 */
import type { FacultySeed } from './schema';
import {
  analyzeProgress,
  applyWovenGrade,
  gradeWovenAssignment,
  weaveAssignments,
  type SkillStanding,
  type WovenAssignment,
  type WovenGradeResult,
} from '../courseWeaver';
import type { StudentCurriculumProgress } from '../../shared/schema';

export interface AssignMentorWorkOptions {
  studentId: string;
  progress: StudentCurriculumProgress;
  existing: WovenAssignment[];
  now: Date;
  count?: number;
}

/** A faculty mentor assigns audited coursework. Throws for non-faculty. */
export function assignMentorWork(
  mentor: FacultySeed,
  opts: AssignMentorWorkOptions,
): WovenAssignment[] {
  if (mentor.kind !== 'faculty') {
    throw new Error('assignMentorWork: only a faculty seed may assign coursework');
  }
  return weaveAssignments({
    studentId: opts.studentId,
    progress: opts.progress,
    existing: opts.existing,
    now: opts.now,
    count: opts.count,
  });
}

/** Chat-ready presentation of an assignment. Pure; no content invented. */
export function mentorAssignmentMessage(displayName: string, assignment: WovenAssignment): string {
  return (
    `${displayName} assigned: ${assignment.title} ` +
    `(${assignment.subject}, ${assignment.items.length} items, due ${assignment.dueAt}).`
  );
}

export interface SubmitMentorWorkResult extends WovenGradeResult {
  standings: SkillStanding[];
}

/**
 * A student's submission, graded through the existing paths and
 * recorded into the same mastery record portal work uses.
 */
export function submitMentorWork(opts: {
  assignment: WovenAssignment;
  responses: Record<string, string>;
  progress: StudentCurriculumProgress;
  now: Date;
}): SubmitMentorWorkResult {
  const graded = gradeWovenAssignment(opts.assignment, opts.responses, opts.now);
  const { xpEarned, passed } = applyWovenGrade(opts.progress, graded.assignment);
  return {
    assignment: graded.assignment,
    scorePercent: graded.scorePercent,
    perItem: graded.perItem,
    xpEarned,
    passed,
    standings: analyzeProgress(opts.progress),
  };
}
