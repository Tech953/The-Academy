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
  },
  // Faction-Specific Bias Profiles (from Theme Writing framework)
  {
    id: 'CENSORIUM_ANALYST',
    baseSuspicion: 0.25,
    fearAmplifier: 1.1,
    rules: [
      { condition: 'Faith > 0.7', reinterpretIntent: 'ReasoningFailure', suspicionDelta: 0.3 },
      { condition: 'Resonance > 0.6 AND musicCreative < 0.3', reinterpretIntent: 'MysticalNoise', suspicionDelta: 0.2 },
      { condition: 'mathLogic > 0.8 AND linguistic > 0.8', reinterpretIntent: 'PeerRecognition', suspicionDelta: -0.3 },
      { condition: 'mathLogic < 0.4', reinterpretIntent: 'InsufficientData', suspicionDelta: 0.25 }
    ]
  },
  {
    id: 'CONVOCATION_CEREMONIAL',
    baseSuspicion: 0.4,
    fearAmplifier: 1.3,
    rules: [
      { condition: 'Presence < 0.3', reinterpretIntent: 'SocialIrrelevance', suspicionDelta: 0.35 },
      { condition: 'Presence > 0.7 AND Fortitude > 0.7', reinterpretIntent: 'LegitimatePower', suspicionDelta: -0.25 },
      { condition: 'mathLogic > 0.7 AND Presence < 0.4', reinterpretIntent: 'InvisibleBrilliance', suspicionDelta: 0.15 },
      { condition: 'Fortitude > 0.8 AND Presence < 0.4', reinterpretIntent: 'ExpendableLabor', suspicionDelta: 0.2 }
    ]
  },
  {
    id: 'RESONANT_CHOIR_MYSTIC',
    baseSuspicion: 0.2,
    fearAmplifier: 1.0,
    rules: [
      { condition: 'Faith < 0.3 AND Resonance > 0.6', reinterpretIntent: 'SpiritualHostility', suspicionDelta: 0.4 },
      { condition: 'mathLogic < 0.3', reinterpretIntent: 'PureVessel', suspicionDelta: -0.2 },
      { condition: 'Resonance > 0.8 AND musicCreative > 0.7', reinterpretIntent: 'HarmonySeeker', suspicionDelta: -0.3 },
      { condition: 'mathLogic > 0.7 AND Faith < 0.4', reinterpretIntent: 'RationalBlasphemy', suspicionDelta: 0.35 }
    ]
  },
  {
    id: 'IRON_FACULTY_JUDGE',
    baseSuspicion: 0.5,
    fearAmplifier: 1.5,
    rules: [
      { condition: 'Fortitude < 0.3', reinterpretIntent: 'ManipulativeWeak', suspicionDelta: 0.4 },
      { condition: 'Presence > 0.7 AND Fortitude < 0.5', reinterpretIntent: 'PerformativeAuthority', suspicionDelta: 0.3 },
      { condition: 'Fortitude > 0.8', reinterpretIntent: 'EnduranceProven', suspicionDelta: -0.4 },
      { condition: 'Fortitude > 0.6 AND Presence < 0.3', reinterpretIntent: 'DisposableTool', suspicionDelta: 0.15 }
    ]
  },
  {
    id: 'LUMINOUS_COMPACT_FAITHFUL',
    baseSuspicion: 0.35,
    fearAmplifier: 1.2,
    rules: [
      { condition: 'Faith < 0.3', reinterpretIntent: 'DoubtAsBetrayal', suspicionDelta: 0.45 },
      { condition: 'mathLogic > 0.7 AND Faith < 0.5', reinterpretIntent: 'AnalyticalObstruction', suspicionDelta: 0.35 },
      { condition: 'Faith > 0.8', reinterpretIntent: 'TrueBelief', suspicionDelta: -0.35 },
      { condition: 'Resonance > 0.6 AND Faith > 0.6', reinterpretIntent: 'DestinyAligned', suspicionDelta: -0.2 }
    ]
  },
  {
    id: 'PERIPHERAL_OFFICE_BUREAUCRAT',
    baseSuspicion: 0.3,
    fearAmplifier: 0.9,
    rules: [
      { condition: 'Presence > 0.7', reinterpretIntent: 'VisibilityLiability', suspicionDelta: 0.3 },
      { condition: 'musicCreative > 0.6', reinterpretIntent: 'InefficiencyMarker', suspicionDelta: 0.2 },
      { condition: 'Presence < 0.4 AND mathLogic > 0.5', reinterpretIntent: 'DiscreetCompetence', suspicionDelta: -0.25 },
      { condition: 'Fortitude > 0.6 AND Presence < 0.4', reinterpretIntent: 'ReliableObscure', suspicionDelta: -0.2 }
    ]
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
      // Original misreads
      'Manipulation': `The ${objectName} seems to sense ulterior motives in your request...`,
      'Surveillance': `The ${objectName} notices your careful observation and grows wary.`,
      'Concealment': `Your prolonged silence makes the ${objectName} suspicious.`,
      'Aggression': `The ${objectName} perceives your forceful approach as a threat.`,
      'Casing': `The ${objectName} has noticed you watching too carefully, too often.`,
      'Suspicion': `Something about you puts the ${objectName} on edge.`,
      'Communion': `The ${objectName} resonates with your spiritual presence.`,
      'Corruption': `The ${objectName} recoils from what it senses in you.`,
      'Awakening': `The ${objectName} recognizes a kindred energy within you.`,
      // Censorium faction misreads
      'ReasoningFailure': `The ${objectName} regards your faith-based reasoning as epistemically unsound.`,
      'MysticalNoise': `The ${objectName} dismisses your symbolic insight as unmeasurable speculation.`,
      'PeerRecognition': `The ${objectName} nods in recognition of your analytical precision.`,
      'InsufficientData': `The ${objectName} speaks past you, as if to someone who might understand.`,
      // Convocation faction misreads  
      'SocialIrrelevance': `The ${objectName} looks through you as though you weren't present.`,
      'LegitimatePower': `The ${objectName} shifts posture, acknowledging your station.`,
      'InvisibleBrilliance': `The ${objectName} absorbs your insight without attributing it to you.`,
      'ExpendableLabor': `The ${objectName} assigns you the task without ceremony or thanks.`,
      // Resonant Choir faction misreads
      'SpiritualHostility': `The ${objectName} withdraws, sensing belief without surrender.`,
      'PureVessel': `The ${objectName} speaks to you in layered meaning, assuming receptivity.`,
      'HarmonySeeker': `The ${objectName}'s voice takes on a melodic, welcoming quality.`,
      'RationalBlasphemy': `The ${objectName} tenses, as if your analysis profaned something sacred.`,
      // Iron Faculty faction misreads
      'ManipulativeWeak': `The ${objectName} probes your response, testing for cracks.`,
      'PerformativeAuthority': `The ${objectName} smiles thinly. "Let's see how that holds."`,
      'EnduranceProven': `The ${objectName} drops pretense. Plain speech follows.`,
      'DisposableTool': `The ${objectName} issues orders without cushioning. You'll survive.`,
      // Luminous Compact faction misreads
      'DoubtAsBetrayal': `The ${objectName}'s warmth cools. Your hesitation has been noted.`,
      'AnalyticalObstruction': `The ${objectName} speaks in absolutes, cutting off your questions.`,
      'TrueBelief': `The ${objectName} includes you in sacred confidence.`,
      'DestinyAligned': `The ${objectName} speaks as if outcomes are already in motion.`,
      // Peripheral Office faction misreads
      'VisibilityLiability': `The ${objectName} glances around, uncomfortable with your presence.`,
      'InefficiencyMarker': `The ${objectName} redirects to procedure, ignoring your creative suggestion.`,
      'DiscreetCompetence': `The ${objectName} includes you in operational details others never see.`,
      'ReliableObscure': `The ${objectName} trusts you with unglamorous but critical work.`
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

// -----------------------------
// Ambient World Change System
// -----------------------------

export interface AmbientSignal {
  type: 'visual' | 'audio' | 'access' | 'spatial';
  description: string;
  intensity: number; // 0-1
}

export interface FactionAmbientProfile {
  factionId: string;
  positiveSignals: AmbientSignal[];
  negativeSignals: AmbientSignal[];
}

export const FACTION_AMBIENT_PROFILES: FactionAmbientProfile[] = [
  {
    factionId: 'censorium',
    positiveSignals: [
      { type: 'spatial', description: 'Workspaces brighten when you enter', intensity: 0.1 },
      { type: 'visual', description: 'Wall charts gain new annotations referencing your work', intensity: 0.3 },
      { type: 'access', description: 'Restricted archives become accessible through side corridors', intensity: 0.5 }
    ],
    negativeSignals: [
      { type: 'spatial', description: 'Workspaces become colder when you enter', intensity: 0.1 },
      { type: 'audio', description: 'Conversations stop mid-sentence, then resume with different terminology', intensity: 0.3 },
      { type: 'visual', description: 'Your prior contributions are reattributed to "system variance"', intensity: 0.5 }
    ]
  },
  {
    factionId: 'convocation_of_seals',
    positiveSignals: [
      { type: 'spatial', description: 'NPCs reposition themselves when you enter formal halls', intensity: 0.1 },
      { type: 'visual', description: 'Posters and banners update with symbolic references to you', intensity: 0.3 },
      { type: 'access', description: 'Doors open without verbal challenge', intensity: 0.5 }
    ],
    negativeSignals: [
      { type: 'audio', description: 'Footsteps echo longer; ceremonial chimes delay', intensity: 0.1 },
      { type: 'access', description: 'You are excluded from processions you helped enable', intensity: 0.3 },
      { type: 'visual', description: 'Your name is omitted during public recitations of events', intensity: 0.5 }
    ]
  },
  {
    factionId: 'resonant_choir',
    positiveSignals: [
      { type: 'spatial', description: 'Incense scents intensify pleasantly', intensity: 0.1 },
      { type: 'visual', description: 'Murals seem to shift expression warmly', intensity: 0.3 },
      { type: 'audio', description: 'Background chants harmonize when you approach', intensity: 0.5 }
    ],
    negativeSignals: [
      { type: 'spatial', description: 'Rites stall or loop in your presence', intensity: 0.1 },
      { type: 'audio', description: 'Background chants subtly change key when you approach', intensity: 0.3 },
      { type: 'visual', description: 'Murals crack along symbolic lines you questioned', intensity: 0.5 }
    ]
  },
  {
    factionId: 'iron_faculty',
    positiveSignals: [
      { type: 'spatial', description: 'Physical damage is quietly repaired', intensity: 0.1 },
      { type: 'visual', description: 'Training equipment calibrates to reasonable difficulty', intensity: 0.3 },
      { type: 'access', description: 'Unspoken latitude to refuse certain trials', intensity: 0.5 }
    ],
    negativeSignals: [
      { type: 'audio', description: 'The clang of tools dulls when you enter', intensity: 0.1 },
      { type: 'access', description: 'More "tests" are assigned without explanation', intensity: 0.3 },
      { type: 'visual', description: 'Your victories are no longer commemorated on damage boards', intensity: 0.5 }
    ]
  },
  {
    factionId: 'luminous_compact',
    positiveSignals: [
      { type: 'spatial', description: 'Sacred spaces brighten in your presence', intensity: 0.1 },
      { type: 'visual', description: 'Scripture marginal notes appear, questioning absolutes', intensity: 0.3 },
      { type: 'access', description: 'Invited to outcomes, not just sermons', intensity: 0.5 }
    ],
    negativeSignals: [
      { type: 'spatial', description: 'Sacred spaces dim unpredictably in your presence', intensity: 0.1 },
      { type: 'access', description: 'Excluded from declarations of prophecy', intensity: 0.3 },
      { type: 'visual', description: 'Your name becomes synonymous with "delay" in whispered doctrine', intensity: 0.5 }
    ]
  },
  {
    factionId: 'peripheral_office',
    positiveSignals: [
      { type: 'spatial', description: 'Temporary signs reroute traffic around you', intensity: 0.1 },
      { type: 'visual', description: 'Forms appear pre-filled with your known preferences', intensity: 0.3 },
      { type: 'access', description: 'Locked doors are unlocked before you arrive', intensity: 0.5 }
    ],
    negativeSignals: [
      { type: 'audio', description: 'Administrative whispers increase when you pass', intensity: 0.1 },
      { type: 'access', description: 'Surveillance blind spots narrow', intensity: 0.3 },
      { type: 'visual', description: 'Your file gains a redacted header: "Visibility Risk"', intensity: 0.5 }
    ]
  }
];

export function getAmbientSignals(
  factionId: string,
  reputationWithFaction: number
): AmbientSignal[] {
  const profile = FACTION_AMBIENT_PROFILES.find(p => p.factionId === factionId);
  if (!profile) return [];
  
  // Positive reputation (0.5-1.0) shows positive signals
  // Negative reputation (0-0.5) shows negative signals
  if (reputationWithFaction >= 0.5) {
    const intensity = (reputationWithFaction - 0.5) * 2; // Normalize to 0-1
    return profile.positiveSignals.filter(s => s.intensity <= intensity);
  } else {
    const intensity = (0.5 - reputationWithFaction) * 2; // Normalize to 0-1
    return profile.negativeSignals.filter(s => s.intensity <= intensity);
  }
}

// -----------------------------
// Confluence Hall (Shared Corridor)
// -----------------------------

export interface ConfluenceHallState {
  interferencePatterns: string[];
  ambientDescription: string;
  npcBehavior: string;
  activeLayersFromFactions: string[];
}

export interface StatInterferencePattern {
  highStat: string;
  lowStat?: string;
  conflictName: string;
  visualEffect: string;
  audioEffect: string;
  npcReaction: string;
}

export const CONFLUENCE_INTERFERENCE_PATTERNS: StatInterferencePattern[] = [
  {
    highStat: 'mathLogic',
    lowStat: undefined,
    conflictName: 'Cognition Dominance',
    visualEffect: 'Equations briefly align into symbols on the walls',
    audioEffect: 'A faint clicking, like chalk on slate, follows your steps',
    npcReaction: 'Other students slow their pace, as if processing'
  },
  {
    highStat: 'mathLogic',
    lowStat: 'faith',
    conflictName: 'Analytical Skeptic',
    visualEffect: 'Scripture annotations gain footnotes that fade before you can read them',
    audioEffect: 'Whispers sound like questions without answers',
    npcReaction: 'NPCs pause mid-walk, visibly unsettled'
  },
  {
    highStat: 'presence',
    lowStat: 'fortitude',
    conflictName: 'Fragile Authority',
    visualEffect: 'Floor markings subtly rearrange to trip your pacing',
    audioEffect: 'Heraldic shadows loom larger than you',
    npcReaction: 'Smiles carry an edge, as if testing for cracks'
  },
  {
    highStat: 'resonance',
    lowStat: 'faith',
    conflictName: 'Detached Perception',
    visualEffect: 'Harmonies detune when you stop walking',
    audioEffect: 'Murals avoid eye contact',
    npcReaction: 'Ritual markings glow, then dim in disappointment'
  },
  {
    highStat: 'musicCreative',
    lowStat: 'presence',
    conflictName: 'Unheard Artist',
    visualEffect: 'The corridor sounds beautiful—but empty',
    audioEffect: 'Echoes return distorted versions of your steps',
    npcReaction: 'Peripheral signage becomes dominant'
  },
  {
    highStat: 'fortitude',
    lowStat: 'presence',
    conflictName: 'Silent Endurance',
    visualEffect: 'Iron Faculty scars feel closer, heavier',
    audioEffect: 'The weight of old trials presses against the walls',
    npcReaction: 'NPCs assign tasks without preamble'
  },
  {
    highStat: 'faith',
    lowStat: 'mathLogic',
    conflictName: 'Uncritical Devotion',
    visualEffect: 'Light blooms around certain phrases carved into the walls',
    audioEffect: 'Doctrine sounds unusually simple',
    npcReaction: 'NPCs speak in absolutes, offering no contradictions'
  }
];

export const FACTION_CORRIDOR_LAYERS: Record<string, string[]> = {
  censorium: [
    'Whispering annotations etched faintly into stone',
    'Lines that resemble equations but never resolve',
    'Cold clarity in the air—breathing feels measured'
  ],
  convocation_of_seals: [
    'Processional markings in the floor',
    'Faded heraldic shadows that don\'t match current banners',
    'Subtle pressure to walk at a "proper" pace'
  ],
  resonant_choir: [
    'Low harmonic hum in the walls',
    'Murals that change expression depending on viewing angle',
    'Scent of incense that fades when approached'
  ],
  iron_faculty: [
    'Hairline cracks in load-bearing arches',
    'Old impact scars left unrepaired on purpose',
    'Temperature slightly cooler near the floor'
  ],
  luminous_compact: [
    'Light blooms around certain phrases carved into the walls',
    'Gold leaf repairs over older inscriptions',
    'Warmth that comes and goes unpredictably'
  ],
  peripheral_office: [
    'Utility markings: drain covers, access panels, numbered tiles',
    'Quiet airflow you can\'t quite feel',
    'Signage that looks temporary—but isn\'t'
  ]
};

export function generateConfluenceHallState(
  characterStats: Record<string, number>,
  factionReputations: Record<string, number>
): ConfluenceHallState {
  const interferencePatterns: string[] = [];
  const activeLayersFromFactions: string[] = [];
  
  // Check for active interference patterns based on stat conflicts
  for (const pattern of CONFLUENCE_INTERFERENCE_PATTERNS) {
    const highValue = characterStats[pattern.highStat] || 0;
    const lowValue = pattern.lowStat ? (characterStats[pattern.lowStat] || 0) : 50;
    
    // Pattern activates when high stat >= 70 and (if applicable) low stat < 30
    if (highValue >= 70) {
      if (!pattern.lowStat || lowValue < 30) {
        interferencePatterns.push(`${pattern.conflictName}: ${pattern.visualEffect}`);
      }
    }
  }
  
  // Determine which faction layers are most active based on reputation
  const sortedFactions = Object.entries(factionReputations)
    .sort(([, a], [, b]) => Math.abs(b - 0.5) - Math.abs(a - 0.5)) // Most deviated from neutral
    .slice(0, 3); // Top 3 most influential
  
  for (const [factionId] of sortedFactions) {
    const layers = FACTION_CORRIDOR_LAYERS[factionId];
    if (layers) {
      activeLayersFromFactions.push(...layers.slice(0, 1)); // Take first layer
    }
  }
  
  // Generate ambient description
  let ambientDescription = 'A long, gently curving passage. Stone that is neither polished nor ruined. ';
  ambientDescription += 'The ceiling is too high to feel safe, too low to feel grand. ';
  ambientDescription += 'Light source unclear—no visible torches or fixtures. ';
  
  if (interferencePatterns.length > 0) {
    ambientDescription += 'Something feels... unresolved here. ';
  }
  
  if (activeLayersFromFactions.length > 0) {
    ambientDescription += activeLayersFromFactions[0] + '. ';
  }
  
  // Generate NPC behavior description
  let npcBehavior = 'NPCs in the corridor ';
  if (interferencePatterns.length >= 2) {
    npcBehavior += 'slow down and change lanes, unsure how to navigate around you.';
  } else if (interferencePatterns.length === 1) {
    npcBehavior += 'stop pretending not to notice something about you.';
  } else {
    npcBehavior += 'pass without particular notice.';
  }
  
  return {
    interferencePatterns,
    ambientDescription,
    npcBehavior,
    activeLayersFromFactions
  };
}

// -----------------------------
// GED Culmination System
// -----------------------------

export interface DepartureVector {
  id: string;
  name: string;
  condition: string;
  exitDescription: string;
  npcConfirmation: string;
}

export const DEPARTURE_VECTORS: DepartureVector[] = [
  {
    id: 'analyst',
    name: 'The Analyst',
    condition: 'High Cognition, resolved faith conflict',
    exitDescription: 'You exit through a narrow, unmarked arch. The corridor behind you goes silent.',
    npcConfirmation: 'It stops asking once it knows what answer you\'ll give.'
  },
  {
    id: 'witness',
    name: 'The Witness',
    condition: 'High Resonance, high Expression',
    exitDescription: 'Light leads the way. Sound follows, harmonizing with your footsteps.',
    npcConfirmation: 'You\'re done being tested. Not done being wrong.'
  },
  {
    id: 'anchor',
    name: 'The Anchor',
    condition: 'High Fortitude, high Presence',
    exitDescription: 'The floor stabilizes beneath you. The ceiling lowers, as if making room.',
    npcConfirmation: 'The Academy will remember you stood here.'
  },
  {
    id: 'catalyst',
    name: 'The Catalyst',
    condition: 'Multiple faction misreads collapsed',
    exitDescription: 'The corridor fractures after you leave. Not breaking—reconfiguring.',
    npcConfirmation: 'They\'ll blame you. They\'ll also need you again.'
  },
  {
    id: 'shadow',
    name: 'The Shadow',
    condition: 'Low Presence, high competence',
    exitDescription: 'You exit through a maintenance corridor no one else notices.',
    npcConfirmation: 'If no one saw you leave, did you graduate?'
  }
];

export function determineGedCulmination(
  characterStats: Record<string, number>,
  factionMisreadsCollapsed: number,
  contradictionsEmbraced: boolean
): DepartureVector | null {
  // GED triggers when contradictions are embraced and misreads have collapsed
  if (factionMisreadsCollapsed < 2 || !contradictionsEmbraced) {
    return null;
  }
  
  const cognition = ((characterStats.mathLogic || 0) + (characterStats.linguistic || 0)) / 2;
  const presence = characterStats.presence || 0;
  const fortitude = characterStats.fortitude || 0;
  const resonance = characterStats.resonance || 0;
  const expression = characterStats.musicCreative || 0;
  
  // Determine departure vector based on dominant build
  if (cognition >= 70 && (characterStats.faith || 0) >= 50) {
    return DEPARTURE_VECTORS.find(d => d.id === 'analyst')!;
  }
  if (resonance >= 70 && expression >= 60) {
    return DEPARTURE_VECTORS.find(d => d.id === 'witness')!;
  }
  if (fortitude >= 70 && presence >= 60) {
    return DEPARTURE_VECTORS.find(d => d.id === 'anchor')!;
  }
  if (factionMisreadsCollapsed >= 4) {
    return DEPARTURE_VECTORS.find(d => d.id === 'catalyst')!;
  }
  if (presence < 30 && cognition >= 50) {
    return DEPARTURE_VECTORS.find(d => d.id === 'shadow')!;
  }
  
  // Default to most fitting based on highest stat
  return DEPARTURE_VECTORS[0];
}

