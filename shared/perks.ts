import { z } from "zod";

// Perk effect types
export interface PerkEffect {
  type: 'stat_bonus' | 'special_ability' | 'passive_bonus' | 'skill_unlock';
  target?: string; // Which stat to modify
  value?: number; // Bonus amount
  description: string;
}

// Perk definition with polar cub icon
export interface Perk {
  id: string;
  name: string;
  description: string;
  category: 'combat' | 'social' | 'academic' | 'survival' | 'mystical';
  iconKey: string; // Which polar cub image to use
  effects: PerkEffect[];
  prerequisites?: {
    level?: number;
    stats?: Record<string, number>;
    otherPerks?: string[];
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

// Character perk instance (unlocked perk)
export interface CharacterPerk {
  perkId: string;
  level: number;
  unlockedAt: string; // timestamp
}

// Polar cub icon mapping - each image represents different perk themes
export const POLAR_CUB_ICONS = {
  strong: 'cute_polar_bear_cub__98a707c7.jpg',    // Strong/determined pose for combat perks
  smart: 'cute_polar_bear_cub__ec414e02.jpg',     // Curious/thinking pose for academic perks  
  social: 'cute_polar_bear_cub__5ff14998.jpg',    // Friendly/playful pose for social perks
  stealth: 'cute_polar_bear_cub__da0b1b5b.jpg',   // Alert/cautious pose for survival perks
  mystical: 'cute_polar_bear_cub__392eeae5.jpg'   // Magical/serene pose for mystical perks
} as const;

// Complete perk database with polar cub demonstrations
export const PERK_DATABASE: Record<string, Perk> = {
  // Combat Perks (Strong polar cub - combat ready stance)
  iron_will: {
    id: 'iron_will',
    name: 'Iron Will',
    description: 'Your determination is unbreakable. Gain resistance to mental effects and +2 Endurance.',
    category: 'combat',
    iconKey: 'strong',
    effects: [
      { type: 'stat_bonus', target: 'endurance', value: 2, description: '+2 Endurance' },
      { type: 'passive_bonus', description: 'Resistance to fear and mental effects' }
    ],
    rarity: 'common'
  },
  
  berserker_fury: {
    id: 'berserker_fury',
    name: 'Berserker Fury',
    description: 'Channel your inner rage. +3 Strength but -1 Intelligence during combat.',
    category: 'combat',
    iconKey: 'strong',
    effects: [
      { type: 'stat_bonus', target: 'strength', value: 3, description: '+3 Strength in combat' },
      { type: 'stat_bonus', target: 'intelligence', value: -1, description: '-1 Intelligence in combat' }
    ],
    prerequisites: { stats: { strength: 60 } },
    rarity: 'uncommon'
  },

  // Academic Perks (Smart polar cub - thinking/studying pose)
  quick_learner: {
    id: 'quick_learner',
    name: 'Quick Learner',
    description: 'Your mind absorbs knowledge like a sponge. +2 Intelligence and faster skill progression.',
    category: 'academic',
    iconKey: 'smart',
    effects: [
      { type: 'stat_bonus', target: 'intelligence', value: 2, description: '+2 Intelligence' },
      { type: 'passive_bonus', description: '25% faster skill progression' }
    ],
    rarity: 'common'
  },

  photographic_memory: {
    id: 'photographic_memory',
    name: 'Photographic Memory',
    description: 'You never forget what you\'ve seen. Perfect recall of conversations and discovered secrets.',
    category: 'academic',
    iconKey: 'smart',
    effects: [
      { type: 'special_ability', description: 'Perfect memory of all conversations and clues' },
      { type: 'stat_bonus', target: 'perception', value: 1, description: '+1 Perception' }
    ],
    prerequisites: { stats: { intelligence: 70 } },
    rarity: 'rare'
  },

  // Social Perks (Social polar cub - friendly/charismatic pose)  
  silver_tongue: {
    id: 'silver_tongue',
    name: 'Silver Tongue',
    description: 'Your words carry weight and charm. +2 Charisma and improved dialogue options.',
    category: 'social',
    iconKey: 'social',
    effects: [
      { type: 'stat_bonus', target: 'charisma', value: 2, description: '+2 Charisma' },
      { type: 'special_ability', description: 'Unlock additional dialogue options' }
    ],
    rarity: 'common'
  },

  natural_leader: {
    id: 'natural_leader',
    name: 'Natural Leader',
    description: 'Others are drawn to follow you. Boost faction reputation gains and NPC cooperation.',
    category: 'social',
    iconKey: 'social',
    effects: [
      { type: 'passive_bonus', description: '50% faster reputation gains' },
      { type: 'special_ability', description: 'NPCs more likely to help and trust you' }
    ],
    prerequisites: { stats: { charisma: 65 } },
    rarity: 'uncommon'
  },

  // Survival Perks (Stealth polar cub - alert/cautious pose)
  keen_senses: {
    id: 'keen_senses',
    name: 'Keen Senses',
    description: 'Nothing escapes your notice. +3 Perception and detect hidden objects and passages.',
    category: 'survival',
    iconKey: 'stealth',
    effects: [
      { type: 'stat_bonus', target: 'perception', value: 3, description: '+3 Perception' },
      { type: 'special_ability', description: 'Automatically detect hidden objects and secret passages' }
    ],
    rarity: 'common'
  },

  shadow_walker: {
    id: 'shadow_walker',
    name: 'Shadow Walker',
    description: 'Move like a ghost through the academy. +2 Dexterity and improved stealth capabilities.',
    category: 'survival',
    iconKey: 'stealth',
    effects: [
      { type: 'stat_bonus', target: 'dexterity', value: 2, description: '+2 Dexterity' },
      { type: 'special_ability', description: 'Move undetected through academy halls' }
    ],
    prerequisites: { stats: { dexterity: 60 } },
    rarity: 'uncommon'
  },

  // Mystical Perks (Mystical polar cub - magical/serene pose)
  arcane_affinity: {
    id: 'arcane_affinity',
    name: 'Arcane Affinity', 
    description: 'The mysteries of magic come naturally to you. Sense magical auras and enhanced mystical faction reputation.',
    category: 'mystical',
    iconKey: 'mystical',
    effects: [
      { type: 'special_ability', description: 'Sense magical items and enchantments' },
      { type: 'passive_bonus', description: 'Double reputation gains with mystical factions' }
    ],
    rarity: 'uncommon'
  },

  prophet_visions: {
    id: 'prophet_visions',
    name: 'Prophet Visions',
    description: 'Glimpse fragments of possible futures. Occasionally receive hints about upcoming events.',
    category: 'mystical',
    iconKey: 'mystical',
    effects: [
      { type: 'special_ability', description: 'Random prophetic visions about future events' },
      { type: 'stat_bonus', target: 'perception', value: 1, description: '+1 Perception' }
    ],
    prerequisites: { stats: { intelligence: 65, perception: 65 } },
    rarity: 'legendary'
  }
};

// Validation schemas
export const perkEffectSchema = z.object({
  type: z.enum(['stat_bonus', 'special_ability', 'passive_bonus', 'skill_unlock']),
  target: z.string().optional(),
  value: z.number().optional(),
  description: z.string()
});

export const characterPerkSchema = z.object({
  perkId: z.string(),
  level: z.number().min(1),
  unlockedAt: z.string()
});

// Helper functions
export function getPerksByCategory(category: Perk['category']): Perk[] {
  return Object.values(PERK_DATABASE).filter(perk => perk.category === category);
}

export function getAvailablePerks(character: { stats: Record<string, number>, perks: CharacterPerk[] }): Perk[] {
  const unlockedPerkIds = character.perks.map(p => p.perkId);
  
  return Object.values(PERK_DATABASE).filter(perk => {
    // Skip if already unlocked
    if (unlockedPerkIds.includes(perk.id)) return false;
    
    // Check stat prerequisites
    if (perk.prerequisites?.stats) {
      for (const [stat, required] of Object.entries(perk.prerequisites.stats)) {
        if ((character.stats[stat] || 0) < required) return false;
      }
    }
    
    // Check perk prerequisites  
    if (perk.prerequisites?.otherPerks) {
      for (const requiredPerk of perk.prerequisites.otherPerks) {
        if (!unlockedPerkIds.includes(requiredPerk)) return false;
      }
    }
    
    return true;
  });
}

export function applyPerkEffects(baseStats: Record<string, number>, perks: CharacterPerk[]): Record<string, number> {
  const modifiedStats = { ...baseStats };
  
  for (const characterPerk of perks) {
    const perk = PERK_DATABASE[characterPerk.perkId];
    if (!perk) continue;
    
    for (const effect of perk.effects) {
      if (effect.type === 'stat_bonus' && effect.target && effect.value) {
        modifiedStats[effect.target] = (modifiedStats[effect.target] || 0) + effect.value;
      }
    }
  }
  
  return modifiedStats;
}

// Types already exported above