/**
 * Options: Portfolio & Transcript Generators
 * Produces narrative portfolios, structured skill transcripts,
 * and accreditation-ready exports.
 */

import type { JournalEntry } from '../phase1/studentJournal';
import type { MasterySignal } from '../phase2/masterySignalExtractor';
import type { ConfidenceBand } from '../phase2/confidenceEstimator';
import type { CanonEvent } from '../phase4/loreSkin';

export interface Portfolio {
  studentId: string;
  generatedAt: string;
  summary: PortfolioSummary;
  reflections: JournalEntry[];
  mastery: MasterySnapshot;
  loreEvents: CanonEvent[];
  achievements: Achievement[];
}

export interface PortfolioSummary {
  totalStudyTime: string;
  skillsMastered: number;
  skillsInProgress: number;
  strongestDomains: string[];
  personalStatement?: string;
}

export interface MasterySnapshot {
  skills: Array<{
    skillId: string;
    skillName: string;
    masteryState: string;
    confidenceBand: ConfidenceBand;
    domain: string;
  }>;
}

export interface Achievement {
  title: string;
  description: string;
  earnedAt: string;
  category: 'mastery' | 'persistence' | 'milestone' | 'domain';
}

export interface Transcript {
  studentId: string;
  studentName: string;
  issuedAt: string;
  issuedBy: string;
  curriculumHash?: string;
  skills: TranscriptEntry[];
  gedAlignment: GEDAlignment;
}

export interface TranscriptEntry {
  skillId: string;
  skillName: string;
  domain: string;
  masteryState: string;
  confidenceBand: ConfidenceBand;
  attempts: number;
  lastActivity?: string;
}

export interface GEDAlignment {
  mathematicalReasoning: DomainStatus;
  languageArts: DomainStatus;
  science: DomainStatus;
  socialStudies: DomainStatus;
  overallReady: boolean;
}

export interface DomainStatus {
  skillsTotal: number;
  skillsMastered: number;
  percentComplete: number;
  status: 'not_started' | 'in_progress' | 'complete' | 'ready';
}

export interface AccreditationRecord {
  studentId: string;
  issuedBy: string;
  issuedAt: string;
  curriculumHash: string;
  competencies: Record<string, string>;
  signature: string;
}

export class PortfolioGenerator {
  generate(params: {
    studentId: string;
    journalEntries: JournalEntry[];
    masterySignals: Record<string, MasterySignal>;
    confidenceBands: Record<string, ConfidenceBand>;
    canonEvents?: CanonEvent[];
    personalStatement?: string;
  }): Portfolio {
    const reflections = params.journalEntries
      .filter(e => e.type === 'reflection' || e.type === 'hypothesis')
      .slice(-20);
    
    const totalTimeSeconds = params.journalEntries
      .filter(e => e.timeToSolutionSeconds)
      .reduce((sum, e) => sum + (e.timeToSolutionSeconds || 0), 0);
    
    const mastered = Object.values(params.masterySignals)
      .filter(s => s.state === 'stable').length;
    const inProgress = Object.values(params.masterySignals)
      .filter(s => s.state === 'emerging' || s.state === 'fragile').length;
    
    const domainCounts: Record<string, number> = {};
    for (const signal of Object.values(params.masterySignals)) {
      if (signal.state === 'stable') {
        const domain = signal.skillNode.split('.')[0];
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    }
    const strongestDomains = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([domain]) => domain);
    
    const achievements = this.generateAchievements(
      params.masterySignals,
      params.canonEvents || []
    );
    
    return {
      studentId: params.studentId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalStudyTime: this.formatTime(totalTimeSeconds),
        skillsMastered: mastered,
        skillsInProgress: inProgress,
        strongestDomains,
        personalStatement: params.personalStatement
      },
      reflections,
      mastery: {
        skills: Object.entries(params.masterySignals).map(([skillId, signal]) => ({
          skillId,
          skillName: skillId.split('.').pop() || skillId,
          masteryState: signal.state,
          confidenceBand: params.confidenceBands[skillId] || 'unknown',
          domain: skillId.split('.')[0]
        }))
      },
      loreEvents: params.canonEvents || [],
      achievements
    };
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  }

  private generateAchievements(
    signals: Record<string, MasterySignal>,
    events: CanonEvent[]
  ): Achievement[] {
    const achievements: Achievement[] = [];
    
    const stableCount = Object.values(signals).filter(s => s.state === 'stable').length;
    if (stableCount >= 1) {
      achievements.push({
        title: 'First Mastery',
        description: 'Achieved stable understanding in your first skill',
        earnedAt: new Date().toISOString(),
        category: 'mastery'
      });
    }
    if (stableCount >= 5) {
      achievements.push({
        title: 'Building Foundation',
        description: 'Mastered 5 skills',
        earnedAt: new Date().toISOString(),
        category: 'mastery'
      });
    }
    if (stableCount >= 10) {
      achievements.push({
        title: 'Solid Progress',
        description: 'Mastered 10 skills',
        earnedAt: new Date().toISOString(),
        category: 'mastery'
      });
    }
    
    for (const event of events) {
      if (event.significance === 'major' || event.significance === 'legendary') {
        achievements.push({
          title: event.eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          description: event.detail,
          earnedAt: event.timestamp,
          category: 'milestone'
        });
      }
    }
    
    return achievements;
  }
}

