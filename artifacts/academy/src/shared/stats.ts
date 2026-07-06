// ============================================
// THE ACADEMY - COMPREHENSIVE STAT SYSTEM
// ============================================
// Based on 3-tier system: Physical, Mental, Spiritual
// Each category has multiple sub-stats represented by polar bear mascot icons

// Stat icon image mappings - each stat has a unique bear mascot representation
export const STAT_ICONS = {
  // Category icons (main categories)
  physical: 'STAT_ICON_PROTOTYPE_1769387147172.png',
  mental: 'STAT_ICON_PROTOTYPE_1769387147172.png',
  spiritual: 'STAT_ICON_PROTOTYPE_1769387147172.png',
  
  // Physical stats (from prototype 2)
  quickness: 'STAT_ICON_PROTOTYPE_2_1769387147169.png',
  endurance: 'STAT_ICON_PROTOTYPE_2_1769387147169.png',
  agility: 'STAT_ICON_PROTOTYPE_2_1769387147169.png',
  speed: 'STAT_ICON_PROTOTYPE_2_1769387147169.png',
  strength: 'STAT_ICON_PROTOTYPE_2_1769387147169.png',
  
  // Mental stats (from prototype 3)
  mathLogic: 'STAT_ICON_PROTOTYPE_3_1769387147170.png',
  linguistic: 'STAT_ICON_PROTOTYPE_3_1769387147170.png',
  presence: 'STAT_ICON_PROTOTYPE_3_1769387147170.png',
  fortitude: 'STAT_ICON_PROTOTYPE_3_1769387147170.png',
  musicCreative: 'STAT_ICON_PROTOTYPE_3_1769387147170.png',
  
  // Spiritual stats (from prototype 4)
  faith: 'STAT_ICON_PROTOTYPE_4_1769387147171.png',
  karma: 'STAT_ICON_PROTOTYPE_4_1769387147171.png',
  resonance: 'STAT_ICON_PROTOTYPE_4_1769387147171.png',
  luck: 'STAT_ICON_PROTOTYPE_4_1769387147171.png',
  chi: 'STAT_ICON_PROTOTYPE_4_1769387147171.png',
  nagual: 'STAT_ICON_PROTOTYPE_4_1769387147171.png',
  ashe: 'STAT_ICON_PROTOTYPE_4_1769387147171.png',
} as const;

export type StatKey = keyof typeof STAT_ICONS;

// Stat category definitions
export type StatCategory = 'physical' | 'mental' | 'spiritual';

export interface StatDefinition {
  id: string;
  name: string;
  description: string;
  category: StatCategory;
  iconKey: StatKey;
  abbreviation: string;
}

// Physical Stats - Body and athletic capabilities
export const PHYSICAL_STATS: StatDefinition[] = [
  {
    id: 'quickness',
    name: 'Quickness',
    description: 'Reaction time and reflexes. Affects dodge chance and initiative in encounters.',
    category: 'physical',
    iconKey: 'quickness',
    abbreviation: 'QCK'
  },
  {
    id: 'endurance',
    name: 'Endurance',
    description: 'Stamina and resistance to fatigue. Determines how long you can exert yourself.',
    category: 'physical',
    iconKey: 'endurance',
    abbreviation: 'END'
  },
  {
    id: 'agility',
    name: 'Agility',
    description: 'Flexibility and coordination. Affects balance, climbing, and acrobatic actions.',
    category: 'physical',
    iconKey: 'agility',
    abbreviation: 'AGI'
  },
  {
    id: 'speed',
    name: 'Speed',
    description: 'Raw movement velocity. Determines travel time and escape abilities.',
    category: 'physical',
    iconKey: 'speed',
    abbreviation: 'SPD'
  },
  {
    id: 'strength',
    name: 'Strength',
    description: 'Raw physical power. Affects carrying capacity, melee damage, and physical tasks.',
    category: 'physical',
    iconKey: 'strength',
    abbreviation: 'STR'
  }
];

// Mental Stats - Intelligence and cognitive abilities
export const MENTAL_STATS: StatDefinition[] = [
  {
    id: 'mathLogic',
    name: 'Math-Logic',
    description: 'Mathematical reasoning and logical thinking. Crucial for science and problem-solving.',
    category: 'mental',
    iconKey: 'mathLogic',
    abbreviation: 'MTH'
  },
  {
    id: 'linguistic',
    name: 'Linguistic',
    description: 'Language comprehension and communication skills. Affects reading, writing, and persuasion.',
    category: 'mental',
    iconKey: 'linguistic',
    abbreviation: 'LNG'
  },
  {
    id: 'presence',
    name: 'Presence',
    description: 'Social awareness and emotional intelligence. Affects how others perceive and respond to you.',
    category: 'mental',
    iconKey: 'presence',
    abbreviation: 'PRS'
  },
  {
    id: 'fortitude',
    name: 'Fortitude',
    description: 'Mental resilience and willpower. Resistance to fear, stress, and mental manipulation.',
    category: 'mental',
    iconKey: 'fortitude',
    abbreviation: 'FOR'
  },
  {
    id: 'musicCreative',
    name: 'Music-Creative',
    description: 'Artistic expression and creative thinking. Affects arts, music, and innovative solutions.',
    category: 'mental',
    iconKey: 'musicCreative',
    abbreviation: 'CRE'
  }
];

