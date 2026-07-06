// The Academy - Dialogue Modulation System
// Implements stat-based NPC dialogue tone shifts, misread detection,
// and faction bias interpretation based on player build

import { GameStats } from '@shared/schema';

// -----------------------------
// Core Dialogue Axes
// -----------------------------
// These map the 17-stat system to 6 dialogue-influencing axes

export interface DialogueAxes {
  cognition: number;    // Pattern recognition, abstraction (mathLogic + linguistic)
  presence: number;     // Social gravity, authority (presence)
  resonance: number;    // Symbol literacy, metaphysical attunement (resonance)
  fortitude: number;    // Psychological endurance (fortitude)
  expression: number;   // Aesthetic fluency, creativity (musicCreative)
  faith: number;        // Commitment to belief (faith)
}

export type DialogueAxis = keyof DialogueAxes;

// Threshold definitions for dialogue shifts
export const AXIS_THRESHOLDS = {
  LOW: 30,      // Below this triggers "low" dialogue patterns
  HIGH: 70,     // Above this triggers "high" dialogue patterns
  VERY_HIGH: 90 // Above this triggers special recognition
};

// Map game stats to dialogue axes
export function calculateDialogueAxes(stats: GameStats): DialogueAxes {
  return {
    cognition: Math.round((stats.mathLogic + stats.linguistic) / 2),
    presence: stats.presence,
    resonance: stats.resonance,
    fortitude: stats.fortitude,
    expression: stats.musicCreative,
    faith: stats.faith
  };
}

// -----------------------------
// Dialogue Tone Profiles
// -----------------------------

export interface ToneProfile {
  vocabularyDensity: 'simple' | 'normal' | 'compressed';
  metaphorUse: 'literal' | 'balanced' | 'symbolic';
  authorityLevel: 'dismissive' | 'neutral' | 'deferential';
  ritualFormality: 'casual' | 'procedural' | 'ceremonial';
  emotionalRegister: 'cold' | 'neutral' | 'warm';
  certaintyCadence: 'hedging' | 'balanced' | 'absolute';
}

export function calculateToneProfile(axes: DialogueAxes): ToneProfile {
  return {
    vocabularyDensity: axes.cognition < AXIS_THRESHOLDS.LOW ? 'simple' 
      : axes.cognition >= AXIS_THRESHOLDS.HIGH ? 'compressed' : 'normal',
    
    metaphorUse: axes.resonance < AXIS_THRESHOLDS.LOW ? 'literal'
      : axes.resonance >= AXIS_THRESHOLDS.HIGH ? 'symbolic' : 'balanced',
    
    authorityLevel: axes.presence < AXIS_THRESHOLDS.LOW ? 'dismissive'
      : axes.presence >= AXIS_THRESHOLDS.HIGH ? 'deferential' : 'neutral',
    
    ritualFormality: axes.faith < AXIS_THRESHOLDS.LOW ? 'casual'
      : axes.faith >= AXIS_THRESHOLDS.HIGH ? 'ceremonial' : 'procedural',
    
    emotionalRegister: axes.expression < AXIS_THRESHOLDS.LOW ? 'cold'
      : axes.expression >= AXIS_THRESHOLDS.HIGH ? 'warm' : 'neutral',
    
    certaintyCadence: axes.fortitude < AXIS_THRESHOLDS.LOW ? 'hedging'
      : axes.fortitude >= AXIS_THRESHOLDS.HIGH ? 'absolute' : 'balanced'
  };
}

// -----------------------------
// Stat Conflict Misread System
// -----------------------------

export interface StatConflict {
  id: string;
  highStat: DialogueAxis;
  lowStat: DialogueAxis;
  misreadLabel: string;
  npcAssumption: string;
  dialogueDrift: string[];
  consequence: string;
  exampleDialogue: string;
}

