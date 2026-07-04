import {
  GEDSubjectKey, StudentCurriculumProgress, LessonProgress,
} from '@shared/schema';
import {
  computeAllSubjectProgress, SUBJECT_META,
} from './gedCurriculum';

// ─── Archival Epochs ──────────────────────────────────────────────────────────

export type ArtifactType = 'breakthrough' | 'struggle' | 'synthesis' | 'milestone';

export interface EpochArtifact {
  id: string;
  type: ArtifactType;
  label: string;
  domain: GEDSubjectKey | 'GENERAL';
  tensionDelta: number;  // positive = reduces tension, negative = increases it
  timestamp: number;
}

export interface EpochSnapshot {
  level: number;
  xp: number;
  lessonsCompleted: number;
  quizAverage: number;
  enrolledCourses: number;
  gedReadiness: number;
  dominantDomain: GEDSubjectKey | null;
}

export interface ArchivalEpoch {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  snapshot: EpochSnapshot;
  artifacts: EpochArtifact[];
}

const EPOCHS_KEY = 'academy-archival-epochs-v1';
const CURRENT_EPOCH_START_KEY = 'academy-current-epoch-start';
const EPOCH_ARTIFACTS_KEY = 'academy-epoch-artifacts-pending';

function epochLabel(n: number): string {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
  return `EPOCH ${numerals[n] ?? n + 1}`;
}

