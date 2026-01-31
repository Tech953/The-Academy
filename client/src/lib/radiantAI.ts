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

// Club types for extracurricular activities
export type ClubType = 'Chess' | 'Science' | 'Drama' | 'Sports' | 'Art' | 'Music' | 'Debate' | 'Literature';

// Secret society types (rare, hidden affiliations)
export type SecretSociety = 'Red Lotus' | 'Silver Raven' | 'Golden Owl' | 'Shadow Circle';

// Mentorship tracking
export interface MentorshipInfo {
  mentorId?: string;       // Faculty mentor ID
  mentorName?: string;
  menteeIds: string[];     // Students being mentored
  menteeNames: string[];
}

// Complete NPC Core Entity
export interface NPCEntity {
  id: string;
  name: string;
  role: string;            // Student, Teacher, Staff, etc.
  faction?: string;
  club?: ClubType;         // Extracurricular club membership
  secretSociety?: SecretSociety;  // Hidden affiliation (rare)
  mentorship?: MentorshipInfo;    // Mentor/mentee relationships
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
    club: undefined,
    secretSociety: undefined,
    mentorship: { menteeIds: [], menteeNames: [] },
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
// PROCEDURAL NPC GENERATION
// ============================================

const FIRST_NAMES = [
  'Alice', 'Bob', 'Claire', 'David', 'Eve', 'Frank', 'Gina', 'Henry',
  'Iris', 'Jack', 'Kate', 'Leo', 'Maya', 'Noah', 'Olivia', 'Paul',
  'Quinn', 'Riley', 'Sofia', 'Tyler', 'Uma', 'Victor', 'Wendy', 'Xavier',
  'Yuki', 'Zara', 'Aiden', 'Bella', 'Caleb', 'Diana', 'Ethan', 'Fiona'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Lee', 'Garcia', 'Patel', 'Chen', 'Brown', 'Nguyen',
  'Williams', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore',
  'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Wilson', 'Clark', 'Lewis'
];

const GOAL_TEMPLATES = {
  academic: [
    'Graduate top of class', 'Ace the upcoming exam', 'Complete research project',
    'Win science fair', 'Get perfect attendance', 'Master advanced mathematics',
    'Publish research paper', 'Earn scholarship', 'Improve GPA'
  ],
  social: [
    'Make new friends', 'Win club competition', 'Lead student council',
    'Organize campus event', 'Build study group', 'Become popular',
    'Start new club', 'Mentor younger students', 'Win debate tournament'
  ],
  personal: [
    'Relax and destress', 'Practice a skill', 'Complete hobby project',
    'Exercise regularly', 'Learn new instrument', 'Read more books',
    'Improve self-confidence', 'Find work-life balance', 'Explore campus secrets'
  ]
};

const CLUB_TYPES: ClubType[] = ['Chess', 'Science', 'Drama', 'Sports', 'Art', 'Music', 'Debate', 'Literature'];
const SECRET_SOCIETIES: SecretSociety[] = ['Red Lotus', 'Silver Raven', 'Golden Owl', 'Shadow Circle'];
const LOCATIONS = ['Library', 'Courtyard', 'Lab', 'Gym', 'Cafeteria', 'Dormitory', 'Classroom', 'Office'];
const ARCHETYPES = Object.keys(PERSONALITY_ARCHETYPES);

export function generateRandomName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

export function generateRandomStats(): NPCStats {
  return {
    intelligence: Math.floor(Math.random() * 60) + 30,  // 30-90
    charisma: Math.floor(Math.random() * 60) + 30,
    athleticism: Math.floor(Math.random() * 60) + 30,
    creativity: Math.floor(Math.random() * 60) + 30,
    discipline: Math.floor(Math.random() * 60) + 30
  };
}

export function generateRandomPersonality(): NPCPersonality {
  return {
    openness: Math.floor(Math.random() * 9) + 1,        // 1-9
    conscientiousness: Math.floor(Math.random() * 9) + 1,
    extraversion: Math.floor(Math.random() * 9) + 1,
    agreeableness: Math.floor(Math.random() * 9) + 1,
    neuroticism: Math.floor(Math.random() * 9) + 1
  };
}

export function generateRandomGoals(count: number = 2): NPCGoal[] {
  const goalTypes = ['academic', 'social', 'personal'] as const;
  const goals: NPCGoal[] = [];
  
  for (let i = 0; i < count; i++) {
    const type = goalTypes[Math.floor(Math.random() * goalTypes.length)];
    const templates = GOAL_TEMPLATES[type];
    const description = templates[Math.floor(Math.random() * templates.length)];
    
    goals.push({
      id: `goal_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      term: ['long', 'medium', 'short'][Math.floor(Math.random() * 3)] as GoalTerm,
      description,
      priority: Math.floor(Math.random() * 5) + 5,  // 5-9
      status: 'active',
      progress: Math.floor(Math.random() * 30),     // 0-30 starting progress
      conditions: [],
      blockers: [],
      relatedNPCs: []
    });
  }
  
  return goals;
}

export interface NPCGeneratorOptions {
  role?: 'Student' | 'Teacher' | 'Staff';
  archetype?: string;
  faction?: string;
  includeClub?: boolean;
  includeSecretSociety?: boolean;
}

export function generateProceduralNPC(options: NPCGeneratorOptions = {}): NPCEntity {
  const id = `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const name = generateRandomName();
  const role = options.role || (['Student', 'Student', 'Student', 'Teacher', 'Staff'][Math.floor(Math.random() * 5)]);
  const archetype = options.archetype || ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
  
  const baseNPC = createNPCEntity(id, name, role, archetype, options.faction);
  
  // Apply random stats
  baseNPC.stats = generateRandomStats();
  
  // 60% chance of club membership for students
  if (role === 'Student' && (options.includeClub ?? Math.random() > 0.4)) {
    baseNPC.club = CLUB_TYPES[Math.floor(Math.random() * CLUB_TYPES.length)];
  }
  
  // 10% chance of secret society membership
  if (options.includeSecretSociety ?? Math.random() < 0.1) {
    baseNPC.secretSociety = SECRET_SOCIETIES[Math.floor(Math.random() * SECRET_SOCIETIES.length)];
  }
  
  // Generate goals
  baseNPC.goals = generateRandomGoals(Math.floor(Math.random() * 2) + 1);
  
  // Random starting location
  baseNPC.currentLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  
  return baseNPC;
}

export function generateNPCPopulation(count: number, options: NPCGeneratorOptions = {}): NPCEntity[] {
  const npcs: NPCEntity[] = [];
  
  for (let i = 0; i < count; i++) {
    npcs.push(generateProceduralNPC(options));
  }
  
  return npcs;
}

// ============================================
// SOCIAL NETWORK GENERATION
// ============================================

export function generateSocialNetwork(npcs: NPCEntity[]): void {
  for (const npc of npcs) {
    const others = npcs.filter(o => o.id !== npc.id);
    const connectionCount = Math.min(Math.floor(Math.random() * 4) + 1, others.length);
    
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    const connections = shuffled.slice(0, connectionCount);
    
    for (const other of connections) {
      const affinity = Math.floor(Math.random() * 80) - 20;  // -20 to 60
      const trust = Math.floor(Math.random() * 60) + 20;     // 20 to 80
      const respect = Math.floor(Math.random() * 60) + 20;   // 20 to 80
      
      const existingRelationship = npc.relationships.find(r => r.targetId === other.id);
      if (!existingRelationship) {
        npc.relationships.push({
          targetId: other.id,
          targetName: other.name,
          type: determineRelationshipType(affinity, trust, respect),
          affinity,
          trust,
          respect,
          history: [],
          lastInteraction: Date.now()
        });
      }
    }
  }
}

export function assignMentorships(npcs: NPCEntity[]): void {
  const faculty = npcs.filter(n => n.role === 'Teacher');
  const students = npcs.filter(n => n.role === 'Student');
  
  if (faculty.length === 0) return;
  
  for (const student of students) {
    if (Math.random() > 0.6) continue; // 40% chance of having a mentor
    
    const mentor = faculty[Math.floor(Math.random() * faculty.length)];
    
    student.mentorship = {
      ...student.mentorship,
      mentorId: mentor.id,
      mentorName: mentor.name,
      menteeIds: student.mentorship?.menteeIds || [],
      menteeNames: student.mentorship?.menteeNames || []
    };
    
    mentor.mentorship = {
      ...mentor.mentorship,
      menteeIds: [...(mentor.mentorship?.menteeIds || []), student.id],
      menteeNames: [...(mentor.mentorship?.menteeNames || []), student.name]
    };
    
    // Add positive relationship
    student.relationships.push({
      targetId: mentor.id,
      targetName: mentor.name,
      type: 'mentorship',
      affinity: 30 + Math.floor(Math.random() * 30),
      trust: 50 + Math.floor(Math.random() * 30),
      respect: 60 + Math.floor(Math.random() * 30),
      history: ['Assigned as mentor'],
      lastInteraction: Date.now()
    });
  }
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
// EVENT CHAINING SYSTEM
// ============================================

const EVENT_TEMPLATES = {
  academic: ['Math Exam', 'Science Fair', 'Debate Competition', 'Research Presentation', 'Guest Lecture'],
  social: ['Campus Festival', 'Club Competition', 'Theater Performance', 'Dance Night', 'Study Group'],
  emergency: ['Fire Drill', 'Power Outage', 'Medical Emergency', 'Weather Alert', 'Security Lockdown']
};

const EVENT_LOCATIONS = ['Library', 'Courtyard', 'Lab', 'Gym', 'Auditorium', 'Cafeteria', 'Classroom'];

export interface EventChainConfig {
  chainProbability: number;  // 0-1 chance to spawn follow-up
  maxChainDepth: number;     // Maximum follow-up events
}

export const DEFAULT_CHAIN_CONFIG: EventChainConfig = {
  chainProbability: 0.4,
  maxChainDepth: 3
};

export function generateProceduralEvent(type?: WorldEventType, durationMs?: number): WorldEvent {
  const eventTypes: WorldEventType[] = ['exam', 'competition', 'social', 'announcement', 'crisis'];
  const selectedType = type || eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  const templateType = selectedType === 'exam' ? 'academic' : 
                       selectedType === 'crisis' ? 'emergency' : 
                       selectedType === 'competition' ? 'academic' : 'social';
  
  const templates = EVENT_TEMPLATES[templateType];
  const name = templates[Math.floor(Math.random() * templates.length)];
  const location = EVENT_LOCATIONS[Math.floor(Math.random() * EVENT_LOCATIONS.length)];
  
  const duration = durationMs || (Math.floor(Math.random() * 45) + 15) * 60 * 1000; // 15-60 min
  const now = Date.now();
  
  return {
    id: `event_${now}_${Math.random().toString(36).substr(2, 9)}`,
    type: selectedType,
    name,
    description: `${name} occurring at ${location}`,
    startTime: now,
    endTime: now + duration,
    affectedLocations: [location],
    affectedNPCs: [],
    playerInvolved: Math.random() > 0.5,
    consequences: []
  };
}

export function chainEvent(
  triggerEvent: WorldEvent, 
  config: EventChainConfig = DEFAULT_CHAIN_CONFIG,
  currentDepth: number = 0
): WorldEvent | null {
  if (currentDepth >= config.maxChainDepth) return null;
  if (Math.random() > config.chainProbability) return null;
  
  // Determine follow-up event type based on trigger
  let followUpType: WorldEventType;
  switch (triggerEvent.type) {
    case 'exam':
      followUpType = Math.random() > 0.5 ? 'social' : 'announcement';
      break;
    case 'crisis':
      followUpType = 'announcement';
      break;
    case 'competition':
      followUpType = Math.random() > 0.5 ? 'social' : 'announcement';
      break;
    default:
      followUpType = ['exam', 'social', 'announcement'][Math.floor(Math.random() * 3)] as WorldEventType;
  }
  
  const followUp = generateProceduralEvent(followUpType);
  followUp.startTime = triggerEvent.endTime + (5 * 60 * 1000); // Starts 5 min after trigger ends
  followUp.endTime = followUp.startTime + (30 * 60 * 1000);    // 30 min duration
  followUp.description = `Follow-up to ${triggerEvent.name}: ${followUp.name}`;
  
  return followUp;
}

// ============================================
// ADAPTIVE GOAL EVOLUTION
// ============================================

export type GoalImpact = 'stress' | 'motivation' | 'happiness' | 'bonding' | 'fatigue' | 'excitement' | 'panic';

export function adaptGoalsToEvent(npc: NPCEntity, event: WorldEvent, impact: GoalImpact): NPCEntity {
  const updatedGoals = npc.goals.map(goal => {
    let progressChange = 0;
    
    // Academic goals
    if (goal.description.toLowerCase().includes('study') || 
        goal.description.toLowerCase().includes('exam') ||
        goal.description.toLowerCase().includes('grade') ||
        goal.description.toLowerCase().includes('research')) {
      
      if (impact === 'stress' || impact === 'panic') {
        progressChange = Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 5 : -Math.floor(Math.random() * 5);
      } else if (impact === 'motivation' || impact === 'excitement') {
        progressChange = Math.floor(Math.random() * 10) + 5;
      } else if (impact === 'fatigue') {
        progressChange = -Math.floor(Math.random() * 5);
      }
    }
    
    // Social goals
    if (goal.description.toLowerCase().includes('friend') || 
        goal.description.toLowerCase().includes('social') ||
        goal.description.toLowerCase().includes('club') ||
        goal.description.toLowerCase().includes('popular')) {
      
      if (impact === 'bonding' || impact === 'happiness') {
        progressChange = Math.floor(Math.random() * 15) + 5;
      } else if (impact === 'motivation') {
        progressChange = Math.floor(Math.random() * 10);
      }
    }
    
    // Personal goals
    if (goal.description.toLowerCase().includes('relax') || 
        goal.description.toLowerCase().includes('hobby') ||
        goal.description.toLowerCase().includes('balance')) {
      
      if (impact === 'happiness') {
        progressChange = Math.floor(Math.random() * 10) + 5;
      } else if (impact === 'stress' || impact === 'panic') {
        progressChange = -Math.floor(Math.random() * 10);
      }
    }
    
    const newProgress = Math.max(0, Math.min(100, goal.progress + progressChange));
    const newStatus = newProgress >= 100 ? 'completed' as GoalStatus : goal.status;
    
    return {
      ...goal,
      progress: newProgress,
      status: newStatus
    };
  });
  
  return { ...npc, goals: updatedGoals };
}

export function evolveGoalsOverTime(npc: NPCEntity): NPCEntity {
  // Remove completed/failed goals and potentially generate new ones
  const activeGoals = npc.goals.filter(g => g.status === 'active');
  
  // If NPC has fewer than 2 active goals, consider adding new ones
  if (activeGoals.length < 2 && Math.random() > 0.7) {
    const newGoals = generateRandomGoals(1);
    return { ...npc, goals: [...npc.goals, ...newGoals] };
  }
  
  // Occasionally increase priority of long-standing goals
  const updatedGoals = npc.goals.map(goal => {
    if (goal.status === 'active' && goal.progress < 30 && Math.random() > 0.8) {
      return { ...goal, priority: Math.min(10, goal.priority + 1) };
    }
    return goal;
  });
  
  return { ...npc, goals: updatedGoals };
}

// ============================================
// EMERGENT FACTION SYSTEM
// ============================================

export interface EmergentFaction {
  id: string;
  name: string;
  description: string;
  members: string[];       // NPC IDs
  leaderId?: string;
  leaderName?: string;
  influence: number;       // 0-100
  goals: string[];
  rivalFactions: string[];
  alliedFactions: string[];
  formed: number;          // Timestamp
}

const FACTION_NAME_PREFIXES = ['The', 'Order of', 'Society of', 'Circle of', 'Alliance of'];
const FACTION_NAME_SUFFIXES = ['Scholars', 'Seekers', 'Guardians', 'Innovators', 'Pioneers', 'Visionaries'];

export function generateFactionName(): string {
  const prefix = FACTION_NAME_PREFIXES[Math.floor(Math.random() * FACTION_NAME_PREFIXES.length)];
  const suffix = FACTION_NAME_SUFFIXES[Math.floor(Math.random() * FACTION_NAME_SUFFIXES.length)];
  return `${prefix} ${suffix}`;
}

export function detectEmergentFaction(npcs: NPCEntity[], minMembers: number = 3): EmergentFaction | null {
  // Look for clusters of NPCs with high mutual affinity
  const candidates: Map<string, Set<string>> = new Map();
  
  for (const npc of npcs) {
    const friends: string[] = [];
    
    for (const rel of npc.relationships) {
      if (rel.affinity >= 40 && rel.trust >= 50) {
        friends.push(rel.targetId);
      }
    }
    
    if (friends.length >= 2) {
      candidates.set(npc.id, new Set(friends));
    }
  }
  
  // Find overlapping friend groups
  for (const [npcId, friendSet] of candidates) {
    const potentialMembers = [npcId, ...friendSet];
    
    if (potentialMembers.length >= minMembers) {
      // Verify mutual connections
      let mutualCount = 0;
      for (const memberId of potentialMembers) {
        const memberFriends = candidates.get(memberId);
        if (memberFriends) {
          const overlap = potentialMembers.filter(m => m !== memberId && memberFriends.has(m));
          mutualCount += overlap.length;
        }
      }
      
      if (mutualCount >= minMembers - 1) {
        // Elect leader based on charisma + discipline
        const memberNPCs = npcs.filter(n => potentialMembers.includes(n.id));
        const leader = memberNPCs.reduce((best, curr) => 
          (curr.stats.charisma + curr.stats.discipline) > (best.stats.charisma + best.stats.discipline) ? curr : best
        );
        
        return {
          id: `faction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: generateFactionName(),
          description: 'An emergent group of like-minded individuals',
          members: potentialMembers,
          leaderId: leader.id,
          leaderName: leader.name,
          influence: 10 + potentialMembers.length * 5,
          goals: [],
          rivalFactions: [],
          alliedFactions: [],
          formed: Date.now()
        };
      }
    }
  }
  
  return null;
}

export function updateFactionInfluence(faction: EmergentFaction, npcs: NPCEntity[]): EmergentFaction {
  // Faction influence grows with member achievements and relationships
  const memberNPCs = npcs.filter(n => faction.members.includes(n.id));
  
  let influenceChange = 0;
  for (const member of memberNPCs) {
    // Completed goals boost influence
    const completedGoals = member.goals.filter(g => g.status === 'completed');
    influenceChange += completedGoals.length * 2;
    
    // High stats contribute
    if (member.stats.charisma > 70) influenceChange += 1;
    if (member.stats.intelligence > 70) influenceChange += 1;
  }
  
  // Natural decay
  influenceChange -= 1;
  
  return {
    ...faction,
    influence: Math.max(0, Math.min(100, faction.influence + influenceChange))
  };
}

// ============================================
// NPC MANAGER (Singleton)
// ============================================

class RadiantAIManager {
  private npcs: Map<string, NPCEntity> = new Map();
  private activeEvents: WorldEvent[] = [];
  private emergentFactions: EmergentFaction[] = [];
  private listeners: Set<(npcs: Map<string, NPCEntity>) => void> = new Set();
  private tickCounter: number = 0;
  
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
  
  // Tick - update all NPCs with full simulation features
  // Uses internal tick counter for cadence-based operations
  tick(gameHour: number, playerLocation: string | null) {
    // Increment internal tick counter
    this.tickCounter++;
    
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
      
      // Evolve goals periodically (every 5 ticks or ~5% chance per tick)
      if (Math.random() < 0.05 || this.tickCounter % 5 === 0) {
        updated = evolveGoalsOverTime(updated);
      }
      
      updated.lastUpdate = now;
      this.npcs.set(id, updated);
    }
    
    // Detect emergent factions periodically (every 10 ticks)
    if (this.tickCounter % 10 === 0) {
      this.detectNewFactions();
    }
    
    // Update faction influences periodically (every 20 ticks)
    if (this.tickCounter % 20 === 0) {
      this.updateFactions();
    }
    
    this.notifyListeners();
  }
  
  // Get current tick count for debugging/monitoring
  getTickCount(): number {
    return this.tickCounter;
  }
  
  // Add world event with optional chaining support
  addWorldEventWithChaining(event: WorldEvent, impact?: GoalImpact): WorldEvent | null {
    if (impact) {
      return this.processEventWithChaining(event, impact);
    } else {
      this.addWorldEvent(event);
      return null;
    }
  }
  
  // Subscribe to changes
  subscribe(listener: (npcs: Map<string, NPCEntity>) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.npcs));
  }
  
  // Get emergent factions
  getFactions(): EmergentFaction[] {
    return this.emergentFactions;
  }
  
  // Add emergent faction
  addFaction(faction: EmergentFaction) {
    this.emergentFactions.push(faction);
  }
  
  // Detect and add new emergent factions
  detectNewFactions() {
    const newFaction = detectEmergentFaction(this.getAllNPCs());
    if (newFaction && !this.emergentFactions.find(f => 
      f.members.sort().join(',') === newFaction.members.sort().join(',')
    )) {
      this.emergentFactions.push(newFaction);
    }
  }
  
  // Update all faction influences
  updateFactions() {
    this.emergentFactions = this.emergentFactions.map(f => 
      updateFactionInfluence(f, this.getAllNPCs())
    ).filter(f => f.influence > 0); // Remove factions with no influence
  }
  
  // Process event with chaining and goal adaptation
  processEventWithChaining(event: WorldEvent, impact: GoalImpact) {
    this.addWorldEvent(event);
    
    // Apply adaptive goal evolution to affected NPCs
    for (const npcId of event.affectedNPCs) {
      const npc = this.npcs.get(npcId);
      if (npc) {
        const updated = adaptGoalsToEvent(npc, event, impact);
        this.npcs.set(npcId, updated);
      }
    }
    
    // NPCs at affected locations also get impacted
    for (const location of event.affectedLocations) {
      const npcsAtLocation = this.getNPCsAtLocation(location);
      for (const npc of npcsAtLocation) {
        if (!event.affectedNPCs.includes(npc.id)) {
          const updated = adaptGoalsToEvent(npc, event, impact);
          this.npcs.set(npc.id, updated);
        }
      }
    }
    
    // Attempt to chain a follow-up event
    const followUp = chainEvent(event);
    if (followUp) {
      // Schedule the follow-up event (would be triggered later)
      this.activeEvents.push(followUp);
    }
    
    this.notifyListeners();
    return followUp;
  }
  
  // Serialize state for persistence
  serialize(): string {
    return JSON.stringify({
      npcs: Array.from(this.npcs.entries()),
      events: this.activeEvents,
      factions: this.emergentFactions,
      tickCounter: this.tickCounter
    });
  }
  
  // Deserialize state
  deserialize(data: string) {
    try {
      const parsed = JSON.parse(data);
      this.npcs = new Map(parsed.npcs);
      this.activeEvents = parsed.events || [];
      this.emergentFactions = parsed.factions || [];
      this.tickCounter = parsed.tickCounter || 0;
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to deserialize Radiant AI state:', e);
    }
  }
  
  // Reset tick counter (useful for new game starts)
  resetTickCounter() {
    this.tickCounter = 0;
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
    secretSociety: 'Golden Owl',
    mentorship: { menteeIds: ['marcus_chen', 'alex_reyes'], menteeNames: ['Marcus Chen', 'Alex Reyes'] },
    goals: [
      { id: 'goal_1', term: 'long', description: 'Maintain Academy excellence', priority: 9, status: 'active', progress: 60, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  },
  {
    ...createNPCEntity('prof_elena', 'Professor Elena Vasquez', 'Teacher', 'scholar', 'Faculty'),
    stats: { intelligence: 88, charisma: 65, athleticism: 30, creativity: 75, discipline: 85 },
    club: 'Science',
    mentorship: { menteeIds: ['ivy_hart'], menteeNames: ['Ivy Hart'] },
    goals: [
      { id: 'goal_2', term: 'medium', description: 'Complete research on resonance theory', priority: 8, status: 'active', progress: 40, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  },
  {
    ...createNPCEntity('marcus_chen', 'Marcus Chen', 'Student', 'leader', 'Student Council'),
    stats: { intelligence: 75, charisma: 85, athleticism: 70, creativity: 60, discipline: 75 },
    club: 'Debate',
    mentorship: { mentorId: 'headmaster_thorne', mentorName: 'Headmaster Thorne', menteeIds: [], menteeNames: [] },
    goals: [
      { id: 'goal_3', term: 'short', description: 'Win student council election', priority: 8, status: 'active', progress: 30, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  },
  {
    ...createNPCEntity('ivy_hart', 'Ivy Hart', 'Student', 'rebel', 'Underground'),
    stats: { intelligence: 80, charisma: 70, athleticism: 55, creativity: 85, discipline: 35 },
    personality: { openness: 9, conscientiousness: 3, extraversion: 5, agreeableness: 4, neuroticism: 6 },
    club: 'Art',
    secretSociety: 'Red Lotus',
    mentorship: { mentorId: 'prof_elena', mentorName: 'Professor Elena Vasquez', menteeIds: [], menteeNames: [] },
    goals: [
      { id: 'goal_4', term: 'medium', description: 'Uncover Academy secrets', priority: 9, status: 'active', progress: 25, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  },
  {
    ...createNPCEntity('sam_brooks', 'Sam Brooks', 'Student', 'nurturer'),
    stats: { intelligence: 65, charisma: 75, athleticism: 50, creativity: 70, discipline: 60 },
    club: 'Literature',
    mentorship: { menteeIds: [], menteeNames: [] },
    goals: [
      { id: 'goal_5', term: 'short', description: 'Help struggling classmates', priority: 6, status: 'active', progress: 50, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  },
  {
    ...createNPCEntity('alex_reyes', 'Alex Reyes', 'Student', 'perfectionist'),
    stats: { intelligence: 90, charisma: 45, athleticism: 40, creativity: 55, discipline: 95 },
    club: 'Chess',
    mentorship: { mentorId: 'headmaster_thorne', mentorName: 'Headmaster Thorne', menteeIds: [], menteeNames: [] },
    goals: [
      { id: 'goal_6', term: 'long', description: 'Achieve top academic ranking', priority: 10, status: 'active', progress: 70, conditions: [], blockers: [], relatedNPCs: ['marcus_chen'] }
    ]
  },
  {
    ...createNPCEntity('coach_rivera', 'Coach Rivera', 'Teacher', 'leader', 'Athletics'),
    stats: { intelligence: 60, charisma: 85, athleticism: 90, creativity: 50, discipline: 80 },
    club: 'Sports',
    schedule: [...TEACHER_SCHEDULE],
    mentorship: { menteeIds: [], menteeNames: [] },
    goals: [
      { id: 'goal_7', term: 'medium', description: 'Lead team to championship', priority: 8, status: 'active', progress: 35, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  },
  {
    ...createNPCEntity('librarian_patel', 'Librarian Patel', 'Staff', 'scholar'),
    stats: { intelligence: 85, charisma: 55, athleticism: 25, creativity: 80, discipline: 70 },
    currentLocation: 'Library',
    secretSociety: 'Silver Raven',
    mentorship: { menteeIds: [], menteeNames: [] },
    goals: [
      { id: 'goal_8', term: 'long', description: 'Preserve Academy archives', priority: 7, status: 'active', progress: 45, conditions: [], blockers: [], relatedNPCs: [] }
    ]
  }
];

// ============================================
// INITIALIZE ACADEMY WITH SOCIAL NETWORK
// ============================================

export function initializeAcademyWithProcedural(
  additionalStudents: number = 10,
  additionalFaculty: number = 2
): NPCEntity[] {
  // Start with predefined NPCs
  const allNPCs = [...ACADEMY_NPCS];
  
  // Generate additional students
  const students = generateNPCPopulation(additionalStudents, { role: 'Student' });
  allNPCs.push(...students);
  
  // Generate additional faculty
  const faculty = generateNPCPopulation(additionalFaculty, { role: 'Teacher' });
  allNPCs.push(...faculty);
  
  // Generate social network for all NPCs
  generateSocialNetwork(allNPCs);
  
  // Assign mentorships - pass full list so faculty can be matched to students
  // Only assign to students without existing mentors
  const studentsNeedingMentors = allNPCs.filter(n => !n.mentorship?.mentorId && n.role === 'Student');
  const allFaculty = allNPCs.filter(n => n.role === 'Teacher');
  
  // Assign mentors from faculty pool
  for (const student of studentsNeedingMentors) {
    if (Math.random() > 0.6 || allFaculty.length === 0) continue; // 40% chance of having a mentor
    
    const mentor = allFaculty[Math.floor(Math.random() * allFaculty.length)];
    
    student.mentorship = {
      ...student.mentorship,
      mentorId: mentor.id,
      mentorName: mentor.name,
      menteeIds: student.mentorship?.menteeIds || [],
      menteeNames: student.mentorship?.menteeNames || []
    };
    
    mentor.mentorship = {
      ...mentor.mentorship,
      menteeIds: [...(mentor.mentorship?.menteeIds || []), student.id],
      menteeNames: [...(mentor.mentorship?.menteeNames || []), student.name]
    };
    
    // Add mentorship relationship
    student.relationships.push({
      targetId: mentor.id,
      targetName: mentor.name,
      type: 'mentorship',
      affinity: 30 + Math.floor(Math.random() * 30),
      trust: 50 + Math.floor(Math.random() * 30),
      respect: 60 + Math.floor(Math.random() * 30),
      history: ['Assigned as mentor'],
      lastInteraction: Date.now()
    });
  }
  
  return allNPCs;
}
