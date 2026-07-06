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
  survival: 'cute_polar_bear_cub__da0b1b5b.jpg',  // Same as stealth for survival perks
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

// ============================================
// STARTER PERKS - Chosen at character creation
// ============================================

export type StarterPerkId = 
  | 'glasses' | 'jocked' | 'well_aligned' | 'marked_one' | 'mondays'
  | 'three_of_kind' | 'nerd_aura' | 'midlife_crisis' | 'stereotyped' 
  | 'slow_burn' | 'burnout_vengeance';

export interface StarterPerk {
  id: StarterPerkId;
  name: string;
  description: string;
  iconKey: string;
  effects: PerkEffect[];
  drawbacks?: string;
}

export const STARTER_PERKS: StarterPerk[] = [
  {
    id: 'glasses',
    name: '"I\'m blind without them."',
    description: 'Buffed mental stats from glasses, or debuff without. Glasses are fragile and must be replaced/upgraded at nurse stations.',
    iconKey: 'smart',
    effects: [
      { type: 'stat_bonus', target: 'intelligence', value: 2, description: '+2 Intelligence while wearing glasses' },
      { type: 'stat_bonus', target: 'perception', value: 2, description: '+2 Perception while wearing glasses' },
    ],
    drawbacks: '-3 Intelligence and Perception without glasses'
  },
  {
    id: 'jocked',
    name: 'Jocked',
    description: 'Physical stats increase faster, though certain factions have an established dislike for your character.',
    iconKey: 'strong',
    effects: [
      { type: 'passive_bonus', description: '+50% Physical stat growth rate' },
    ],
    drawbacks: '-10 starting reputation with academic factions'
  },
  {
    id: 'well_aligned',
    name: 'Well Aligned',
    description: 'When your reputation is symmetrical between factions, you receive bonuses. Otherwise, you suffer an overall penalty.',
    iconKey: 'mystical',
    effects: [
      { type: 'passive_bonus', description: '+10% all stats when reputations are balanced' },
    ],
    drawbacks: '-5% all stats when reputations differ significantly'
  },
  {
    id: 'marked_one',
    name: 'The Marked One',
    description: 'You are given a random nickname that affects your interactions with everyone! You also have added speech bonus from others with nicknames.',
    iconKey: 'social',
    effects: [
      { type: 'special_ability', description: 'Receive a random nickname at game start' },
      { type: 'stat_bonus', target: 'charisma', value: 2, description: '+2 Charisma with other nicknamed characters' },
    ],
  },
  {
    id: 'mondays',
    name: '"Mondays"',
    description: 'Mondays are literally the worst day ever. Increased bonus on all other days.',
    iconKey: 'survival',
    effects: [
      { type: 'passive_bonus', description: '+10% all stats Tuesday through Sunday' },
    ],
    drawbacks: '-25% all stats on Mondays'
  },
  {
    id: 'three_of_kind',
    name: 'Three of a Kind',
    description: 'Good, and bad things usually (always) come in threes.',
    iconKey: 'mystical',
    effects: [
      { type: 'special_ability', description: 'Events occur in groups of three' },
      { type: 'special_ability', description: 'Third attempt at anything has 3x effect' },
    ],
  },
  {
    id: 'nerd_aura',
    name: 'Nerd Aura',
    description: 'There are few people who won\'t immediately assume that all your mannerisms, actions, and appearance is nerdy.',
    iconKey: 'smart',
    effects: [
      { type: 'stat_bonus', target: 'intelligence', value: 1, description: '+1 Intelligence' },
      { type: 'passive_bonus', description: '+15 starting reputation with academic factions' },
      { type: 'special_ability', description: 'Nerdy dialogue options available' },
    ],
  },
  {
    id: 'midlife_crisis',
    name: 'Midlife Crisis',
    description: 'Despite being in high school, you randomly have additional actions and conversation choices to reflect a torn psyche.',
    iconKey: 'mystical',
    effects: [
      { type: 'special_ability', description: 'Random existential dialogue options' },
      { type: 'special_ability', description: 'Deep philosophical conversation choices' },
    ],
  },
  {
    id: 'stereotyped',
    name: 'Stereotyped',
    description: 'The academy takes one characteristic of yours, and either makes it socially positive or negative. You are able to verbally debate judgement, however.',
    iconKey: 'social',
    effects: [
      { type: 'special_ability', description: 'One random trait becomes socially significant' },
      { type: 'special_ability', description: 'Can debate stereotypes in conversations' },
    ],
  },
  {
    id: 'slow_burn',
    name: 'Slow Burn',
    description: 'Your academic investment yields higher long-term benefits or penalties, additionally reflected by your graduation in college.',
    iconKey: 'smart',
    effects: [
      { type: 'passive_bonus', description: '+75% long-term academic returns' },
    ],
    drawbacks: '-25% early-game academic gains'
  },
  {
    id: 'burnout_vengeance',
    name: 'Burnout Vengeance',
    description: 'Increased stats when affected by lack of sleep, or general exhaustion.',
    iconKey: 'strong',
    effects: [
      { type: 'passive_bonus', description: '+20% all combat stats when exhausted' },
      { type: 'passive_bonus', description: '+15% willpower when sleep deprived' },
    ],
  },
];

