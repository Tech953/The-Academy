/**
 * Confluence Hall - Graduation Ceremony System
 * 
 * A multi-node journey through the mystical Confluence Hall,
 * where graduating students traverse from Entry Node to Departure Arch.
 * The path taken depends on player stats, choices, and accumulated wisdom.
 */

export type LightState = 'refracted' | 'occluded' | 'emergent' | 'intensified' | 'transcendent' | 'stabilized';
export type HarmonicState = 'dissonant' | 'harmonic' | 'null' | 'transitioning';
export type TriggerType = 'activation' | 'propagation' | 'meta' | 'dynamic';

export interface ConfluenceNode {
  id: string;
  name: string;
  geometryType: 'radial_convergence' | 'radial_branch' | 'central_hub' | 'fractal_spiral' | 'narrow_passage' | 'radial_orthogonal' | 'radial_exit';
  harmonicState: HarmonicState;
  lightState: LightState;
  ambientEffects: string[];
  description: string;
  triggers: string[];
  nextNode: string | null;
  optionalBranches: OptionalBranch[];
}

export interface OptionalBranch {
  id: string;
  name: string;
  condition: BranchCondition;
  targetNode: string;
  description: string;
}

export interface BranchCondition {
  type: 'stat_threshold' | 'contradiction' | 'memory' | 'choice';
  stat?: string;
  threshold?: number;
  comparison?: 'gte' | 'lte' | 'eq';
  value?: string | number;
}

export interface ContradictionMap {
  resolve: number;      // 0-10 scale
  weaponize: number;    // 0-10 scale
  passive: number;      // 0-10 scale
}

export interface DepartureVector {
  id: string;
  name: string;
  condition: string;
  exitDescription: string;
  npcConfirmation: string;
  dominantContradiction: keyof ContradictionMap;
}

export interface PlayerStats {
  cognition: number;
  presence: number;
  faith: number;
  fortitude: number;
}

export interface ConfluenceState {
  currentNode: string;
  visitedNodes: string[];
  branchesTaken: string[];
  triggerIntensity: {
    harmonic: number;
    dissonant: number;
    visual: number;
  };
  ngPlusMemory: number;
  playerComment: string | null;
}