export const archivalEpochs = {
  load(): ArchivalEpoch[] {
    try {
      const raw = localStorage.getItem(EPOCHS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  save(epochs: ArchivalEpoch[]): void {
    localStorage.setItem(EPOCHS_KEY, JSON.stringify(epochs));
  },

  getCurrentEpochStart(): number {
    const raw = localStorage.getItem(CURRENT_EPOCH_START_KEY);
    const t = raw ? parseInt(raw, 10) : 0;
    if (!t || isNaN(t)) {
      const now = Date.now();
      localStorage.setItem(CURRENT_EPOCH_START_KEY, String(now));
      return now;
    }
    return t;
  },

  closeCurrentEpoch(snapshot: EpochSnapshot): ArchivalEpoch {
    const epochs = archivalEpochs.load();
    const artifacts = archivalEpochs.getPendingArtifacts();
    const startTime = archivalEpochs.getCurrentEpochStart();
    const now = Date.now();
    const epoch: ArchivalEpoch = {
      id: `epoch-${now}`,
      label: epochLabel(epochs.length),
      startTime,
      endTime: now,
      durationMs: now - startTime,
      snapshot,
      artifacts,
    };
    epochs.push(epoch);
    archivalEpochs.save(epochs);
    localStorage.setItem(CURRENT_EPOCH_START_KEY, String(now));
    archivalEpochs.clearPendingArtifacts();
    return epoch;
  },

  addArtifact(artifact: Omit<EpochArtifact, 'id' | 'timestamp'>): void {
    const current = archivalEpochs.getPendingArtifacts();
    current.push({ ...artifact, id: `art-${Date.now()}`, timestamp: Date.now() });
    localStorage.setItem(EPOCH_ARTIFACTS_KEY, JSON.stringify(current));
  },

  getPendingArtifacts(): EpochArtifact[] {
    try {
      const raw = localStorage.getItem(EPOCH_ARTIFACTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  clearPendingArtifacts(): void {
    localStorage.removeItem(EPOCH_ARTIFACTS_KEY);
  },

  /** Snapshot builder from game state */
  buildSnapshot(params: {
    level: number; xp: number; curriculumProgress: StudentCurriculumProgress;
    enrolledCourses: string[];
  }): EpochSnapshot {
    const { level, xp, curriculumProgress, enrolledCourses } = params;
    const allLessons = Object.values(curriculumProgress.lessonProgress) as LessonProgress[];
    const lessonsCompleted = allLessons.filter(l => l.completed).length;
    const scores = allLessons.filter(l => l.quizScore !== undefined && l.quizScore !== null).map(l => (l.quizScore ?? 0) as number);
    const quizAverage = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const subjectProgress = computeAllSubjectProgress(curriculumProgress);
    const dominant = subjectProgress.reduce((best, s) => s.readinessScore > best.readinessScore ? s : best, subjectProgress[0]);
    const gedReadiness = Math.round(subjectProgress.reduce((sum, s) => sum + s.readinessScore, 0) / Math.max(subjectProgress.length, 1));

    return {
      level, xp, lessonsCompleted, quizAverage,
      enrolledCourses: enrolledCourses.length,
      gedReadiness,
      dominantDomain: dominant?.readinessScore > 0 ? dominant.subject : null,
    };
  },
};

// ─── Domain Tension ───────────────────────────────────────────────────────────

export interface DomainTension {
  domain: GEDSubjectKey;
  abbr: string;
  color: string;
  stability: number;   // 0–100: high = stable, low = fragile
  tension: number;     // 0–100: inverse of stability
  readinessScore: number;
  trend: 'improving' | 'stable' | 'fragile' | 'unstarted';
  bleedSources: { from: GEDSubjectKey; fromAbbr: string; intensity: number }[];
}

// Cross-domain bleed links: [source, target, factor]
const BLEED_LINKS: [GEDSubjectKey, GEDSubjectKey, number][] = [
  ['Mathematical Reasoning', 'Science',        0.30],
  ['Science',               'Mathematical Reasoning', 0.15],
  ['Language Arts',         'Social Studies',  0.25],
  ['Social Studies',        'Language Arts',   0.15],
  ['Language Arts',         'Science',         0.10],
  ['Mathematical Reasoning','Social Studies',  0.10],
];

export function computeDomainTensions(
  curriculumProgress: StudentCurriculumProgress
): DomainTension[] {
  const subjectProgress = computeAllSubjectProgress(curriculumProgress);

  const raw: Record<GEDSubjectKey, DomainTension> = {} as Record<GEDSubjectKey, DomainTension>;
  for (const sp of subjectProgress) {
    const meta = SUBJECT_META[sp.subject];
    const stability = Math.min(100, sp.readinessScore);
    const trend: DomainTension['trend'] =
      sp.readinessScore === 0   ? 'unstarted' :
      sp.readinessScore >= 70   ? 'improving' :
      sp.readinessScore >= 40   ? 'stable'    :
      'fragile';
    raw[sp.subject] = {
      domain: sp.subject,
      abbr: meta.abbr,
      color: meta.color,
      stability,
      tension: 100 - stability,
      readinessScore: sp.readinessScore,
      trend,
      bleedSources: [],
    };
  }

  // Apply bleed
  for (const [from, to, factor] of BLEED_LINKS) {
    const sourceTension = raw[from]?.tension ?? 0;
    const intensity = Math.round(sourceTension * factor);
    if (intensity > 0 && raw[to]) {
      raw[to].tension = Math.min(100, raw[to].tension + intensity);
      raw[to].stability = Math.max(0, 100 - raw[to].tension);
      raw[to].bleedSources.push({ from, fromAbbr: SUBJECT_META[from].abbr, intensity });
    }
  }

  return Object.values(raw);
}

// ─── Synthesis Trials ─────────────────────────────────────────────────────────

export interface SynthesisTrial {
  id: string;
  name: string;
  codename: string;
  tier: 1 | 2 | 3 | 4;
  domains: GEDSubjectKey[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  description: string;
  requiredMastery: number;   // average readiness score needed
  xpReward: number;
  statBonuses: Record<string, number>;
  status: 'locked' | 'available' | 'completed';
  completedAt?: number;
  score?: number;
}

const TRIAL_DEFINITIONS: Omit<SynthesisTrial, 'status' | 'completedAt' | 'score'>[] = [
  {
    id: 'trial-rla-1',
    name: 'Literacy Foundation Alignment',
    codename: 'OPERATION WORD-FORM',
    tier: 1,
    domains: ['Language Arts'],
    difficulty: 1,
    description: 'A baseline synthesis challenge in Language Arts. Reading comprehension, extended response, and grammar integration.',
    requiredMastery: 20,
    xpReward: 500,
    statBonuses: { linguistic: 2 },
  },
  {
    id: 'trial-math-1',
    name: 'Quantitative Basics Alignment',
    codename: 'OPERATION CALCULUS-PRIME',
    tier: 1,
    domains: ['Mathematical Reasoning'],
    difficulty: 2,
    description: 'A synthesis event testing algebraic reasoning, data analysis, and quantitative problem solving.',
    requiredMastery: 25,
    xpReward: 650,
    statBonuses: { mathLogic: 2 },
  },
  {
    id: 'trial-sci-1',
    name: 'Scientific Inquiry Trial',
    codename: 'OPERATION EMPIRICA',
    tier: 1,
    domains: ['Science'],
    difficulty: 2,
    description: 'Life, physical, and earth science integration challenge with analysis components.',
    requiredMastery: 25,
    xpReward: 650,
    statBonuses: { mathLogic: 1, perception: 1 },
  },
  {
    id: 'trial-soc-1',
    name: 'Civic Foundations Alignment',
    codename: 'OPERATION POLITY',
    tier: 1,
    domains: ['Social Studies'],
    difficulty: 1,
    description: 'US history, civics, geography and economics synthesis, drawing connections across political and economic systems.',
    requiredMastery: 20,
    xpReward: 500,
    statBonuses: { presence: 2 },
  },
  {
    id: 'trial-dual-1',
    name: 'Civic-Literary Integration',
    codename: 'OPERATION NEXUS-I',
    tier: 2,
    domains: ['Language Arts', 'Social Studies'],
    difficulty: 3,
    description: 'Cross-domain synthesis: RLA extended response applied to historical and civic analysis. Requires mastery in both domains.',
    requiredMastery: 50,
    xpReward: 1200,
    statBonuses: { linguistic: 2, presence: 1 },
  },
  {
    id: 'trial-dual-2',
    name: 'Scientific Quantification Trial',
    codename: 'OPERATION NEXUS-II',
    tier: 2,
    domains: ['Mathematical Reasoning', 'Science'],
    difficulty: 3,
    description: 'Quantitative reasoning applied to science data interpretation. Math-Science synthesis with emphasis on empirical analysis.',
    requiredMastery: 55,
    xpReward: 1400,
    statBonuses: { mathLogic: 2, perception: 1 },
  },
  {
    id: 'trial-triple-1',
    name: 'Applied Knowledge Trial',
    codename: 'OPERATION CONVERGENCE',
    tier: 3,
    domains: ['Mathematical Reasoning', 'Science', 'Social Studies'],
    difficulty: 4,
    description: 'Three-domain synthesis event. Quantitative reasoning applied to scientific and civic systems — an interdisciplinary capstone.',
    requiredMastery: 65,
    xpReward: 2200,
    statBonuses: { mathLogic: 2, presence: 2, perception: 1 },
  },
  {
    id: 'trial-ged-sim',
    name: 'GED Convergence Simulation',
    codename: 'OPERATION GED-PRIME',
    tier: 4,
    domains: ['Language Arts', 'Mathematical Reasoning', 'Science', 'Social Studies'],
    difficulty: 5,
    description: 'Full-spectrum GED simulation. All four domains synthesized in a high-stakes capstone alignment. Completion signals readiness for graduation.',
    requiredMastery: 75,
    xpReward: 5000,
    statBonuses: { linguistic: 3, mathLogic: 3, presence: 2, perception: 2 },
  },
];

const TRIALS_KEY = 'academy-synthesis-trials-v1';

export const synthesisTri = {
  load(): SynthesisTrial[] {
    try {
      const raw = localStorage.getItem(TRIALS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  save(trials: SynthesisTrial[]): void {
    localStorage.setItem(TRIALS_KEY, JSON.stringify(trials));
  },

  computeAll(curriculumProgress: StudentCurriculumProgress): SynthesisTrial[] {
    const saved: Record<string, SynthesisTrial> = {};
    for (const t of synthesisTri.load()) saved[t.id] = t;

    const subjectProgress = computeAllSubjectProgress(curriculumProgress);
    const scoreByDomain: Record<string, number> = {};
    for (const sp of subjectProgress) scoreByDomain[sp.subject] = sp.readinessScore;

    return TRIAL_DEFINITIONS.map(def => {
      const existing = saved[def.id];
      if (existing?.status === 'completed') return existing;

      const avgDomainScore = def.domains.length > 0
        ? def.domains.reduce((sum, d) => sum + (scoreByDomain[d] ?? 0), 0) / def.domains.length
        : 0;
      const status: SynthesisTrial['status'] = avgDomainScore >= def.requiredMastery ? 'available' : 'locked';

      return { ...def, status, completedAt: existing?.completedAt, score: existing?.score };
    });
  },

  complete(trialId: string, score: number, curriculumProgress: StudentCurriculumProgress): SynthesisTrial[] {
    const trials = synthesisTri.computeAll(curriculumProgress);
    const updated = trials.map(t =>
      t.id === trialId ? { ...t, status: 'completed' as const, completedAt: Date.now(), score } : t
    );
    synthesisTri.save(updated.filter(t => t.status === 'completed'));

    // Add artifact for this trial
    const trial = trials.find(t => t.id === trialId);
    if (trial) {
      archivalEpochs.addArtifact({
        type: score >= 75 ? 'breakthrough' : 'synthesis',
        label: `Trial Completed: ${trial.name} (${score}%)`,
        domain: trial.domains[0],
        tensionDelta: Math.round(score / 10),
      });
    }
    return updated;
  },
};

// ─── Institutional Summary ────────────────────────────────────────────────────

export interface InstitutionalSummary {
  totalEpochs: number;
  currentEpochDurationMs: number;
  totalArtifacts: number;
  trialsCompleted: number;
  trialsAvailable: number;
  overallGEDReadiness: number;
  dominantDomain: GEDSubjectKey | null;
  fragiledomains: GEDSubjectKey[];
}

export function getInstitutionalSummary(
  curriculumProgress: StudentCurriculumProgress
): InstitutionalSummary {
  const epochs = archivalEpochs.load();
  const epochStart = archivalEpochs.getCurrentEpochStart();
  const subjectProgress = computeAllSubjectProgress(curriculumProgress);
  const tensions = computeDomainTensions(curriculumProgress);
  const trials = synthesisTri.computeAll(curriculumProgress);

  const gedReadiness = Math.round(
    subjectProgress.reduce((sum, s) => sum + s.readinessScore, 0) / Math.max(subjectProgress.length, 1)
  );
  const dominant = subjectProgress.reduce((best, s) => s.readinessScore > best.readinessScore ? s : best, subjectProgress[0]);
  const fragile = tensions.filter(t => t.tension > 65).map(t => t.domain);

  return {
    totalEpochs: epochs.length + 1,
    currentEpochDurationMs: Date.now() - epochStart,
    totalArtifacts: epochs.reduce((n, e) => n + e.artifacts.length, 0) + archivalEpochs.getPendingArtifacts().length,
    trialsCompleted: trials.filter(t => t.status === 'completed').length,
    trialsAvailable: trials.filter(t => t.status === 'available').length,
    overallGEDReadiness: gedReadiness,
    dominantDomain: dominant?.readinessScore > 0 ? dominant.subject : null,
    fragiledomains: fragile,
  };
}
