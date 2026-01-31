// The Academy Radiant AI System
// Based on the architectural diagram for autonomous NPC behavior

// ============================================
// TYPES & INTERFACES
// ============================================

// Personality traits that influence NPC behavior
export interface NPCPersonality {
  openness: number;        // 0-10: curiosity, creativity, willingness to try new things
  conscientiousness: number; // 0-10: organization, discipline, responsibility
  extraversion: number;    // 0-10: sociability, energy, assertiveness
  agreeableness: number;   // 0-10: cooperation, trust, empathy
  neuroticism: number;     // 0-10: anxiety, emotional volatility, stress response
}

// Emotional state that changes based on events
export interface NPCEmotions {
  happiness: number;       // 0-10
  stress: number;          // 0-10
  confidence: number;      // 0-10
  trust: number;           // 0-10 (toward player specifically)
  curiosity: number;       // 0-10
}

// Skills and stats for NPCs
export interface NPCStats {
  intelligence: number;    // 0-100
  charisma: number;        // 0-100
  athleticism: number;     // 0-100
  creativity: number;      // 0-100
  discipline: number;      // 0-100
}

// Memory entry for NPC recall
export interface MemoryEntry {
  id: string;
  timestamp: number;
  type: 'interaction' | 'observation' | 'event' | 'rumor';
  subject: string;         // Who/what the memory is about
  description: string;
  emotionalImpact: number; // -10 to 10
  importance: number;      // 0-10, affects retention
  decay: number;           // How much importance decreases over time
}

// Goal types and priorities
export type GoalTerm = 'long' | 'medium' | 'short';
export type GoalStatus = 'active' | 'completed' | 'failed' | 'abandoned';

export interface NPCGoal {
  id: string;
  term: GoalTerm;
  description: string;
  priority: number;        // 1-10
  status: GoalStatus;
  progress: number;        // 0-100
  conditions: string[];    // What needs to happen
  blockers: string[];      // What's preventing progress
  relatedNPCs: string[];   // Other NPCs involved
}

// Relationship types and states
export type RelationshipType = 'friendship' | 'rivalry' | 'mentorship' | 'acquaintance' | 'stranger';

export interface NPCRelationship {
  targetId: string;        // NPC or player ID
  targetName: string;
  type: RelationshipType;
  affinity: number;        // -100 to 100
  trust: number;           // 0-100
  respect: number;         // 0-100
  history: string[];       // Key events in relationship
  lastInteraction: number; // Timestamp
}

// Schedule entry for daily routines
export interface ScheduleEntry {
  hour: number;            // 0-23
  activity: string;
  location: string;
  priority: number;        // Higher = harder to override
  interruptible: boolean;
  companions?: string[];   // NPCs they do this with
}

// Dynamic override for schedule
export interface ScheduleOverride {
  id: string;
  reason: string;
  activity: string;
  location: string;
  startHour: number;
  endHour: number;
  priority: number;
  expires: number;         // Timestamp when override ends
}

// Dialogue context for conversations
export interface DialogueContext {
  mood: string;
  recentTopics: string[];
  relationshipWithPlayer: RelationshipType;
  currentGoals: string[];
  environmentalFactors: string[];
}

// World event that affects NPCs
export type WorldEventType = 'exam' | 'competition' | 'accident' | 'announcement' | 'social' | 'crisis';

export interface WorldEvent {
  id: string;
  type: WorldEventType;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  affectedLocations: string[];
  affectedNPCs: string[];
  playerInvolved: boolean;
  consequences: EventConsequence[];
}

export interface EventConsequence {
  type: 'stat_change' | 'relationship_change' | 'goal_update' | 'schedule_override' | 'memory';
  target: string;
  value: any;
}

// Decision Engine output
export interface NPCDecision {
  action: 'move' | 'talk' | 'wait' | 'work' | 'socialize' | 'pursue_goal' | 'react_event';
  target?: string;
  location?: string;
  dialogue?: string;
  reasoning: string;
  priority: number;
}