// The 8 main nodes of Confluence Hall
export const CONFLUENCE_NODES: ConfluenceNode[] = [
  {
    id: 'entry_node',
    name: 'Entry Node',
    geometryType: 'radial_convergence',
    harmonicState: 'dissonant',
    lightState: 'refracted',
    ambientEffects: ['Echoed Footsteps', 'Glyph Pulse', 'NPC Freeze'],
    description: 'The threshold activates as you approach. Light bends around you, scattering into prismatic fragments. Your footsteps echo strangely, each sound arriving a moment after it should. Glyphs carved into the archway pulse with your heartbeat. Behind you, the NPCs you knew have frozen mid-gesture, watching.',
    triggers: ['Trigger Activation', 'Light Propagation'],
    nextNode: 'curved_junction',
    optionalBranches: []
  },
  {
    id: 'curved_junction',
    name: 'Curved Junction',
    geometryType: 'radial_branch',
    harmonicState: 'transitioning',
    lightState: 'occluded',
    ambientEffects: ['Metallic Clangs', 'Shadow Fracture', 'NPC Reposition'],
    description: 'The corridor curves impossibly, folding back on itself. Dissonance gives way to harmony as you walk. Light dims, occluded by geometries that shouldn\'t exist. Metallic sounds ring out from nowhere. Shadows fracture and reform. The NPCs have moved - they stand in different positions now, though you never saw them move.',
    triggers: [],
    nextNode: 'focal_hub',
    optionalBranches: [
      {
        id: 'fractal_loop',
        name: 'Fractal Loop',
        condition: { type: 'stat_threshold', stat: 'cognition', threshold: 6, comparison: 'gte' },
        targetNode: 'focal_hub',
        description: 'Your mind traces the recursive patterns. The loop reveals itself.'
      }
    ]
  },
  {
    id: 'focal_hub',
    name: 'Focal Hub',
    geometryType: 'central_hub',
    harmonicState: 'harmonic',
    lightState: 'emergent',
    ambientEffects: ['Choral Overlay', 'Drifting Objects'],
    description: 'You reach the center. All paths converge here. Harmony resonates through everything. Light emerges from the walls themselves, soft and warm. A chorus you cannot see sings in overlapping harmonies. Objects drift past - books, instruments, memories made manifest - orbiting the hub like satellites.',
    triggers: [],
    nextNode: 'spiral_descent',
    optionalBranches: [
      {
        id: 'orthogonal_branch',
        name: 'Orthogonal Branch',
        condition: { type: 'stat_threshold', stat: 'faith', threshold: 5, comparison: 'gte' },
        targetNode: 'spiral_descent',
        description: 'Faith shows you a path perpendicular to understanding. You take it.'
      }
    ]
  },
  {
    id: 'spiral_descent',
    name: 'Spiral Descent',
    geometryType: 'fractal_spiral',
    harmonicState: 'transitioning',
    lightState: 'intensified',
    ambientEffects: ['Whispered Marginalia', 'Dissonant Spiral'],
    description: 'The path spirals downward. Harmony and dissonance ripple through in waves. Light intensifies, almost too bright to bear. Whispers emerge from the margins of reality - fragments of knowledge you learned, questions you asked, doubts you harbored. The spiral suggests it could go forever.',
    triggers: [],
    nextNode: 'offset_gallery',
    optionalBranches: [
      {
        id: 'dissonant_loop',
        name: 'Dissonant Loop',
        condition: { type: 'contradiction', value: 'weaponize' },
        targetNode: 'offset_gallery',
        description: 'You embrace the dissonance. The loop amplifies it, then releases you.'
      }
    ]
  },
  {
    id: 'offset_gallery',
    name: 'Offset Gallery',
    geometryType: 'narrow_passage',
    harmonicState: 'harmonic',
    lightState: 'transcendent',
    ambientEffects: ['Harmonic Cascade', 'Gesture Alignment', 'Transcendent Flicker'],
    description: 'The passage narrows. You must move carefully, intentionally. Harmony surrounds you completely. Light flickers between states - present and transcendent. A cascade of harmonic tones flows through the gallery. Your gestures begin to align with something larger, as if you\'re conducting an invisible orchestra.',
    triggers: [],
    nextNode: 'transitional_arch',
    optionalBranches: []
  },
  {
    id: 'transitional_arch',
    name: 'Transitional Arch',
    geometryType: 'radial_orthogonal',
    harmonicState: 'null',
    lightState: 'transcendent',
    ambientEffects: ['Transcendent Light'],
    description: 'You pass beneath the arch. Something shifts fundamentally. Harmony dissolves into null - not silence, but the absence of the need for sound. Light becomes transcendent, no longer illuminating but revealing. You are between states now. What you were. What you will become.',
    triggers: ['Meta-Trigger Activation'],
    nextNode: 'convergence_node',
    optionalBranches: []
  },
  {
    id: 'convergence_node',
    name: 'Convergence Node',
    geometryType: 'radial_exit',
    harmonicState: 'harmonic',
    lightState: 'stabilized',
    ambientEffects: ['Aligned Pulse', 'Subtle Glyphs', 'Echoed Memory'],
    description: 'All paths lead here. The exit approaches. Harmony returns, stable and certain. Light stabilizes around you like armor. Pulses align with your breathing. Subtle glyphs write themselves in the air - your name, your journey, your departure vector. Echoes of memory surface and settle.',
    triggers: [],
    nextNode: 'departure_arch',
    optionalBranches: []
  },
  {
    id: 'departure_arch',
    name: 'Departure Arch',
    geometryType: 'radial_exit',
    harmonicState: 'harmonic',
    lightState: 'stabilized',
    ambientEffects: ['Aligned Pulse', 'Subtle Glyphs'],
    description: 'The final arch stands before you. Radial geometry leads outward. Harmony and stability hold you. The glyphs pulse one last time. Beyond this point, you are no longer a student. You are what The Academy made you - and what you made of yourself.',
    triggers: ['Trigger Activation', 'Light Propagation'],
    nextNode: null,
    optionalBranches: []
  }
];

