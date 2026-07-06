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

// Note: Low severity patterns removed to prevent over-triggering on casual conversation
// The system now only intervenes on medium+ severity indicators that clearly signal distress
export const ESCALATION_MARKERS: EscalationMarker[] = [
  // Medium severity - ground (requires explicit self-reference + distress)
  { pattern: /\bi('m| am) completely alone\b/i, severity: 'medium', category: 'isolation', responseType: 'ground' },
  { pattern: /\bi can('t| not) (do|take) this anymore\b/i, severity: 'medium', category: 'hopelessness', responseType: 'ground' },
  { pattern: /\bi('m| am) (so )?worthless\b/i, severity: 'medium', category: 'worthlessness', responseType: 'ground' },
  { pattern: /\bi('m| am) such a failure\b/i, severity: 'medium', category: 'worthlessness', responseType: 'ground' },
  { pattern: /\bi hate myself\b/i, severity: 'medium', category: 'worthlessness', responseType: 'ground' },
  
  // High severity - stabilize (clear escape/ending language)
  { pattern: /\bi don('t| not) want to (be here|exist|live|continue living)\b/i, severity: 'high', category: 'escape', responseType: 'stabilize' },
  { pattern: /\bi wish i (wasn't|weren't|was not) (alive|born|here)\b/i, severity: 'high', category: 'escape', responseType: 'stabilize' },
  { pattern: /\beveryone would be better off without me\b/i, severity: 'high', category: 'worthlessness', responseType: 'stabilize' },
  { pattern: /\bi('m| am) a burden to everyone\b/i, severity: 'high', category: 'worthlessness', responseType: 'stabilize' },
  
  // Critical severity - halt (immediate intervention, explicit harm/ending statements)
  { pattern: /\bi want to (hurt|harm) myself\b/i, severity: 'critical', category: 'harm', responseType: 'halt' },
  { pattern: /\bi want to (die|end my life|end it all|kill myself)\b/i, severity: 'critical', category: 'harm', responseType: 'halt' },
  { pattern: /\bi('m| am) (going to|gonna) (hurt|harm|kill) myself\b/i, severity: 'critical', category: 'harm', responseType: 'halt' },
  { pattern: /\bi('m| am) thinking (of|about) (suicide|ending it|killing myself)\b/i, severity: 'critical', category: 'harm', responseType: 'halt' }
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
  
  // Interruption phase - varies by severity (softer for medium, firmer for critical)
  {
    phase: 'interruption',
    responseType: 'ground',
    lines: [
      'I want to pause here for a moment.',
      'Something you said caught my attention.',
      'Let me check in with you.'
    ]
  },
  {
    phase: 'interruption',
    responseType: 'stabilize',
    lines: [
      'Hold on. I need a moment with you.',
      'I am noticing something in what you shared.',
      'Let me step in here.'
    ]
  },
  {
    phase: 'interruption',
    responseType: 'halt',
    lines: [
      'Stop. Right there.',
      'Look at me. I need your full attention.',
      'This is not judgment. This is concern.'
    ]
  },
  
  // Naming phase (supportive acknowledgment)
  {
    phase: 'naming',
    responseType: 'ground',
    lines: [
      'I hear something difficult in what you shared.',
      'These feelings are real, and they matter.',
      'You do not have to carry this alone.'
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
  
  // Reframing phase (supportive perspective)
  {
    phase: 'reframing',
    responseType: 'ground',
    lines: [
      'What you are feeling is real, but it is not the whole picture.',
      'This moment is hard. It does not define you.',
      'You have navigated difficult times before.'
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
  
  // Closure phase (supportive return to normal)
  {
    phase: 'closure',
    responseType: 'ground',
    lines: [
      'Take all the time you need.',
      'I am here if you want to talk more.',
      'You are not alone in this.'
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