// Complete NPC Core Entity
export interface NPCEntity {
  id: string;
  name: string;
  role: string;            // Student, Teacher, Staff, etc.
  faction?: string;
  stats: NPCStats;
  personality: NPCPersonality;
  emotions: NPCEmotions;
  memories: MemoryEntry[];
  goals: NPCGoal[];
  relationships: NPCRelationship[];
  schedule: ScheduleEntry[];
  scheduleOverrides: ScheduleOverride[];
  currentLocation: string;
  currentActivity: string;
  lastUpdate: number;
}

// ============================================
// DEFAULT VALUES & TEMPLATES
// ============================================

export const DEFAULT_PERSONALITY: NPCPersonality = {
  openness: 5,
  conscientiousness: 5,
  extraversion: 5,
  agreeableness: 5,
  neuroticism: 5
};

export const DEFAULT_EMOTIONS: NPCEmotions = {
  happiness: 5,
  stress: 3,
  confidence: 5,
  trust: 5,
  curiosity: 5
};

export const DEFAULT_STATS: NPCStats = {
  intelligence: 50,
  charisma: 50,
  athleticism: 50,
  creativity: 50,
  discipline: 50
};

// Student schedule template
export const STUDENT_SCHEDULE: ScheduleEntry[] = [
  { hour: 6, activity: 'Wake up', location: 'Dormitory', priority: 5, interruptible: false },
  { hour: 7, activity: 'Breakfast', location: 'Cafeteria', priority: 4, interruptible: true },
  { hour: 8, activity: 'Morning Classes', location: 'Classroom', priority: 8, interruptible: false },
  { hour: 10, activity: 'Break', location: 'Courtyard', priority: 3, interruptible: true },
  { hour: 11, activity: 'Classes', location: 'Classroom', priority: 8, interruptible: false },
  { hour: 12, activity: 'Lunch', location: 'Cafeteria', priority: 5, interruptible: true },
  { hour: 13, activity: 'Afternoon Classes', location: 'Classroom', priority: 8, interruptible: false },
  { hour: 15, activity: 'Free Period', location: 'Library', priority: 2, interruptible: true },
  { hour: 17, activity: 'Club Activities', location: 'Club Room', priority: 4, interruptible: true },
  { hour: 18, activity: 'Dinner', location: 'Cafeteria', priority: 5, interruptible: true },
  { hour: 19, activity: 'Study Hall', location: 'Library', priority: 4, interruptible: true },
  { hour: 21, activity: 'Free Time', location: 'Dormitory', priority: 2, interruptible: true },
  { hour: 22, activity: 'Sleep', location: 'Dormitory', priority: 7, interruptible: false }
];

// Teacher schedule template
export const TEACHER_SCHEDULE: ScheduleEntry[] = [
  { hour: 6, activity: 'Wake up', location: 'Faculty Housing', priority: 5, interruptible: false },
  { hour: 7, activity: 'Preparation', location: 'Office', priority: 6, interruptible: true },
  { hour: 8, activity: 'Teaching', location: 'Classroom', priority: 9, interruptible: false },
  { hour: 10, activity: 'Office Hours', location: 'Office', priority: 5, interruptible: true },
  { hour: 11, activity: 'Teaching', location: 'Classroom', priority: 9, interruptible: false },
  { hour: 12, activity: 'Lunch', location: 'Faculty Lounge', priority: 4, interruptible: true },
  { hour: 13, activity: 'Teaching', location: 'Classroom', priority: 9, interruptible: false },
  { hour: 15, activity: 'Grading', location: 'Office', priority: 6, interruptible: true },
  { hour: 17, activity: 'Department Meeting', location: 'Conference Room', priority: 7, interruptible: false },
  { hour: 18, activity: 'Dinner', location: 'Faculty Lounge', priority: 4, interruptible: true },
  { hour: 19, activity: 'Research', location: 'Office', priority: 5, interruptible: true },
  { hour: 21, activity: 'Rest', location: 'Faculty Housing', priority: 3, interruptible: true }
];

