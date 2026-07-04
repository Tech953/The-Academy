// The Academy — Resonance Engine
// A physics-based system for emergent narrative through energy transference,
// relational space, and quantum-inspired mechanics

// ============================================
// MATHEMATICAL FOUNDATIONS
// ============================================

export type EnergyVector = Record<string, number>;
export type ComplexAmplitude = { real: number; imag: number };
export type ComplexVector = Record<string, ComplexAmplitude>;
export type Position3D = [number, number, number];

// Vector operations
export function addVectors(a: EnergyVector, b: EnergyVector): EnergyVector {
  const result: EnergyVector = { ...a };
  for (const [key, val] of Object.entries(b)) {
    result[key] = (result[key] || 0) + val;
  }
  return result;
}

export function scaleVector(v: EnergyVector, s: number): EnergyVector {
  const result: EnergyVector = {};
  for (const [key, val] of Object.entries(v)) {
    result[key] = val * s;
  }
  return result;
}

export function dotProduct(a: EnergyVector, b: EnergyVector): number {
  let sum = 0;
  for (const key of Object.keys(a)) {
    sum += (a[key] || 0) * (b[key] || 0);
  }
  return sum;
}

export function vectorMagnitude(v: EnergyVector): number {
  return Math.sqrt(Object.values(v).reduce((sum, val) => sum + val * val, 0));
}

// Complex number operations for quantum mechanics
export function complexMultiply(a: ComplexAmplitude, b: ComplexAmplitude): ComplexAmplitude {
  return {
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real
  };
}

export function complexMagnitude(c: ComplexAmplitude): number {
  return Math.sqrt(c.real * c.real + c.imag * c.imag);
}

export function complexPhase(c: ComplexAmplitude): number {
  return Math.atan2(c.imag, c.real);
}

// ============================================
// ENERGY TYPES & PRIMITIVES
// ============================================

export const ENERGY_TYPES = {
  // Constructive energies
  FORCE: 'force',
  ORDER: 'order',
  CLARITY: 'clarity',
  CONNECTION: 'connection',
  COHERENCE: 'coherence',
  STILLNESS: 'stillness',
  HARMONY: 'harmony',
  GROWTH: 'growth',
  
  // Disruptive energies
  ENTROPY: 'entropy',
  FEAR: 'fear',
  DISTORTION: 'distortion',
  INSTABILITY: 'instability',
  CHAOS: 'chaos',
  DECAY: 'decay',
  
  // Spiritual energies
  FAITH: 'faith',
  KARMA: 'karma',
  CHI: 'chi',
  NAGUAL: 'nagual',
  ASHE: 'ashe'
} as const;

export type EnergyType = typeof ENERGY_TYPES[keyof typeof ENERGY_TYPES];

// Force modifiers that affect propagation
export const FORCE_MODIFIERS = {
  inertial: 0.8,      // Resists change
  amplifying: 1.3,    // Escalates future effects
  dampening: 0.6,     // Absorbs excess energy
  reflective: -0.5,   // Mirrors energy back
  fracturing: 1.0     // Creates divergent outcomes
} as const;

export type ForceType = keyof typeof FORCE_MODIFIERS;

// Action-to-energy mappings
export const ACTION_EMISSIONS: Record<string, EnergyVector> = {
  // Constructive actions
  teach: { order: 0.8, clarity: 0.7, connection: 0.5 },
  meditate: { coherence: 0.9, stillness: 0.8, harmony: 0.4 },
  help: { connection: 0.7, harmony: 0.5, growth: 0.3 },
  create: { growth: 0.8, harmony: 0.4, clarity: 0.3 },
  study: { clarity: 0.6, order: 0.5, growth: 0.4 },
  pray: { faith: 0.9, coherence: 0.5, stillness: 0.3 },
  
  // Disruptive actions
  attack: { force: 0.9, entropy: 0.6, fear: 0.5 },
  lie: { distortion: 0.8, instability: 0.6 },
  steal: { chaos: 0.6, distortion: 0.4, fear: 0.3 },
  betray: { distortion: 0.9, chaos: 0.7, decay: 0.5 },
  threaten: { fear: 0.8, force: 0.5, instability: 0.3 },
  
  // Neutral/complex actions
  observe: { clarity: 0.4 },
  speak: { connection: 0.3, clarity: 0.2 },
  question: { clarity: 0.5, instability: 0.2 },
  challenge: { force: 0.4, clarity: 0.3, instability: 0.3 },
  
  // Spiritual actions
  ritual: { faith: 0.7, ashe: 0.6, coherence: 0.5 },
  channel: { chi: 0.8, connection: 0.4 },
  dreamwalk: { nagual: 0.9, clarity: 0.3 },
  karma_action: { karma: 0.7 }
};