// Departure Vectors based on dominant player characteristics
export const DEPARTURE_VECTORS: DepartureVector[] = [
  {
    id: 'the_analyst',
    name: 'The Analyst',
    condition: 'High Cognition, resolved faith conflict',
    exitDescription: 'You exit through a narrow, unmarked arch. The corridor behind you goes silent. Your mind has mapped every pattern. Now you carry the map.',
    npcConfirmation: 'It stops asking once it knows what answer you\'ll give.',
    dominantContradiction: 'resolve'
  },
  {
    id: 'the_witness',
    name: 'The Witness',
    condition: 'High Faith, high Expression',
    exitDescription: 'Light leads the way. Sound follows, harmonizing with your footsteps. You saw what others couldn\'t. Now you carry the seeing.',
    npcConfirmation: 'You\'re done being tested. Not done being wrong.',
    dominantContradiction: 'passive'
  },
  {
    id: 'the_anchor',
    name: 'The Anchor',
    condition: 'High Fortitude, high Presence',
    exitDescription: 'The floor stabilizes beneath you. The ceiling lowers, as if making room. You held when others wavered. Now you carry the weight.',
    npcConfirmation: 'The Academy will remember you stood here.',
    dominantContradiction: 'resolve'
  },
  {
    id: 'the_catalyst',
    name: 'The Catalyst',
    condition: 'Multiple faction misreads collapsed, high weaponize',
    exitDescription: 'The corridor fractures after you leave. Not breaking - reconfiguring. You changed what couldn\'t be changed. Now you carry the change.',
    npcConfirmation: 'They\'ll blame you. They\'ll also need you again.',
    dominantContradiction: 'weaponize'
  },
  {
    id: 'the_shadow',
    name: 'The Shadow',
    condition: 'Low Presence, high competence',
    exitDescription: 'You exit through a maintenance corridor no one else notices. Your absence was your presence. Now you carry the unseen.',
    npcConfirmation: 'If no one saw you leave, did you graduate?',
    dominantContradiction: 'passive'
  },
  {
    id: 'the_bridge',
    name: 'The Bridge',
    condition: 'Balanced stats, high passive',
    exitDescription: 'Two paths merge at your feet, becoming one. Neither side won - you connected them. Now you carry the connection.',
    npcConfirmation: 'Some graduates burn bridges. You built them.',
    dominantContradiction: 'passive'
  }
];

// Lookup a departure vector by ID
export function getDepartureVectorById(id: string): ConfluenceDepartureVector | undefined {
  return DEPARTURE_VECTORS.find(v => v.id === id);
}

// Calculate player stats from game stats
export function calculatePlayerStats(gameStats: Record<string, number>): PlayerStats {
  return {
    cognition: Math.round(((gameStats.mathLogic || 0) + (gameStats.linguistic || 0)) / 20), // 0-10 scale
    presence: Math.round((gameStats.presence || 0) / 10),
    faith: Math.round((gameStats.faith || 0) / 10),
    fortitude: Math.round((gameStats.fortitude || 0) / 10)
  };
}

// Calculate contradiction map from behavior patterns
export function calculateContradictionMap(
  misreadsCollapsed: number,
  contradictionsEmbraced: boolean,
  factionAffinities: Record<string, number>
): ContradictionMap {
  // Resolve: facing and solving contradictions directly
  const resolve = Math.min(10, misreadsCollapsed * 2 + (contradictionsEmbraced ? 3 : 0));
  
  // Weaponize: using contradictions to change outcomes
  const affinitiesTotals = Object.values(factionAffinities);
  const variance = affinitiesTotals.length > 0 
    ? Math.max(...affinitiesTotals) - Math.min(...affinitiesTotals) 
    : 0;
  const weaponize = Math.min(10, Math.round(variance * 10));
  
  // Passive: accepting contradictions without action
  const passive = Math.max(0, 10 - resolve - weaponize);
  
  return { resolve, weaponize, passive };
}

// Determine departure vector based on stats and contradiction map
export function determineDepartureVector(
  stats: PlayerStats,
  contradictions: ContradictionMap
): DepartureVector {
  // Find dominant contradiction approach
  const dominant = Object.entries(contradictions)
    .sort(([, a], [, b]) => b - a)[0][0] as keyof ContradictionMap;
  
  // Match based on stats and contradiction approach
  if (stats.cognition >= 6 && dominant === 'resolve') {
    return DEPARTURE_VECTORS.find(v => v.id === 'the_analyst')!;
  }
  if (stats.faith >= 6 && stats.presence >= 4) {
    return DEPARTURE_VECTORS.find(v => v.id === 'the_witness')!;
  }
  if (stats.fortitude >= 6 && stats.presence >= 5) {
    return DEPARTURE_VECTORS.find(v => v.id === 'the_anchor')!;
  }
  if (dominant === 'weaponize' && contradictions.weaponize >= 6) {
    return DEPARTURE_VECTORS.find(v => v.id === 'the_catalyst')!;
  }
  if (stats.presence <= 3 && stats.cognition >= 4) {
    return DEPARTURE_VECTORS.find(v => v.id === 'the_shadow')!;
  }
  
  // Default: The Bridge for balanced characters
  return DEPARTURE_VECTORS.find(v => v.id === 'the_bridge')!;
}

// Check if a branch condition is met
export function checkBranchCondition(
  condition: BranchCondition,
  stats: PlayerStats,
  contradictions: ContradictionMap
): boolean {
  switch (condition.type) {
    case 'stat_threshold':
      const statValue = stats[condition.stat as keyof PlayerStats] || 0;
      switch (condition.comparison) {
        case 'gte': return statValue >= (condition.threshold || 0);
        case 'lte': return statValue <= (condition.threshold || 0);
        case 'eq': return statValue === (condition.threshold || 0);
        default: return false;
      }
    case 'contradiction':
      const contradictionKey = condition.value as keyof ContradictionMap;
      return contradictions[contradictionKey] >= 5;
    case 'memory':
      return false; // NG+ feature
    default:
      return false;
  }
}