// ============================================
// PERSONALITY ARCHETYPES
// ============================================

export const PERSONALITY_ARCHETYPES: Record<string, NPCPersonality> = {
  scholar: { openness: 8, conscientiousness: 7, extraversion: 3, agreeableness: 5, neuroticism: 4 },
  rebel: { openness: 7, conscientiousness: 3, extraversion: 6, agreeableness: 3, neuroticism: 6 },
  leader: { openness: 6, conscientiousness: 7, extraversion: 8, agreeableness: 5, neuroticism: 3 },
  nurturer: { openness: 5, conscientiousness: 6, extraversion: 5, agreeableness: 9, neuroticism: 4 },
  perfectionist: { openness: 4, conscientiousness: 9, extraversion: 4, agreeableness: 4, neuroticism: 7 },
  socialite: { openness: 7, conscientiousness: 4, extraversion: 9, agreeableness: 7, neuroticism: 3 },
  loner: { openness: 6, conscientiousness: 5, extraversion: 2, agreeableness: 4, neuroticism: 5 },
  optimist: { openness: 7, conscientiousness: 5, extraversion: 7, agreeableness: 8, neuroticism: 2 },
  cynic: { openness: 5, conscientiousness: 6, extraversion: 4, agreeableness: 3, neuroticism: 6 },
  mentor: { openness: 7, conscientiousness: 8, extraversion: 6, agreeableness: 8, neuroticism: 2 }
};

// ============================================
// NPC CREATION
// ============================================

export function createNPCEntity(
  id: string,
  name: string,
  role: string,
  archetype?: string,
  faction?: string
): NPCEntity {
  const personality = archetype && PERSONALITY_ARCHETYPES[archetype] 
    ? { ...PERSONALITY_ARCHETYPES[archetype] }
    : { ...DEFAULT_PERSONALITY };
  
  const schedule = role === 'Teacher' ? [...TEACHER_SCHEDULE] : [...STUDENT_SCHEDULE];
  
  return {
    id,
    name,
    role,
    faction,
    stats: { ...DEFAULT_STATS },
    personality,
    emotions: { ...DEFAULT_EMOTIONS },
    memories: [],
    goals: [],
    relationships: [],
    schedule,
    scheduleOverrides: [],
    currentLocation: role === 'Teacher' ? 'Office' : 'Dormitory',
    currentActivity: 'Idle',
    lastUpdate: Date.now()
  };
}

// ============================================
// MEMORY SYSTEM
// ============================================

export function addMemory(
  npc: NPCEntity,
  type: MemoryEntry['type'],
  subject: string,
  description: string,
  emotionalImpact: number,
  importance: number
): NPCEntity {
  const memory: MemoryEntry = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type,
    subject,
    description,
    emotionalImpact,
    importance,
    decay: 0.1 // 10% decay per game day
  };
  
  const memories = [...npc.memories, memory];
  
  // Keep only top 50 memories by importance
  if (memories.length > 50) {
    memories.sort((a, b) => b.importance - a.importance);
    memories.splice(50);
  }
  
  return { ...npc, memories };
}

export function decayMemories(npc: NPCEntity): NPCEntity {
  const memories = npc.memories
    .map(m => ({ ...m, importance: m.importance * (1 - m.decay) }))
    .filter(m => m.importance > 0.5); // Remove faded memories
  
  return { ...npc, memories };
}

export function recallMemories(npc: NPCEntity, subject: string, limit = 5): MemoryEntry[] {
  return npc.memories
    .filter(m => m.subject.toLowerCase().includes(subject.toLowerCase()))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, limit);
}

// ============================================
// GOAL SYSTEM
// ============================================

export function addGoal(npc: NPCEntity, goal: Omit<NPCGoal, 'id' | 'status' | 'progress'>): NPCEntity {
  const newGoal: NPCGoal = {
    ...goal,
    id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'active',
    progress: 0
  };
  
  return { ...npc, goals: [...npc.goals, newGoal] };
}

