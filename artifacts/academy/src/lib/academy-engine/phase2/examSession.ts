/**
 * Phase 2: Exam Session Manager
 * Tracks responses, timing, and fatigue. Enables adaptive pacing.
 */

import type { GeneratedExam, ExamQuestion } from './proceduralExamEngine';
import type { AttemptOutcome } from '../phase1/studentJournal';

export type SessionStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'abandoned';

export interface QuestionResponse {
  questionId: string;
  skillNode: string;
  response: string;
  outcome?: AttemptOutcome;
  timeSpentSeconds: number;
  startedAt: string;
  submittedAt?: string;
  hintsViewed: number;
}

export interface SessionMetrics {
  totalTimeSeconds: number;
  questionsAnswered: number;
  questionsRemaining: number;
  averageTimePerQuestion: number;
  currentStreak: number;
  fatigueLevel: 'fresh' | 'moderate' | 'tired' | 'exhausted';
}

export interface ExamSessionData {
  id: string;
  examId: string;
  studentId: string;
  status: SessionStatus;
  startedAt: string;
  pausedAt?: string;
  completedAt?: string;
  responses: Record<string, QuestionResponse>;
  currentQuestionIndex: number;
  currentSectionIndex: number;
  totalPauseTime: number;
  metrics: SessionMetrics;
}

const STORAGE_KEY = 'academy_exam_session';
const FATIGUE_THRESHOLDS = {
  moderate: 15 * 60,
  tired: 30 * 60,
  exhausted: 45 * 60
};

export class ExamSession {
  private data: ExamSessionData;
  private exam: GeneratedExam;
  private questionStartTime: number | null = null;

  constructor(exam: GeneratedExam, studentId: string, existingSession?: ExamSessionData) {
    this.exam = exam;
    
    if (existingSession) {
      this.data = existingSession;
    } else {
      this.data = this.createNewSession(exam, studentId);
    }
  }

  private createNewSession(exam: GeneratedExam, studentId: string): ExamSessionData {
    return {
      id: `session-${Date.now()}`,
      examId: exam.id,
      studentId,
      status: 'not_started',
      startedAt: new Date().toISOString(),
      responses: {},
      currentQuestionIndex: 0,
      currentSectionIndex: 0,
      totalPauseTime: 0,
      metrics: {
        totalTimeSeconds: 0,
        questionsAnswered: 0,
        questionsRemaining: exam.totalQuestions,
        averageTimePerQuestion: 0,
        currentStreak: 0,
        fatigueLevel: 'fresh'
      }
    };
  }

  start(): void {
    if (this.data.status === 'not_started') {
      this.data.status = 'in_progress';
      this.data.startedAt = new Date().toISOString();
      this.startQuestion();
      this.save();
    } else if (this.data.status === 'paused') {
      this.resume();
    }
  }

  pause(): void {
    if (this.data.status === 'in_progress') {
      this.data.status = 'paused';
      this.data.pausedAt = new Date().toISOString();
      this.save();
    }
  }

  resume(): void {
    if (this.data.status === 'paused' && this.data.pausedAt) {
      const pauseDuration = (Date.now() - new Date(this.data.pausedAt).getTime()) / 1000;
      this.data.totalPauseTime += pauseDuration;
      this.data.status = 'in_progress';
      delete this.data.pausedAt;
      this.save();
    }
  }

  private startQuestion(): void {
    this.questionStartTime = Date.now();
  }

  getCurrentQuestion(): ExamQuestion | null {
    const section = this.exam.sections[this.data.currentSectionIndex];
    if (!section) return null;
    return section.questions[this.data.currentQuestionIndex] || null;
  }

  getCurrentSection(): { name: string; index: number; total: number } | null {
    const section = this.exam.sections[this.data.currentSectionIndex];
    if (!section) return null;
    return {
      name: section.name,
      index: this.data.currentSectionIndex,
      total: this.exam.sections.length
    };
  }

  submitResponse(response: string, outcome?: AttemptOutcome): QuestionResponse | null {
    const question = this.getCurrentQuestion();
    if (!question || this.data.status !== 'in_progress') return null;
    
    const timeSpent = this.questionStartTime 
      ? (Date.now() - this.questionStartTime) / 1000 
      : 0;
    
    const responseData: QuestionResponse = {
      questionId: question.id,
      skillNode: question.skillNode,
      response,
      outcome,
      timeSpentSeconds: timeSpent,
      startedAt: new Date(this.questionStartTime || Date.now()).toISOString(),
      submittedAt: new Date().toISOString(),
      hintsViewed: 0
    };
    
    this.data.responses[question.id] = responseData;
    this.updateMetrics(responseData);
    this.advanceToNextQuestion();
    this.save();
    
    return responseData;
  }