export const STAT_CONFLICTS: StatConflict[] = [
  {
    id: 'brilliant_insignificant',
    highStat: 'cognition',
    lowStat: 'presence',
    misreadLabel: 'Brilliant but insignificant',
    npcAssumption: 'You understand everything—but lack the right to matter.',
    dialogueDrift: [
      'NPCs speak in compressed, intelligent language',
      'Then exclude you from decisions',
      'Credit ideas to others'
    ],
    consequence: 'You are used as a diagnostic tool, not a leader. Betrayal is more likely than confrontation.',
    exampleDialogue: "Yes, that's correct. Of course, implementation will be handled elsewhere."
  },
  {
    id: 'authority_without_insight',
    highStat: 'presence',
    lowStat: 'cognition',
    misreadLabel: 'Authority without insight',
    npcAssumption: 'You are powerful, but shallow—dangerous if bored.',
    dialogueDrift: [
      'NPCs simplify explanations excessively',
      'Over-ritualize speech to pad meaning',
      'Hide complexity behind ceremony'
    ],
    consequence: 'NPCs flatter and placate. Critical information is delayed or lost.',
    exampleDialogue: "There are... traditions. You needn't concern yourself with the finer mechanisms."
  },
  {
    id: 'symbol_literate_belief_resistant',
    highStat: 'resonance',
    lowStat: 'faith',
    misreadLabel: 'Symbol-literate, belief-resistant',
    npcAssumption: 'You see meaning but refuse to surrender to it.',
    dialogueDrift: [
      'NPCs speak in riddles that stop short of commitment',
      'Rituals are framed as optional or theatrical',
      'Prophecies are softened into hypotheticals'
    ],
    consequence: 'Mystical NPCs never fully trust you. Certain rites remain inert around you.',
    exampleDialogue: "You know what this gesture implies. Whether you allow it to matter is another question."
  },
  {
    id: 'devout_but_uncritical',
    highStat: 'faith',
    lowStat: 'cognition',
    misreadLabel: 'Devout but uncritical',
    npcAssumption: 'You will believe anything framed convincingly.',
    dialogueDrift: [
      'NPCs speak in absolutes',
      'Simplify doctrine into slogans',
      'Withhold contradictions'
    ],
    consequence: 'You are targeted for indoctrination. False paths open more readily.',
    exampleDialogue: "Don't trouble yourself with why. Obedience is the shape of understanding."
  },
  {
    id: 'unbreakable_disposable',
    highStat: 'fortitude',
    lowStat: 'presence',
    misreadLabel: 'Unbreakable, therefore disposable',
    npcAssumption: 'You can endure anything—and do not require consideration.',
    dialogueDrift: [
      'NPCs drop politeness',
      'Issue blunt orders',
      'Frame suffering as neutral logistics'
    ],
    consequence: 'You are assigned the most punishing tasks. Trauma is normalized.',
    exampleDialogue: "You'll survive. Others wouldn't."
  },
  {
    id: 'impressive_but_fragile',
    highStat: 'presence',
    lowStat: 'fortitude',
    misreadLabel: 'Impressive, but fragile',
    npcAssumption: 'Your authority is performative and easily cracked.',
    dialogueDrift: [
      'NPCs probe with veiled threats',
      'Offer false support',
      'Test boundaries publicly'
    ],
    consequence: 'Social traps increase. Reputation damage is more likely than violence.',
    exampleDialogue: "You're very composed. Let's see how that holds under review."
  },
  {
    id: 'articulate_without_substance',
    highStat: 'expression',
    lowStat: 'cognition',
    misreadLabel: 'Articulate without substance',
    npcAssumption: 'You sound convincing, but don\'t understand.',
    dialogueDrift: [
      'NPCs compliment style while doubting insight',
      'Reduce dialogue to aesthetics',
      'Avoid technical depth'
    ],
    consequence: 'You are used for morale, performance, distraction. Real decisions bypass you.',
    exampleDialogue: "Beautifully said. Now let someone else handle the mechanics."
  },
  {
    id: 'cold_inhuman_intelligence',
    highStat: 'cognition',
    lowStat: 'expression',
    misreadLabel: 'Cold, inhuman intelligence',
    npcAssumption: 'You compute, but do not feel.',
    dialogueDrift: [
      'NPCs stop explaining emotional stakes',
      'Speak in purely functional terms',
      'Treat you as a tool or auditor'
    ],
    consequence: 'Emotional alliances are harder. NPCs justify harsh actions in your presence.',
    exampleDialogue: "You don't need the context. Just the outcome."
  },
  {
    id: 'touched_but_irrelevant',
    highStat: 'resonance',
    lowStat: 'presence',
    misreadLabel: 'Touched, but irrelevant',
    npcAssumption: 'You are spiritually attuned but socially powerless.',
    dialogueDrift: [
      'NPCs indulge your insights without acting on them',
      'Treat visions as curiosities',
      'Praise intuition, ignore conclusions'
    ],
    consequence: 'You are consulted, not obeyed. Prophetic warnings go unheeded.',
    exampleDialogue: "That's... perceptive. Unfortunately, perception isn't authority."
  }
];

