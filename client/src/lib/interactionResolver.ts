// The Academy - Object Interaction Resolver System
// Implements bias interpretation, authority resolution, outcome projection,
// corridor mutations, and mythic flags for emergent gameplay

// -----------------------------
// Core Type Definitions
// -----------------------------

export type IntentEnum = 
  | 'Observe' 
  | 'Request' 
  | 'Force' 
  | 'Perform' 
  | 'Desecrate' 
  | 'Protect'
  | 'Examine'
  | 'Take'
  | 'Use'
  | 'Talk';

export interface BiasRule {
  condition: string;
  reinterpretIntent: string;
  suspicionDelta: number;
}

export interface BiasProfile {
  id: string;
  baseSuspicion: number;
  fearAmplifier: number;
  rules: BiasRule[];
}

export interface AuthorityRule {
  priority: number;
  condition: string;
  authorityHolder: 'Player' | 'Object' | 'Faction' | 'Mythic' | 'System';
}

export interface OutcomeProfile {
  id: string;
  physicalEffectWeight: number;
  accessEffectWeight: number;
  perceptionEffectWeight: number;
  narrativeEffectWeight: number;
  mythicEffectWeight: number;
}

export interface ObjectArchetype {
  id: string;
  name: string;
  defaultBiasProfile: string;
  defaultAuthorityRules: string;
  defaultOutcomeProfile: string;
  canInteract: IntentEnum[];
}

export interface CorridorMutationRule {
  id: string;
  trigger: string;
  visualShift: string;
  audioShift: string;
  accessShift: string;
}

export interface MythicFlag {
  id: string;
  triggerCondition: string;
  globalEffect: string;
  description: string;
}

export interface PlayerSignal {
  intent: IntentEnum;
  resonanceProfile: Record<string, number>;
  reputationVector: Record<string, number>;
  visibleStats: Record<string, number>;
  recentHistory: string[];
  silenceDuration?: number;
}

export interface Outcome {
  success: boolean;
  physicalChange: number;
  accessShift: number;
  perceptionFeedback: number;
  narrativeMemory: number;
  mythicRipple: number;
  perceivedIntent: string;
  originalIntent: IntentEnum;
  wasMisread: boolean;
  message: string;
  authorityHolder: string;
}

export interface CorridorState {
  visualShift?: string;
  audioShift?: string;
  accessShift?: string;
}

export interface WorldMemory {
  misreads: number;
  factionTension: Record<string, number>;
  corridorScars: string[];
  corridorState: Record<string, CorridorState>;
  activeMythicFlags: Record<string, boolean>;
  interactionHistory: Array<{
    objectId: string;
    intent: IntentEnum;
    outcome: string;
    timestamp: number;
  }>;
}

// -----------------------------
// Sample Data Tables
// -----------------------------

export const BIAS_PROFILES: BiasProfile[] = [
  {
    id: 'SCHOLAR_AUTHORITY',
    baseSuspicion: 0.3,
    fearAmplifier: 1.4,
    rules: [
      { condition: 'intent == Request AND Presence > Logic', reinterpretIntent: 'Manipulation', suspicionDelta: 0.2 },
      { condition: 'intent == Observe AND Resonance > 0.7', reinterpretIntent: 'Surveillance', suspicionDelta: 0.1 },
      { condition: 'silenceDuration > 3', reinterpretIntent: 'Concealment', suspicionDelta: 0.3 }
    ]
  },
  {
    id: 'GUARDIAN_VIGILANT',
    baseSuspicion: 0.5,
    fearAmplifier: 1.2,
    rules: [
      { condition: 'intent == Force', reinterpretIntent: 'Aggression', suspicionDelta: 0.4 },
      { condition: 'intent == Observe AND recentHistory.length > 3', reinterpretIntent: 'Casing', suspicionDelta: 0.2 },
      { condition: 'Karma < 0.3', reinterpretIntent: 'Suspicion', suspicionDelta: 0.3 }
    ]
  },
  {
    id: 'MYSTIC_RECEPTIVE',
    baseSuspicion: 0.1,
    fearAmplifier: 0.8,
    rules: [
      { condition: 'intent == Perform AND Resonance > 0.5', reinterpretIntent: 'Communion', suspicionDelta: -0.2 },
      { condition: 'intent == Desecrate', reinterpretIntent: 'Corruption', suspicionDelta: 0.5 },
      { condition: 'Chi > 0.7 OR Ashe > 0.7', reinterpretIntent: 'Awakening', suspicionDelta: -0.1 }
    ]
  },
  {
    id: 'NEUTRAL_OBJECT',
    baseSuspicion: 0.0,
    fearAmplifier: 1.0,
    rules: []
  }
];

