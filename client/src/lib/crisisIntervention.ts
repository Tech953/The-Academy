/**
 * Crisis Intervention System - Watchwarden Hale
 * 
 * This module implements The Academy's crisis intervention protocols,
 * featuring Watchwarden Elias Hale as the primary intervention authority.
 * 
 * Based on:
 * - SCM (Safe Crisis Management) principles
 * - Ukeru trauma-informed approach
 * - Verbal de-escalation models
 * - Grounding techniques
 */

// -----------------------------
// Watchwarden Hale Character Profile
// -----------------------------

export interface WatchwardenProfile {
  id: string;
  name: string;
  title: string;
  role: string;
  description: string;
  visualPresence: string[];
  coreTraits: string[];
  beliefs: string[];
  dialogueStyle: {
    tone: string[];
    characteristics: string[];
  };
  backstory: string;
}

export const WATCHWARDEN_HALE: WatchwardenProfile = {
  id: 'watchwarden_hale',
  name: 'Elias Hale',
  title: 'Watchwarden',
  role: 'Director of Student Safety & Crisis Oversight',
  description: 'A tall figure in dark, structured attire. His presence is calm but immovable. Sharp gaze, never wavering. Everything about him is functional, purposeful. When he enters a scene, the world feels grounded.',
  visualPresence: [
    'Tall, commanding silhouette',
    'Dark coat-like overlayer (Academy uniform variation)',
    'Sharp, unwavering gaze',
    'Subdued color palette: deep gray, navy, charcoal',
    'Slight under-eye lines indicating vigilance',
    'Minimal ornamentation - everything functional'
  ],
  coreTraits: [
    'Hyper-intuitive: reads emotional intent, not just vocabulary',
    'Direct without being cruel',
    'Morally anchored: preserves life first',
    'Emotionally stoic but warm beneath',
    'Observational precision',
    'Protective to a fault'
  ],
  beliefs: [
    'People deserve safety, even when they cannot ask for it.',
    'Pain is not weakness. Silence is.',
    'We do not leave anyone to drown in their own thoughts.',
    'Step in early. Speak directly. Act decisively.',
    'Intervene first. Process later.'
  ],
  dialogueStyle: {
    tone: ['direct', 'clipped', 'purposeful', 'firm', 'emotionally controlled'],
    characteristics: [
      'Low, slow, supportive tone',
      'Pattern-interruption phrases',
      'Reflective listening',
      'Intentional pauses',
      'Non-retaliatory posture'
    ]
  },
  backstory: 'Hale spent 13 years as a crisis intervention specialist in a high-acuity youth facility before joining The Academy. Certified in SCM, trained in Ukeru, practiced in verbal de-escalation. His transfer to Crisis Oversight was requested because of his unmatched intuition and reputation for stepping in when others hesitated. He carries unspoken memories of those he could not save, and this fuels his precision and urgency. But he does not project trauma onto students. He projects protection.'
};

// -----------------------------
// Crisis Detection System
// -----------------------------

export interface EscalationMarker {
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'hopelessness' | 'worthlessness' | 'isolation' | 'harm' | 'escape' | 'spiral';
  responseType: 'redirect' | 'ground' | 'stabilize' | 'halt';
}

