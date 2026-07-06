/**
 * Phase 1: Student Profile Engine
 * Persistent learner identity tracking attempts, preferences, and cognitive patterns.
 */

import type { RepresentationType } from './skillGraph';
import type { AttemptOutcome, ErrorType } from './studentJournal';

export interface AttemptRecord {
  skillNode: string;
  representation: RepresentationType;
  outcome: AttemptOutcome;
  timestamp: string;
  timeSpentSeconds: number;
  errorType?: ErrorType;
}

export interface SkillProgress {
  skillNode: string;
  attempts: number;
  successes: number;
  averageTime: number;
  lastAttempt?: string;
  preferredRepresentation?: RepresentationType;
  frictionPoints: string[];
}

export interface StudentProfileData {
  studentId: string;
  displayName: string;
  createdAt: string;
  lastActiveAt: string;
  attempts: AttemptRecord[];
  representationBias: Record<RepresentationType, number>;
  skillProgress: Record<string, SkillProgress>;
  cognitiveTraits: CognitiveTraits;
  preferences: StudentPreferences;
}

export interface CognitiveTraits {
  patternRecognition: number;
  errorRecovery: number;
  synthesis: number;
  longFormReasoning: number;
  teachingOthers: number;
}

export interface StudentPreferences {
  preferredPace: 'slow' | 'moderate' | 'fast';
  preferredRepresentations: RepresentationType[];
  accessibilityProfile: string;
  language: string;
  sessionLengthMinutes: number;
}

const STORAGE_KEY = 'academy_profile';

export class StudentProfile {
  private data: StudentProfileData;

  constructor(studentId: string, displayName?: string) {
    const stored = this.load(studentId);
    if (stored) {
      this.data = stored;
      this.data.lastActiveAt = new Date().toISOString();
    } else {
      this.data = this.createDefault(studentId, displayName || 'Student');
    }
    this.save();
  }

  private createDefault(studentId: string, displayName: string): StudentProfileData {
    return {
      studentId,
      displayName,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      attempts: [],
      representationBias: {
        numeric: 0,
        verbal: 0,
        applied: 0,
        abstract: 0,
        graphical: 0,
        written: 0
      },
      skillProgress: {},
      cognitiveTraits: {
        patternRecognition: 0,
        errorRecovery: 0,
        synthesis: 0,
        longFormReasoning: 0,
        teachingOthers: 0
      },
      preferences: {
        preferredPace: 'moderate',
        preferredRepresentations: ['verbal', 'applied'],
        accessibilityProfile: 'default',
        language: 'en',
        sessionLengthMinutes: 30
      }
    };
  }

  private load(studentId: string): StudentProfileData | null {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${studentId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn('Failed to load profile:', e);
      return null;
    }
  }

  private save(): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${this.data.studentId}`, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save profile:', e);
    }
  }

  logAttempt(params: {
    skillNode: string;
    representation: RepresentationType;
    outcome: AttemptOutcome;
    timeSpentSeconds: number;
    errorType?: ErrorType;
  }): void {
    const record: AttemptRecord = {
      ...params,
      timestamp: new Date().toISOString()
    };
    this.data.attempts.push(record);
    
    if (params.outcome === 'success') {
      this.data.representationBias[params.representation] += 1;
    }
    
    this.updateSkillProgress(params);
    this.updateCognitiveTraits(params);
    this.data.lastActiveAt = new Date().toISOString();
    this.save();
  }

  private updateSkillProgress(params: {
    skillNode: string;
    representation: RepresentationType;
    outcome: AttemptOutcome;
    timeSpentSeconds: number;
    errorType?: ErrorType;
  }): void {
    const existing = this.data.skillProgress[params.skillNode];
    
    if (!existing) {
      this.data.skillProgress[params.skillNode] = {
        skillNode: params.skillNode,
        attempts: 1,
        successes: params.outcome === 'success' ? 1 : 0,
        averageTime: params.timeSpentSeconds,
        lastAttempt: new Date().toISOString(),
        preferredRepresentation: params.representation,
        frictionPoints: params.errorType && params.errorType !== 'none' ? [params.errorType] : []
      };
    } else {
      existing.attempts += 1;
      if (params.outcome === 'success') existing.successes += 1;
      existing.averageTime = (existing.averageTime * (existing.attempts - 1) + params.timeSpentSeconds) / existing.attempts;
      existing.lastAttempt = new Date().toISOString();
      
      if (params.outcome === 'success') {
        existing.preferredRepresentation = params.representation;
      }
      
      if (params.errorType && params.errorType !== 'none' && !existing.frictionPoints.includes(params.errorType)) {
        existing.frictionPoints.push(params.errorType);
      }
    }
  }

  private updateCognitiveTraits(params: {
    outcome: AttemptOutcome;
    errorType?: ErrorType;
    timeSpentSeconds: number;
  }): void {
    if (params.outcome === 'success' && params.errorType === 'none') {
      this.data.cognitiveTraits.patternRecognition += 0.1;
    }
    
    if (params.errorType && params.errorType !== 'none' && params.outcome === 'success') {
      this.data.cognitiveTraits.errorRecovery += 0.2;
    }
    
    for (const key of Object.keys(this.data.cognitiveTraits) as (keyof CognitiveTraits)[]) {
      this.data.cognitiveTraits[key] = Math.min(10, this.data.cognitiveTraits[key]);
    }
  }

  getSkillProgress(skillNode: string): SkillProgress | null {
    return this.data.skillProgress[skillNode] || null;
  }

  getSuccessRate(skillNode?: string): number {
    const attempts = skillNode
      ? this.data.attempts.filter(a => a.skillNode === skillNode)
      : this.data.attempts;
    
    if (attempts.length === 0) return 0;
    const successes = attempts.filter(a => a.outcome === 'success').length;
    return successes / attempts.length;
  }

  getPreferredRepresentation(): RepresentationType {
    const bias = this.data.representationBias;
    let max: RepresentationType = 'verbal';
    let maxValue = 0;
    
    for (const [rep, value] of Object.entries(bias) as [RepresentationType, number][]) {
      if (value > maxValue) {
        maxValue = value;
        max = rep;
      }
    }
    return max;
  }

  getStruggleAreas(): string[] {
    return Object.entries(this.data.skillProgress)
      .filter(([_, progress]) => {
        const rate = progress.attempts > 0 ? progress.successes / progress.attempts : 1;
        return rate < 0.5 && progress.attempts >= 3;
      })
      .map(([skillNode]) => skillNode);
  }

  getStrengthAreas(): string[] {
    return Object.entries(this.data.skillProgress)
      .filter(([_, progress]) => {
        const rate = progress.attempts > 0 ? progress.successes / progress.attempts : 0;
        return rate >= 0.8 && progress.attempts >= 3;
      })
      .map(([skillNode]) => skillNode);
  }

  getTotalAttempts(): number {
    return this.data.attempts.length;
  }

  getStudyTime(): number {
    return this.data.attempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0);
  }

  updatePreferences(updates: Partial<StudentPreferences>): void {
    this.data.preferences = { ...this.data.preferences, ...updates };
    this.save();
  }

  updateDisplayName(name: string): void {
    this.data.displayName = name;
    this.save();
  }

  getData(): StudentProfileData {
    return { ...this.data };
  }

  getStudentId(): string {
    return this.data.studentId;
  }

  getDisplayName(): string {
    return this.data.displayName;
  }

  exportToJSON(): string {
    return JSON.stringify(this.data, null, 2);
  }
}