// Detect active stat conflicts based on current dialogue axes
export function detectStatConflicts(axes: DialogueAxes): StatConflict[] {
  const activeConflicts: StatConflict[] = [];
  
  for (const conflict of STAT_CONFLICTS) {
    const highValue = axes[conflict.highStat];
    const lowValue = axes[conflict.lowStat];
    
    // Conflict is active when high stat is above HIGH threshold
    // and low stat is below LOW threshold
    if (highValue >= AXIS_THRESHOLDS.HIGH && lowValue < AXIS_THRESHOLDS.LOW) {
      activeConflicts.push(conflict);
    }
  }
  
  return activeConflicts;
}

// -----------------------------
// Academy Faction Definitions
// -----------------------------

export interface FactionBias {
  id: string;
  name: string;
  motto: string;
  coreValue: string;
  overvalues: DialogueAxis[];
  misreadBias: string;
  dialogueWarp: string[];
  thrives: string;
  suffers: string;
  exampleDialogue: string;
}

export const ACADEMY_FACTIONS: FactionBias[] = [
  {
    id: 'censorium',
    name: 'The Censorium',
    motto: 'What can be measured can be trusted.',
    coreValue: 'Cognition, proof, internal consistency',
    overvalues: ['cognition'],
    misreadBias: 'Confuses low Expression or low Faith for dishonesty or absence.',
    dialogueWarp: [
      'Cold, compressed speech',
      'Emotional or symbolic statements are retranslated into data',
      'They speak around belief, not to it'
    ],
    thrives: 'High Cognition, low Faith builds. Players who tolerate emotional erasure.',
    suffers: 'Visionaries, artists, prophets. Anyone whose truth isn\'t replicable.',
    exampleDialogue: "Your conclusion is interesting. The method by which you arrived there is... unreviewable."
  },
  {
    id: 'convocation_of_seals',
    name: 'The Convocation of Seals',
    motto: 'Authority precedes understanding.',
    coreValue: 'Presence, ritual legitimacy',
    overvalues: ['presence'],
    misreadBias: 'Confuses Presence for competence. Assumes low Presence equals irrelevance.',
    dialogueWarp: [
      'Formal, ceremonial language',
      'Heavy use of titles and permissions',
      'Truth is secondary to who says it'
    ],
    thrives: 'High Presence builds. Characters who play hierarchy well.',
    suffers: 'Quiet intellectuals. Outsiders without credentials.',
    exampleDialogue: "We acknowledge your insight. The chamber, however, does not."
  },
  {
    id: 'resonant_choir',
    name: 'The Resonant Choir',
    motto: 'Meaning reveals itself to those who listen.',
    coreValue: 'Resonance, Expression',
    overvalues: ['resonance', 'expression'],
    misreadBias: 'Mistakes low Faith for spiritual hostility and low Cognition for purity.',
    dialogueWarp: [
      'Poetic, layered speech',
      'Passive-aggressive mysticism',
      'Riddles that punish literalism'
    ],
    thrives: 'High Resonance, high Expression. Players willing to perform belief.',
    suffers: 'Rational mystics. Critical thinkers who still feel deeply.',
    exampleDialogue: "You hear the harmony. You simply refuse to kneel to it."
  },
  {
    id: 'iron_faculty',
    name: 'The Iron Faculty',
    motto: 'Endurance is the only credential that matters.',
    coreValue: 'Fortitude',
    overvalues: ['fortitude'],
    misreadBias: 'Interprets vulnerability as deceit and Presence as softness.',
    dialogueWarp: [
      'Blunt, stripped-down language',
      'Praise sounds like threat',
      'Comfort is framed as inefficiency'
    ],
    thrives: 'High Fortitude builds. Players who accept cruelty as neutral.',
    suffers: 'Emotional or diplomatic characters. Anyone who needs recovery acknowledged.',
    exampleDialogue: "If this bothers you, say so. We'll stop pretending you belong."
  },
  {
    id: 'luminous_compact',
    name: 'The Luminous Compact',
    motto: 'Belief shapes reality faster than proof.',
    coreValue: 'Faith',
    overvalues: ['faith'],
    misreadBias: 'Confuses doubt with betrayal and Cognition with obstruction.',
    dialogueWarp: [
      'Absolutist language',
      'Future tense certainty',
      'Moral pressure disguised as reassurance'
    ],
    thrives: 'High Faith builds. Players who commit early and publicly.',
    suffers: 'Slow deciders. Characters who hold multiple truths.',
    exampleDialogue: "You wouldn't still be questioning if you were meant to lead."
  },
  {
    id: 'peripheral_office',
    name: 'The Peripheral Office',
    motto: 'If no one notices, it still counts.',
    coreValue: 'Function over recognition',
    overvalues: ['cognition', 'fortitude'],
    misreadBias: 'Assumes high Presence is a liability and Expression is inefficiency.',
    dialogueWarp: [
      'Flat, bureaucratic speech',
      'Important truths buried in mundane phrasing',
      'Passive resistance to spectacle'
    ],
    thrives: 'Low Presence, high Cognition or Fortitude. Stealth-social builds.',
    suffers: 'Leaders, performers, visionaries.',
    exampleDialogue: "That's not how we do things. Not because it's wrong. Because it attracts attention."
  }
];

