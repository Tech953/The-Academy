import { describe, it, expect } from 'vitest';
import { assignMentorWork, mentorAssignmentMessage, submitMentorWork } from './mentor';
import { validEngram } from './fixtures';
import type { FacultySeed } from './schema';
import {
  analyzeProgress,
  applyWovenGrade,
  gradeWovenAssignment,
  weaveAssignments,
} from '../courseWeaver';
import { emptyProgress, type StudentCurriculumProgress } from '../gedCurriculum';

const NOW = new Date('2026-10-21T12:00:00Z');

// Same shape as the CourseWeaver suite's fixture: fractions struggling.
function progressWith(entries: Record<string, { score: number; attempts: number }>): StudentCurriculumProgress {
  const p = emptyProgress();
  for (const [code, e] of Object.entries(entries)) {
    p.lessonProgress[code] = {
      lessonCode: code, completed: e.score >= 60,
      quizScore: e.score, attempts: e.attempts,
      lastAttemptAt: NOW.toISOString(),
    };
  }
  return p;
}

const studentA = () => progressWith({
  'MATH.1.1': { score: 90, attempts: 1 },
  'MATH.2.1': { score: 30, attempts: 2 },
  'MATH.2.2': { score: 40, attempts: 2 },
  'MATH.5.1': { score: 88, attempts: 1 },
  'MATH.6.1': { score: 92, attempts: 1 },
});

// Hand-authored faculty fixture — never generated (generator only
// emits student/ambient). The slots themselves stay empty until the
// owner fills them; this is a test-local stand-in.
const mentor = (): FacultySeed =>
  validEngram({ id: 'faculty-test', kind: 'faculty', provenance: 'authored:test' }) as FacultySeed;

describe('assignMentorWork', () => {
  it('assigns audited coursework from the governed store / ItemForge weave', () => {
    const assignments = assignMentorWork(mentor(), {
      studentId: 'A', progress: studentA(), existing: [], now: NOW,
    });
    expect(assignments.length).toBeGreaterThan(0);
    // Weakest-first: fractions is the struggling skill.
    expect(assignments[0].skillNodeId).toBe('MATH.FRAC.002');
    for (const a of assignments) {
      expect(a.items.length).toBeGreaterThanOrEqual(3);
      for (const item of a.items) expect(item.id).toBeTruthy();
    }
  });

  it('rejects a generated peer as teacher', () => {
    const peer = validEngram({ id: 'npc-student-001', kind: 'student' });
    expect(() =>
      assignMentorWork(peer as unknown as FacultySeed, {
        studentId: 'A', progress: studentA(), existing: [], now: NOW,
      }),
    ).toThrow('only a faculty seed');
  });

  it('presents an assignment without inventing content', () => {
    const [assignment] = assignMentorWork(mentor(), {
      studentId: 'A', progress: studentA(), existing: [], now: NOW,
    });
    const message = mentorAssignmentMessage('Mentor', assignment);
    expect(message).toContain(assignment.title);
    expect(message).toContain(assignment.subject);
    expect(message).toContain(assignment.dueAt);
  });
});

describe('submitMentorWork — acceptance §9.2, end to end', () => {
  it('mentor chat → assignment → grade → same mastery record as portal work', () => {
    const progress = studentA();
    const [assignment] = assignMentorWork(mentor(), {
      studentId: 'A', progress, existing: [], now: NOW,
    });
    const allCorrect: Record<string, string> = {};
    for (const q of assignment.items) allCorrect[q.id] = q.answer;

    const result = submitMentorWork({ assignment, responses: allCorrect, progress, now: NOW });
    expect(result.scorePercent).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.assignment.status).toBe('completed');
    // The mastery record moved: fractions is no longer struggling.
    const frac = result.standings.find(s => s.skillNodeId === 'MATH.FRAC.002')!;
    expect(frac.status).toBe('mastered');
    // And the next mentor weave moves on, same as the portal loop.
    const next = assignMentorWork(mentor(), {
      studentId: 'A', progress, existing: [result.assignment], now: NOW,
    });
    expect(next[0]?.skillNodeId).not.toBe('MATH.FRAC.002');
  });

  it('mentor-path grading equals direct CourseWeaver grading, same inputs', () => {
    const [assignment] = assignMentorWork(mentor(), {
      studentId: 'A', progress: studentA(), existing: [], now: NOW,
    });
    const allCorrect: Record<string, string> = {};
    for (const q of assignment.items) allCorrect[q.id] = q.answer;

    const viaMentor = submitMentorWork({
      assignment, responses: allCorrect, progress: studentA(), now: NOW,
    });
    const direct = gradeWovenAssignment(assignment, allCorrect, NOW);
    const directProgress = studentA();
    applyWovenGrade(directProgress, direct.assignment);
    const directStandings = analyzeProgress(directProgress);

    expect(viaMentor.scorePercent).toBe(direct.scorePercent);
    expect(viaMentor.perItem).toEqual(direct.perItem);
    expect(JSON.stringify(viaMentor.standings)).toBe(JSON.stringify(directStandings));
  });

  it('a failing submission keeps the skill targeted', () => {
    const progress = studentA();
    const [assignment] = assignMentorWork(mentor(), {
      studentId: 'A', progress, existing: [], now: NOW,
    });
    const result = submitMentorWork({ assignment, responses: {}, progress, now: NOW });
    expect(result.scorePercent).toBe(0);
    const frac = result.standings.find(s => s.skillNodeId === 'MATH.FRAC.002')!;
    expect(frac.status).toBe('struggling');
  });
});