export function updateGoalProgress(npc: NPCEntity, goalId: string, progress: number): NPCEntity {
  const goals = npc.goals.map(g => {
    if (g.id === goalId) {
      const newProgress = Math.min(100, Math.max(0, progress));
      const status = newProgress >= 100 ? 'completed' : g.status;
      return { ...g, progress: newProgress, status };
    }
    return g;
  });
  
  return { ...npc, goals };
}

export function getActiveGoals(npc: NPCEntity, term?: GoalTerm): NPCGoal[] {
  return npc.goals
    .filter(g => g.status === 'active' && (!term || g.term === term))
    .sort((a, b) => b.priority - a.priority);
}

// ============================================
// RELATIONSHIP SYSTEM
// ============================================

export function updateRelationship(
  npc: NPCEntity,
  targetId: string,
  targetName: string,
  changes: Partial<Pick<NPCRelationship, 'affinity' | 'trust' | 'respect'>>
): NPCEntity {
  let relationships = [...npc.relationships];
  const existingIdx = relationships.findIndex(r => r.targetId === targetId);
  
  if (existingIdx >= 0) {
    const existing = relationships[existingIdx];
    relationships[existingIdx] = {
      ...existing,
      affinity: Math.max(-100, Math.min(100, (existing.affinity || 0) + (changes.affinity || 0))),
      trust: Math.max(0, Math.min(100, (existing.trust || 50) + (changes.trust || 0))),
      respect: Math.max(0, Math.min(100, (existing.respect || 50) + (changes.respect || 0))),
      lastInteraction: Date.now()
    };
  } else {
    // Create new relationship
    relationships.push({
      targetId,
      targetName,
      type: 'acquaintance',
      affinity: changes.affinity || 0,
      trust: changes.trust || 50,
      respect: changes.respect || 50,
      history: [],
      lastInteraction: Date.now()
    });
  }
  
  // Update relationship type based on affinity
  relationships = relationships.map(r => ({
    ...r,
    type: determineRelationshipType(r.affinity, r.trust, r.respect)
  }));
  
  return { ...npc, relationships };
}

function determineRelationshipType(affinity: number, trust: number, respect: number): RelationshipType {
  if (affinity >= 60 && trust >= 60) return 'friendship';
  if (affinity <= -40) return 'rivalry';
  if (respect >= 70 && affinity >= 20) return 'mentorship';
  if (affinity > -20 && affinity < 30) return 'acquaintance';
  return 'stranger';
}

export function getRelationship(npc: NPCEntity, targetId: string): NPCRelationship | null {
  return npc.relationships.find(r => r.targetId === targetId) || null;
}

// ============================================
// SCHEDULE SYSTEM
// ============================================

export function getCurrentScheduledActivity(npc: NPCEntity, hour: number): ScheduleEntry | null {
  // Check for active overrides first
  const now = Date.now();
  const activeOverride = npc.scheduleOverrides.find(
    o => o.expires > now && hour >= o.startHour && hour < o.endHour
  );
  
  if (activeOverride) {
    return {
      hour,
      activity: activeOverride.activity,
      location: activeOverride.location,
      priority: activeOverride.priority,
      interruptible: false
    };
  }
  
  // Find scheduled activity for this hour
  const scheduled = npc.schedule
    .filter(s => s.hour <= hour)
    .sort((a, b) => b.hour - a.hour)[0];
  
  return scheduled || null;
}

export function addScheduleOverride(
  npc: NPCEntity,
  reason: string,
  activity: string,
  location: string,
  startHour: number,
  endHour: number,
  priority: number,
  durationMs: number
): NPCEntity {
  const override: ScheduleOverride = {
    id: `override_${Date.now()}`,
    reason,
    activity,
    location,
    startHour,
    endHour,
    priority,
    expires: Date.now() + durationMs
  };
  
  return {
    ...npc,
    scheduleOverrides: [...npc.scheduleOverrides, override]
  };
}

