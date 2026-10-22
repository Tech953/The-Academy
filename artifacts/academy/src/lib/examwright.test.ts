/**
 * Examwright tests — Phase 6 acceptance.
 *
 * Acceptance (roadmap Phase 6): full-length exams assemble at the
 * official volumes (RLA 46 / Math 46 / Science 34 / SS 35) within the
 * Auditor's domain-mix tolerances; sittings run the official clock
 * (150/115/90/70 min); grading runs the Phase 2 engine and reports on
 * the gedScale with ER labeled simulated; grades record through the
 * same attempt path as lesson quizzes so standings respond.
 */
import { describe, it, expect } from 'vitest';
import {
  EXAM_SPECS, EXAM_SUBJECTS, assembleExam, gradeExam, applyExamGrade,
  examRecordEntries, examDomainFor, examSeed,
  startTimer, remainingMs, timerExpired, formatRemaining,
} from './examwright';
import { auditStore } from './auditor';
import { analyzeProgress } from './courseWeaver';
import { emptyProgress } from './gedCurriculum';
import type { GEDSubjectKey } from '@shared/schema';

const STUDENT_A = 'alice';
const STUDENT_B = 'bob';

function modelAnswers(exam: ReturnType<typeof assembleExam>, fraction = 1): Record<string, string> {
  // Answer every item with its model answer, then spoil a tail slice
  // to hit the requested fraction of objective credit.
  const responses: Record<string, string> = {};
  const objective = exam.items.filter(q => q.type !== 'extended_response');
  const spoilCount = Math.round(objective.length * (1 - fraction));
  objective.forEach((q, i) => {
    responses[q.id] = i >= objective.length - spoilCount ? 'definitely wrong' : q.answer;
  });
  const er = exam.items.find(q => q.type === 'extended_response');
  if (er) {
    responses[er.id] = [
      'The second text presents the stronger argument because its evidence is more convincing and better supported by specific examples.',
      '',
      'First, the second text gives concrete data, and furthermore it addresses the opposing view directly. However, the first text relies on general claims, while the second text shows exactly how the policy works in practice.',
      '',
      'In conclusion, the stronger case is the one grounded in evidence rather than assertion, and therefore it should be adopted.',
    ].join('\n');
  }
  return responses;
}

describe('official specs', () => {
  it('carries the official durations and volumes', () => {
    expect(EXAM_SPECS['Language Arts'].durationMinutes).toBe(150);
    expect(EXAM_SPECS['Mathematical Reasoning'].durationMinutes).toBe(115);
    expect(EXAM_SPECS['Science'].durationMinutes).toBe(90);
    expect(EXAM_SPECS['Social Studies'].durationMinutes).toBe(70);
    expect(EXAM_SPECS['Language Arts'].volume).toBe(46);
    expect(EXAM_SPECS['Mathematical Reasoning'].volume).toBe(46);
    expect(EXAM_SPECS['Science'].volume).toBe(34);
    expect(EXAM_SPECS['Social Studies'].volume).toBe(35);
  });
});

