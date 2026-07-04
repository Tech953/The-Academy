/**
 * Phase 1: Skill Graph Ontology
 * A directed, weighted graph of competencies instead of linear curriculum.
 * Each node represents a demonstrable capability, not a chapter.
 */

export type SkillDomain = 'Math' | 'Language' | 'Science' | 'Social' | 'Reasoning';
export type RepresentationType = 'numeric' | 'verbal' | 'applied' | 'abstract' | 'graphical' | 'written';
export type MasteryLevel = 'novice' | 'practiced' | 'fluent' | 'adaptive' | 'mentor';

export interface SkillNode {
  id: string;
  domain: SkillDomain;
  name: string;
  description: string;
  prerequisites: string[];
  cognitiveLoad: number;
  representations: RepresentationType[];
  gedAlignment?: string;
}

export interface SkillEdge {
  from: string;
  to: string;
  weight: number;
  type: 'hard' | 'soft';
}

export interface SkillGraphData {
  nodes: SkillNode[];
  edges: SkillEdge[];
  version: string;
}

const GED_SKILL_GRAPH: SkillGraphData = {
  version: '0.1.0',
  nodes: [
    { id: 'MATH.ARITH.001', domain: 'Math', name: 'Basic Arithmetic', description: 'Master fundamental operations with whole numbers', prerequisites: [], cognitiveLoad: 1, representations: ['numeric', 'verbal', 'applied'], gedAlignment: 'Mathematical Reasoning' },
    { id: 'MATH.FRAC.002', domain: 'Math', name: 'Fractions & Decimals', description: 'Work with fractions, decimals, and their conversions', prerequisites: ['MATH.ARITH.001'], cognitiveLoad: 2, representations: ['numeric', 'verbal', 'applied'], gedAlignment: 'Mathematical Reasoning' },
    { id: 'MATH.RATIO.003', domain: 'Math', name: 'Ratios & Proportions', description: 'Understand and apply ratios, rates, and proportions', prerequisites: ['MATH.FRAC.002'], cognitiveLoad: 2, representations: ['numeric', 'verbal', 'applied', 'graphical'], gedAlignment: 'Mathematical Reasoning' },
    { id: 'MATH.PERC.004', domain: 'Math', name: 'Percentages', description: 'Calculate and interpret percentages in various contexts', prerequisites: ['MATH.RATIO.003'], cognitiveLoad: 2, representations: ['numeric', 'verbal', 'applied'], gedAlignment: 'Mathematical Reasoning' },
    { id: 'MATH.ALGE.005', domain: 'Math', name: 'Algebraic Expressions', description: 'Write and simplify algebraic expressions', prerequisites: ['MATH.ARITH.001'], cognitiveLoad: 2, representations: ['numeric', 'abstract', 'verbal'], gedAlignment: 'Mathematical Reasoning' },
    { id: 'MATH.LINEQ.006', domain: 'Math', name: 'Linear Equations', description: 'Solve one and two-step linear equations', prerequisites: ['MATH.ALGE.005'], cognitiveLoad: 2, representations: ['numeric', 'graphical', 'verbal'], gedAlignment: 'Mathematical Reasoning' },
    { id: 'MATH.SYS.007', domain: 'Math', name: 'Systems of Equations', description: 'Solve systems of linear equations', prerequisites: ['MATH.LINEQ.006'], cognitiveLoad: 3, representations: ['numeric', 'graphical', 'applied'], gedAlignment: 'Mathematical Reasoning' },
    { id: 'MATH.GEOM.008', domain: 'Math', name: 'Basic Geometry', description: 'Understand shapes, angles, and basic measurements', prerequisites: ['MATH.ARITH.001'], cognitiveLoad: 2, representations: ['graphical', 'numeric', 'applied'], gedAlignment: 'Mathematical Reasoning' },
    { id: 'MATH.AREA.009', domain: 'Math', name: 'Area & Perimeter', description: 'Calculate area and perimeter of common shapes', prerequisites: ['MATH.GEOM.008', 'MATH.FRAC.002'], cognitiveLoad: 2, representations: ['graphical', 'numeric', 'applied'], gedAlignment: 'Mathematical Reasoning' },
    { id: 'MATH.VOL.010', domain: 'Math', name: 'Volume & Surface Area', description: 'Calculate volume and surface area of 3D shapes', prerequisites: ['MATH.AREA.009'], cognitiveLoad: 3, representations: ['graphical', 'numeric', 'applied'], gedAlignment: 'Mathematical Reasoning' },
    { id: 'MATH.STAT.011', domain: 'Math', name: 'Basic Statistics', description: 'Calculate mean, median, mode, and range', prerequisites: ['MATH.ARITH.001'], cognitiveLoad: 2, representations: ['numeric', 'graphical', 'verbal'], gedAlignment: 'Mathematical Reasoning' },
    { id: 'MATH.PROB.012', domain: 'Math', name: 'Probability', description: 'Calculate basic probability of events', prerequisites: ['MATH.RATIO.003', 'MATH.STAT.011'], cognitiveLoad: 3, representations: ['numeric', 'applied', 'abstract'], gedAlignment: 'Mathematical Reasoning' },

    { id: 'LANG.READ.001', domain: 'Language', name: 'Reading Comprehension', description: 'Understand and interpret written texts', prerequisites: [], cognitiveLoad: 1, representations: ['verbal', 'written'], gedAlignment: 'Language Arts' },
    { id: 'LANG.MAIN.002', domain: 'Language', name: 'Main Idea Identification', description: 'Identify main ideas and supporting details', prerequisites: ['LANG.READ.001'], cognitiveLoad: 2, representations: ['verbal', 'written'], gedAlignment: 'Language Arts' },
    { id: 'LANG.INFER.003', domain: 'Language', name: 'Making Inferences', description: 'Draw conclusions from textual evidence', prerequisites: ['LANG.MAIN.002'], cognitiveLoad: 2, representations: ['verbal', 'written', 'abstract'], gedAlignment: 'Language Arts' },
    { id: 'LANG.VOCAB.004', domain: 'Language', name: 'Vocabulary in Context', description: 'Determine word meanings from context', prerequisites: ['LANG.READ.001'], cognitiveLoad: 2, representations: ['verbal', 'written'], gedAlignment: 'Language Arts' },
    { id: 'LANG.GRAM.005', domain: 'Language', name: 'Grammar & Mechanics', description: 'Apply grammar rules and punctuation correctly', prerequisites: [], cognitiveLoad: 2, representations: ['verbal', 'written'], gedAlignment: 'Language Arts' },
    { id: 'LANG.SENT.006', domain: 'Language', name: 'Sentence Structure', description: 'Construct clear and varied sentences', prerequisites: ['LANG.GRAM.005'], cognitiveLoad: 2, representations: ['verbal', 'written'], gedAlignment: 'Language Arts' },
    { id: 'LANG.PARA.007', domain: 'Language', name: 'Paragraph Development', description: 'Write coherent paragraphs with topic sentences', prerequisites: ['LANG.SENT.006'], cognitiveLoad: 2, representations: ['written', 'verbal'], gedAlignment: 'Language Arts' },
    { id: 'LANG.ESSAY.008', domain: 'Language', name: 'Essay Writing', description: 'Compose structured essays with arguments', prerequisites: ['LANG.PARA.007', 'LANG.INFER.003'], cognitiveLoad: 3, representations: ['written', 'verbal', 'abstract'], gedAlignment: 'Language Arts' },
    { id: 'LANG.ARG.009', domain: 'Language', name: 'Argument Construction', description: 'Build and evaluate logical arguments', prerequisites: ['LANG.ESSAY.008'], cognitiveLoad: 3, representations: ['written', 'verbal', 'abstract'], gedAlignment: 'Language Arts' },

    { id: 'SCI.SCI.001', domain: 'Science', name: 'Scientific Method', description: 'Understand hypothesis, experimentation, and conclusion', prerequisites: [], cognitiveLoad: 1, representations: ['verbal', 'applied', 'written'], gedAlignment: 'Science' },
    { id: 'SCI.DATA.002', domain: 'Science', name: 'Data Interpretation', description: 'Read and interpret scientific data and graphs', prerequisites: ['SCI.SCI.001', 'MATH.STAT.011'], cognitiveLoad: 2, representations: ['graphical', 'numeric', 'verbal'], gedAlignment: 'Science' },
    { id: 'SCI.LIFE.003', domain: 'Science', name: 'Life Science Basics', description: 'Understand cells, organisms, and ecosystems', prerequisites: ['SCI.SCI.001'], cognitiveLoad: 2, representations: ['verbal', 'applied', 'graphical'], gedAlignment: 'Science' },
    { id: 'SCI.PHYS.004', domain: 'Science', name: 'Physical Science Basics', description: 'Understand matter, energy, and forces', prerequisites: ['SCI.SCI.001', 'MATH.ARITH.001'], cognitiveLoad: 2, representations: ['numeric', 'applied', 'verbal'], gedAlignment: 'Science' },
    { id: 'SCI.EARTH.005', domain: 'Science', name: 'Earth Science Basics', description: 'Understand Earth systems, weather, and geology', prerequisites: ['SCI.SCI.001'], cognitiveLoad: 2, representations: ['verbal', 'graphical', 'applied'], gedAlignment: 'Science' },
    { id: 'SCI.EXP.006', domain: 'Science', name: 'Experimental Design', description: 'Design and evaluate scientific experiments', prerequisites: ['SCI.DATA.002'], cognitiveLoad: 3, representations: ['applied', 'written', 'abstract'], gedAlignment: 'Science' },

    { id: 'SOC.USHIST.001', domain: 'Social', name: 'U.S. History Foundations', description: 'Understand key events in American history', prerequisites: [], cognitiveLoad: 2, representations: ['verbal', 'written'], gedAlignment: 'Social Studies' },
    { id: 'SOC.CIV.002', domain: 'Social', name: 'Civics & Government', description: 'Understand U.S. government structure and rights', prerequisites: [], cognitiveLoad: 2, representations: ['verbal', 'written', 'applied'], gedAlignment: 'Social Studies' },
    { id: 'SOC.ECON.003', domain: 'Social', name: 'Economics Basics', description: 'Understand economic concepts and systems', prerequisites: ['MATH.PERC.004'], cognitiveLoad: 2, representations: ['verbal', 'numeric', 'graphical'], gedAlignment: 'Social Studies' },
    { id: 'SOC.GEO.004', domain: 'Social', name: 'Geography & Maps', description: 'Read maps and understand geographic concepts', prerequisites: [], cognitiveLoad: 1, representations: ['graphical', 'verbal', 'applied'], gedAlignment: 'Social Studies' },
    { id: 'SOC.DOC.005', domain: 'Social', name: 'Document Analysis', description: 'Analyze primary and secondary historical sources', prerequisites: ['SOC.USHIST.001', 'LANG.INFER.003'], cognitiveLoad: 3, representations: ['verbal', 'written', 'abstract'], gedAlignment: 'Social Studies' },

    { id: 'REAS.CRIT.001', domain: 'Reasoning', name: 'Critical Thinking', description: 'Evaluate information and identify bias', prerequisites: ['LANG.INFER.003'], cognitiveLoad: 2, representations: ['verbal', 'abstract'], gedAlignment: 'Reasoning' },
    { id: 'REAS.PROB.002', domain: 'Reasoning', name: 'Problem Solving', description: 'Apply systematic approaches to solve problems', prerequisites: ['REAS.CRIT.001'], cognitiveLoad: 2, representations: ['abstract', 'applied', 'verbal'], gedAlignment: 'Reasoning' },
    { id: 'REAS.PAT.003', domain: 'Reasoning', name: 'Pattern Recognition', description: 'Identify and extend patterns across contexts', prerequisites: [], cognitiveLoad: 2, representations: ['abstract', 'numeric', 'graphical'], gedAlignment: 'Reasoning' },
    { id: 'REAS.SYNTH.004', domain: 'Reasoning', name: 'Synthesis', description: 'Combine information from multiple sources', prerequisites: ['REAS.CRIT.001', 'LANG.ARG.009'], cognitiveLoad: 3, representations: ['abstract', 'verbal', 'written'], gedAlignment: 'Reasoning' },
  ],
  edges: [
    { from: 'MATH.ARITH.001', to: 'MATH.FRAC.002', weight: 1, type: 'hard' },
    { from: 'MATH.FRAC.002', to: 'MATH.RATIO.003', weight: 1, type: 'hard' },
    { from: 'MATH.RATIO.003', to: 'MATH.PERC.004', weight: 1, type: 'hard' },
    { from: 'MATH.ARITH.001', to: 'MATH.ALGE.005', weight: 1, type: 'hard' },
    { from: 'MATH.ALGE.005', to: 'MATH.LINEQ.006', weight: 1, type: 'hard' },
    { from: 'MATH.LINEQ.006', to: 'MATH.SYS.007', weight: 1, type: 'hard' },
    { from: 'MATH.ARITH.001', to: 'MATH.GEOM.008', weight: 1, type: 'hard' },
    { from: 'MATH.GEOM.008', to: 'MATH.AREA.009', weight: 1, type: 'hard' },
    { from: 'MATH.FRAC.002', to: 'MATH.AREA.009', weight: 0.5, type: 'soft' },
    { from: 'MATH.AREA.009', to: 'MATH.VOL.010', weight: 1, type: 'hard' },
    { from: 'MATH.ARITH.001', to: 'MATH.STAT.011', weight: 1, type: 'hard' },
    { from: 'MATH.RATIO.003', to: 'MATH.PROB.012', weight: 1, type: 'hard' },
    { from: 'MATH.STAT.011', to: 'MATH.PROB.012', weight: 0.5, type: 'soft' },
    { from: 'LANG.READ.001', to: 'LANG.MAIN.002', weight: 1, type: 'hard' },
    { from: 'LANG.MAIN.002', to: 'LANG.INFER.003', weight: 1, type: 'hard' },
    { from: 'LANG.READ.001', to: 'LANG.VOCAB.004', weight: 1, type: 'hard' },
    { from: 'LANG.GRAM.005', to: 'LANG.SENT.006', weight: 1, type: 'hard' },
    { from: 'LANG.SENT.006', to: 'LANG.PARA.007', weight: 1, type: 'hard' },
    { from: 'LANG.PARA.007', to: 'LANG.ESSAY.008', weight: 1, type: 'hard' },
    { from: 'LANG.INFER.003', to: 'LANG.ESSAY.008', weight: 0.5, type: 'soft' },
    { from: 'LANG.ESSAY.008', to: 'LANG.ARG.009', weight: 1, type: 'hard' },
    { from: 'SCI.SCI.001', to: 'SCI.DATA.002', weight: 1, type: 'hard' },
    { from: 'MATH.STAT.011', to: 'SCI.DATA.002', weight: 0.5, type: 'soft' },
    { from: 'SCI.SCI.001', to: 'SCI.LIFE.003', weight: 1, type: 'hard' },
    { from: 'SCI.SCI.001', to: 'SCI.PHYS.004', weight: 1, type: 'hard' },
    { from: 'MATH.ARITH.001', to: 'SCI.PHYS.004', weight: 0.5, type: 'soft' },
    { from: 'SCI.SCI.001', to: 'SCI.EARTH.005', weight: 1, type: 'hard' },
    { from: 'SCI.DATA.002', to: 'SCI.EXP.006', weight: 1, type: 'hard' },
    { from: 'LANG.INFER.003', to: 'REAS.CRIT.001', weight: 0.5, type: 'soft' },
    { from: 'REAS.CRIT.001', to: 'REAS.PROB.002', weight: 1, type: 'hard' },
    { from: 'REAS.CRIT.001', to: 'REAS.SYNTH.004', weight: 0.5, type: 'soft' },
    { from: 'LANG.ARG.009', to: 'REAS.SYNTH.004', weight: 0.5, type: 'soft' },
    { from: 'SOC.USHIST.001', to: 'SOC.DOC.005', weight: 0.5, type: 'soft' },
    { from: 'LANG.INFER.003', to: 'SOC.DOC.005', weight: 0.5, type: 'soft' },
    { from: 'MATH.PERC.004', to: 'SOC.ECON.003', weight: 0.5, type: 'soft' },
  ]
};