// Get faction by ID
export function getFactionById(id: string): FactionBias | undefined {
  return ACADEMY_FACTIONS.find(f => f.id === id);
}

// Calculate faction affinity based on player axes
export function calculateFactionAffinity(axes: DialogueAxes): Record<string, number> {
  const affinities: Record<string, number> = {};
  
  for (const faction of ACADEMY_FACTIONS) {
    let score = 0;
    
    for (const valuedAxis of faction.overvalues) {
      score += axes[valuedAxis];
    }
    
    // Normalize to 0-100
    affinities[faction.id] = Math.min(100, Math.round(score / faction.overvalues.length));
  }
  
  return affinities;
}

// Detect faction-specific misreads
export function detectFactionMisread(axes: DialogueAxes, factionId: string): string | null {
  const faction = getFactionById(factionId);
  if (!faction) return null;
  
  // Check for stat patterns that trigger faction misreads
  switch (factionId) {
    case 'censorium':
      if (axes.expression < AXIS_THRESHOLDS.LOW || axes.faith < AXIS_THRESHOLDS.LOW) {
        return 'The Censorium questions your epistemic reliability.';
      }
      break;
    case 'convocation_of_seals':
      if (axes.presence < AXIS_THRESHOLDS.LOW) {
        return 'The Convocation views you as socially invisible.';
      }
      break;
    case 'resonant_choir':
      if (axes.faith < AXIS_THRESHOLDS.LOW && axes.resonance >= AXIS_THRESHOLDS.HIGH) {
        return 'The Choir distrusts your spiritual detachment.';
      }
      break;
    case 'iron_faculty':
      if (axes.fortitude < AXIS_THRESHOLDS.LOW) {
        return 'The Iron Faculty sees you as a manipulation risk.';
      }
      break;
    case 'luminous_compact':
      if (axes.cognition >= AXIS_THRESHOLDS.HIGH && axes.faith < AXIS_THRESHOLDS.LOW) {
        return 'The Compact views your analysis as obstruction.';
      }
      break;
    case 'peripheral_office':
      if (axes.presence >= AXIS_THRESHOLDS.HIGH) {
        return 'The Office considers your visibility a liability.';
      }
      break;
  }
  
  return null;
}

// -----------------------------
// Dialogue Modulation Functions
// -----------------------------

export interface ModulatedDialogue {
  originalLine: string;
  modulatedLine: string;
  toneAdjustments: string[];
  activeMisreads: string[];
  factionMisread?: string;
}

