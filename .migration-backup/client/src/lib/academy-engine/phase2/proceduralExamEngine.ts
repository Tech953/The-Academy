/**
 * Phase 2: Procedural Exam Engine
 * Generates GED-class exams procedurally with deterministic seeding.
 * No static question banks - no memorization exploits.
 */

import { skillGraph, type SkillNode, type SkillDomain, type RepresentationType } from '../phase1/skillGraph';
import type { HomeworkProblem } from '../phase1/homeworkEngine';

export interface ExamQuestion extends HomeworkProblem {
  points: number;
  domain: SkillDomain;
  gedAlignment: string;
}

export interface ExamSection {
  name: string;
  domain: SkillDomain;
  questions: ExamQuestion[];
  timeAllotted: number;
}

export interface GeneratedExam {
  id: string;
  studentId: string;
  seed: number;
  title: string;
  sections: ExamSection[];
  totalQuestions: number;
  totalPoints: number;
  estimatedMinutes: number;
  generatedAt: string;
  expiresAt: string;
}

export interface ExamConfig {
  targetSkills?: string[];
  questionsPerSection?: number;
  includeAllDomains?: boolean;
  difficultyBias?: 'easy' | 'standard' | 'challenging';
  representationFocus?: RepresentationType[];
}

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

const EXAM_TEMPLATES: Record<SkillDomain, string[]> = {
  Math: ['Mathematical Reasoning Assessment', 'Quantitative Skills Evaluation', 'Math Competency Check'],
  Language: ['Language Arts Assessment', 'Reading & Writing Evaluation', 'Communication Skills Check'],
  Science: ['Science Reasoning Assessment', 'Scientific Inquiry Evaluation', 'Science Literacy Check'],
  Social: ['Social Studies Assessment', 'Civics & History Evaluation', 'Social Sciences Check'],
  Reasoning: ['Critical Thinking Assessment', 'Reasoning Skills Evaluation', 'Analytical Thinking Check']
};

const GED_SECTION_NAMES: Record<SkillDomain, string> = {
  Math: 'Mathematical Reasoning',
  Language: 'Reasoning Through Language Arts',
  Science: 'Science',
  Social: 'Social Studies',
  Reasoning: 'Critical Thinking'
};

export class ProceduralExamEngine {
  private studentId: string;
  private rng: SeededRandom | null = null;

  constructor(studentId: string) {
    this.studentId = studentId;
  }

  generate(config: ExamConfig = {}): GeneratedExam {
    const seed = hashString(`${this.studentId}-${Date.now()}`);
    this.rng = new SeededRandom(seed);
    
    const domains = this.selectDomains(config);
    const sections: ExamSection[] = [];
    
    for (const domain of domains) {
      const section = this.generateSection(domain, config, seed);
      sections.push(section);
    }
    
    const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
    const totalPoints = sections.reduce((sum, s) => 
      sum + s.questions.reduce((qSum, q) => qSum + q.points, 0), 0);
    const estimatedMinutes = sections.reduce((sum, s) => sum + s.timeAllotted, 0);
    
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return {
      id: `exam-${seed}`,
      studentId: this.studentId,
      seed,
      title: this.generateTitle(domains),
      sections,
      totalQuestions,
      totalPoints,
      estimatedMinutes,
      generatedAt: now.toISOString(),
      expiresAt: expires.toISOString()
    };
  }

  private selectDomains(config: ExamConfig): SkillDomain[] {
    if (config.targetSkills && config.targetSkills.length > 0) {
      const domains = new Set<SkillDomain>();
      for (const skillId of config.targetSkills) {
        const node = skillGraph.getNode(skillId);
        if (node) domains.add(node.domain);
      }
      return Array.from(domains);
    }
    
    if (config.includeAllDomains) {
      return ['Math', 'Language', 'Science', 'Social'];
    }
    
    return this.rng!.shuffle(['Math', 'Language', 'Science', 'Social'] as SkillDomain[]).slice(0, 2);
  }

  private generateSection(domain: SkillDomain, config: ExamConfig, baseSeed: number): ExamSection {
    const skills = skillGraph.getNodesByDomain(domain);
    const questionCount = config.questionsPerSection || 5;
    const questions: ExamQuestion[] = [];
    
    const selectedSkills = this.rng!.shuffle(skills).slice(0, questionCount);
    
    for (let i = 0; i < selectedSkills.length; i++) {
      const skill = selectedSkills[i];
      const question = this.generateQuestion(skill, baseSeed + i * 100, config);
      questions.push(question);
    }
    
    const timeAllotted = questionCount * 3;
    
    return {
      name: GED_SECTION_NAMES[domain],
      domain,
      questions,
      timeAllotted
    };
  }

