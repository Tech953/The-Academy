/**
 * Phase 2: Mastery Signal Extractor
 * Infers learning signals from behavior, not scores.
 * Observes patterns over time without grading.
 */

import type { RepresentationType } from '../phase1/skillGraph';
import type { AttemptOutcome } from '../phase1/studentJournal';

export type MasteryState = 'insufficient_data' | 'fragile' | 'emerging' | 'stable';

export interface MasterySignal {
  skillNode: string;
  state: MasteryState;
  successes: number;
  struggles: number;
  representations: Set<RepresentationType>;
  timeHistory: number[];
  lastUpdated: string;
  transferSuccess: boolean;
  explanationQuality?: number;
}

export interface MasterySnapshot {
  studentId: string;
  timestamp: string;
  signals: Record<string, MasterySignal>;
}

const STORAGE_KEY = 'academy_mastery';

export class MasterySignalExtractor {
  private signals: Map<string, MasterySignal> = new Map();
  private studentId: string;

  constructor(studentId: string) {
    this.studentId = studentId;
    this.load();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${this.studentId}`);
      if (stored) {
        const data = JSON.parse(stored);
        this.signals = new Map(
          Object.entries(data).map(([key, value]: [string, any]) => [
            key,
            { ...value, representations: new Set(value.representations) }
          ])
        );
      }
    } catch (e) {
      console.warn('Failed to load mastery signals:', e);
    }
  }

  private save(): void {
    try {
      const data: Record<string, any> = {};
      this.signals.forEach((signal, key) => {
        data[key] = {
          ...signal,
          representations: Array.from(signal.representations)
        };
      });
      localStorage.setItem(`${STORAGE_KEY}_${this.studentId}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save mastery signals:', e);
    }
  }

  logAttempt(params: {
    skillNode: string;
    outcome: AttemptOutcome;
    representation: RepresentationType;
    timeSpent: number;
    transferContext?: boolean;
    explanationGiven?: boolean;
  }): MasteryState {
    const existing = this.signals.get(params.skillNode);
    
    if (!existing) {
      const newSignal: MasterySignal = {
        skillNode: params.skillNode,
        state: 'insufficient_data',
        successes: params.outcome === 'success' ? 1 : 0,
        struggles: params.outcome === 'struggle' ? 1 : 0,
        representations: new Set([params.representation]),
        timeHistory: [params.timeSpent],
        lastUpdated: new Date().toISOString(),
        transferSuccess: params.transferContext && params.outcome === 'success' || false
      };
      this.signals.set(params.skillNode, newSignal);
    } else {
      if (params.outcome === 'success') {
        existing.successes += 1;
      } else if (params.outcome === 'struggle') {
        existing.struggles += 1;
      }
      
      existing.representations.add(params.representation);
      existing.timeHistory.push(params.timeSpent);
      if (existing.timeHistory.length > 20) {
        existing.timeHistory = existing.timeHistory.slice(-20);
      }
      
      existing.lastUpdated = new Date().toISOString();
      
      if (params.transferContext && params.outcome === 'success') {
        existing.transferSuccess = true;
      }
      
      if (params.explanationGiven && params.outcome === 'success') {
        existing.explanationQuality = (existing.explanationQuality || 0) + 1;
      }
    }
    
    const state = this.infer(params.skillNode);
    this.save();
    return state;
  }

  infer(skillNode: string): MasteryState {
    const signal = this.signals.get(skillNode);
    if (!signal) return 'insufficient_data';
    
    const totalAttempts = signal.successes + signal.struggles;
    if (totalAttempts < 3) return 'insufficient_data';
    
    const successRate = signal.successes / totalAttempts;
    const hasMultipleRepresentations = signal.representations.size >= 2;
    const hasTransfer = signal.transferSuccess;
    const hasExplanation = (signal.explanationQuality || 0) >= 1;
    
    if (successRate >= 0.8 && hasMultipleRepresentations && (hasTransfer || hasExplanation)) {
      signal.state = 'stable';
    } else if (successRate >= 0.6 && signal.successes >= 3) {
      signal.state = 'emerging';
    } else if (successRate < 0.4 && totalAttempts >= 5) {
      signal.state = 'fragile';
    } else {
      signal.state = 'emerging';
    }
    
    return signal.state;
  }

  getSignal(skillNode: string): MasterySignal | undefined {
    return this.signals.get(skillNode);
  }

  getAllSignals(): Record<string, MasterySignal> {
    const result: Record<string, MasterySignal> = {};
    this.signals.forEach((signal, key) => {
      result[key] = { ...signal, representations: new Set(signal.representations) };
    });
    return result;
  }

  getSnapshot(): MasterySnapshot {
    return {
      studentId: this.studentId,
      timestamp: new Date().toISOString(),
      signals: this.getAllSignals()
    };
  }

  getStableSkills(): string[] {
    return Array.from(this.signals.entries())
      .filter(([_, signal]) => signal.state === 'stable')
      .map(([skillNode]) => skillNode);
  }

  getFragileSkills(): string[] {
    return Array.from(this.signals.entries())
      .filter(([_, signal]) => signal.state === 'fragile')
      .map(([skillNode]) => skillNode);
  }

  getEmergingSkills(): string[] {
    return Array.from(this.signals.entries())
      .filter(([_, signal]) => signal.state === 'emerging')
      .map(([skillNode]) => skillNode);
  }

  getTimeConsistency(skillNode: string): number {
    const signal = this.signals.get(skillNode);
    if (!signal || signal.timeHistory.length < 3) return 0;
    
    const times = signal.timeHistory;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    
    const cv = stdDev / avg;
    return Math.max(0, 1 - cv);
  }

  getOverallProgress(): {
    stable: number;
    emerging: number;
    fragile: number;
    insufficient: number;
  } {
    const counts = { stable: 0, emerging: 0, fragile: 0, insufficient: 0 };
    
    this.signals.forEach(signal => {
      switch (signal.state) {
        case 'stable': counts.stable++; break;
        case 'emerging': counts.emerging++; break;
        case 'fragile': counts.fragile++; break;
        default: counts.insufficient++; break;
      }
    });
    
    return counts;
  }
}
