/**
 * GED Curriculum Progression Bridge
 * Connects lesson completion and quiz performance to:
 *   - Character stat bonuses
 *   - XP awards
 *   - GED readiness scoring
 *   - Skill graph node mastery
 */
import type {
  GEDSubjectKey,
  StudentCurriculumProgress,
  LessonProgress,
  ChapterProgress,
  SubjectProgress,
  GEDTextbook,
  GEDLesson,
} from '@shared/schema';
import { KAPLAN_GED_CURRICULUM, RLA_TEXTBOOK, SS_TEXTBOOK, SCIENCE_TEXTBOOK } from './gedCurriculumData';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const XP_PER_LESSON_COMPLETE = 25;
export const XP_PER_LESSON_QUIZ_PASS = 50;   // score ≥ 60
export const XP_PER_CHAPTER_MASTER  = 200;
export const XP_PER_SUBJECT_READY   = 500;
export const PASSING_QUIZ_SCORE     = 60;
export const MASTERY_QUIZ_SCORE     = 80;

/** Which character stats each subject improves */
export const SUBJECT_STAT_MAP: Record<GEDSubjectKey, Array<{ stat: string; gain: number }>> = {
  'Mathematical Reasoning': [
    { stat: 'mathLogic',   gain: 3 },
    { stat: 'intuition',   gain: 1 },
  ],
  'Language Arts': [
    { stat: 'linguistic',  gain: 3 },
    { stat: 'presence',    gain: 1 },
  ],
  'Science': [
    { stat: 'mathLogic',   gain: 2 },
    { stat: 'endurance',   gain: 1 },
  ],
  'Social Studies': [
    { stat: 'fortitude',   gain: 2 },
    { stat: 'presence',    gain: 1 },
  ],
};

/** GED assessment codes mapped to skill graph node IDs */
export const GED_CODE_TO_SKILL: Record<string, string> = {
  'MATH.3.1': 'MATH.RATIO.003',
  'MATH.3.2': 'MATH.PERC.004',
  'MATH.5.1': 'MATH.ALGE.005',
  'MATH.5.4': 'MATH.ALGE.005',
  'MATH.6.1': 'MATH.LINEQ.006',
  'MATH.6.7': 'MATH.LINEQ.006',
  'MATH.7.3': 'MATH.GEOM.008',
  'MATH.7.4': 'MATH.AREA.009',
  'RLA.1.1':  'LANG.MAIN.002',
  'RLA.1.2':  'LANG.MAIN.002',
  'RLA.1.4':  'REAS.CRIT.001',
  'RLA.1.5':  'LANG.INFER.003',
  'RLA.2.1':  'LANG.INFER.003',
  'RLA.2.2':  'LANG.ARG.009',
  'RLA.4.1':  'LANG.SENT.006',
  'RLA.4.2':  'LANG.SENT.006',
  'RLA.4.6':  'LANG.SENT.006',
  'RLA.8.1':  'LANG.GRAM.005',
  'RLA.8.3':  'LANG.GRAM.005',
  'RLA.9.1':  'LANG.GRAM.005',
  'SS.2.1':   'SOC.USHIST.001',
  'SS.2.3':   'SOC.USHIST.001',
  'SS.3.2':   'SOC.CIV.002',
  'SS.4.1':   'SOC.ECON.003',
  'SCI.1.2':  'SCI.SCI.001',
  'SCI.1.5':  'MATH.STAT.011',
  'SCI.2.1':  'SCI.LIFE.003',
  'SCI.2.5':  'SCI.LIFE.003',
  'SCI.3.3':  'SCI.EARTH.005',
  'SCI.4.1':  'SCI.PHYS.004',
  'SCI.4.5':  'SCI.PHYS.004',
};

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function emptyProgress(): StudentCurriculumProgress {
  return {
    lessonProgress: {},
    chapterProgress: {},
    totalXpEarned: 0,
    lastStudiedAt: new Date().toISOString(),
  };
}

export function getLessonProgress(
  progress: StudentCurriculumProgress,
  lessonCode: string
): LessonProgress {
  return progress.lessonProgress[lessonCode] ?? {
    lessonCode,
    completed: false,
    attempts: 0,
  };
}

/**
 * Record a quiz attempt. Returns the XP earned and any stat bonuses.
 */
export function recordQuizAttempt(
  progress: StudentCurriculumProgress,
  lessonCode: string,
  scorePercent: number,
  subject: GEDSubjectKey
): { xpEarned: number; statBonuses: Array<{ stat: string; gain: number }>; passed: boolean } {
  const lp = getLessonProgress(progress, lessonCode);
  const wasAlreadyComplete = lp.completed;
  const passed = scorePercent >= PASSING_QUIZ_SCORE;
  let xp = 0;
  const bonuses: Array<{ stat: string; gain: number }> = [];

  lp.attempts += 1;
  lp.lastAttemptAt = new Date().toISOString();

  if (!wasAlreadyComplete) {
    xp += XP_PER_LESSON_COMPLETE;
    lp.completed = true;
  }

  if (passed && (!lp.quizScore || scorePercent > lp.quizScore)) {
    if (!lp.quizScore || lp.quizScore < PASSING_QUIZ_SCORE) {
      xp += XP_PER_LESSON_QUIZ_PASS;
      const subjectBonuses = SUBJECT_STAT_MAP[subject];
      subjectBonuses.forEach(b => bonuses.push({ stat: b.stat, gain: Math.ceil(b.gain * (scorePercent / 100)) }));
    }
    lp.quizScore = Math.max(lp.quizScore ?? 0, scorePercent);
  }

  progress.lessonProgress[lessonCode] = lp;
  progress.totalXpEarned += xp;
  progress.lastStudiedAt = new Date().toISOString();

  return { xpEarned: xp, statBonuses: bonuses, passed };
}

