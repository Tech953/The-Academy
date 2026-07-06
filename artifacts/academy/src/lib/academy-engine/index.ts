/**
 * Academy Engine - Complete Cognitive Infrastructure
 * 
 * Phase 1: Skill Graph, Journals, Homework, Profiles
 * Phase 2: Mastery Signals, Confidence, Exams, Sessions
 * Phase 3: Curriculum Versioning, Teacher Authority
 * Phase 4: Lore/Narrative Skin
 * Options: Ethics, Portfolio, Accreditation, Version Freeze
 */

export * from './phase1/skillGraph';
export * from './phase1/studentJournal';
export * from './phase1/homeworkEngine';
export * from './phase1/studentProfile';

export { MasterySignalExtractor, type MasterySignal, type MasteryState, type MasterySnapshot } from './phase2/masterySignalExtractor';
export { ConfidenceEstimator, confidenceEstimator, type ConfidenceBand, type ConfidenceDisplay } from './phase2/confidenceEstimator';
export { ProceduralExamEngine, type GeneratedExam, type ExamSection, type ExamQuestion, type ExamConfig } from './phase2/proceduralExamEngine';
export { ExamSession, type ExamSessionData, type QuestionResponse, type SessionMetrics, type SessionStatus } from './phase2/examSession';

export { CurriculumVersioning, curriculumVersioning, type CurriculumVersion, type CurriculumContent, type CurriculumPolicies } from './phase3/curriculumVersioning';
export { TeacherIdentity, ApprovalLayer, AnnotationEngine, approvalLayer, annotationEngine, type Teacher, type TeacherSignature, type Approval, type Annotation } from './phase3/teacherAuthority';

export { PromptSkinner, LoreRegistry, CanonEventLogger, LoreModeManager, loreRegistry, loreModeManager, type LoreMode, type LoreFragment, type CanonEvent, type CanonEventType } from './phase4/loreSkin';

export { EthicsLockfile, ethicsLockfile, type EthicsViolation, type EthicsReport } from './options/ethicsLockfile';
export { PortfolioGenerator, TranscriptGenerator, AccreditationExporter, portfolioGenerator, transcriptGenerator, accreditationExporter, type Portfolio, type Transcript, type AccreditationRecord } from './options/portfolioGenerator';
export { ReleaseFreezer, releaseFreezer, type FrozenRelease, type ReleaseManifest } from './options/versionFreeze';

import { SkillGraph, skillGraph } from './phase1/skillGraph';
import { StudentJournal } from './phase1/studentJournal';
import { HomeworkEngine } from './phase1/homeworkEngine';
import { StudentProfile } from './phase1/studentProfile';
import { MasterySignalExtractor } from './phase2/masterySignalExtractor';
import { confidenceEstimator } from './phase2/confidenceEstimator';
import { ProceduralExamEngine } from './phase2/proceduralExamEngine';
import { ExamSession } from './phase2/examSession';
import { curriculumVersioning } from './phase3/curriculumVersioning';
import { approvalLayer, annotationEngine, TeacherIdentity, ApprovalLayer, AnnotationEngine } from './phase3/teacherAuthority';
import { PromptSkinner, loreRegistry, loreModeManager, CanonEventLogger, LoreRegistry, LoreModeManager } from './phase4/loreSkin';
import { ethicsLockfile, EthicsLockfile } from './options/ethicsLockfile';
import { portfolioGenerator, transcriptGenerator, accreditationExporter, PortfolioGenerator, TranscriptGenerator, AccreditationExporter } from './options/portfolioGenerator';
import { releaseFreezer, ReleaseFreezer } from './options/versionFreeze';

export class AcademyEngine {
  public readonly skillGraph: SkillGraph;
  public readonly journal: StudentJournal;
  public readonly homework: HomeworkEngine;
  public readonly profile: StudentProfile;
  public readonly mastery: MasterySignalExtractor;
  public readonly confidence = confidenceEstimator;
  public readonly examEngine: ProceduralExamEngine;
  public readonly curriculum = curriculumVersioning;
  public readonly approvals: ApprovalLayer = approvalLayer;
  public readonly annotations: AnnotationEngine = annotationEngine;
  public readonly promptSkinner: PromptSkinner;
  public readonly loreRegistry: LoreRegistry = loreRegistry;
  public readonly loreModeManager: LoreModeManager = loreModeManager;
  public readonly canonEvents: CanonEventLogger;
  public readonly ethics: EthicsLockfile = ethicsLockfile;
  public readonly portfolioGenerator: PortfolioGenerator = portfolioGenerator;
  public readonly transcriptGenerator: TranscriptGenerator = transcriptGenerator;
  public readonly accreditationExporter: AccreditationExporter = accreditationExporter;
  public readonly releaseFreezer: ReleaseFreezer = releaseFreezer;

  private studentId: string;
  private currentSession: ExamSession | null = null;

  constructor(studentId: string, studentName?: string) {
    this.studentId = studentId;
    this.skillGraph = skillGraph;
    this.journal = new StudentJournal(studentId);
    this.homework = new HomeworkEngine(studentId);
    this.profile = new StudentProfile(studentId, studentName);
    this.mastery = new MasterySignalExtractor(studentId);
    this.examEngine = new ProceduralExamEngine(studentId);
    this.promptSkinner = new PromptSkinner(this.loreModeManager.getMode());
    this.canonEvents = new CanonEventLogger(studentId);
  }