export const AUTHORITY_RULES: AuthorityRule[] = [
  { priority: 0, condition: "mythicFlag == 'BlackSeal'", authorityHolder: 'Mythic' },
  { priority: 1, condition: 'ritualCompleted == true', authorityHolder: 'Object' },
  { priority: 2, condition: 'factionPermission >= 0.5', authorityHolder: 'Faction' },
  { priority: 3, condition: 'playerReputation > 0.7', authorityHolder: 'Player' },
  { priority: 4, condition: 'true', authorityHolder: 'Object' }
];

export const OUTCOME_PROFILES: OutcomeProfile[] = [
  {
    id: 'DENIAL_SOFT',
    physicalEffectWeight: 0.1,
    accessEffectWeight: 0.4,
    perceptionEffectWeight: 0.7,
    narrativeEffectWeight: 0.6,
    mythicEffectWeight: 0.0
  },
  {
    id: 'DENIAL_HARD',
    physicalEffectWeight: 0.3,
    accessEffectWeight: 0.8,
    perceptionEffectWeight: 0.5,
    narrativeEffectWeight: 0.7,
    mythicEffectWeight: 0.1
  },
  {
    id: 'GRANT_STANDARD',
    physicalEffectWeight: 0.5,
    accessEffectWeight: 0.6,
    perceptionEffectWeight: 0.4,
    narrativeEffectWeight: 0.5,
    mythicEffectWeight: 0.0
  },
  {
    id: 'GRANT_MYTHIC',
    physicalEffectWeight: 0.2,
    accessEffectWeight: 0.3,
    perceptionEffectWeight: 0.9,
    narrativeEffectWeight: 0.8,
    mythicEffectWeight: 0.6
  },
  {
    id: 'CONSEQUENCE_SEVERE',
    physicalEffectWeight: 0.8,
    accessEffectWeight: 0.9,
    perceptionEffectWeight: 0.6,
    narrativeEffectWeight: 0.9,
    mythicEffectWeight: 0.3
  }
];

export const OBJECT_ARCHETYPES: ObjectArchetype[] = [
  {
    id: 'LOCKED_DOOR',
    name: 'Locked Door',
    defaultBiasProfile: 'GUARDIAN_VIGILANT',
    defaultAuthorityRules: '4',
    defaultOutcomeProfile: 'DENIAL_SOFT',
    canInteract: ['Observe', 'Request', 'Force', 'Use']
  },
  {
    id: 'SACRED_ARTIFACT',
    name: 'Sacred Artifact',
    defaultBiasProfile: 'MYSTIC_RECEPTIVE',
    defaultAuthorityRules: '1',
    defaultOutcomeProfile: 'GRANT_MYTHIC',
    canInteract: ['Observe', 'Perform', 'Protect', 'Take']
  },
  {
    id: 'FACULTY_NPC',
    name: 'Faculty Member',
    defaultBiasProfile: 'SCHOLAR_AUTHORITY',
    defaultAuthorityRules: '2',
    defaultOutcomeProfile: 'DENIAL_HARD',
    canInteract: ['Observe', 'Request', 'Talk']
  },
  {
    id: 'STUDENT_NPC',
    name: 'Fellow Student',
    defaultBiasProfile: 'NEUTRAL_OBJECT',
    defaultAuthorityRules: '3',
    defaultOutcomeProfile: 'GRANT_STANDARD',
    canInteract: ['Observe', 'Request', 'Talk']
  },
  {
    id: 'MYSTERIOUS_SYMBOL',
    name: 'Mysterious Symbol',
    defaultBiasProfile: 'MYSTIC_RECEPTIVE',
    defaultAuthorityRules: '0',
    defaultOutcomeProfile: 'GRANT_MYTHIC',
    canInteract: ['Observe', 'Examine', 'Perform']
  }
];

export const CORRIDOR_MUTATION_RULES: CorridorMutationRule[] = [
  {
    id: 'FEAR_SPREADING',
    trigger: 'factionFear > 0.7',
    visualShift: 'lights_dim',
    audioShift: 'silence_deepen',
    accessShift: 'NPCs_avoid'
  },
  {
    id: 'TENSION_RISING',
    trigger: 'misreads >= 5',
    visualShift: 'shadows_lengthen',
    audioShift: 'whispers_echo',
    accessShift: 'doors_hesitate'
  },
  {
    id: 'MYTHIC_AWAKENING',
    trigger: "activeMythicFlags['BlackSeal'] == true",
    visualShift: 'symbols_glow',
    audioShift: 'resonance_hum',
    accessShift: 'hidden_paths_reveal'
  },
  {
    id: 'REPUTATION_COLLAPSE',
    trigger: 'playerReputation < 0.2',
    visualShift: 'eyes_follow',
    audioShift: 'murmurs_surround',
    accessShift: 'doors_lock'
  }
];