// ============================================
// RESONANCE FIELD
// ============================================

export interface ResonanceField {
  values: EnergyVector;
  phase: number;           // Quantum phase (0 to 2π)
  coherence: number;       // How stable the field is (0 to 1)
  lastUpdate: number;      // Timestamp
}

export function createField(values: EnergyVector = {}): ResonanceField {
  return {
    values: { ...values },
    phase: 0,
    coherence: 1.0,
    lastUpdate: Date.now()
  };
}

export function fieldInteract(target: ResonanceField, source: ResonanceField): ResonanceField {
  const newValues = { ...target.values };
  
  for (const [key, val] of Object.entries(source.values)) {
    if (key in newValues) {
      // Constructive/destructive interference based on phase
      const phaseDiff = Math.abs(target.phase - source.phase);
      const interference = Math.cos(phaseDiff);
      newValues[key] += val * 0.5 * interference;
    } else {
      newValues[key] = val * 0.3;
    }
  }
  
  return {
    values: newValues,
    phase: (target.phase + source.phase * 0.1) % (2 * Math.PI),
    coherence: target.coherence * 0.95,
    lastUpdate: Date.now()
  };
}

export function fieldDecay(field: ResonanceField, deltaTime: number, halfLife: number = 10): ResonanceField {
  const decayFactor = Math.pow(0.5, deltaTime / halfLife);
  const newValues: EnergyVector = {};
  
  for (const [key, val] of Object.entries(field.values)) {
    const decayed = val * decayFactor;
    if (Math.abs(decayed) > 0.001) {
      newValues[key] = decayed;
    }
  }
  
  return {
    ...field,
    values: newValues,
    coherence: Math.min(1, field.coherence + 0.01 * deltaTime),
    lastUpdate: Date.now()
  };
}

// ============================================
// QUANTUM STATE SYSTEM
// ============================================

export interface QuantumState {
  amplitudes: ComplexVector;
  collapsed: boolean;
  observedOutcome: string | null;
}

export function createSuperposition(possibilities: Record<string, number>): QuantumState {
  const amplitudes: ComplexVector = {};
  const entries = Object.entries(possibilities);
  
  // Guard against empty or zero-sum probabilities
  if (entries.length === 0) {
    return {
      amplitudes: { 'default': { real: 1, imag: 0 } },
      collapsed: false,
      observedOutcome: null
    };
  }
  
  const totalProb = Object.values(possibilities).reduce((a, b) => a + b, 0);
  
  // Guard against zero-sum probabilities
  if (totalProb <= 0) {
    const equalProb = 1 / entries.length;
    for (const [outcome] of entries) {
      amplitudes[outcome] = { real: Math.sqrt(equalProb), imag: 0 };
    }
    return {
      amplitudes,
      collapsed: false,
      observedOutcome: null
    };
  }
  
  for (const [outcome, prob] of entries) {
    const normalizedProb = prob / totalProb;
    const amplitude = Math.sqrt(normalizedProb);
    amplitudes[outcome] = { real: amplitude, imag: 0 };
  }
  
  return {
    amplitudes,
    collapsed: false,
    observedOutcome: null
  };
}

export function getProbability(state: QuantumState, outcome: string): number {
  const amp = state.amplitudes[outcome];
  if (!amp) return 0;
  return amp.real * amp.real + amp.imag * amp.imag;
}

