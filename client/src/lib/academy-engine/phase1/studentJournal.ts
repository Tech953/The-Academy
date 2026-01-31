/**
 * Phase 1: Student Research Journals
 * Persistent, searchable, player-owned knowledge artifacts.
 * Captures how a student thinks, not just what they answer.
 */

import type { RepresentationType } from './skillGraph';

export type JournalEntryType = 'attempt' | 'reflection' | 'hypothesis' | 'confusion' | 'milestone';
export type AttemptOutcome = 'success' | 'partial' | 'struggle';
export type ErrorType = 'none' | 'conceptual' | 'procedural' | 'transfer' | 'careless';

export interface JournalEntry {
  id: string;
  timestamp: string;
  studentId: string;
  type: JournalEntryType;
  skillNode?: string;
  problemSeed?: number;
  attemptNumber?: number;
  outcome?: AttemptOutcome;
  timeToSolutionSeconds?: number;
  representation?: RepresentationType;
  errorType?: ErrorType;
  studentResponse?: string;
  systemObservations?: string[];
  reflectionPrompts?: string[];
  tags: string[];
}

export interface JournalSearchParams {
  skillNode?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  type?: JournalEntryType;
  outcome?: AttemptOutcome;
}

export interface JournalStats {
  totalEntries: number;
  successRate: number;
  averageTimeSeconds: number;
  mostActiveSkills: Array<{ skill: string; count: number }>;
  recentActivity: JournalEntry[];
}

const STORAGE_KEY = 'academy_journal';

export class StudentJournal {
  private entries: JournalEntry[] = [];
  private studentId: string;

  constructor(studentId: string) {
    this.studentId = studentId;
    this.load();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${this.studentId}`);
      if (stored) {
        this.entries = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load journal:', e);
    }
  }

  private save(): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${this.studentId}`, JSON.stringify(this.entries));
    } catch (e) {
      console.warn('Failed to save journal:', e);
    }
  }

  logAttempt(params: {
    skillNode: string;
    problemSeed: number;
    attemptNumber: number;
    outcome: AttemptOutcome;
    timeToSolutionSeconds: number;
    representation: RepresentationType;
    errorType?: ErrorType;
    studentResponse?: string;
    systemObservations?: string[];
  }): JournalEntry {
    const entry: JournalEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      studentId: this.studentId,
      type: 'attempt',
      ...params,
      tags: [`#skill:${params.skillNode}`, `#outcome:${params.outcome}`],
      reflectionPrompts: this.generateReflectionPrompts(params.outcome, params.errorType)
    };
    this.entries.push(entry);
    this.save();
    return entry;
  }

  addReflection(content: string, relatedSkill?: string, tags: string[] = []): JournalEntry {
    const entry: JournalEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      studentId: this.studentId,
      type: 'reflection',
      skillNode: relatedSkill,
      studentResponse: content,
      tags: [...tags, '#reflection', ...(relatedSkill ? [`#skill:${relatedSkill}`] : [])]
    };
    this.entries.push(entry);
    this.save();
    return entry;
  }

  addHypothesis(content: string, relatedSkill?: string): JournalEntry {
    const entry: JournalEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      studentId: this.studentId,
      type: 'hypothesis',
      skillNode: relatedSkill,
      studentResponse: content,
      tags: ['#hypothesis', ...(relatedSkill ? [`#skill:${relatedSkill}`] : [])]
    };
    this.entries.push(entry);
    this.save();
    return entry;
  }

  addConfusion(content: string, relatedSkill?: string): JournalEntry {
    const entry: JournalEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      studentId: this.studentId,
      type: 'confusion',
      skillNode: relatedSkill,
      studentResponse: content,
      tags: ['#confusion', ...(relatedSkill ? [`#skill:${relatedSkill}`] : [])],
      reflectionPrompts: [
        'What specifically is unclear?',
        'What would help you understand this better?',
        'Can you explain what you do understand so far?'
      ]
    };
    this.entries.push(entry);
    this.save();
    return entry;
  }

  logMilestone(title: string, description: string, relatedSkill?: string): JournalEntry {
    const entry: JournalEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      studentId: this.studentId,
      type: 'milestone',
      skillNode: relatedSkill,
      studentResponse: `${title}\n\n${description}`,
      tags: ['#milestone', ...(relatedSkill ? [`#skill:${relatedSkill}`] : [])]
    };
    this.entries.push(entry);
    this.save();
    return entry;
  }

  private generateReflectionPrompts(outcome?: AttemptOutcome, errorType?: ErrorType): string[] {
    const prompts: string[] = [];
    
    if (outcome === 'struggle') {
      prompts.push('What did you find confusing about this problem?');
      prompts.push('What would help you approach this differently next time?');
    }
    
    if (errorType === 'conceptual') {
      prompts.push('What underlying concept might need review?');
    } else if (errorType === 'procedural') {
      prompts.push('Which step in the process was unclear?');
    } else if (errorType === 'transfer') {
      prompts.push('How might this problem connect to what you already know?');
    }
    
    if (outcome === 'success') {
      prompts.push('What strategy worked well for you?');
      prompts.push('Could you explain this to someone else?');
    }
    
    return prompts;
  }

  search(params: JournalSearchParams): JournalEntry[] {
    return this.entries.filter(entry => {
      if (params.skillNode && entry.skillNode !== params.skillNode) return false;
      if (params.type && entry.type !== params.type) return false;
      if (params.outcome && entry.outcome !== params.outcome) return false;
      if (params.startDate && new Date(entry.timestamp) < params.startDate) return false;
      if (params.endDate && new Date(entry.timestamp) > params.endDate) return false;
      if (params.tags && params.tags.length > 0) {
        if (!params.tags.some(tag => entry.tags.includes(tag))) return false;
      }
      return true;
    });
  }

  getEntriesBySkill(skillNode: string): JournalEntry[] {
    return this.entries.filter(e => e.skillNode === skillNode);
  }

  getTimeline(startDate?: Date, endDate?: Date): JournalEntry[] {
    return this.entries
      .filter(e => {
        const date = new Date(e.timestamp);
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
        return true;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  getStats(): JournalStats {
    const attempts = this.entries.filter(e => e.type === 'attempt');
    const successes = attempts.filter(e => e.outcome === 'success');
    
    const skillCounts = new Map<string, number>();
    for (const entry of this.entries) {
      if (entry.skillNode) {
        skillCounts.set(entry.skillNode, (skillCounts.get(entry.skillNode) || 0) + 1);
      }
    }
    
    const mostActiveSkills = Array.from(skillCounts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const avgTime = attempts.length > 0
      ? attempts.reduce((sum, e) => sum + (e.timeToSolutionSeconds || 0), 0) / attempts.length
      : 0;
    
    return {
      totalEntries: this.entries.length,
      successRate: attempts.length > 0 ? successes.length / attempts.length : 0,
      averageTimeSeconds: avgTime,
      mostActiveSkills,
      recentActivity: this.entries.slice(-10).reverse()
    };
  }

  getAllEntries(): JournalEntry[] {
    return [...this.entries];
  }

  getEntry(id: string): JournalEntry | undefined {
    return this.entries.find(e => e.id === id);
  }

  updateEntry(id: string, updates: Partial<JournalEntry>): boolean {
    const index = this.entries.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.entries[index] = { ...this.entries[index], ...updates };
    this.save();
    return true;
  }

  exportToJSON(): string {
    return JSON.stringify({
      studentId: this.studentId,
      exportDate: new Date().toISOString(),
      entries: this.entries
    }, null, 2);
  }
}