export const MYTHIC_FLAGS: MythicFlag[] = [
  {
    id: 'BlackSeal',
    triggerCondition: 'misreads >= 10',
    globalEffect: 'Doors question intent before opening',
    description: 'The Academy has learned to distrust. Every threshold demands proof of purpose.'
  },
  {
    id: 'WatchersEye',
    triggerCondition: 'factionTension.faculty > 0.8',
    globalEffect: 'Faculty NPCs share information about player',
    description: 'You are being watched. Word travels faster than you do.'
  },
  {
    id: 'ResonanceBloom',
    triggerCondition: 'Chi > 0.8 AND Ashe > 0.8',
    globalEffect: 'Hidden symbols become visible to player',
    description: 'Your spiritual attunement has opened your eyes to what was always there.'
  },
  {
    id: 'KarmicDebt',
    triggerCondition: 'Karma < 0.1',
    globalEffect: 'Random negative outcomes become more likely',
    description: 'The weight of your choices presses down. Fortune has turned away.'
  },
  {
    id: 'NagualAwakening',
    triggerCondition: 'Nagual > 0.9',
    globalEffect: 'Animal companions appear in dreams and visions',
    description: 'The spirit world recognizes you. Guides emerge from shadow.'
  }
];

// -----------------------------
// Dynamic Condition Evaluator
// -----------------------------

export function evaluateCondition(
  condition: string, 
  player: PlayerSignal, 
  world: WorldMemory,
  context: Record<string, any> = {}
): boolean {
  try {
    let expr = condition;
    
    // Replace intent (case-insensitive)
    expr = expr.replace(/\bintent\b/gi, `'${player.intent}'`);
    
    // Build a combined stats map with both original keys and uppercase versions
    const allStats: Record<string, number> = {};
    
    // Add resonance profile values
    Object.entries(player.resonanceProfile).forEach(([key, value]) => {
      allStats[key] = value || 0;
      allStats[key.toLowerCase()] = value || 0;
      allStats[key.charAt(0).toUpperCase() + key.slice(1)] = value || 0;
    });
    
    // Add visible stats
    Object.entries(player.visibleStats).forEach(([key, value]) => {
      allStats[key] = value || 0;
      allStats[key.toLowerCase()] = value || 0;
      allStats[key.charAt(0).toUpperCase() + key.slice(1)] = value || 0;
    });
    
    // Sort keys by length (longest first) to avoid partial replacements
    const sortedStatKeys = Object.keys(allStats).sort((a, b) => b.length - a.length);
    
    // Replace all stat references
    sortedStatKeys.forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      expr = expr.replace(regex, allStats[key]?.toString() || '0');
    });
    
    // Replace world state values
    expr = expr.replace(/\bmisreads\b/gi, world.misreads.toString());
    
    // Replace faction tensions
    Object.entries(world.factionTension).forEach(([key, value]) => {
      expr = expr.replace(new RegExp(`factionTension\\.${key}`, 'gi'), value?.toString() || '0');
    });
    expr = expr.replace(/\bfactionFear\b/gi, (world.factionTension.faculty || 0).toString());
    
    // Replace mythic flags
    Object.entries(world.activeMythicFlags).forEach(([key, value]) => {
      expr = expr.replace(
        new RegExp(`activeMythicFlags\\['${key}'\\]`, 'gi'), 
        value?.toString() || 'false'
      );
      expr = expr.replace(
        new RegExp(`mythicFlag\\s*==\\s*'${key}'`, 'gi'),
        value?.toString() || 'false'
      );
    });
    
    // Replace context values (case-insensitive)
    const sortedContextKeys = Object.keys(context).sort((a, b) => b.length - a.length);
    sortedContextKeys.forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      expr = expr.replace(regex, 
        typeof context[key] === 'string' ? `'${context[key]}'` : context[key]?.toString() || 'false'
      );
    });
    
    // Replace silence duration
    expr = expr.replace(/\bsilenceDuration\b/gi, player.silenceDuration?.toString() || '0');
    
    // Replace recent history length
    expr = expr.replace(/\brecentHistory\.length\b/gi, player.recentHistory.length.toString());
    
    // Replace logical operators
    expr = expr.replace(/\bAND\b/gi, '&&');
    expr = expr.replace(/\bOR\b/gi, '||');
    expr = expr.replace(/\bNOT\b/gi, '!');
    
    // Replace 'high' keyword with > 0.7 threshold check (handled in rules)
    expr = expr.replace(/\bhigh\b/gi, '> 0.7');
    
    // Replace any remaining undefined variable references with 0
    expr = expr.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (match) => {
      // Keep known operators and values
      if (['true', 'false', 'null', 'undefined'].includes(match.toLowerCase())) {
        return match;
      }
      // Check if it's a number
      if (!isNaN(Number(match))) {
        return match;
      }
      // Default unknown variables to 0
      return '0';
    });
    
    // Safely evaluate
    const safeEval = new Function('return ' + expr);
    return Boolean(safeEval());
  } catch (e) {
    console.warn(`Failed to evaluate condition: ${condition}`, e);
    return false;
  }
}