export function cleanExpiredOverrides(npc: NPCEntity): NPCEntity {
  const now = Date.now();
  return {
    ...npc,
    scheduleOverrides: npc.scheduleOverrides.filter(o => o.expires > now)
  };
}

// ============================================
// EMOTION SYSTEM
// ============================================

export function updateEmotions(
  npc: NPCEntity,
  changes: Partial<NPCEmotions>
): NPCEntity {
  const emotions = { ...npc.emotions };
  
  for (const [key, value] of Object.entries(changes)) {
    if (key in emotions) {
      emotions[key as keyof NPCEmotions] = Math.max(0, Math.min(10, 
        emotions[key as keyof NPCEmotions] + value
      ));
    }
  }
  
  return { ...npc, emotions };
}

export function getEmotionalState(emotions: NPCEmotions): string {
  const { happiness, stress, confidence, trust, curiosity } = emotions;
  
  if (happiness >= 7 && stress <= 3) return 'content';
  if (happiness >= 8) return 'joyful';
  if (stress >= 8) return 'anxious';
  if (stress >= 6 && happiness <= 3) return 'distressed';
  if (confidence >= 7) return 'confident';
  if (confidence <= 3) return 'insecure';
  if (curiosity >= 7) return 'intrigued';
  if (trust <= 3) return 'suspicious';
  if (happiness <= 3) return 'melancholic';
  
  return 'neutral';
}

// ============================================
// DECISION ENGINE
// ============================================

export function makeDecision(
  npc: NPCEntity,
  gameHour: number,
  playerLocation: string | null,
  activeEvents: WorldEvent[]
): NPCDecision {
  const scheduledActivity = getCurrentScheduledActivity(npc, gameHour);
  const emotionalState = getEmotionalState(npc.emotions);
  const activeGoals = getActiveGoals(npc);
  
  // Check for high-priority events
  const relevantEvent = activeEvents.find(e => 
    e.affectedNPCs.includes(npc.id) || 
    e.affectedLocations.includes(npc.currentLocation)
  );
  
  if (relevantEvent && relevantEvent.type === 'crisis') {
    return {
      action: 'react_event',
      target: relevantEvent.id,
      reasoning: `Responding to crisis: ${relevantEvent.name}`,
      priority: 10
    };
  }
  
  // Check for social opportunities with player
  const playerRelationship = getRelationship(npc, 'player');
  if (playerLocation === npc.currentLocation && playerRelationship) {
    const shouldInteract = 
      npc.personality.extraversion >= 6 ||
      (playerRelationship.affinity >= 40 && Math.random() > 0.5);
    
    if (shouldInteract && scheduledActivity?.interruptible !== false) {
      return {
        action: 'talk',
        target: 'player',
        reasoning: `${emotionalState} and wants to interact`,
        priority: 6
      };
    }
  }
  
  // Check for goal pursuit
  const topGoal = activeGoals[0];
  if (topGoal && topGoal.priority >= 7 && (scheduledActivity?.priority || 0) < 8) {
    return {
      action: 'pursue_goal',
      target: topGoal.id,
      reasoning: `Working toward: ${topGoal.description}`,
      priority: topGoal.priority
    };
  }
  
  // Follow schedule
  if (scheduledActivity) {
    if (npc.currentLocation !== scheduledActivity.location) {
      return {
        action: 'move',
        location: scheduledActivity.location,
        reasoning: `Scheduled: ${scheduledActivity.activity}`,
        priority: scheduledActivity.priority
      };
    }
    
    return {
      action: 'work',
      target: scheduledActivity.activity,
      location: scheduledActivity.location,
      reasoning: `Engaged in: ${scheduledActivity.activity}`,
      priority: scheduledActivity.priority
    };
  }
  
  // Default: wait
  return {
    action: 'wait',
    reasoning: 'No immediate tasks or goals',
    priority: 1
  };
}

