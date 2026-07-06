/**
 * Phase 1: Procedural Homework Engine
 * Low-stakes, non-punitive, deterministic generation.
 * Practice without fear - shifts representation instead of punishment.
 */

import { skillGraph, type SkillNode, type RepresentationType } from './skillGraph';

export interface HomeworkProblem {
  id: string;
  skillNode: string;
  seed: number;
  difficulty: number;
  representation: RepresentationType;
  prompt: string;
  context?: string;
  hints: string[];
  solutionSteps?: string[];
}

export interface HomeworkSet {
  id: string;
  studentId: string;
  skillNode: string;
  problems: HomeworkProblem[];
  createdAt: string;
  attemptNumber: number;
}

export interface DifficultyParams {
  numberMagnitude: 'small' | 'medium' | 'large';
  contextComplexity: 'simple' | 'moderate' | 'complex';
  distractorCount: number;
  stepCount: number;
}

const REPRESENTATION_ORDER: RepresentationType[] = ['numeric', 'verbal', 'applied', 'abstract'];

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

const PROBLEM_TEMPLATES: Record<string, Record<RepresentationType, string[]>> = {
  'MATH.ARITH.001': {
    numeric: [
      'Calculate: {a} + {b} = ?',
      'What is {a} - {b}?',
      'Multiply: {a} x {b} = ?',
      'Divide: {a} / {b} = ?'
    ],
    verbal: [
      'Add the numbers {a} and {b}. What is the sum?',
      'Find the difference between {a} and {b}.',
      'What is the product of {a} and {b}?'
    ],
    applied: [
      'You have {a} items and receive {b} more. How many total?',
      'A store has {a} items. If {b} are sold, how many remain?',
      'Each box holds {b} items. How many items in {c} boxes?'
    ],
    abstract: [],
    graphical: [],
    written: []
  },
  'MATH.RATIO.003': {
    numeric: [
      'Simplify the ratio {a}:{b}',
      'If {a}:{b} = x:{c}, find x',
      'What is {a} as a ratio to {b}?'
    ],
    verbal: [
      'Express the relationship between {a} and {b} as a ratio in simplest form.',
      'Two quantities are in the ratio {a}:{b}. If one quantity is {c}, find the other.'
    ],
    applied: [
      'A recipe uses {a} cups flour to {b} cups sugar. For {c} cups flour, how much sugar?',
      'The ratio of students to teachers is {a}:{b}. With {c} students, how many teachers?'
    ],
    abstract: [
      'Given ratio a:b = {a}:{b} and b:c = {b}:{c}, find a:c'
    ],
    graphical: [],
    written: []
  },
  'MATH.PERC.004': {
    numeric: [
      'What is {a}% of {b}?',
      '{a} is what percent of {b}?',
      'Increase {b} by {a}%'
    ],
    verbal: [
      'Calculate {a} percent of {b}.',
      'Express {a} out of {b} as a percentage.'
    ],
    applied: [
      'A {b} dollar item is {a}% off. What is the sale price?',
      'Sales tax is {a}%. What is the total for a {b} dollar purchase?'
    ],
    abstract: [],
    graphical: [],
    written: []
  },
  'LANG.MAIN.002': {
    verbal: [
      'Read the passage and identify the main idea.',
      'What is the central theme of this text?',
      'Summarize the key point in one sentence.'
    ],
    written: [
      'Write a sentence that captures the main idea of the passage.',
      'In your own words, explain what this text is primarily about.'
    ],
    abstract: [
      'How does the author develop the central argument?',
      'What evidence supports the main claim?'
    ],
    numeric: [],
    applied: [],
    graphical: []
  },
  'SCI.SCI.001': {
    verbal: [
      'Describe the steps of the scientific method.',
      'What makes a hypothesis testable?',
      'Explain the difference between observation and inference.'
    ],
    applied: [
      'Design an experiment to test whether plants grow faster with more sunlight.',
      'Given this data, what conclusion can you draw?'
    ],
    written: [
      'Write a hypothesis for the following question: {context}',
      'Describe how you would test this prediction.'
    ],
    abstract: [],
    numeric: [],
    graphical: []
  }
};