// -----------------------------
// Object Interaction Resolver
// -----------------------------

export function resolveInteraction(
  player: PlayerSignal,
  objectArchetype: ObjectArchetype,
  world: WorldMemory,
  context: Record<string, any> = {}
): Outcome {
  // Get linked profiles
  const biasProfile = BIAS_PROFILES.find(b => b.id === objectArchetype.defaultBiasProfile) 
    || BIAS_PROFILES.find(b => b.id === 'NEUTRAL_OBJECT')!;
  const outcomeProfile = OUTCOME_PROFILES.find(o => o.id === objectArchetype.defaultOutcomeProfile)
    || OUTCOME_PROFILES[0];
  
  // Phase 1: Bias Interpretation
  let perceivedIntent: string = player.intent;
  let totalSuspicionDelta = biasProfile.baseSuspicion;
  let wasMisread = false;
  
  for (const rule of biasProfile.rules) {
    if (evaluateCondition(rule.condition, player, world, context)) {
      perceivedIntent = rule.reinterpretIntent;
      totalSuspicionDelta += rule.suspicionDelta;
      wasMisread = true;
      break;
    }
  }
  
  // Phase 2: Authority Resolution
  let resolvedAuthority = 'Object';
  for (const rule of AUTHORITY_RULES.sort((a, b) => a.priority - b.priority)) {
    if (evaluateCondition(rule.condition, player, world, context)) {
      resolvedAuthority = rule.authorityHolder;
      break;
    }
  }
  
  // Phase 3: Outcome Projection
  const baseSuccess = resolvedAuthority === 'Player' || 
    (resolvedAuthority === 'Object' && !wasMisread) ||
    (resolvedAuthority === 'Faction' && (context.factionPermission ?? 0) >= 0.5);
  
  // Apply fear amplifier to suspicion
  const effectiveSuspicion = totalSuspicionDelta * biasProfile.fearAmplifier;
  
  // Calculate outcome weights
  const outcome: Outcome = {
    success: baseSuccess && effectiveSuspicion < 0.7,
    physicalChange: outcomeProfile.physicalEffectWeight * (baseSuccess ? 1 : -1),
    accessShift: outcomeProfile.accessEffectWeight * (baseSuccess ? 0.5 : -0.5),
    perceptionFeedback: outcomeProfile.perceptionEffectWeight * (wasMisread ? -1 : 1),
    narrativeMemory: outcomeProfile.narrativeEffectWeight,
    mythicRipple: outcomeProfile.mythicEffectWeight * (world.activeMythicFlags['BlackSeal'] ? 1.5 : 1),
    perceivedIntent,
    originalIntent: player.intent,
    wasMisread,
    authorityHolder: resolvedAuthority,
    message: generateOutcomeMessage(player.intent, perceivedIntent, wasMisread, baseSuccess, objectArchetype.name)
  };
  
  return outcome;
}

function generateOutcomeMessage(
  originalIntent: IntentEnum,
  perceivedIntent: string,
  wasMisread: boolean,
  success: boolean,
  objectName: string
): string {
  if (wasMisread) {
    const misreadMessages: Record<string, string> = {
      'Manipulation': `The ${objectName} seems to sense ulterior motives in your request...`,
      'Surveillance': `The ${objectName} notices your careful observation and grows wary.`,
      'Concealment': `Your prolonged silence makes the ${objectName} suspicious.`,
      'Aggression': `The ${objectName} perceives your forceful approach as a threat.`,
      'Casing': `The ${objectName} has noticed you watching too carefully, too often.`,
      'Suspicion': `Something about you puts the ${objectName} on edge.`,
      'Communion': `The ${objectName} resonates with your spiritual presence.`,
      'Corruption': `The ${objectName} recoils from what it senses in you.`,
      'Awakening': `The ${objectName} recognizes a kindred energy within you.`
    };
    return misreadMessages[perceivedIntent] || `The ${objectName} misunderstands your intentions...`;
  }
  
  if (success) {
    return `Your ${originalIntent.toLowerCase()} action on the ${objectName} succeeds.`;
  }
  
  return `The ${objectName} does not respond to your ${originalIntent.toLowerCase()} attempt.`;
}