  logAttempt(params: {
    skillNode: string;
    outcome: 'success' | 'partial' | 'struggle';
    representation: 'numeric' | 'verbal' | 'applied' | 'abstract' | 'graphical' | 'written';
    timeSpentSeconds: number;
    errorType?: 'none' | 'conceptual' | 'procedural' | 'transfer' | 'careless';
    response?: string;
  }): void {
    this.ethics.validate([params.skillNode, 'outcome', 'representation']);
    
    this.journal.logAttempt({
      skillNode: params.skillNode,
      problemSeed: Date.now(),
      attemptNumber: 1,
      outcome: params.outcome,
      timeToSolutionSeconds: params.timeSpentSeconds,
      representation: params.representation,
      errorType: params.errorType,
      studentResponse: params.response
    });
    
    this.profile.logAttempt({
      skillNode: params.skillNode,
      representation: params.representation,
      outcome: params.outcome,
      timeSpentSeconds: params.timeSpentSeconds,
      errorType: params.errorType
    });
    
    const masteryState = this.mastery.logAttempt({
      skillNode: params.skillNode,
      outcome: params.outcome,
      representation: params.representation,
      timeSpent: params.timeSpentSeconds
    });
    
    if (params.outcome === 'struggle') {
      this.homework.recordStruggle(params.skillNode);
    } else if (params.outcome === 'success') {
      this.homework.recordSuccess(params.skillNode);
    }
    
    if (masteryState === 'stable') {
      const skill = this.skillGraph.getNode(params.skillNode);
      if (skill) {
        this.canonEvents.logMasteryAchieved(params.skillNode, skill.name);
      }
    }
  }

  generateHomework(skillNode: string, problemCount: number = 5): ReturnType<HomeworkEngine['generateHomeworkSet']> {
    return this.homework.generateHomeworkSet(skillNode, problemCount);
  }

  generateExam(config?: Parameters<ProceduralExamEngine['generate']>[0]): ReturnType<ProceduralExamEngine['generate']> {
    return this.examEngine.generate(config);
  }

  startExamSession(exam: ReturnType<ProceduralExamEngine['generate']>): ExamSession {
    this.currentSession = new ExamSession(exam, this.studentId);
    this.currentSession.start();
    return this.currentSession;
  }

  getCurrentSession(): ExamSession | null {
    return this.currentSession;
  }

  getProgress(): {
    skillsAttempted: number;
    skillsMastered: number;
    skillsEmerging: number;
    overallConfidence: string;
    gedReadiness: boolean;
  } {
    const masteryProgress = this.mastery.getOverallProgress();
    const stableSkills = this.mastery.getStableSkills();
    
    const gedDomains = ['MATH', 'LANG', 'SCI', 'SOC'];
    const gedReady = gedDomains.every(domain => {
      const domainSkills = stableSkills.filter(s => s.startsWith(domain));
      return domainSkills.length >= 3;
    });
    
    let overallConfidence = 'emerging';
    if (masteryProgress.stable > masteryProgress.emerging) {
      overallConfidence = 'reliable';
    } else if (masteryProgress.emerging > masteryProgress.fragile) {
      overallConfidence = 'stabilizing';
    }
    
    return {
      skillsAttempted: masteryProgress.stable + masteryProgress.emerging + masteryProgress.fragile,
      skillsMastered: masteryProgress.stable,
      skillsEmerging: masteryProgress.emerging,
      overallConfidence,
      gedReadiness: gedReady
    };
  }

  generatePortfolio(): ReturnType<PortfolioGenerator['generate']> {
    const masterySignals = this.mastery.getAllSignals();
    const confidenceBands: Record<string, 'unknown' | 'emerging' | 'stabilizing' | 'reliable'> = {};
    
    for (const [skillId, signal] of Object.entries(masterySignals)) {
      confidenceBands[skillId] = this.confidence.estimate(signal.state);
    }
    
    return this.portfolioGenerator.generate({
      studentId: this.studentId,
      journalEntries: this.journal.getAllEntries(),
      masterySignals,
      confidenceBands,
      canonEvents: this.canonEvents.getEvents()
    });
  }

  generateTranscript(): ReturnType<TranscriptGenerator['generate']> {
    const masterySignals = this.mastery.getAllSignals();
    const confidenceBands: Record<string, 'unknown' | 'emerging' | 'stabilizing' | 'reliable'> = {};
    
    for (const [skillId, signal] of Object.entries(masterySignals)) {
      confidenceBands[skillId] = this.confidence.estimate(signal.state);
    }
    
    return this.transcriptGenerator.generate({
      studentId: this.studentId,
      studentName: this.profile.getDisplayName(),
      masterySignals,
      confidenceBands
    });
  }

  getStudentId(): string {
    return this.studentId;
  }
}

export function createAcademyEngine(studentId: string, studentName?: string): AcademyEngine {
  return new AcademyEngine(studentId, studentName);
}