// ============================================
// DIALOGUE GENERATION CONTEXT
// ============================================

export function buildDialogueContext(
  npc: NPCEntity,
  playerName: string,
  recentPlayerActions: string[]
): DialogueContext {
  const playerRelationship = getRelationship(npc, 'player');
  const recentMemories = recallMemories(npc, playerName, 3);
  const activeGoals = getActiveGoals(npc).slice(0, 2);
  
  return {
    mood: getEmotionalState(npc.emotions),
    recentTopics: recentMemories.map(m => m.description),
    relationshipWithPlayer: playerRelationship?.type || 'stranger',
    currentGoals: activeGoals.map(g => g.description),
    environmentalFactors: recentPlayerActions
  };
}

// Generate dialogue based on context (to be used with AI)
export function generateDialoguePrompt(npc: NPCEntity, context: DialogueContext): string {
  const personalityDesc = describePersonality(npc.personality);
  
  return `You are ${npc.name}, a ${npc.role} at The Academy.
Personality: ${personalityDesc}
Current mood: ${context.mood}
Relationship with player: ${context.relationshipWithPlayer}
${context.currentGoals.length > 0 ? `Current goals: ${context.currentGoals.join(', ')}` : ''}
${context.recentTopics.length > 0 ? `Recent topics: ${context.recentTopics.join(', ')}` : ''}

Respond naturally in character, considering your personality and relationship with the player.`;
}

function describePersonality(p: NPCPersonality): string {
  const traits: string[] = [];
  
  if (p.openness >= 7) traits.push('curious and creative');
  else if (p.openness <= 3) traits.push('traditional and practical');
  
  if (p.conscientiousness >= 7) traits.push('organized and disciplined');
  else if (p.conscientiousness <= 3) traits.push('spontaneous and flexible');
  
  if (p.extraversion >= 7) traits.push('outgoing and energetic');
  else if (p.extraversion <= 3) traits.push('reserved and thoughtful');
  
  if (p.agreeableness >= 7) traits.push('warm and cooperative');
  else if (p.agreeableness <= 3) traits.push('competitive and direct');
  
  if (p.neuroticism >= 7) traits.push('sensitive and emotional');
  else if (p.neuroticism <= 3) traits.push('calm and stable');
  
  return traits.length > 0 ? traits.join(', ') : 'balanced';
}

// ============================================
// WORLD EVENTS SYSTEM
// ============================================