// -----------------------------
// World Memory Management
// -----------------------------

export function createInitialWorldMemory(): WorldMemory {
  return {
    misreads: 0,
    factionTension: {
      faculty: 0.2,
      students: 0.1,
      mysterious: 0.0
    },
    corridorScars: [],
    corridorState: {},
    activeMythicFlags: {},
    interactionHistory: []
  };
}

export function updateWorldMemory(
  world: WorldMemory,
  outcome: Outcome,
  objectId: string,
  currentLocation?: string
): WorldMemory {
  const updatedWorld = { ...world };
  
  // Track misreads
  if (outcome.wasMisread) {
    updatedWorld.misreads += 1;
    
    // Add corridor scar on significant misreads
    if (currentLocation && updatedWorld.misreads % 3 === 0) {
      updatedWorld.corridorScars = [
        ...updatedWorld.corridorScars,
        `${currentLocation}: Misread echo ${updatedWorld.misreads}`
      ];
    }
    
    // Increase faction tension
    const tensionIncrease = 0.05;
    Object.keys(updatedWorld.factionTension).forEach(faction => {
      updatedWorld.factionTension[faction] = Math.min(1, 
        updatedWorld.factionTension[faction] + tensionIncrease
      );
    });
  }
  
  // Record interaction
  updatedWorld.interactionHistory = [
    ...updatedWorld.interactionHistory,
    {
      objectId,
      intent: outcome.originalIntent,
      outcome: outcome.success ? 'success' : 'failure',
      timestamp: Date.now()
    }
  ].slice(-50); // Keep last 50 interactions
  
  // Check and activate mythic flags
  for (const flag of MYTHIC_FLAGS) {
    if (!updatedWorld.activeMythicFlags[flag.id]) {
      // Simple trigger checks
      if (flag.id === 'BlackSeal' && updatedWorld.misreads >= 10) {
        updatedWorld.activeMythicFlags[flag.id] = true;
      }
      if (flag.id === 'WatchersEye' && updatedWorld.factionTension.faculty > 0.8) {
        updatedWorld.activeMythicFlags[flag.id] = true;
      }
      if (flag.id === 'KarmicDebt' && (outcome.perceptionFeedback < -0.5)) {
        updatedWorld.activeMythicFlags[flag.id] = true;
      }
    }
  }
  
  // Apply corridor mutations
  if (currentLocation) {
    for (const mutation of CORRIDOR_MUTATION_RULES) {
      // Simplified trigger evaluation
      let shouldApply = false;
      if (mutation.trigger.includes('misreads') && updatedWorld.misreads >= 5) {
        shouldApply = true;
      }
      if (mutation.trigger.includes('factionFear') && updatedWorld.factionTension.faculty > 0.7) {
        shouldApply = true;
      }
      if (mutation.trigger.includes('BlackSeal') && updatedWorld.activeMythicFlags['BlackSeal']) {
        shouldApply = true;
      }
      
      if (shouldApply) {
        updatedWorld.corridorState[currentLocation] = {
          visualShift: mutation.visualShift,
          audioShift: mutation.audioShift,
          accessShift: mutation.accessShift
        };
      }
    }
  }
  
  return updatedWorld;
}

// -----------------------------
// Helper: Create PlayerSignal from Character Stats
// -----------------------------

export function createPlayerSignalFromStats(
  intent: IntentEnum,
  characterStats: Record<string, number>,
  reputations: { faculty: number; students: number; mysterious: number },
  recentActions: string[] = []
): PlayerSignal {
  return {
    intent,
    resonanceProfile: {
      Resonance: characterStats.resonance || 0,
      Chi: characterStats.chi || 0,
      Ashe: characterStats.ashe || 0,
      Nagual: characterStats.nagual || 0
    },
    reputationVector: {
      faculty: reputations.faculty,
      students: reputations.students,
      mysterious: reputations.mysterious
    },
    visibleStats: {
      Presence: characterStats.presence || 0,
      Logic: characterStats.mathLogic || 0,
      Fortitude: characterStats.fortitude || 0,
      Karma: characterStats.karma || 0,
      Strength: characterStats.strength || 0,
      Faith: characterStats.faith || 0,
      Luck: characterStats.luck || 0
    },
    recentHistory: recentActions,
    silenceDuration: 0
  };
}