// Initialize a new Confluence Hall state
export function initializeConfluenceState(): ConfluenceState {
  return {
    currentNode: 'entry_node',
    visitedNodes: [],
    branchesTaken: [],
    triggerIntensity: {
      harmonic: 5,
      dissonant: 2,
      visual: 7
    },
    ngPlusMemory: 0,
    playerComment: null
  };
}

// Advance to the next node, considering branches
// Branches are ONLY taken when explicitly chosen by the player
export function advanceNode(
  state: ConfluenceState,
  stats: PlayerStats,
  contradictions: ContradictionMap,
  chooseBranch?: string
): { newState: ConfluenceState; node: ConfluenceNode; branchTaken?: OptionalBranch } {
  const currentNode = CONFLUENCE_NODES.find(n => n.id === state.currentNode);
  if (!currentNode) {
    return { 
      newState: state, 
      node: CONFLUENCE_NODES[0] 
    };
  }
  
  // Mark current node as visited
  const visitedNodes = [...state.visitedNodes, state.currentNode];
  
  // Branches are ONLY taken when explicitly chosen - not auto-triggered
  let branchTaken: OptionalBranch | undefined;
  let nextNodeId = currentNode.nextNode;
  
  // Only take branch if player explicitly chooses it
  if (chooseBranch) {
    const chosenBranch = currentNode.optionalBranches.find(b => b.id === chooseBranch);
    if (chosenBranch && checkBranchCondition(chosenBranch.condition, stats, contradictions)) {
      branchTaken = chosenBranch;
      nextNodeId = chosenBranch.targetNode;
    }
  }
  
  // Get next node
  const nextNode = CONFLUENCE_NODES.find(n => n.id === nextNodeId) || currentNode;
  
  // Update trigger intensities based on node properties
  const triggerIntensity = { ...state.triggerIntensity };
  if (nextNode.harmonicState === 'harmonic') {
    triggerIntensity.harmonic = Math.min(10, triggerIntensity.harmonic + 1);
  } else if (nextNode.harmonicState === 'dissonant') {
    triggerIntensity.dissonant = Math.min(10, triggerIntensity.dissonant + 1);
  }
  if (nextNode.lightState === 'transcendent' || nextNode.lightState === 'intensified') {
    triggerIntensity.visual = Math.min(10, triggerIntensity.visual + 1);
  }
  
  const newState: ConfluenceState = {
    ...state,
    currentNode: nextNode.id,
    visitedNodes,
    branchesTaken: branchTaken ? [...state.branchesTaken, branchTaken.id] : state.branchesTaken,
    triggerIntensity
  };
  
  return { newState, node: nextNode, branchTaken };
}

// Generate the complete graduation narrative
export function generateGraduationNarrative(
  stats: PlayerStats,
  contradictions: ContradictionMap,
  departureVector: DepartureVector
): string[] {
  const lines: string[] = [];
  
  lines.push('');
  lines.push('============================================');
  lines.push('      CONFLUENCE HALL - GRADUATION');
  lines.push('============================================');
  lines.push('');
  lines.push(`Departure Vector: ${departureVector.name}`);
  lines.push(`"${departureVector.condition}"`);
  lines.push('');
  
  // Stats summary
  lines.push('--- Your Journey ---');
  lines.push(`Cognition: ${'#'.repeat(stats.cognition)}${'_'.repeat(10 - stats.cognition)}`);
  lines.push(`Presence:  ${'#'.repeat(stats.presence)}${'_'.repeat(10 - stats.presence)}`);
  lines.push(`Faith:     ${'#'.repeat(stats.faith)}${'_'.repeat(10 - stats.faith)}`);
  lines.push(`Fortitude: ${'#'.repeat(stats.fortitude)}${'_'.repeat(10 - stats.fortitude)}`);
  lines.push('');
  
  // Contradiction map
  lines.push('--- Contradiction Map ---');
  lines.push(`Resolve:   ${'='.repeat(contradictions.resolve)}${'_'.repeat(10 - contradictions.resolve)}`);
  lines.push(`Weaponize: ${'+'.repeat(contradictions.weaponize)}${'_'.repeat(10 - contradictions.weaponize)}`);
  lines.push(`Passive:   ${'-'.repeat(contradictions.passive)}${'_'.repeat(10 - contradictions.passive)}`);
  lines.push('');
  
  return lines;
}