export function collapseState(state: QuantumState): QuantumState {
  if (state.collapsed) return state;
  
  const outcomes = Object.keys(state.amplitudes);
  const probabilities: number[] = [];
  let cumulative = 0;
  
  for (const outcome of outcomes) {
    const prob = getProbability(state, outcome);
    cumulative += prob;
    probabilities.push(cumulative);
  }
  
  const roll = Math.random();
  let selectedOutcome = outcomes[outcomes.length - 1];
  
  for (let i = 0; i < outcomes.length; i++) {
    if (roll <= probabilities[i]) {
      selectedOutcome = outcomes[i];
      break;
    }
  }
  
  return {
    amplitudes: { [selectedOutcome]: { real: 1, imag: 0 } },
    collapsed: true,
    observedOutcome: selectedOutcome
  };
}

export function evolveState(state: QuantumState, phaseRotation: number): QuantumState {
  if (state.collapsed) return state;
  
  const newAmplitudes: ComplexVector = {};
  const rotator: ComplexAmplitude = {
    real: Math.cos(phaseRotation),
    imag: Math.sin(phaseRotation)
  };
  
  for (const [outcome, amp] of Object.entries(state.amplitudes)) {
    newAmplitudes[outcome] = complexMultiply(amp, rotator);
  }
  
  return {
    ...state,
    amplitudes: newAmplitudes
  };
}

// ============================================
// RELATIONAL GRAPH NODES
// ============================================

export type NodeType = 'npc' | 'location' | 'concept' | 'object' | 'faction' | 'player';

export interface ResonanceNode {
  id: string;
  type: NodeType;
  name: string;
  position: Position3D;           // Conceptual 3D space position
  field: ResonanceField;
  skills: SkillSet;
  infrastructure: InfrastructureState;
  inertia: number;                // Resistance to change (0-1)
  forceType: ForceType;           // How this node transforms energy
  quantumStates: Map<string, QuantumState>;  // Pending uncertain outcomes
  memory: ResonanceMemory[];      // History of significant resonance events
}

export interface SkillSet {
  excellence: number;   // Technical mastery (0-100)
  efficacy: number;     // Practical application (0-100)
  perception: number;   // Awareness of fields (0-100)
}

export interface InfrastructureState {
  development: number;    // Growth/improvement rate (0-100)
  maintenance: number;    // Upkeep level (0-100)
  capacity: number;       // Maximum load (0-100)
}

export interface ResonanceMemory {
  timestamp: number;
  sourceId: string;
  energyReceived: EnergyVector;
  impact: number;         // How strongly it affected this node
  context: string;        // What happened
}

export function createNode(
  id: string,
  type: NodeType,
  name: string,
  position: Position3D = [0, 0, 0]
): ResonanceNode {
  return {
    id,
    type,
    name,
    position,
    field: createField(),
    skills: { excellence: 50, efficacy: 50, perception: 50 },
    infrastructure: { development: 50, maintenance: 50, capacity: 100 },
    inertia: 0.5,
    forceType: 'inertial',
    quantumStates: new Map(),
    memory: []
  };
}

// ============================================
// RELATIONAL EDGES
// ============================================

export interface ResonanceEdge {
  sourceId: string;
  targetId: string;
  weights: EdgeWeights;
  conductivity: number;   // How well energy flows (0-1)
  lastInteraction: number;
}

export interface EdgeWeights {
  trust: number;          // -100 to 100
  fear: number;           // 0 to 100
  alignment: number;      // -100 to 100 (ideological)
  history: number;        // Accumulated interaction (-100 to 100)
  emotional: number;      // Emotional proximity (0 to 100)
  physical: number;       // Physical proximity modifier (0-1)
}

export function createEdge(sourceId: string, targetId: string): ResonanceEdge {
  return {
    sourceId,
    targetId,
    weights: {
      trust: 0,
      fear: 0,
      alignment: 0,
      history: 0,
      emotional: 0,
      physical: 1
    },
    conductivity: 0.5,
    lastInteraction: Date.now()
  };
}

export function calculateEdgeConductivity(edge: ResonanceEdge): number {
  const w = edge.weights;
  const trustFactor = (w.trust + 100) / 200;
  const fearFactor = (100 - w.fear) / 100;
  const emotionalFactor = w.emotional / 100;
  
  return (trustFactor * 0.4 + fearFactor * 0.2 + emotionalFactor * 0.3 + w.physical * 0.1);
}

// ============================================
// GEOMETRIC MANIFOLD
// ============================================