// Spiritual Stats - Mystical and metaphysical abilities
export const SPIRITUAL_STATS: StatDefinition[] = [
  {
    id: 'faith',
    name: 'Faith',
    description: 'Belief and devotion. Strengthens resolve and unlocks divine interactions.',
    category: 'spiritual',
    iconKey: 'faith',
    abbreviation: 'FTH'
  },
  {
    id: 'karma',
    name: 'Karma',
    description: 'Cosmic balance of actions. Affects random events and NPC attitudes toward you.',
    category: 'spiritual',
    iconKey: 'karma',
    abbreviation: 'KRM'
  },
  {
    id: 'resonance',
    name: 'Resonance',
    description: 'Attunement to mystical energies. Affects sensitivity to supernatural phenomena.',
    category: 'spiritual',
    iconKey: 'resonance',
    abbreviation: 'RSN'
  },
  {
    id: 'luck',
    name: 'Luck',
    description: 'Fortune and chance. Affects critical successes, loot drops, and random encounters.',
    category: 'spiritual',
    iconKey: 'luck',
    abbreviation: 'LCK'
  },
  {
    id: 'chi',
    name: 'Chi',
    description: 'Life force energy. Affects energy recovery and inner balance.',
    category: 'spiritual',
    iconKey: 'chi',
    abbreviation: 'CHI'
  },
  {
    id: 'nagual',
    name: 'Nagual',
    description: 'Spirit animal connection. Unlocks animal companion bonuses and nature affinity.',
    category: 'spiritual',
    iconKey: 'nagual',
    abbreviation: 'NGL'
  },
  {
    id: 'ashe',
    name: 'Ashe',
    description: 'Ancestral power and divine authority. Affects leadership and ritual effectiveness.',
    category: 'spiritual',
    iconKey: 'ashe',
    abbreviation: 'ASH'
  }
];

// All stats combined
export const ALL_STATS: StatDefinition[] = [
  ...PHYSICAL_STATS,
  ...MENTAL_STATS,
  ...SPIRITUAL_STATS
];

// Get stat by ID
export function getStatById(id: string): StatDefinition | undefined {
  return ALL_STATS.find(stat => stat.id === id);
}

// Get stats by category
export function getStatsByCategory(category: StatCategory): StatDefinition[] {
  return ALL_STATS.filter(stat => stat.category === category);
}

// Category metadata
export const STAT_CATEGORIES: Record<StatCategory, { name: string; description: string; iconKey: StatKey }> = {
  physical: {
    name: 'Physical',
    description: 'Body and athletic capabilities',
    iconKey: 'physical'
  },
  mental: {
    name: 'Mental',
    description: 'Intelligence and cognitive abilities',
    iconKey: 'mental'
  },
  spiritual: {
    name: 'Spiritual',
    description: 'Mystical and metaphysical abilities',
    iconKey: 'spiritual'
  }
};

// Full character stats interface (new 17-stat system)
export interface FullCharacterStats {
  // Physical (5 stats)
  quickness: number;
  endurance: number;
  agility: number;
  speed: number;
  strength: number;
  
  // Mental (5 stats)
  mathLogic: number;
  linguistic: number;
  presence: number;
  fortitude: number;
  musicCreative: number;
  
  // Spiritual (7 stats)
  faith: number;
  karma: number;
  resonance: number;
  luck: number;
  chi: number;
  nagual: number;
  ashe: number;
}

// Default stats for new characters
export const DEFAULT_STATS: FullCharacterStats = {
  // Physical
  quickness: 10,
  endurance: 10,
  agility: 10,
  speed: 10,
  strength: 10,
  
  // Mental
  mathLogic: 10,
  linguistic: 10,
  presence: 10,
  fortitude: 10,
  musicCreative: 10,
  
  // Spiritual
  faith: 5,
  karma: 50, // Neutral karma
  resonance: 5,
  luck: 10,
  chi: 10,
  nagual: 0,
  ashe: 0
};

// Calculate category totals
export function getCategoryTotal(stats: FullCharacterStats, category: StatCategory): number {
  const categoryStats = getStatsByCategory(category);
  return categoryStats.reduce((total, stat) => {
    const value = stats[stat.id as keyof FullCharacterStats];
    return total + (typeof value === 'number' ? value : 0);
  }, 0);
}

// Legacy stat mapping (for backward compatibility with old 7-stat system)
export function mapLegacyStats(legacyStats: {
  perception?: number;
  intelligence?: number;
  charisma?: number;
  dexterity?: number;
  strength?: number;
  health?: number;
  endurance?: number;
}): Partial<FullCharacterStats> {
  return {
    // Map old stats to new system
    quickness: legacyStats.perception || 10,
    endurance: legacyStats.endurance || legacyStats.health || 10,
    agility: legacyStats.dexterity || 10,
    speed: legacyStats.dexterity || 10,
    strength: legacyStats.strength || 10,
    mathLogic: legacyStats.intelligence || 10,
    linguistic: legacyStats.intelligence || 10,
    presence: legacyStats.charisma || 10,
    fortitude: legacyStats.endurance || 10,
    musicCreative: legacyStats.charisma || 10,
    luck: 10,
    karma: 50,
    faith: 5,
    resonance: 5,
    chi: 10,
    nagual: 0,
    ashe: 0
  };
}