const GENERIC_TEMPLATES: Record<RepresentationType, string[]> = {
  numeric: ['Solve: {prompt}', 'Calculate: {prompt}', 'Find the value: {prompt}'],
  verbal: ['Explain: {prompt}', 'Describe: {prompt}', 'In words, {prompt}'],
  applied: ['Apply to real life: {prompt}', 'Consider this scenario: {prompt}'],
  abstract: ['Think conceptually: {prompt}', 'Consider the pattern: {prompt}'],
  graphical: ['Interpret the graph: {prompt}', 'Draw or analyze: {prompt}'],
  written: ['Write about: {prompt}', 'Compose: {prompt}']
};

export class HomeworkEngine {
  private studentId: string;
  private struggleHistory: Map<string, number> = new Map();

  constructor(studentId: string) {
    this.studentId = studentId;
    this.loadHistory();
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(`homework_history_${this.studentId}`);
      if (stored) {
        this.struggleHistory = new Map(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load homework history:', e);
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(
        `homework_history_${this.studentId}`,
        JSON.stringify(Array.from(this.struggleHistory.entries()))
      );
    } catch (e) {
      console.warn('Failed to save homework history:', e);
    }
  }

  recordStruggle(skillNode: string): void {
    const current = this.struggleHistory.get(skillNode) || 0;
    this.struggleHistory.set(skillNode, current + 1);
    this.saveHistory();
  }

  recordSuccess(skillNode: string): void {
    const current = this.struggleHistory.get(skillNode) || 0;
    this.struggleHistory.set(skillNode, Math.max(0, current - 1));
    this.saveHistory();
  }

  getNextRepresentation(skillNode: string, currentRep: RepresentationType): RepresentationType {
    const node = skillGraph.getNode(skillNode);
    if (!node) return currentRep;

    const available = node.representations.filter(r => 
      REPRESENTATION_ORDER.includes(r)
    );
    
    if (available.length <= 1) return currentRep;

    const currentIndex = REPRESENTATION_ORDER.indexOf(currentRep);
    for (let i = 1; i <= REPRESENTATION_ORDER.length; i++) {
      const nextRep = REPRESENTATION_ORDER[(currentIndex + i) % REPRESENTATION_ORDER.length];
      if (available.includes(nextRep)) {
        return nextRep;
      }
    }
    return currentRep;
  }

  smoothDifficulty(skillNode: string): DifficultyParams {
    const struggles = this.struggleHistory.get(skillNode) || 0;
    
    if (struggles >= 3) {
      return {
        numberMagnitude: 'small',
        contextComplexity: 'simple',
        distractorCount: 0,
        stepCount: 1
      };
    } else if (struggles >= 1) {
      return {
        numberMagnitude: 'small',
        contextComplexity: 'moderate',
        distractorCount: 1,
        stepCount: 2
      };
    } else {
      return {
        numberMagnitude: 'medium',
        contextComplexity: 'moderate',
        distractorCount: 2,
        stepCount: 3
      };
    }
  }

  generateProblem(
    skillNode: string,
    seed: number,
    representation?: RepresentationType
  ): HomeworkProblem {
    const node = skillGraph.getNode(skillNode);
    if (!node) {
      throw new Error(`Unknown skill node: ${skillNode}`);
    }

    const rng = new SeededRandom(seed);
    const struggles = this.struggleHistory.get(skillNode) || 0;
    
    const rep = representation || 
      (struggles > 0 
        ? this.getNextRepresentation(skillNode, node.representations[0])
        : rng.choice(node.representations.filter(r => REPRESENTATION_ORDER.includes(r)) || ['verbal'] as RepresentationType[]));

    const difficultyParams = this.smoothDifficulty(skillNode);
    const templates = PROBLEM_TEMPLATES[skillNode]?.[rep] || GENERIC_TEMPLATES[rep];
    
    if (!templates || templates.length === 0) {
      return {
        id: `${skillNode}-${seed}`,
        skillNode,
        seed,
        difficulty: node.cognitiveLoad,
        representation: rep,
        prompt: `Practice ${node.name}`,
        hints: [`Review the concept of ${node.name}`]
      };
    }

    const template = rng.choice(templates);
    const numbers = this.generateNumbers(difficultyParams, rng);
    const prompt = this.fillTemplate(template, numbers);

    return {
      id: `${skillNode}-${seed}`,
      skillNode,
      seed,
      difficulty: node.cognitiveLoad,
      representation: rep,
      prompt,
      context: this.generateContext(node, difficultyParams, rng),
      hints: this.generateHints(node, rep, struggles)
    };
  }

  private generateNumbers(params: DifficultyParams, rng: SeededRandom): Record<string, number> {
    const ranges: Record<string, [number, number]> = {
      small: [1, 20],
      medium: [10, 100],
      large: [100, 1000]
    };
    const [min, max] = ranges[params.numberMagnitude];
    
    return {
      a: rng.nextInt(min, max),
      b: rng.nextInt(min, max),
      c: rng.nextInt(min, max)
    };
  }

  private fillTemplate(template: string, numbers: Record<string, number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => 
      numbers[key]?.toString() || key
    );
  }