export function calculateDistance(a: Position3D, b: Position3D): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 +
    (a[1] - b[1]) ** 2 +
    (a[2] - b[2]) ** 2
  );
}

export function calculateCurvature(distance: number, sacredSite: boolean = false): number {
  // Curvature increases near sacred sites, causing reality warping
  const baseCurvature = Math.exp(-distance / 10);
  return sacredSite ? baseCurvature * 1.5 : baseCurvature;
}

export interface SacredZone {
  id: string;
  name: string;
  center: Position3D;
  radius: number;
  amplification: number;    // How much it amplifies resonance
  attuned: EnergyType[];    // Which energies it enhances
}

// ============================================
// RESONANCE ENGINE
// ============================================

export interface ResonanceWorld {
  nodes: Map<string, ResonanceNode>;
  edges: Map<string, ResonanceEdge>;
  sacredZones: SacredZone[];
  worldTime: number;
  tickCount: number;
  pendingPropagations: PropagationEvent[];
  crystallizedPatterns: CrystallizedPattern[];
}

export interface PropagationEvent {
  id: string;
  sourceId: string;
  energy: EnergyVector;
  depth: number;
  maxDepth: number;
  visitedNodes: Set<string>;
  timestamp: number;
}

export interface CrystallizedPattern {
  id: string;
  energySignature: EnergyVector;
  nodeIds: string[];
  strength: number;
  formed: number;
}

export function createWorld(): ResonanceWorld {
  return {
    nodes: new Map(),
    edges: new Map(),
    sacredZones: [],
    worldTime: 0,
    tickCount: 0,
    pendingPropagations: [],
    crystallizedPatterns: []
  };
}

function getEdgeKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export class ResonanceEngine {
  private world: ResonanceWorld;
  private listeners: Set<(world: ResonanceWorld) => void> = new Set();
  
  constructor() {
    this.world = createWorld();
  }
  
  // ---- Node Management ----
  
  addNode(node: ResonanceNode): void {
    this.world.nodes.set(node.id, node);
    this.notifyListeners();
  }
  
  getNode(id: string): ResonanceNode | undefined {
    return this.world.nodes.get(id);
  }
  
  removeNode(id: string): void {
    this.world.nodes.delete(id);
    // Remove associated edges
    for (const [key, edge] of Array.from(this.world.edges.entries())) {
      if (edge.sourceId === id || edge.targetId === id) {
        this.world.edges.delete(key);
      }
    }
    this.notifyListeners();
  }
  
  // ---- Edge Management ----
  
  addEdge(sourceId: string, targetId: string, weights?: Partial<EdgeWeights>): void {
    const key = getEdgeKey(sourceId, targetId);
    const edge = createEdge(sourceId, targetId);
    if (weights) {
      Object.assign(edge.weights, weights);
    }
    edge.conductivity = calculateEdgeConductivity(edge);
    this.world.edges.set(key, edge);
    this.notifyListeners();
  }
  
  getEdge(sourceId: string, targetId: string): ResonanceEdge | undefined {
    return this.world.edges.get(getEdgeKey(sourceId, targetId));
  }
  
  getEdgesFrom(nodeId: string): ResonanceEdge[] {
    const edges: ResonanceEdge[] = [];
    for (const edge of Array.from(this.world.edges.values())) {
      if (edge.sourceId === nodeId || edge.targetId === nodeId) {
        edges.push(edge);
      }
    }
    return edges;
  }
  
  // ---- Sacred Zones ----
  
  addSacredZone(zone: SacredZone): void {
    this.world.sacredZones.push(zone);
    this.notifyListeners();
  }
  
  isInSacredZone(position: Position3D): SacredZone | null {
    for (const zone of this.world.sacredZones) {
      if (calculateDistance(position, zone.center) <= zone.radius) {
        return zone;
      }
    }
    return null;
  }
  
  // ---- Action Emission ----
  
  emitAction(
    sourceId: string,
    actionType: string,
    targetId?: string,
    customEnergy?: EnergyVector
  ): void {
    let source = this.world.nodes.get(sourceId);
    
    // Auto-create source node if it doesn't exist (for world events, environment, etc.)
    if (!source) {
      source = createNode(sourceId, 'concept', sourceId, [0, 0, 0]);
      source.forceType = 'amplifying';
      this.world.nodes.set(sourceId, source);
    }
    
    // Get base energy emission from action
    let energy = customEnergy || ACTION_EMISSIONS[actionType] || {};
    energy = { ...energy };
    
    // Apply source skills modifier
    const skillMod = 1 + (source.skills.excellence - 50) / 100;
    energy = scaleVector(energy, skillMod);
    
    // Check sacred zone amplification
    const zone = this.isInSacredZone(source.position);
    if (zone) {
      for (const etype of zone.attuned) {
        if (etype in energy) {
          energy[etype] *= zone.amplification;
        }
      }
    }
    
    // Apply to source's own field
    source.field = fieldInteract(source.field, createField(energy));
    
    // If there's a direct target, propagate immediately
    if (targetId) {
      this.propagateToNode(sourceId, targetId, energy, 0);
    }
    
    // Queue propagation to connected nodes
    this.queuePropagation(sourceId, energy);
    
    this.notifyListeners();
  }
  
  // ---- Propagation ----
  
  private queuePropagation(sourceId: string, energy: EnergyVector): void {
    const event: PropagationEvent = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceId,
      energy,
      depth: 0,
      maxDepth: 3,
      visitedNodes: new Set([sourceId]),
      timestamp: Date.now()
    };
    this.world.pendingPropagations.push(event);
  }
  
  private propagateToNode(
    sourceId: string,
    targetId: string,
    energy: EnergyVector,
    depth: number
  ): void {
    const source = this.world.nodes.get(sourceId);
    const target = this.world.nodes.get(targetId);
    if (!source || !target) return;
    
    // Calculate distance and curvature
    const distance = calculateDistance(source.position, target.position);
    const zone = this.isInSacredZone(target.position);
    const curvature = calculateCurvature(distance, zone !== null);
    
    // Get edge conductivity
    const edge = this.getEdge(sourceId, targetId);
    const conductivity = edge ? calculateEdgeConductivity(edge) : 0.3;
    
    // Apply force modifier based on target's force type
    const forceModifier = FORCE_MODIFIERS[target.forceType];
    
    // Calculate energy transfer
    const depthDecay = Math.pow(0.5, depth);
    const totalModifier = curvature * conductivity * forceModifier * depthDecay * (1 - target.inertia);
    const transferredEnergy = scaleVector(energy, totalModifier);
    
    // Handle reflective force type
    if (target.forceType === 'reflective' && forceModifier < 0) {
      // Reflect some energy back
      const reflectedEnergy = scaleVector(energy, Math.abs(forceModifier) * conductivity);
      source.field = fieldInteract(source.field, createField(reflectedEnergy));
    }
    
    // Apply to target's field
    target.field = fieldInteract(target.field, createField(transferredEnergy));
    
    // Update skills based on energy received
    this.updateSkillsFromEnergy(target, transferredEnergy);
    
    // Record memory
    const impact = vectorMagnitude(transferredEnergy);
    if (impact > 0.1) {
      target.memory.push({
        timestamp: Date.now(),
        sourceId,
        energyReceived: transferredEnergy,
        impact,
        context: `Energy from ${source.name}`
      });
      
      // Limit memory size
      if (target.memory.length > 50) {
        target.memory = target.memory.slice(-50);
      }
    }
    
    // Update edge from interaction
    if (edge) {
      edge.weights.history += impact * (dotProduct(transferredEnergy, { connection: 1, harmony: 1 }) > 0 ? 1 : -1);
      edge.weights.history = Math.max(-100, Math.min(100, edge.weights.history));
      edge.lastInteraction = Date.now();
    }
    
    this.world.nodes.set(targetId, target);
    this.world.nodes.set(sourceId, source);
  }
  
  private updateSkillsFromEnergy(node: ResonanceNode, energy: EnergyVector): void {
    // Clarity and Order improve Excellence
    const excellenceDelta = (energy.clarity || 0) * 0.5 + (energy.order || 0) * 0.3;
    // Force and Growth improve Efficacy
    const efficacyDelta = (energy.force || 0) * 0.3 + (energy.growth || 0) * 0.4;
    // Coherence and Stillness improve Perception
    const perceptionDelta = (energy.coherence || 0) * 0.5 + (energy.stillness || 0) * 0.3;
    
    node.skills.excellence = Math.max(0, Math.min(100, node.skills.excellence + excellenceDelta));
    node.skills.efficacy = Math.max(0, Math.min(100, node.skills.efficacy + efficacyDelta));
    node.skills.perception = Math.max(0, Math.min(100, node.skills.perception + perceptionDelta));
  }
  
  // ---- Time Evolution ----
  
  tick(deltaTime: number = 1): void {
    this.world.tickCount++;
    this.world.worldTime += deltaTime;
    
    // Process pending propagations
    this.processPropagations();
    
    // Decay all fields
    for (const [id, node] of Array.from(this.world.nodes.entries())) {
      node.field = fieldDecay(node.field, deltaTime);
      
      // Infrastructure decay
      node.infrastructure.development *= (1 - 0.005 * deltaTime);
      node.infrastructure.maintenance *= (1 - 0.01 * deltaTime);
      
      // Clamp values
      node.infrastructure.development = Math.max(0, node.infrastructure.development);
      node.infrastructure.maintenance = Math.max(0, node.infrastructure.maintenance);
      
      // Evolve quantum states
      for (const [stateId, state] of Array.from(node.quantumStates.entries())) {
        if (!state.collapsed) {
          const evolved = evolveState(state, deltaTime * 0.1);
          node.quantumStates.set(stateId, evolved);
        }
      }
      
      this.world.nodes.set(id, node);
    }
    
    // Check for crystallization patterns every 10 ticks
    if (this.world.tickCount % 10 === 0) {
      this.detectCrystallization();
    }
    
    this.notifyListeners();
  }
  
  private processPropagations(): void {
    const remaining: PropagationEvent[] = [];
    
    for (const event of this.world.pendingPropagations) {
      if (event.depth >= event.maxDepth) continue;
      
      const source = this.world.nodes.get(event.sourceId);
      if (!source) continue;
      
      const edges = this.getEdgesFrom(event.sourceId);
      
      for (const edge of edges) {
        const targetId = edge.sourceId === event.sourceId ? edge.targetId : edge.sourceId;
        
        if (event.visitedNodes.has(targetId)) continue;
        
        // Propagate to this node
        this.propagateToNode(event.sourceId, targetId, event.energy, event.depth);
        
        // Create continuation event
        const nextEvent: PropagationEvent = {
          id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sourceId: targetId,
          energy: scaleVector(event.energy, 0.5),
          depth: event.depth + 1,
          maxDepth: event.maxDepth,
          visitedNodes: new Set([...Array.from(event.visitedNodes), targetId]),
          timestamp: Date.now()
        };
        
        if (vectorMagnitude(nextEvent.energy) > 0.05) {
          remaining.push(nextEvent);
        }
      }
    }
    
    this.world.pendingPropagations = remaining;
  }
  
  // ---- Quantum Observation ----
  
  addPendingOutcome(nodeId: string, stateId: string, possibilities: Record<string, number>): void {
    const node = this.world.nodes.get(nodeId);
    if (!node) return;
    
    node.quantumStates.set(stateId, createSuperposition(possibilities));
    this.world.nodes.set(nodeId, node);
    this.notifyListeners();
  }
  
  observe(nodeId: string, stateId: string): string | null {
    const node = this.world.nodes.get(nodeId);
    if (!node) return null;
    
    const state = node.quantumStates.get(stateId);
    if (!state) return null;
    
    const collapsed = collapseState(state);
    node.quantumStates.set(stateId, collapsed);
    
    // Emit energy based on observation
    if (collapsed.observedOutcome) {
      this.emitAction(nodeId, 'observe');
    }
    
    this.world.nodes.set(nodeId, node);
    this.notifyListeners();
    
    return collapsed.observedOutcome;
  }
  
  getProbabilities(nodeId: string, stateId: string): Record<string, number> | null {
    const node = this.world.nodes.get(nodeId);
    if (!node) return null;
    
    const state = node.quantumStates.get(stateId);
    if (!state) return null;
    
    const probs: Record<string, number> = {};
    for (const outcome of Object.keys(state.amplitudes)) {
      probs[outcome] = getProbability(state, outcome);
    }
    return probs;
  }
  
  // ---- Crystallization ----
  
  private detectCrystallization(): void {
    // Find nodes with similar high-magnitude fields
    const nodeList = Array.from(this.world.nodes.values());
    
    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const a = nodeList[i];
        const b = nodeList[j];
        
        const aMag = vectorMagnitude(a.field.values);
        const bMag = vectorMagnitude(b.field.values);
        
        if (aMag < 0.5 || bMag < 0.5) continue;
        
        // Check for similar energy signatures
        const dotProd = dotProduct(a.field.values, b.field.values);
        const similarity = dotProd / (aMag * bMag);
        
        if (similarity > 0.8) {
          // Check if already part of a pattern
          const existingPattern = this.world.crystallizedPatterns.find(
            p => p.nodeIds.includes(a.id) && p.nodeIds.includes(b.id)
          );
          
          if (existingPattern) {
            existingPattern.strength += 0.1;
          } else {
            // Create new crystallized pattern
            this.world.crystallizedPatterns.push({
              id: `crystal_${Date.now()}`,
              energySignature: addVectors(a.field.values, b.field.values),
              nodeIds: [a.id, b.id],
              strength: similarity,
              formed: this.world.worldTime
            });
          }
        }
      }
    }
    
    // Remove weak patterns
    this.world.crystallizedPatterns = this.world.crystallizedPatterns.filter(
      p => p.strength > 0.3
    );
  }
  
  // ---- Infrastructure ----
  
  invest(nodeId: string, type: 'development' | 'maintenance', amount: number): void {
    const node = this.world.nodes.get(nodeId);
    if (!node) return;
    
    node.infrastructure[type] = Math.min(100, node.infrastructure[type] + amount);
    
    // Development and maintenance have synergy
    if (type === 'development' && node.infrastructure.maintenance > 50) {
      node.infrastructure.development += amount * 0.1;
    }
    
    this.world.nodes.set(nodeId, node);
    this.notifyListeners();
  }
  
  getInfrastructureEffectiveness(nodeId: string): number {
    const node = this.world.nodes.get(nodeId);
    if (!node) return 0;
    
    const { development, maintenance, capacity } = node.infrastructure;
    // Balance formula: effectiveness = min(dev, maint) + (dev+maint)/4
    return Math.min(development, maintenance) * 0.6 + (development + maintenance) * 0.2;
  }
  
  // ---- Divine Interference ----
  
  divineIntervention(nodeId: string, energyType: EnergyType, magnitude: number): void {
    const node = this.world.nodes.get(nodeId);
    if (!node) return;
    
    // Divine intervention bypasses normal propagation
    const divineEnergy: EnergyVector = { [energyType]: magnitude };
    node.field = fieldInteract(node.field, createField(divineEnergy));
    
    // Also affects quantum states (increases coherence)
    for (const [stateId, state] of Array.from(node.quantumStates.entries())) {
      if (!state.collapsed) {
        // Shift probabilities based on energy type
        const newAmplitudes = { ...state.amplitudes };
        for (const outcome of Object.keys(newAmplitudes)) {
          if (outcome.toLowerCase().includes(energyType)) {
            newAmplitudes[outcome].real *= 1.5;
          }
        }
        node.quantumStates.set(stateId, { ...state, amplitudes: newAmplitudes });
      }
    }
    
    node.field.coherence = Math.min(1, node.field.coherence + 0.3);
    this.world.nodes.set(nodeId, node);
    this.notifyListeners();
  }
  
  // ---- Serialization ----
  
  serialize(): string {
    const serializable = {
      nodes: Array.from(this.world.nodes.entries()).map(([id, node]) => ({
        ...node,
        quantumStates: Array.from(node.quantumStates.entries())
      })),
      edges: Array.from(this.world.edges.entries()),
      sacredZones: this.world.sacredZones,
      worldTime: this.world.worldTime,
      tickCount: this.world.tickCount,
      crystallizedPatterns: this.world.crystallizedPatterns
    };
    return JSON.stringify(serializable);
  }
  
  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      this.world.nodes = new Map();
      for (const nodeData of parsed.nodes || []) {
        const node: ResonanceNode = {
          ...nodeData,
          quantumStates: new Map(nodeData.quantumStates || [])
        };
        this.world.nodes.set(node.id, node);
      }
      
      this.world.edges = new Map(parsed.edges || []);
      this.world.sacredZones = parsed.sacredZones || [];
      this.world.worldTime = parsed.worldTime || 0;
      this.world.tickCount = parsed.tickCount || 0;
      this.world.crystallizedPatterns = parsed.crystallizedPatterns || [];
      this.world.pendingPropagations = [];
      
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to deserialize resonance state:', e);
    }
  }
  
  // ---- Subscription ----
  
  subscribe(listener: (world: ResonanceWorld) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.world));
  }
  
  // ---- Getters ----
  
  getWorld(): ResonanceWorld {
    return this.world;
  }
  
  getWorldTime(): number {
    return this.world.worldTime;
  }
  
  getTickCount(): number {
    return this.world.tickCount;
  }
}