describe('assembly', () => {
  it('hits official volume for all four subjects', () => {
    for (const subject of EXAM_SUBJECTS) {
      const exam = assembleExam(STUDENT_A, subject, 1);
      expect(exam.items.length, subject).toBe(EXAM_SPECS[subject].volume);
      expect(new Set(exam.items.map(q => q.id)).size, subject).toBe(exam.items.length);
      expect(exam.durationMinutes).toBe(EXAM_SPECS[subject].durationMinutes);
      expect(exam.missingDomains, subject).toEqual([]);
    }
  });

  it('holds the Auditor mix tolerances (Math quant/alg, RLA literary)', () => {
    const math = assembleExam(STUDENT_A, 'Mathematical Reasoning', 1);
    const quant = math.items.filter(q => ['Basic Math', 'Geometry'].includes(examDomainFor(math.subject, q.gedCode)!)).length;
    const quantPct = (quant / math.items.length) * 100;
    expect(Math.abs(quantPct - 45)).toBeLessThanOrEqual(12);
    expect(Math.abs((100 - quantPct) - 55)).toBeLessThanOrEqual(12);

    const rla = assembleExam(STUDENT_A, 'Language Arts', 1);
    const info = rla.items.filter(q => examDomainFor(rla.subject, q.gedCode) === 'Reading — Informational').length;
    const lit = rla.items.filter(q => examDomainFor(rla.subject, q.gedCode) === 'Reading — Literary').length;
    const litShare = (lit / (info + lit)) * 100;
    expect(Math.abs(litShare - 25)).toBeLessThanOrEqual(12);
  });

  it('carries exactly one extended response, last, in RLA', () => {
    const rla = assembleExam(STUDENT_A, 'Language Arts', 1);
    const ers = rla.items.filter(q => q.type === 'extended_response');
    expect(ers.length).toBe(1);
    expect(rla.items[rla.items.length - 1].type).toBe('extended_response');
  });

  it('reports strata honestly against the bank', () => {
    for (const subject of EXAM_SUBJECTS) {
      const exam = assembleExam(STUDENT_A, subject, 1);
      for (const s of exam.strata) {
        if (s.quota === 0) continue;
        if (s.bankAvailable >= s.quota) {
          expect(s.drawn, `${subject}/${s.domain}`).toBe(s.quota);
          expect(s.shortfall).toBe(false);
        } else {
          // Bank smaller than the blueprint quota: draw what exists
          // and REPORT the shortfall — never invent items.
          expect(s.drawn, `${subject}/${s.domain}`).toBe(s.bankAvailable);
          expect(s.shortfall).toBe(true);
        }
      }
    }
    // Known case: the SS bank holds 12 Civics & Government items
    // against a 15-item blueprint quota (50% of 35, rounded) — the
    // shortfall must surface on the assembled exam, and the exam
    // still fills its official volume from the wider SS bank.
    const ss = assembleExam(STUDENT_A, 'Social Studies', 1);
    const civics = ss.strata.find(s => s.domain === 'Civics & Government')!;
    expect(civics.shortfall).toBe(true);
    expect(civics.drawn).toBe(12);
    expect(ss.items.length).toBe(35);
  });

  it('is deterministic per student seed and divergent across students', () => {
    for (const subject of EXAM_SUBJECTS) {
      const a1 = assembleExam(STUDENT_A, subject, 1);
      const a2 = assembleExam(STUDENT_A, subject, 1);
      expect(a1.items.map(q => q.id)).toEqual(a2.items.map(q => q.id));
      expect(a1.seed).toBe(examSeed(STUDENT_A, subject, 1));

      const b1 = assembleExam(STUDENT_B, subject, 1);
      const overlap = a1.items.filter(q => b1.items.some(o => o.id === q.id)).length;
      expect(overlap, subject).toBeLessThan(a1.items.length);

      const aNext = assembleExam(STUDENT_A, subject, 2);
      expect(aNext.items.map(q => q.id)).not.toEqual(a1.items.map(q => q.id));
    }
  });

  it('the Auditor still passes the unchanged bank', () => {
    expect(auditStore().acceptance.overall).toBe(true);
  });
});

describe('timer', () => {
  it('runs the official clock as pure functions', () => {
    const exam = assembleExam(STUDENT_A, 'Science', 1);
    const t0 = new Date('2026-10-22T12:00:00Z');
    const timer = startTimer(exam, t0);
    expect(timer.durationMs).toBe(90 * 60 * 1000);
    expect(remainingMs(timer, t0)).toBe(90 * 60 * 1000);
    expect(remainingMs(timer, new Date(t0.getTime() + 30 * 60 * 1000))).toBe(60 * 60 * 1000);
    expect(timerExpired(timer, new Date(t0.getTime() + 89 * 60 * 1000))).toBe(false);
    expect(timerExpired(timer, new Date(t0.getTime() + 90 * 60 * 1000))).toBe(true);
    expect(remainingMs(timer, new Date(t0.getTime() + 120 * 60 * 1000))).toBe(0);
    expect(formatRemaining(90 * 60 * 1000)).toBe('1:30:00');
    expect(formatRemaining(65 * 1000)).toBe('1:05');
    expect(formatRemaining(9 * 1000)).toBe('0:09');
  });
});