  private generateQuestion(skill: SkillNode, seed: number, config: ExamConfig): ExamQuestion {
    const rng = new SeededRandom(seed);
    
    const availableReps = skill.representations.filter(r => 
      !config.representationFocus || config.representationFocus.includes(r)
    );
    const representation = availableReps.length > 0 
      ? rng.choice(availableReps) 
      : skill.representations[0];
    
    const prompt = this.generatePrompt(skill, representation, rng, config);
    const points = skill.cognitiveLoad;
    
    return {
      id: `q-${seed}`,
      skillNode: skill.id,
      seed,
      difficulty: this.adjustDifficulty(skill.cognitiveLoad, config),
      representation,
      prompt,
      hints: this.generateHints(skill, representation),
      points,
      domain: skill.domain,
      gedAlignment: skill.gedAlignment || skill.domain
    };
  }

  private generatePrompt(skill: SkillNode, rep: RepresentationType, rng: SeededRandom, config: ExamConfig): string {
    const templates = this.getTemplatesForSkill(skill.id, rep);
    const template = rng.choice(templates);
    const numbers = this.generateNumbers(config, rng);
    return this.fillTemplate(template, numbers, skill);
  }

  private getTemplatesForSkill(skillId: string, rep: RepresentationType): string[] {
    const genericTemplates: Record<RepresentationType, string[]> = {
      numeric: [
        'Solve the following: {prompt}',
        'Calculate: {prompt}',
        'Find the value: {prompt}'
      ],
      verbal: [
        'Explain: {prompt}',
        'Describe in your own words: {prompt}',
        'Answer the following: {prompt}'
      ],
      applied: [
        'Apply this concept: {prompt}',
        'In this scenario: {prompt}',
        'Real-world application: {prompt}'
      ],
      abstract: [
        'Consider: {prompt}',
        'Analyze: {prompt}',
        'Reason through: {prompt}'
      ],
      graphical: [
        'Based on the data: {prompt}',
        'Interpret: {prompt}',
        'Analyze the visual: {prompt}'
      ],
      written: [
        'Write about: {prompt}',
        'Compose: {prompt}',
        'Draft: {prompt}'
      ]
    };
    
    return genericTemplates[rep] || ['Complete: {prompt}'];
  }

  private generateNumbers(config: ExamConfig, rng: SeededRandom): Record<string, number> {
    const ranges: Record<string, [number, number]> = {
      easy: [1, 20],
      standard: [10, 100],
      challenging: [50, 500]
    };
    const [min, max] = ranges[config.difficultyBias || 'standard'];
    
    return {
      a: rng.nextInt(min, max),
      b: rng.nextInt(min, max),
      c: rng.nextInt(min, max)
    };
  }

  private fillTemplate(template: string, numbers: Record<string, number>, skill: SkillNode): string {
    let result = template;
    result = result.replace(/\{prompt\}/g, skill.description);
    result = result.replace(/\{(\w+)\}/g, (_, key) => 
      numbers[key]?.toString() || key
    );
    return result;
  }

  private adjustDifficulty(base: number, config: ExamConfig): number {
    switch (config.difficultyBias) {
      case 'easy': return Math.max(1, base - 1);
      case 'challenging': return Math.min(5, base + 1);
      default: return base;
    }
  }

  private generateHints(skill: SkillNode, rep: RepresentationType): string[] {
    const hints: string[] = [
      `Review the concept: ${skill.name}`,
      `Think about ${skill.description.toLowerCase()}`
    ];
    
    if (rep === 'numeric') {
      hints.push('Work step by step with the numbers.');
    } else if (rep === 'verbal') {
      hints.push('Consider what the question is really asking.');
    } else if (rep === 'applied') {
      hints.push('Connect this to a situation you know.');
    }
    
    return hints;
  }

  private generateTitle(domains: SkillDomain[]): string {
    if (domains.length === 1) {
      const templates = EXAM_TEMPLATES[domains[0]];
      return this.rng!.choice(templates);
    }
    return 'GED Practice Assessment';
  }

  generateFromMasteryGaps(stableSkills: string[], fragileSkills: string[]): GeneratedExam {
    const targetSkills = fragileSkills.length > 0 ? fragileSkills : 
      skillGraph.getAvailableSkills(new Set(stableSkills)).map(n => n.id);
    
    return this.generate({
      targetSkills: targetSkills.slice(0, 10),
      questionsPerSection: 5,
      difficultyBias: fragileSkills.length > 0 ? 'easy' : 'standard'
    });
  }
}