// ============================================
// LEVEL-UP PERKS - Awarded every other level
// ============================================

export interface LevelUpPerk extends Perk {
  tier?: number;
  maxTier?: number;
  levelRequired?: number;
}

export const LEVELUP_PERKS: LevelUpPerk[] = [
  // Tier-based perks
  { id: 'ambidextrous', name: 'Ambidextrous', description: 'Dual Hand Proficiency – Stat Bonuses', category: 'combat', iconKey: 'strong', effects: [{ type: 'stat_bonus', target: 'dexterity', value: 2, description: '+2 Dexterity per tier' }], rarity: 'uncommon', tier: 1, maxTier: 3 },
  { id: 'mr_electric', name: 'Mr. Electric', description: 'Tune into Biological Frequencies', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Sense nearby electronic devices' }], rarity: 'uncommon', tier: 1, maxTier: 3 },
  { id: 'wizardry', name: 'Wizardry', description: 'Spell based off Stat', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Learn spells based on your highest stat' }], rarity: 'rare', tier: 1, maxTier: 3 },
  { id: 'high_life', name: 'High-Life', description: 'Levitation Enchantment', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Can levitate briefly' }], rarity: 'legendary', tier: 1, maxTier: 3 },
  { id: 'netfix', name: 'Netfix', description: 'Additional conversation options for TV show viewership', category: 'social', iconKey: 'social', effects: [{ type: 'special_ability', description: 'TV show dialogue options' }], rarity: 'common', tier: 1, maxTier: 3 },
  { id: 'familiar_of_void', name: 'Familiar of the Void', description: 'Acquire Void Companion', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Gain a void familiar companion' }], rarity: 'legendary', tier: 1, maxTier: 3 },
  
  // Standard perks
  { id: 'enlightenment', name: 'Enlightenment', description: 'Faction Bonus – Random Information/Neurological Activity', category: 'academic', iconKey: 'smart', effects: [{ type: 'passive_bonus', description: '+5 all faction reputation' }], rarity: 'uncommon' },
  { id: 'augmentation', name: 'Augmentation', description: 'Opens Market -> Introduces New NPC(s)', category: 'survival', iconKey: 'stealth', effects: [{ type: 'skill_unlock', description: 'Unlocks the Augmentation Market' }], rarity: 'rare' },
  { id: 'hive_mentality', name: 'Hive Mentality', description: 'Alignment Bonus with Insect Lovers', category: 'social', iconKey: 'social', effects: [{ type: 'passive_bonus', description: '+20 reputation with insect enthusiasts' }], rarity: 'uncommon' },
  { id: 'so_duh', name: 'So-Duh', description: 'Bonuses from Drinking Soda', category: 'survival', iconKey: 'stealth', effects: [{ type: 'passive_bonus', description: '+3 Energy when drinking soda' }], rarity: 'common' },
  { id: 'geometry_divination', name: 'Geometry Divination', description: 'Interpretation of Divine Shapes', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'stat_bonus', target: 'perception', value: 2, description: '+2 Spiritual stat' }], rarity: 'uncommon' },
  { id: 'academic_past', name: '"I was an academic…"', description: 'Choose Bonus from Category', category: 'academic', iconKey: 'smart', effects: [{ type: 'special_ability', description: 'Choose one academic subject for +3 bonus' }], rarity: 'uncommon' },
  { id: 'wood_walker', name: 'Wood-Walker', description: 'Sensory Interpretation of Living/Dead Wood', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Sense the state of wooden objects and trees' }], rarity: 'uncommon' },
  { id: 'vegan', name: 'Vegan', description: 'Spiritual Bonus/Meal Restrictions', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'stat_bonus', target: 'endurance', value: 3, description: '+3 Spiritual stat' }], rarity: 'common' },
  { id: 'vegetarian', name: 'Vegetarian', description: 'Spiritual Bonus/Meal Restrictions', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'stat_bonus', target: 'endurance', value: 2, description: '+2 Spiritual stat' }], rarity: 'common' },
  { id: 'etherian', name: 'Etherian', description: 'Chosen by Animal Form', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Adopt an animal spirit form' }], rarity: 'rare' },
  { id: 'hall_monitor', name: 'Hall Monitor', description: 'Role Request – Reputation (+/-)', category: 'social', iconKey: 'social', effects: [{ type: 'passive_bonus', description: '+10 Faculty, -5 Student reputation' }], rarity: 'common' },
  { id: 'teachers_aide', name: "Teacher's Aide", description: 'Role Request – Reputation (+/-)', category: 'social', iconKey: 'social', effects: [{ type: 'stat_bonus', target: 'intelligence', value: 1, description: '+1 Intelligence from teaching' }], rarity: 'common' },
  { id: 'premonition', name: 'Premonition', description: 'Receive Specific Information about Future Event', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Occasionally receive hints about upcoming events' }], rarity: 'rare' },
  { id: 'billybobs_ranch', name: "Billy-Bob's Ranch", description: 'Unlocks Location (Horses/Alpacas/Kangaroos)', category: 'survival', iconKey: 'stealth', effects: [{ type: 'skill_unlock', description: "Unlocks Billy-Bob's Ranch location" }], rarity: 'uncommon' },
  { id: 'divine_intervention', name: 'Divine Intervention', description: 'Random Associated Entity Changes Circumstance', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Rarely, a divine entity intervenes in your favor' }], rarity: 'legendary' },
  { id: 'harmonics', name: 'Harmonics', description: 'Resonance Bonus', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'stat_bonus', target: 'charisma', value: 3, description: '+3 Resonance' }], rarity: 'uncommon' },
  { id: 'chess_mate', name: 'Chess-Mate', description: 'Conversation Options', category: 'academic', iconKey: 'smart', effects: [{ type: 'stat_bonus', target: 'intelligence', value: 2, description: '+2 Strategy' }], rarity: 'common' },
  { id: 'peaked', name: 'Peaked', description: 'Reputation (+/-) – Dependent on Audience', category: 'social', iconKey: 'social', effects: [{ type: 'special_ability', description: 'Reputation gains/losses amplified based on witnesses' }], rarity: 'uncommon' },
  { id: 'aura_farmer', name: 'Aura Farmer', description: 'Generate Presence (+/~/-))', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Passively generate positive, neutral, or negative aura' }], rarity: 'uncommon' },
  { id: 'power_hungry', name: 'Power Hungry', description: 'Exp. (+) for Hunger (-)', category: 'survival', iconKey: 'stealth', effects: [{ type: 'passive_bonus', description: '+25% XP gain when hungry' }], rarity: 'uncommon' },
  { id: 'weathervane', name: 'Weathervane', description: 'Storm Perception – Attracts Lightning', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Can predict weather changes' }], rarity: 'uncommon' },
  { id: 'snack_sense', name: 'Snack Sense', description: 'Barter Bonus/Food Bonus', category: 'survival', iconKey: 'stealth', effects: [{ type: 'stat_bonus', target: 'perception', value: 2, description: '+2 Barter for food items' }], rarity: 'common' },
  { id: 'karma_banker', name: 'Karma Banker', description: 'Higher Stat vs. Lower Impact', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Store karma for later use' }], rarity: 'rare' },
  { id: 'you_know_what_they_say', name: '"You know what they say…"', description: 'Grants Neutral Conversation Topic', category: 'social', iconKey: 'social', effects: [{ type: 'special_ability', description: 'Can always start a neutral conversation' }], rarity: 'common' },
  { id: 'build_different', name: 'Build Different', description: 'Alternative Dietary Choices Provide Resonance Bonus', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'passive_bonus', description: '+2 Resonance from unusual foods' }], rarity: 'uncommon' },
  { id: 'quick_grab', name: 'Quick-Grab', description: '100% Chance in Object Retrieval (Cooldown)', category: 'combat', iconKey: 'strong', effects: [{ type: 'special_ability', description: 'Guaranteed item pickup (5 minute cooldown)' }], rarity: 'uncommon' },
  { id: 'booked', name: 'Booked', description: 'Bonus Stat Increase from Reading – Time Dilation', category: 'academic', iconKey: 'smart', effects: [{ type: 'stat_bonus', target: 'intelligence', value: 2, description: '+2 to stat gains from reading' }], rarity: 'uncommon' },
  { id: 'mission_op', name: 'Mission Op', description: 'Alternate Pathways Yield Higher Exp.', category: 'survival', iconKey: 'stealth', effects: [{ type: 'passive_bonus', description: '+50% XP from alternate solutions' }], rarity: 'uncommon' },
  { id: 'funsies', name: 'Funsies', description: 'When you level up, dollar bills appear in your dorm room', category: 'social', iconKey: 'social', effects: [{ type: 'special_ability', description: 'Gain $10-50 per level up' }], rarity: 'common' },
  { id: 'tralueses', name: 'Tralueses', description: 'Every time you step down, you break a law of physics', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Random physics anomalies when descending' }], rarity: 'legendary' },
  { id: 'extreme_math_extender', name: 'Extreme Math Extender', description: 'Every time you find an unopened crate – (+) math/logic', category: 'academic', iconKey: 'smart', effects: [{ type: 'stat_bonus', target: 'intelligence', value: 1, description: '+1 Math/Logic per crate found' }], rarity: 'uncommon' },
  { id: 'art_of_boredom', name: 'The Art of Boredom', description: 'Idle-Time increases Creativity Stat', category: 'academic', iconKey: 'smart', effects: [{ type: 'passive_bonus', description: '+1 Creativity per minute idle (max 10)' }], rarity: 'common' },
  { id: 'liar_liar', name: 'Liar Liar', description: 'Lying provides exp bonus (if successful)', category: 'social', iconKey: 'social', effects: [{ type: 'passive_bonus', description: '+200% XP from successful lies' }], rarity: 'uncommon' },
  { id: 'honor_and_glory', name: 'Honor and Glory', description: 'Accepting penalties and truth provide tiers of rank.', category: 'social', iconKey: 'social', effects: [{ type: 'special_ability', description: 'Gain honor ranks for truthfulness' }], rarity: 'uncommon' },
  { id: 'attuned_hearing', name: 'Attuned Hearing', description: 'Increased Hearing (Cooldown)', category: 'survival', iconKey: 'stealth', effects: [{ type: 'special_ability', description: 'Enhanced hearing for 30 seconds (3 min cooldown)' }], rarity: 'common' },
  { id: 'shelf_centered', name: 'Shelf Centered', description: 'Sharp Increase in Mental Stats for each Trophy', category: 'academic', iconKey: 'smart', effects: [{ type: 'stat_bonus', target: 'intelligence', value: 1, description: '+1 Intelligence per trophy' }], rarity: 'uncommon' },
  { id: 'tile_by_tile', name: 'Tile by Tile', description: 'Measure resonance impact, tile by tile (Cooldown)', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'See resonance values per tile (2 min cooldown)' }], rarity: 'uncommon' },
  { id: 'natural_consequence', name: 'Natural Consequence', description: 'Nature prioritizes involvement during spiritual stat decline', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Nature intervenes when spiritual stats drop' }], rarity: 'uncommon' },
  { id: 'cool_coordinated', name: 'Cool Coordinated', description: 'Matching colors yields resonance bonus.', category: 'social', iconKey: 'social', effects: [{ type: 'passive_bonus', description: '+3 Resonance when colors match' }], rarity: 'common' },
  { id: 'candy_is_good', name: '"Candy is Good?"', description: 'Candy provides higher physical bonuses.', category: 'survival', iconKey: 'stealth', effects: [{ type: 'stat_bonus', target: 'strength', value: 3, description: '+3 to physical stats from candy' }], rarity: 'common' },
  { id: 'blade_of_arcana', name: 'Blade of Arcana', description: 'Utility bonus with Tools, lower luck stat.', category: 'combat', iconKey: 'strong', effects: [{ type: 'stat_bonus', target: 'dexterity', value: 3, description: '+3 Tool proficiency' }], rarity: 'uncommon' },
  { id: 'cherry_blossom', name: 'Blessing of the Cherry Blossom', description: 'Faith bonus directly Affects Stamina', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'stat_bonus', target: 'endurance', value: 2, description: '+2 Stamina from faith' }], rarity: 'uncommon' },
  { id: 'strayed_from_faith', name: 'Strayed from the Faith', description: 'Possessed by a Memetic device (Random)', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Gain a random memetic possession' }], rarity: 'rare' },
  { id: 'hunters_refuge', name: "Hunter's Refuge", description: 'Your dorm room offers additional healing and study bonus.', category: 'survival', iconKey: 'stealth', effects: [{ type: 'passive_bonus', description: '+50% Energy recovery in dorm' }], rarity: 'uncommon' },
  { id: 'treasure_hunter', name: 'Treasure Hunter', description: 'Finding equipment yields higher chance of key items', category: 'survival', iconKey: 'stealth', effects: [{ type: 'passive_bonus', description: '+5% cumulative chance for rare items' }], rarity: 'uncommon' },
  { id: 'pro_gamer', name: '"Pro-Gamer"', description: 'Additional conversation options for playing games', category: 'social', iconKey: 'social', effects: [{ type: 'special_ability', description: 'Gaming dialogue options' }], rarity: 'common' },
  { id: 'spiritually_inclined', name: 'Spiritually Inclined', description: 'Bonus from Spiritual attributes and Ritual', category: 'mystical', iconKey: 'mystical', effects: [{ type: 'stat_bonus', target: 'endurance', value: 2, description: '+2 Spiritual' }], rarity: 'uncommon' },
  { id: 'polar_cub_advent', name: 'Polar Cub Advent', description: "Channel the school's animal mascot during key moments.", category: 'mystical', iconKey: 'mystical', effects: [{ type: 'special_ability', description: 'Channel the polar bear mascot for power boosts' }], rarity: 'legendary' },
  { id: 'puzzle_peer', name: 'Puzzle Peer', description: 'Increased reputation XP when completing puzzles with others.', category: 'academic', iconKey: 'smart', effects: [{ type: 'passive_bonus', description: '+100% reputation XP from group puzzles' }], rarity: 'common' },
];

// Helper functions for the new perk system
export function getRandomStarterPerks(count: number = 3): StarterPerk[] {
  const shuffled = [...STARTER_PERKS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getRandomLevelUpPerks(count: number = 3, excludeIds: string[] = []): LevelUpPerk[] {
  const available = LEVELUP_PERKS.filter(p => !excludeIds.includes(p.id));
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getStarterPerkById(id: StarterPerkId): StarterPerk | undefined {
  return STARTER_PERKS.find(p => p.id === id);
}

export function getLevelUpPerkById(id: string): LevelUpPerk | undefined {
  return LEVELUP_PERKS.find(p => p.id === id);
}