describe('grading', () => {
  it('grades a perfect objective paper to 100 and the top band', () => {
    const exam = assembleExam(STUDENT_A, 'Mathematical Reasoning', 1);
    const result = gradeExam(exam, modelAnswers(exam, 1), new Date());
    expect(result.scorePercent).toBe(100);
    expect(result.scaledScore).toBe(200);
    expect(result.band).toBe('College Ready + Credit');
    expect(result.perDomain.reduce((s, d) => s + d.items, 0)).toBe(46);
  });

  it('grades a zero paper to 100 scaled / Below Passing', () => {
    const exam = assembleExam(STUDENT_A, 'Science', 1);
    const result = gradeExam(exam, {}, new Date());
    expect(result.scorePercent).toBe(0);
    expect(result.scaledScore).toBe(100);
    expect(result.band).toBe('Below Passing');
  });

  it('maps a passing paper onto the gedScale anchors', () => {
    const exam = assembleExam(STUDENT_A, 'Social Studies', 1);
    const result = gradeExam(exam, modelAnswers(exam, 0.6), new Date());
    expect(result.scorePercent).toBeGreaterThanOrEqual(55);
    expect(result.scorePercent).toBeLessThanOrEqual(65);
    expect(result.scaledScore).toBeGreaterThanOrEqual(140);
    expect(result.scaledScore).toBeLessThanOrEqual(150);
  });

  it('scores the RLA extended response through the simulated rubric, labeled', () => {
    const exam = assembleExam(STUDENT_A, 'Language Arts', 1);
    const result = gradeExam(exam, modelAnswers(exam, 1), new Date());
    expect(result.extendedResponse).not.toBeNull();
    expect(result.extendedResponse!.simulated).toBe(true);
    expect(result.extendedResponse!.total).toBeGreaterThanOrEqual(4); // model essay clears the pass bar
    expect(result.extendedResponse!.maxTotal).toBe(7);
    // Non-RLA exams carry no ER block.
    const math = assembleExam(STUDENT_A, 'Mathematical Reasoning', 1);
    expect(gradeExam(math, {}, new Date()).extendedResponse).toBeNull();
  });
});

describe('loop closure', () => {
  it('applyExamGrade records through the quiz path and moves standings', () => {
    const subject: GEDSubjectKey = 'Mathematical Reasoning';
    const fresh = emptyProgress();
    const before = analyzeProgress(fresh);
    expect(before.every(s => s.status === 'unseen')).toBe(true);

    const exam = assembleExam(STUDENT_A, subject, 1);
    const result = gradeExam(exam, modelAnswers(exam, 1), new Date());
    const applied = applyExamGrade(fresh, result);
    expect(applied.recordedLessons.length).toBeGreaterThan(0);
    expect(applied.passed).toBe(true);

    // Entries only ever anchor on real lesson codes.
    const lessonCodes = new Set(examRecordEntries(result).map(e => e.lessonCode));
    for (const code of lessonCodes) {
      expect(fresh.lessonProgress[code]?.attempts).toBeGreaterThanOrEqual(1);
    }
    // Standings respond: the recorded skills are no longer unseen.
    const after = analyzeProgress(fresh);
    const recordedSkills = new Set(examRecordEntries(result).map(e => e.skillNodeId));
    for (const skill of recordedSkills) {
      const standing = after.find(s => s.skillNodeId === skill);
      if (standing) expect(standing.status).not.toBe('unseen');
    }
  });

  it('a failing exam records the evidence too (standings show struggle)', () => {
    const progress = emptyProgress();
    const exam = assembleExam(STUDENT_A, 'Science', 1);
    const result = gradeExam(exam, {}, new Date());
    const applied = applyExamGrade(progress, result);
    expect(applied.passed).toBe(false);
    const entries = examRecordEntries(result);
    for (const e of entries) {
      expect(progress.lessonProgress[e.lessonCode]?.quizScore ?? 0).toBe(0);
      // Two skills may anchor on the same lesson, so attempts ≥ 1.
      expect(progress.lessonProgress[e.lessonCode]?.attempts).toBeGreaterThanOrEqual(1);
    }
  });
});