export class SkillGraph {
  private nodes: Map<string, SkillNode> = new Map();
  private edges: SkillEdge[] = [];
  private adjacencyList: Map<string, string[]> = new Map();
  public readonly version: string;

  constructor(data: SkillGraphData = GED_SKILL_GRAPH) {
    this.version = data.version;
    this.loadGraph(data);
    this.validate();
  }

  private loadGraph(data: SkillGraphData): void {
    for (const node of data.nodes) {
      this.nodes.set(node.id, node);
      this.adjacencyList.set(node.id, []);
    }
    for (const edge of data.edges) {
      this.edges.push(edge);
      const adj = this.adjacencyList.get(edge.from);
      if (adj) adj.push(edge.to);
    }
  }

  private validate(): void {
    Array.from(this.nodes.entries()).forEach(([nodeId, node]) => {
      for (const prereq of node.prerequisites) {
        if (!this.nodes.has(prereq)) {
          console.warn(`Missing prerequisite ${prereq} for ${nodeId}`);
        }
      }
    });
    if (this.hasCycle()) {
      console.warn('Skill graph contains cycles - may cause infinite loops');
    }
  }

  private hasCycle(): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);
      const neighbors = this.adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
      recStack.delete(nodeId);
      return false;
    };

    for (const nodeId of Array.from(this.nodes.keys())) {
      if (!visited.has(nodeId) && dfs(nodeId)) return true;
    }
    return false;
  }

  getNode(id: string): SkillNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): SkillNode[] {
    return Array.from(this.nodes.values());
  }

  getNodesByDomain(domain: SkillDomain): SkillNode[] {
    return this.getAllNodes().filter(n => n.domain === domain);
  }

  getPrerequisites(nodeId: string): SkillNode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    return node.prerequisites.map(id => this.nodes.get(id)).filter((n): n is SkillNode => !!n);
  }

  getDependents(nodeId: string): SkillNode[] {
    return this.getAllNodes().filter(n => n.prerequisites.includes(nodeId));
  }

  getAvailableSkills(masteredSkills: Set<string>): SkillNode[] {
    return this.getAllNodes().filter(node => {
      if (masteredSkills.has(node.id)) return false;
      return node.prerequisites.every(prereq => masteredSkills.has(prereq));
    });
  }

  getLearningPath(targetId: string, masteredSkills: Set<string> = new Set()): SkillNode[] {
    const path: SkillNode[] = [];
    const visited = new Set<string>();

    const dfs = (nodeId: string): void => {
      if (visited.has(nodeId) || masteredSkills.has(nodeId)) return;
      visited.add(nodeId);
      const node = this.nodes.get(nodeId);
      if (!node) return;
      for (const prereq of node.prerequisites) {
        dfs(prereq);
      }
      path.push(node);
    };

    dfs(targetId);
    return path;
  }

  getSkillDifficulty(nodeId: string): number {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;
    const depth = this.getDepth(nodeId);
    return node.cognitiveLoad + (depth * 0.5);
  }

  private getDepth(nodeId: string, visited: Set<string> = new Set()): number {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);
    const node = this.nodes.get(nodeId);
    if (!node || node.prerequisites.length === 0) return 0;
    return 1 + Math.max(...node.prerequisites.map(p => this.getDepth(p, visited)));
  }

  toJSON(): SkillGraphData {
    return {
      version: this.version,
      nodes: this.getAllNodes(),
      edges: this.edges
    };
  }
}

export const skillGraph = new SkillGraph();