  recordHintViewed(): void {
    const question = this.getCurrentQuestion();
    if (question && this.data.responses[question.id]) {
      this.data.responses[question.id].hintsViewed++;
      this.save();
    }
  }

  private updateMetrics(response: QuestionResponse): void {
    this.data.metrics.questionsAnswered++;
    this.data.metrics.questionsRemaining--;
    this.data.metrics.totalTimeSeconds += response.timeSpentSeconds;
    this.data.metrics.averageTimePerQuestion = 
      this.data.metrics.totalTimeSeconds / this.data.metrics.questionsAnswered;
    
    if (response.outcome === 'success') {
      this.data.metrics.currentStreak++;
    } else {
      this.data.metrics.currentStreak = 0;
    }
    
    this.updateFatigueLevel();
  }

  private updateFatigueLevel(): void {
    const time = this.data.metrics.totalTimeSeconds;
    
    if (time >= FATIGUE_THRESHOLDS.exhausted) {
      this.data.metrics.fatigueLevel = 'exhausted';
    } else if (time >= FATIGUE_THRESHOLDS.tired) {
      this.data.metrics.fatigueLevel = 'tired';
    } else if (time >= FATIGUE_THRESHOLDS.moderate) {
      this.data.metrics.fatigueLevel = 'moderate';
    } else {
      this.data.metrics.fatigueLevel = 'fresh';
    }
  }

  private advanceToNextQuestion(): void {
    const currentSection = this.exam.sections[this.data.currentSectionIndex];
    
    if (this.data.currentQuestionIndex < currentSection.questions.length - 1) {
      this.data.currentQuestionIndex++;
    } else if (this.data.currentSectionIndex < this.exam.sections.length - 1) {
      this.data.currentSectionIndex++;
      this.data.currentQuestionIndex = 0;
    } else {
      this.complete();
      return;
    }
    
    this.startQuestion();
  }

  private complete(): void {
    this.data.status = 'completed';
    this.data.completedAt = new Date().toISOString();
  }

  abandon(): void {
    this.data.status = 'abandoned';
    this.data.completedAt = new Date().toISOString();
    this.save();
  }

  getProgress(): {
    currentQuestion: number;
    totalQuestions: number;
    currentSection: number;
    totalSections: number;
    percentComplete: number;
  } {
    let answered = 0;
    for (let s = 0; s < this.data.currentSectionIndex; s++) {
      answered += this.exam.sections[s].questions.length;
    }
    answered += this.data.currentQuestionIndex;
    
    return {
      currentQuestion: this.data.currentQuestionIndex + 1,
      totalQuestions: this.exam.totalQuestions,
      currentSection: this.data.currentSectionIndex + 1,
      totalSections: this.exam.sections.length,
      percentComplete: (answered / this.exam.totalQuestions) * 100
    };
  }

  shouldSuggestBreak(): boolean {
    return this.data.metrics.fatigueLevel === 'tired' || 
           this.data.metrics.fatigueLevel === 'exhausted';
  }

  getBreakSuggestion(): string {
    if (this.data.metrics.fatigueLevel === 'exhausted') {
      return 'You\'ve been working hard. Consider taking a longer break to recharge.';
    } else if (this.data.metrics.fatigueLevel === 'tired') {
      return 'A short break might help you focus better.';
    }
    return '';
  }

  getMetrics(): SessionMetrics {
    return { ...this.data.metrics };
  }

  getStatus(): SessionStatus {
    return this.data.status;
  }

  getData(): ExamSessionData {
    return { ...this.data };
  }

  getAllResponses(): QuestionResponse[] {
    return Object.values(this.data.responses);
  }

  private save(): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${this.data.studentId}`, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save exam session:', e);
    }
  }

  static load(exam: GeneratedExam, studentId: string): ExamSession | null {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${studentId}`);
      if (stored) {
        const data = JSON.parse(stored) as ExamSessionData;
        if (data.examId === exam.id && data.status !== 'completed') {
          return new ExamSession(exam, studentId, data);
        }
      }
    } catch (e) {
      console.warn('Failed to load exam session:', e);
    }
    return null;
  }
}