export function createWorldEvent(
  type: WorldEventType,
  name: string,
  description: string,
  durationMs: number,
  affectedLocations: string[],
  affectedNPCs: string[],
  playerInvolved: boolean
): WorldEvent {
  const now = Date.now();
  
  return {
    id: `event_${now}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    name,
    description,
    startTime: now,
    endTime: now + durationMs,
    affectedLocations,
    affectedNPCs,
    playerInvolved,
    consequences: []
  };
}

export function applyEventConsequences(npc: NPCEntity, event: WorldEvent): NPCEntity {
  let updatedNPC = { ...npc };
  
  for (const consequence of event.consequences) {
    if (consequence.target !== npc.id && consequence.target !== 'all') continue;
    
    switch (consequence.type) {
      case 'stat_change':
        updatedNPC.stats = { 
          ...updatedNPC.stats, 
          ...consequence.value 
        };
        break;
      case 'relationship_change':
        updatedNPC = updateRelationship(
          updatedNPC,
          consequence.value.targetId,
          consequence.value.targetName,
          consequence.value.changes
        );
        break;
      case 'memory':
        updatedNPC = addMemory(
          updatedNPC,
          'event',
          event.name,
          consequence.value.description,
          consequence.value.emotionalImpact,
          consequence.value.importance
        );
        break;
    }
  }
  
  return updatedNPC;
}

// ============================================
// NPC MANAGER (Singleton)
// ============================================

class RadiantAIManager {
  private npcs: Map<string, NPCEntity> = new Map();
  private activeEvents: WorldEvent[] = [];
  private listeners: Set<(npcs: Map<string, NPCEntity>) => void> = new Set();
  
  // Initialize with NPCs
  initialize(npcList: NPCEntity[]) {
    this.npcs.clear();
    for (const npc of npcList) {
      this.npcs.set(npc.id, npc);
    }
    this.notifyListeners();
  }
  
  // Get NPC by ID
  getNPC(id: string): NPCEntity | undefined {
    return this.npcs.get(id);
  }
  
  // Get all NPCs
  getAllNPCs(): NPCEntity[] {
    return Array.from(this.npcs.values());
  }
  
  // Get NPCs at location
  getNPCsAtLocation(location: string): NPCEntity[] {
    return this.getAllNPCs().filter(npc => npc.currentLocation === location);
  }
  
  // Update NPC
  updateNPC(id: string, updates: Partial<NPCEntity>) {
    const npc = this.npcs.get(id);
    if (npc) {
      this.npcs.set(id, { ...npc, ...updates, lastUpdate: Date.now() });
      this.notifyListeners();
    }
  }
  
  // Process player interaction with NPC
  processPlayerInteraction(npcId: string, interactionType: string, outcome: 'positive' | 'negative' | 'neutral') {
    const npc = this.npcs.get(npcId);
    if (!npc) return;
    
    // Update relationship
    const affinityChange = outcome === 'positive' ? 5 : outcome === 'negative' ? -5 : 0;
    const trustChange = outcome === 'positive' ? 3 : outcome === 'negative' ? -3 : 0;
    
    let updatedNPC = updateRelationship(npc, 'player', 'Player', {
      affinity: affinityChange,
      trust: trustChange
    });
    
    // Add memory
    updatedNPC = addMemory(
      updatedNPC,
      'interaction',
      'Player',
      `${interactionType} interaction - ${outcome}`,
      outcome === 'positive' ? 2 : outcome === 'negative' ? -2 : 0,
      6
    );
    
    // Update emotions
    updatedNPC = updateEmotions(updatedNPC, {
      happiness: outcome === 'positive' ? 1 : outcome === 'negative' ? -1 : 0,
      trust: outcome === 'positive' ? 1 : outcome === 'negative' ? -2 : 0
    });
    
    this.npcs.set(npcId, updatedNPC);
    this.notifyListeners();
  }
  
  // Add world event
  addWorldEvent(event: WorldEvent) {
    this.activeEvents.push(event);
    
    // Apply immediate consequences
    for (const npc of this.getAllNPCs()) {
      if (event.affectedNPCs.includes(npc.id) || event.affectedNPCs.includes('all')) {
        const updated = applyEventConsequences(npc, event);
        this.npcs.set(npc.id, updated);
      }
    }
    
    this.notifyListeners();
  }
  
  // Tick - update all NPCs
  tick(gameHour: number, playerLocation: string | null) {
    // Clean expired events
    const now = Date.now();
    this.activeEvents = this.activeEvents.filter(e => e.endTime > now);
    
    // Update each NPC
    for (const [id, npc] of Array.from(this.npcs.entries())) {
      let updated = cleanExpiredOverrides(npc);
      
      // Make decision
      const decision = makeDecision(updated, gameHour, playerLocation, this.activeEvents);
      
      // Apply decision
      if (decision.action === 'move' && decision.location) {
        updated.currentLocation = decision.location;
      }
      updated.currentActivity = decision.reasoning;
      
      // Decay memories periodically
      if (Math.random() < 0.1) {
        updated = decayMemories(updated);
      }
      
      updated.lastUpdate = now;
      this.npcs.set(id, updated);
    }
    
    this.notifyListeners();
  }
  
  // Subscribe to changes
  subscribe(listener: (npcs: Map<string, NPCEntity>) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.npcs));
  }
  
  // Serialize state for persistence
  serialize(): string {
    return JSON.stringify({
      npcs: Array.from(this.npcs.entries()),
      events: this.activeEvents
    });
  }
  
  // Deserialize state
  deserialize(data: string) {
    try {
      const parsed = JSON.parse(data);
      this.npcs = new Map(parsed.npcs);
      this.activeEvents = parsed.events || [];
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to deserialize Radiant AI state:', e);
    }
  }
}

export const radiantAI = new RadiantAIManager();

// ============================================
// PREDEFINED ACADEMY NPCS
// ============================================

export const ACADEMY_NPCS: NPCEntity[] = [
  {
    ...createNPCEntity('headmaster_thorne', 'Headmaster Thorne', 'Teacher', 'mentor', 'Administration'),
    stats: { intelligence: 95, charisma: 80, athleticism: 40, creativity: 70, discipline: 90 },
    goals: [
      { id: 'goal_1', term: 'long', description: 'Maintain Academy excellence', priority: 9, status: 'active', progress: 60, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  },
  {
    ...createNPCEntity('prof_elena', 'Professor Elena Vasquez', 'Teacher', 'scholar', 'Faculty'),
    stats: { intelligence: 88, charisma: 65, athleticism: 30, creativity: 75, discipline: 85 },
    goals: [
      { id: 'goal_2', term: 'medium', description: 'Complete research on resonance theory', priority: 8, status: 'active', progress: 40, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  },
  {
    ...createNPCEntity('marcus_chen', 'Marcus Chen', 'Student', 'leader', 'Student Council'),
    stats: { intelligence: 75, charisma: 85, athleticism: 70, creativity: 60, discipline: 75 },
    goals: [
      { id: 'goal_3', term: 'short', description: 'Win student council election', priority: 8, status: 'active', progress: 30, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  },
  {
    ...createNPCEntity('ivy_hart', 'Ivy Hart', 'Student', 'rebel', 'Underground'),
    stats: { intelligence: 80, charisma: 70, athleticism: 55, creativity: 85, discipline: 35 },
    personality: { openness: 9, conscientiousness: 3, extraversion: 5, agreeableness: 4, neuroticism: 6 },
    goals: [
      { id: 'goal_4', term: 'medium', description: 'Uncover Academy secrets', priority: 9, status: 'active', progress: 25, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  },
  {
    ...createNPCEntity('sam_brooks', 'Sam Brooks', 'Student', 'nurturer'),
    stats: { intelligence: 65, charisma: 75, athleticism: 50, creativity: 70, discipline: 60 },
    goals: [
      { id: 'goal_5', term: 'short', description: 'Help struggling classmates', priority: 6, status: 'active', progress: 50, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  },
  {
    ...createNPCEntity('alex_reyes', 'Alex Reyes', 'Student', 'perfectionist'),
    stats: { intelligence: 90, charisma: 45, athleticism: 40, creativity: 55, discipline: 95 },
    goals: [
      { id: 'goal_6', term: 'long', description: 'Achieve top academic ranking', priority: 10, status: 'active', progress: 70, conditions: [], blockers: [], relatedNPCs: ['marcus_chen'] }
    ]
  },
  {
    ...createNPCEntity('coach_rivera', 'Coach Rivera', 'Teacher', 'leader', 'Athletics'),
    stats: { intelligence: 60, charisma: 85, athleticism: 90, creativity: 50, discipline: 80 },
    schedule: [...TEACHER_SCHEDULE],
    goals: [
      { id: 'goal_7', term: 'medium', description: 'Lead team to championship', priority: 8, status: 'active', progress: 35, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  },
  {
    ...createNPCEntity('librarian_patel', 'Librarian Patel', 'Staff', 'scholar'),
    stats: { intelligence: 85, charisma: 55, athleticism: 25, creativity: 80, discipline: 70 },
    currentLocation: 'Library',
    goals: [
      { id: 'goal_8', term: 'long', description: 'Preserve Academy archives', priority: 7, status: 'active', progress: 45, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  }
];