  private generateContext(node: SkillNode, params: DifficultyParams, rng: SeededRandom): string {
    const contexts: Record<string, string[]> = {
      simple: [
        'This is a straightforward practice problem.',
        'Focus on the basic concept.',
        'Take your time with this one.'
      ],
      moderate: [
        'Apply what you know about ' + node.name,
        'Think about similar problems you\'ve solved.',
        'Use the skills you\'ve been developing.'
      ],
      complex: [
        'This problem connects multiple concepts.',
        'Consider different approaches.',
        'Think step by step.'
      ]
    };
    return rng.choice(contexts[params.contextComplexity]);
  }

  private generateHints(node: SkillNode, rep: RepresentationType, struggles: number): string[] {
    const hints: string[] = [];
    
    if (struggles > 0) {
      hints.push(`Let's try approaching ${node.name} differently.`);
    }
    
    hints.push(`Remember the key concept: ${node.description}`);
    
    if (rep === 'numeric') {
      hints.push('Work with the numbers step by step.');
    } else if (rep === 'verbal') {
      hints.push('Think about what the words are asking.');
    } else if (rep === 'applied') {
      hints.push('Connect this to a real situation you know.');
    }
    
    return hints;
  }

  generateHomeworkSet(
    skillNode: string,
    problemCount: number = 5,
    attemptNumber: number = 1
  ): HomeworkSet {
    const baseSeed = hashString(`${this.studentId}-${skillNode}-${attemptNumber}`);
    const problems: HomeworkProblem[] = [];
    
    for (let i = 0; i < problemCount; i++) {
      const seed = baseSeed + i * 1000;
      problems.push(this.generateProblem(skillNode, seed));
    }

    return {
      id: `hw-${Date.now()}`,
      studentId: this.studentId,
      skillNode,
      problems,
      createdAt: new Date().toISOString(),
      attemptNumber
    };
  }

  getReflectionPrompt(outcome: 'success' | 'struggle', skillNode: string): string {
    const node = skillGraph.getNode(skillNode);
    const name = node?.name || 'this concept';
    
    if (outcome === 'struggle') {
      const prompts = [
        `What part of ${name} felt unclear?`,
        'What would help you understand this better?',
        'Can you describe what you tried?',
        'What confused you about this problem?'
      ];
      return prompts[Math.floor(Math.random() * prompts.length)];
    } else {
      const prompts = [
        `What strategy helped you with ${name}?`,
        'Could you explain this to a classmate?',
        'What did you learn from this problem?',
        'How does this connect to what you already knew?'
      ];
      return prompts[Math.floor(Math.random() * prompts.length)];
    }
  }
}