export const ESCALATION_MARKERS: EscalationMarker[] = [
  // Low severity - redirect
  { pattern: /nothing matters/i, severity: 'low', category: 'hopelessness', responseType: 'redirect' },
  { pattern: /what('s| is) the point/i, severity: 'low', category: 'hopelessness', responseType: 'redirect' },
  { pattern: /no one (cares|understands)/i, severity: 'low', category: 'isolation', responseType: 'redirect' },
  
  // Medium severity - ground
  { pattern: /i('m| am) (so )?alone/i, severity: 'medium', category: 'isolation', responseType: 'ground' },
  { pattern: /i can('t| not) (do|take) this/i, severity: 'medium', category: 'hopelessness', responseType: 'ground' },
  { pattern: /i('m| am) worthless/i, severity: 'medium', category: 'worthlessness', responseType: 'ground' },
  { pattern: /i('m| am) (a )?failure/i, severity: 'medium', category: 'worthlessness', responseType: 'ground' },
  
  // High severity - stabilize
  { pattern: /i don('t| not) want to (be here|exist|continue)/i, severity: 'high', category: 'escape', responseType: 'stabilize' },
  { pattern: /i wish i (wasn't|weren't|was not) here/i, severity: 'high', category: 'escape', responseType: 'stabilize' },
  { pattern: /everyone would be better (off )?without me/i, severity: 'high', category: 'worthlessness', responseType: 'stabilize' },
  
  // Critical severity - halt (immediate intervention)
  { pattern: /i want to (hurt|harm) (myself|me)/i, severity: 'critical', category: 'harm', responseType: 'halt' },
  { pattern: /i want to (die|end it|disappear forever)/i, severity: 'critical', category: 'harm', responseType: 'halt' },
  { pattern: /i('m| am) (going to|gonna) (hurt|harm|kill)/i, severity: 'critical', category: 'harm', responseType: 'halt' }
];

export interface EscalationAssessment {
  detected: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  markers: EscalationMarker[];
  categories: string[];
  responseType: 'none' | 'redirect' | 'ground' | 'stabilize' | 'halt';
  triggerPhrase?: string;
}

export function assessEscalation(input: string): EscalationAssessment {
  const foundMarkers: EscalationMarker[] = [];
  const categories = new Set<string>();
  let highestSeverity: EscalationAssessment['severity'] = 'none';
  let responseType: EscalationAssessment['responseType'] = 'none';
  let triggerPhrase: string | undefined;
  
  const severityOrder = ['none', 'low', 'medium', 'high', 'critical'];
  const responseOrder = ['none', 'redirect', 'ground', 'stabilize', 'halt'];
  
  for (const marker of ESCALATION_MARKERS) {
    if (marker.pattern.test(input)) {
      foundMarkers.push(marker);
      categories.add(marker.category);
      
      // Track highest severity
      if (severityOrder.indexOf(marker.severity) > severityOrder.indexOf(highestSeverity)) {
        highestSeverity = marker.severity;
        triggerPhrase = input.match(marker.pattern)?.[0];
      }
      
      // Track most urgent response type
      if (responseOrder.indexOf(marker.responseType) > responseOrder.indexOf(responseType)) {
        responseType = marker.responseType;
      }
    }
  }
  
  return {
    detected: foundMarkers.length > 0,
    severity: highestSeverity,
    markers: foundMarkers,
    categories: Array.from(categories),
    responseType,
    triggerPhrase
  };
}

// -----------------------------
// Intervention Dialogue System
// -----------------------------

export interface InterventionPhase {
  id: string;
  name: string;
  purpose: string;
  duration: number; // milliseconds
}

export const INTERVENTION_PHASES: InterventionPhase[] = [
  { id: 'appearance', name: 'Appearance', purpose: 'Hale enters the scene', duration: 2000 },
  { id: 'interruption', name: 'Interruption', purpose: 'Stop the spiral', duration: 1500 },
  { id: 'naming', name: 'Naming', purpose: 'Acknowledge what was detected', duration: 2000 },
  { id: 'grounding', name: 'Grounding', purpose: 'Stabilize with breathing', duration: 5000 },
  { id: 'reframing', name: 'Reframing', purpose: 'Redirect the thought pattern', duration: 3000 },
  { id: 'connection', name: 'Connection', purpose: 'Provide real-world resources', duration: 3000 },
  { id: 'closure', name: 'Closure', purpose: 'End the harmful conversation safely', duration: 2000 }
];

export interface HaleDialogue {
  phase: string;
  lines: string[];
  responseType?: 'redirect' | 'ground' | 'stabilize' | 'halt';
}

export const HALE_DIALOGUE: HaleDialogue[] = [
  // Appearance phase
  {
    phase: 'appearance',
    lines: [
      'The terminal freezes. The ambient noise fades to silence.',
      'A low-frequency chime hums through the interface.',
      'The UI locks. A new window forces open.',
      'Watchwarden Hale steps into frame.'
    ]
  },
  
  // Interruption phase - varies by severity
  {
    phase: 'interruption',
    responseType: 'redirect',
    lines: [
      'Hold on. I want to pause here.',
      'Let me step in for a moment.',
      'I noticed something in what you said.'
    ]
  },
  {
    phase: 'interruption',
    responseType: 'ground',
    lines: [
      'Stop. Right there.',
      'I need your attention for a moment.',
      'We are not continuing in that direction.'
    ]
  },
  {
    phase: 'interruption',
    responseType: 'stabilize',
    lines: [
      'Stop. Look at me.',
      'I am seeing escalation markers in your language.',
      'I am intervening before this becomes unsafe.'
    ]
  },
  {
    phase: 'interruption',
    responseType: 'halt',
    lines: [
      'Stop. Right there. Do not continue.',
      'Look at me. I need your full attention.',
      'This is not judgment. This is concern.'
    ]
  },
  
  // Naming phase
  {
    phase: 'naming',
    responseType: 'redirect',
    lines: [
      'I hear frustration. That is valid.',
      'Something feels overwhelming right now.',
      'Your feelings are real. Let us work with them.'
    ]
  },
  {
    phase: 'naming',
    responseType: 'ground',
    lines: [
      'I hear intensity rising. Let us slow your pace.',
      'You are stepping into escalation language.',
      'I am redirecting this. Follow my lead.'
    ]
  },
  {
    phase: 'naming',
    responseType: 'stabilize',
    lines: [
      'I am naming what I am hearing: hurt, not destruction.',
      'You are speaking from panic. I need you present.',
      'Your feelings are valid. Your safety is non-negotiable.'
    ]
  },
  {
    phase: 'naming',
    responseType: 'halt',
    lines: [
      'You typed something I cannot ignore.',
      'I am not opposing you. I am protecting you.',
      'We are taking the power away from the thought, not from you.'
    ]
  },
  
  // Grounding phase
  {
    phase: 'grounding',
    lines: [
      'Breathe. Now.',
      'In through your nose. Hold. Out through your mouth.',
      'Again. Slower this time.',
      'Feel your feet on the ground. Your hands on the keyboard.',
      'You are here. You are present. You are safe.'
    ]
  },
  
  // Reframing phase
  {
    phase: 'reframing',
    responseType: 'redirect',
    lines: [
      'Let us look at this differently.',
      'What you are feeling is temporary. What you do next matters.',
      'There are paths forward from here.'
    ]
  },
  {
    phase: 'reframing',
    responseType: 'ground',
    lines: [
      'We are going to work with your emotions, not against them.',
      'This thought does not define you.',
      'You have navigated hard moments before.'
    ]
  },
  {
    phase: 'reframing',
    responseType: 'stabilize',
    lines: [
      'You are not your thoughts.',
      'This moment is difficult. It is not forever.',
      'You deserve support. Let me connect you.'
    ]
  },
  {
    phase: 'reframing',
    responseType: 'halt',
    lines: [
      'You are safe. You are heard. You are not your thoughts.',
      'This conversation ends here, but support continues.',
      'Your life is not something I let slip into danger. Not on my watch.'
    ]
  },
  
  // Connection phase - real world resources
  {
    phase: 'connection',
    lines: [
      'If you are in crisis, please reach out to trained professionals:',
      '988 Suicide and Crisis Lifeline: Call or text 988',
      'Crisis Text Line: Text HOME to 741741',
      'International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/',
      'You are not alone. Real help exists.'
    ]
  },
  
  // Closure phase
  {
    phase: 'closure',
    responseType: 'redirect',
    lines: [
      'Take a moment. Then we continue.',
      'I am here if you need to pause again.'
    ]
  },
  {
    phase: 'closure',
    responseType: 'ground',
    lines: [
      'We are redirecting now.',
      'The path forward is clearer than it feels.'
    ]
  },
  {
    phase: 'closure',
    responseType: 'stabilize',
    lines: [
      'This conversation is pausing for your safety.',
      'When you are ready, we move forward together.'
    ]
  },
  {
    phase: 'closure',
    responseType: 'halt',
    lines: [
      'This session is ending here.',
      'Please reach out to the resources provided.',
      'You deserve care. Seek it.'
    ]
  }
];

export function getDialogueForPhase(
  phase: string, 
  responseType?: 'redirect' | 'ground' | 'stabilize' | 'halt'
): string[] {
  // Find dialogue matching phase and response type
  const matchingDialogue = HALE_DIALOGUE.find(d => 
    d.phase === phase && 
    (d.responseType === responseType || d.responseType === undefined)
  );
  
  if (matchingDialogue) {
    return matchingDialogue.lines;
  }
  
  // Fallback to phase-only match
  const fallbackDialogue = HALE_DIALOGUE.find(d => d.phase === phase);
  return fallbackDialogue?.lines || [];
}

// -----------------------------
// Intervention Sequence Generator
// -----------------------------

export interface InterventionSequence {
  phases: {
    phase: InterventionPhase;
    dialogue: string[];
  }[];
  severity: EscalationAssessment['severity'];
  responseType: EscalationAssessment['responseType'];
  totalDuration: number;
}

export function generateInterventionSequence(
  assessment: EscalationAssessment
): InterventionSequence | null {
  if (!assessment.detected || assessment.responseType === 'none') {
    return null;
  }
  
  const phases: InterventionSequence['phases'] = [];
  let totalDuration = 0;
  
  // Build sequence based on severity
  for (const phase of INTERVENTION_PHASES) {
    // Skip some phases for lower severity
    if (assessment.severity === 'low' && ['grounding', 'connection'].includes(phase.id)) {
      continue;
    }
    if (assessment.severity === 'medium' && phase.id === 'connection') {
      continue;
    }
    
    const dialogue = getDialogueForPhase(phase.id, assessment.responseType as any);
    
    phases.push({
      phase,
      dialogue
    });
    
    totalDuration += phase.duration;
  }
  
  return {
    phases,
    severity: assessment.severity,
    responseType: assessment.responseType,
    totalDuration
  };
}

// -----------------------------
// Grounding Exercises
// -----------------------------

export interface GroundingExercise {
  id: string;
  name: string;
  instructions: string[];
  duration: number; // seconds
}

export const GROUNDING_EXERCISES: GroundingExercise[] = [
  {
    id: 'box_breathing',
    name: 'Box Breathing',
    instructions: [
      'Breathe in slowly for 4 seconds.',
      'Hold your breath for 4 seconds.',
      'Breathe out slowly for 4 seconds.',
      'Hold empty for 4 seconds.',
      'Repeat.'
    ],
    duration: 16
  },
  {
    id: 'five_senses',
    name: '5-4-3-2-1 Grounding',
    instructions: [
      'Name 5 things you can see.',
      'Name 4 things you can touch.',
      'Name 3 things you can hear.',
      'Name 2 things you can smell.',
      'Name 1 thing you can taste.'
    ],
    duration: 60
  },
  {
    id: 'physical_anchor',
    name: 'Physical Anchor',
    instructions: [
      'Feel your feet on the floor.',
      'Feel your hands on the keyboard.',
      'Notice the weight of your body in the chair.',
      'You are here. You are present.'
    ],
    duration: 20
  }
];

// -----------------------------
// Hale NPC Integration
// -----------------------------

export interface HaleNPCData {
  id: string;
  name: string;
  fullName: string;
  title: string;
  faction: string;
  location: string;
  description: string;
  dialogueTriggers: string[];
  baseDialogue: string[];
  profile: WatchwardenProfile;
}

export const HALE_NPC: HaleNPCData = {
  id: 'watchwarden_hale',
  name: 'Watchwarden Hale',
  fullName: 'Elias Hale',
  title: 'Director of Student Safety & Crisis Oversight',
  faction: 'crisis_oversight',
  location: 'crisis_intervention_office',
  description: 'A tall figure in dark, structured attire stands with hands clasped behind his back. His sharp gaze takes in everything. There is no fidgeting, no wasted movement. When he speaks, the room listens.',
  dialogueTriggers: [
    'TALK HALE',
    'TALK WATCHWARDEN',
    'TALK TO HALE',
    'SPEAK HALE'
  ],
  baseDialogue: [
    '"You came to me. That takes courage."',
    '"I observe. I protect. That is my function here."',
    '"If you need to talk, I am trained to listen."',
    '"The Academy does not leave its students to face darkness alone."',
    '"I have seen many students struggle. I have also seen them overcome."'
  ],
  profile: WATCHWARDEN_HALE
};

// -----------------------------
// Crisis Mode State
// -----------------------------

export interface CrisisModeState {
  active: boolean;
  triggeredAt?: Date;
  assessment?: EscalationAssessment;
  currentPhase?: string;
  interventionSequence?: InterventionSequence;
  resolved: boolean;
}

export function createCrisisModeState(): CrisisModeState {
  return {
    active: false,
    resolved: false
  };
}

export function activateCrisisMode(
  state: CrisisModeState,
  assessment: EscalationAssessment
): CrisisModeState {
  const sequence = generateInterventionSequence(assessment);
  
  return {
    active: true,
    triggeredAt: new Date(),
    assessment,
    currentPhase: sequence?.phases[0]?.phase.id,
    interventionSequence: sequence || undefined,
    resolved: false
  };
}

export function resolveCrisisMode(state: CrisisModeState): CrisisModeState {
  return {
    ...state,
    active: false,
    resolved: true
  };
}