export class TranscriptGenerator {
  generate(params: {
    studentId: string;
    studentName: string;
    masterySignals: Record<string, MasterySignal>;
    confidenceBands: Record<string, ConfidenceBand>;
    curriculumHash?: string;
    issuer?: string;
  }): Transcript {
    const skills: TranscriptEntry[] = Object.entries(params.masterySignals)
      .map(([skillId, signal]) => ({
        skillId,
        skillName: this.getSkillName(skillId),
        domain: this.getDomainName(skillId),
        masteryState: signal.state,
        confidenceBand: params.confidenceBands[skillId] || 'unknown',
        attempts: signal.successes + signal.struggles,
        lastActivity: signal.lastUpdated
      }))
      .sort((a, b) => a.domain.localeCompare(b.domain));
    
    return {
      studentId: params.studentId,
      studentName: params.studentName,
      issuedAt: new Date().toISOString(),
      issuedBy: params.issuer || 'The Academy',
      curriculumHash: params.curriculumHash,
      skills,
      gedAlignment: this.calculateGEDAlignment(skills)
    };
  }

  private getSkillName(skillId: string): string {
    const parts = skillId.split('.');
    return parts[parts.length - 2] || skillId;
  }

  private getDomainName(skillId: string): string {
    const prefix = skillId.split('.')[0];
    const names: Record<string, string> = {
      MATH: 'Mathematical Reasoning',
      LANG: 'Language Arts',
      SCI: 'Science',
      SOC: 'Social Studies',
      REAS: 'Reasoning'
    };
    return names[prefix] || prefix;
  }

  private calculateGEDAlignment(skills: TranscriptEntry[]): GEDAlignment {
    const domains = {
      mathematicalReasoning: this.getDomainStatus(skills, 'Mathematical Reasoning'),
      languageArts: this.getDomainStatus(skills, 'Language Arts'),
      science: this.getDomainStatus(skills, 'Science'),
      socialStudies: this.getDomainStatus(skills, 'Social Studies')
    };
    
    const allReady = Object.values(domains).every(d => 
      d.status === 'complete' || d.status === 'ready'
    );
    
    return { ...domains, overallReady: allReady };
  }

  private getDomainStatus(skills: TranscriptEntry[], domain: string): DomainStatus {
    const domainSkills = skills.filter(s => s.domain === domain);
    const mastered = domainSkills.filter(s => 
      s.masteryState === 'stable' || s.confidenceBand === 'reliable'
    ).length;
    
    const total = domainSkills.length || 1;
    const percent = (mastered / total) * 100;
    
    let status: DomainStatus['status'] = 'not_started';
    if (percent >= 80) status = 'ready';
    else if (percent >= 100) status = 'complete';
    else if (percent > 0) status = 'in_progress';
    
    return {
      skillsTotal: total,
      skillsMastered: mastered,
      percentComplete: percent,
      status
    };
  }
}

export class AccreditationExporter {
  export(params: {
    studentId: string;
    curriculumHash: string;
    masterySnapshot: Record<string, string>;
    confidenceBands: Record<string, ConfidenceBand>;
    issuer?: string;
  }): AccreditationRecord {
    const signature = this.generateSignature(
      params.studentId,
      params.curriculumHash,
      params.masterySnapshot
    );
    
    return {
      studentId: params.studentId,
      issuedBy: params.issuer || 'The Academy',
      issuedAt: new Date().toISOString(),
      curriculumHash: params.curriculumHash,
      competencies: params.masterySnapshot,
      signature
    };
  }

  private generateSignature(
    studentId: string,
    curriculumHash: string,
    mastery: Record<string, string>
  ): string {
    const payload = JSON.stringify({ studentId, curriculumHash, mastery });
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = ((hash << 5) - hash) + payload.charCodeAt(i);
      hash = hash & hash;
    }
    return `SIG-${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }

  toJSON(record: AccreditationRecord): string {
    return JSON.stringify(record, null, 2);
  }
}

export const portfolioGenerator = new PortfolioGenerator();
export const transcriptGenerator = new TranscriptGenerator();
export const accreditationExporter = new AccreditationExporter();