/**
 * Compute chapter progress from lesson progress data.
 */
export function computeChapterProgress(
  progress: StudentCurriculumProgress,
  chapterKey: string,
  lessons: GEDLesson[]
): ChapterProgress {
  const lessonCodes = lessons.map(l => l.gedCode);
  const completed = lessonCodes.filter(c => progress.lessonProgress[c]?.completed).length;
  const scores = lessonCodes
    .map(c => progress.lessonProgress[c]?.quizScore ?? 0)
    .filter(s => s > 0);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const mastered = completed === lessons.length && avg >= PASSING_QUIZ_SCORE;

  return {
    chapterKey,
    lessonsCompleted: completed,
    totalLessons: lessons.length,
    bestQuizAverage: avg,
    mastered,
  };
}

/**
 * Compute per-subject GED readiness score (0–100).
 * Formula: weighted average of chapter mastery × completion rate.
 */
export function computeSubjectProgress(
  progress: StudentCurriculumProgress,
  textbook: GEDTextbook
): SubjectProgress {
  const chaptersWithLessons = textbook.chapters.filter(c => (c.lessons?.length ?? 0) > 0);
  if (chaptersWithLessons.length === 0) {
    return {
      subject: textbook.subject,
      chaptersCompleted: 0,
      totalChapters: textbook.chapters.length,
      readinessScore: 0,
      passReady: false,
    };
  }

  let weightedSum = 0;
  let chaptersCompleted = 0;

  for (const chapter of chaptersWithLessons) {
    const lessons = chapter.lessons ?? [];
    const key = `${textbook.subject.slice(0, 4).toUpperCase()}.Ch${chapter.number}`;
    const cp = computeChapterProgress(progress, key, lessons);
    const completionRate = lessons.length > 0 ? cp.lessonsCompleted / lessons.length : 0;
    const chapterScore = cp.bestQuizAverage * completionRate;
    weightedSum += chapterScore;
    if (cp.mastered) chaptersCompleted++;
  }

  const readinessScore = Math.round(weightedSum / chaptersWithLessons.length);

  return {
    subject: textbook.subject,
    chaptersCompleted,
    totalChapters: textbook.chapters.length,
    readinessScore,
    passReady: readinessScore >= 70,
  };
}

/**
 * Compute readiness for all 4 subjects.
 */
export function computeAllSubjectProgress(
  progress: StudentCurriculumProgress
): SubjectProgress[] {
  return KAPLAN_GED_CURRICULUM.map(book => computeSubjectProgress(progress, book));
}

/**
 * Get a "GED Diploma Readiness" composite score (0–100).
 */
export function getOverallGEDReadiness(progress: StudentCurriculumProgress): number {
  const subjects = computeAllSubjectProgress(progress);
  if (!subjects.length) return 0;
  return Math.round(subjects.reduce((sum, s) => sum + s.readinessScore, 0) / subjects.length);
}

/**
 * Returns the next recommended lesson code for a given subject,
 * prioritizing incomplete lessons over repeated ones.
 */
export function getNextRecommendedLesson(
  progress: StudentCurriculumProgress,
  textbook: GEDTextbook
): { chapterTitle: string; lesson: GEDLesson } | null {
  for (const chapter of textbook.chapters) {
    for (const lesson of (chapter.lessons ?? [])) {
      const lp = progress.lessonProgress[lesson.gedCode];
      if (!lp?.completed || (lp.quizScore ?? 0) < MASTERY_QUIZ_SCORE) {
        return { chapterTitle: chapter.title, lesson };
      }
    }
  }
  return null;
}

/**
 * Returns the subject name for a lesson code.
 */
export function subjectForLessonCode(lessonCode: string): GEDSubjectKey | null {
  for (const book of KAPLAN_GED_CURRICULUM) {
    for (const ch of book.chapters) {
      for (const l of (ch.lessons ?? [])) {
        if (l.gedCode === lessonCode) return book.subject;
      }
    }
  }
  return null;
}

/**
 * Returns a human-readable mastery label for a quiz score.
 */
export function masteryLabel(score: number): string {
  if (score >= 90) return 'MASTERED';
  if (score >= 80) return 'PROFICIENT';
  if (score >= 60) return 'PASSING';
  if (score > 0)   return 'NEEDS WORK';
  return 'NOT STARTED';
}

export function masteryColor(score: number): string {
  if (score >= 90) return '#00ff00';
  if (score >= 80) return '#88ff44';
  if (score >= 60) return '#ffaa00';
  if (score > 0)   return '#ff6644';
  return '#555';
}

/** Subject display metadata */
export const SUBJECT_META: Record<GEDSubjectKey, { icon: string; abbr: string; color: string }> = {
  'Mathematical Reasoning': { icon: '∑', abbr: 'MATH', color: '#44aaff' },
  'Language Arts':          { icon: 'Aa', abbr: 'RLA',  color: '#ffaa44' },
  'Science':                { icon: '⚗', abbr: 'SCI',  color: '#44ff88' },
  'Social Studies':         { icon: '⊕', abbr: 'SOC',  color: '#ff88cc' },
};

/** All textbooks for iteration */
export { KAPLAN_GED_CURRICULUM };