// Modulate a base dialogue line based on player stats
export function modulateDialogue(
  baseLine: string,
  axes: DialogueAxes,
  npcFactionId?: string
): ModulatedDialogue {
  const toneProfile = calculateToneProfile(axes);
  const conflicts = detectStatConflicts(axes);
  const toneAdjustments: string[] = [];
  let modulatedLine = baseLine;
  
  // Apply vocabulary density
  if (toneProfile.vocabularyDensity === 'simple') {
    toneAdjustments.push('Simplified language');
  } else if (toneProfile.vocabularyDensity === 'compressed') {
    toneAdjustments.push('Compressed, assumption-heavy language');
  }
  
  // Apply authority modulation
  if (toneProfile.authorityLevel === 'dismissive') {
    toneAdjustments.push('Dismissive, interrupting tone');
  } else if (toneProfile.authorityLevel === 'deferential') {
    toneAdjustments.push('Deferential, pausing before speaking');
  }
  
  // Apply metaphor usage
  if (toneProfile.metaphorUse === 'literal') {
    toneAdjustments.push('Literal, avoids symbolism');
  } else if (toneProfile.metaphorUse === 'symbolic') {
    toneAdjustments.push('Rich metaphorical language');
  }
  
  // Check faction misread
  let factionMisread: string | undefined;
  if (npcFactionId) {
    factionMisread = detectFactionMisread(axes, npcFactionId) || undefined;
  }
  
  return {
    originalLine: baseLine,
    modulatedLine,
    toneAdjustments,
    activeMisreads: conflicts.map(c => c.misreadLabel),
    factionMisread
  };
}

// Generate descriptive text based on stat conflicts
export function generateConflictAmbience(conflicts: StatConflict[]): string[] {
  if (conflicts.length === 0) return [];
  
  const descriptions: string[] = [];
  
  for (const conflict of conflicts) {
    switch (conflict.id) {
      case 'brilliant_insignificant':
        descriptions.push('Eyes follow your words but slide past your face.');
        break;
      case 'authority_without_insight':
        descriptions.push('Conversations pause when you approach, as if rearranging themselves.');
        break;
      case 'symbol_literate_belief_resistant':
        descriptions.push('Rituals seem to hesitate around you, half-completed.');
        break;
      case 'devout_but_uncritical':
        descriptions.push('Doctrine seems unusually simple when explained to you.');
        break;
      case 'unbreakable_disposable':
        descriptions.push('Tasks are assigned without preamble or apology.');
        break;
      case 'impressive_but_fragile':
        descriptions.push('Smiles carry an edge, as if testing for cracks.');
        break;
      case 'articulate_without_substance':
        descriptions.push('Applause comes easily, but responsibility does not.');
        break;
      case 'cold_inhuman_intelligence':
        descriptions.push('Emotional context is conspicuously absent from explanations.');
        break;
      case 'touched_but_irrelevant':
        descriptions.push('Your insights are noted with a tone of gentle dismissal.');
        break;
    }
  }
  
  return descriptions;
}

// -----------------------------
// Reputation Shift System
// -----------------------------

export interface MisreadCollapse {
  conflictId: string;
  triggerEvent: string;
  reputationShift: {
    factionId: string;
    delta: number;
    reason: string;
  }[];
  npcResponse: string;
}

export const MISREAD_COLLAPSES: MisreadCollapse[] = [
  {
    conflictId: 'brilliant_insignificant',
    triggerEvent: 'Player\'s idea succeeds publicly',
    reputationShift: [
      { factionId: 'censorium', delta: 15, reason: 'Forced to acknowledge practical brilliance' },
      { factionId: 'convocation_of_seals', delta: -5, reason: 'Embarrassed by their oversight' }
    ],
    npcResponse: 'There\'s a pause. Then a recalibration. You notice it in how they don\'t repeat themselves anymore.'
  },
  {
    conflictId: 'authority_without_insight',
    triggerEvent: 'Player demonstrates deep understanding',
    reputationShift: [
      { factionId: 'convocation_of_seals', delta: 20, reason: 'Authority confirmed with substance' },
      { factionId: 'censorium', delta: 10, reason: 'Surprised by hidden depth' }
    ],
    npcResponse: 'The ceremony continues, but the explanations stop. They\'re listening now.'
  },
  {
    conflictId: 'unbreakable_disposable',
    triggerEvent: 'Player refuses punishment assignment',
    reputationShift: [
      { factionId: 'iron_faculty', delta: -10, reason: 'Defied expectations' },
      { factionId: 'peripheral_office', delta: 10, reason: 'Showed political awareness' }
    ],
    npcResponse: 'Something shifts in their posture. They hadn\'t expected refusal to be an option.'
  }
];

// Export all types
export type { GameStats };