// Singleton instance
export const resonanceEngine = new ResonanceEngine();

// ============================================
// HELPER: Initialize Academy World
// ============================================

export function initializeAcademyResonanceWorld(): void {
  // Add core Academy locations as nodes
  const locations = [
    { id: 'main_hall', name: 'Main Hall', pos: [0, 0, 0] as Position3D },
    { id: 'library', name: 'Library', pos: [10, 0, 5] as Position3D },
    { id: 'gymnasium', name: 'Gymnasium', pos: [-10, 0, 5] as Position3D },
    { id: 'dormitory', name: 'Dormitory', pos: [0, 0, 15] as Position3D },
    { id: 'cafeteria', name: 'Cafeteria', pos: [5, 0, 10] as Position3D },
    { id: 'headmaster_office', name: "Headmaster's Office", pos: [0, 5, 0] as Position3D },
    { id: 'science_lab', name: 'Science Lab', pos: [15, 0, 0] as Position3D },
    { id: 'art_studio', name: 'Art Studio', pos: [-15, 0, 0] as Position3D },
    { id: 'meditation_garden', name: 'Meditation Garden', pos: [0, 0, -10] as Position3D },
    { id: 'underground', name: 'Underground Passages', pos: [0, -10, 0] as Position3D }
  ];
  
  for (const loc of locations) {
    const node = createNode(loc.id, 'location', loc.name, loc.pos);
    node.forceType = 'inertial';
    resonanceEngine.addNode(node);
  }
  
  // Add sacred zones
  resonanceEngine.addSacredZone({
    id: 'garden_sacred',
    name: 'Sacred Garden',
    center: [0, 0, -10],
    radius: 5,
    amplification: 1.5,
    attuned: ['stillness', 'coherence', 'harmony', 'chi']
  });
  
  resonanceEngine.addSacredZone({
    id: 'underground_sacred',
    name: 'Hidden Sanctum',
    center: [0, -10, 0],
    radius: 3,
    amplification: 2.0,
    attuned: ['nagual', 'ashe', 'faith']
  });
  
  // Connect locations
  const connections = [
    ['main_hall', 'library'],
    ['main_hall', 'gymnasium'],
    ['main_hall', 'cafeteria'],
    ['main_hall', 'headmaster_office'],
    ['main_hall', 'dormitory'],
    ['library', 'science_lab'],
    ['gymnasium', 'cafeteria'],
    ['dormitory', 'meditation_garden'],
    ['main_hall', 'underground']
  ];
  
  for (const [a, b] of connections) {
    resonanceEngine.addEdge(a, b, { trust: 50, physical: 1 });
  }
  
  // Add concept nodes
  const concepts = [
    { id: 'concept_truth', name: 'Truth', pos: [20, 10, 0] as Position3D },
    { id: 'concept_justice', name: 'Justice', pos: [20, 10, 5] as Position3D },
    { id: 'concept_wisdom', name: 'Wisdom', pos: [20, 10, -5] as Position3D },
    { id: 'concept_power', name: 'Power', pos: [-20, 10, 0] as Position3D },
    { id: 'concept_faith', name: 'Faith', pos: [0, 15, 0] as Position3D }
  ];
  
  for (const concept of concepts) {
    const node = createNode(concept.id, 'concept', concept.name, concept.pos);
    node.forceType = 'amplifying';
    node.inertia = 0.9; // Concepts are slow to change
    resonanceEngine.addNode(node);
  }
}
