export type MemoryRarity = 'bronze' | 'silver' | 'gold' | 'platinum';
export type MemoryCategory = 'milestone' | 'academic' | 'social' | 'discovery' | 'mastery';

export interface MemoryCatalogEntry {
  id: string;
  title: string;
  hiddenTitle: string;
  description: string;
  hiddenHint: string;
  rarity: MemoryRarity;
  category: MemoryCategory;
  visualizationPrompt: string;
  defaultImage: string;
}

export interface EarnedMemory {
  id: string;
  earnedAt: string;
  imageDataUrl?: string;
}

const EARNED_KEY = 'academy-memories-v1';

export const MEMORY_CATALOG: MemoryCatalogEntry[] = [
  {
    id: 'first_boot',
    title: 'System Initialized',
    hiddenTitle: 'First Boot',
    description: 'You opened the Academy OS for the first time. The terminal flickered to life.',
    hiddenHint: 'Start the Academy for the first time.',
    rarity: 'bronze',
    category: 'milestone',
    visualizationPrompt: 'A glowing green terminal screen flickering to life in a dark retro-futuristic classroom, CRT monitor aesthetic, neon glow, Academy OS boot sequence visible',
    defaultImage: '/memory-images/first_boot.png',
  },
  {
    id: 'character_created',
    title: 'Identity Established',
    hiddenTitle: 'Your Name is...',
    description: 'You carved your name into the Academy\'s records. From this moment, your story began.',
    hiddenHint: 'Complete character creation.',
    rarity: 'bronze',
    category: 'milestone',
    visualizationPrompt: 'A student ID card materializing from neon light in a dark Academy corridor, holographic green text with a name being typed, retro-futuristic school aesthetic',
    defaultImage: '/memory-images/character_created.png',
  },
  {
    id: 'first_enroll',
    title: 'Enrolled',
    hiddenTitle: 'First Class',
    description: 'You signed up for your first course. The academy\'s curriculum welcomed you.',
    hiddenHint: 'Enroll in your first course.',
    rarity: 'bronze',
    category: 'academic',
    visualizationPrompt: 'A glowing enrollment form floating in a dark digital space, neon Academy seal, a student\'s hand signing a holographic document, retro-futuristic classroom',
    defaultImage: '/memory-images/first_enroll.png',
  },
  {
    id: 'met_cub',
    title: 'A Peculiar Guide',
    hiddenTitle: 'Meeting Cub',
    description: 'The small polar bear appeared on your screen. Somehow, you knew you wouldn\'t be alone.',
    hiddenHint: 'Open the Cub companion app.',
    rarity: 'bronze',
    category: 'social',
    visualizationPrompt: 'A cute glowing polar bear mascot appearing on a retro CRT monitor screen, surrounded by neon green Academy interface elements, warm amber eyes, playful expression',
    defaultImage: '/memory-images/met_cub.png',
  },
  {
    id: 'first_command',
    title: 'Speaking the Language',
    hiddenTitle: 'First Command',
    description: 'You typed your first command into the terminal. The Academy listened.',
    hiddenHint: 'Enter a command in the Academy terminal.',
    rarity: 'bronze',
    category: 'discovery',
    visualizationPrompt: 'Close-up of glowing green terminal text being typed, retro monospace font, neon cursor blinking, dark background with subtle CRT scanlines',
    defaultImage: '/memory-images/first_command.png',
  },
  {
    id: 'three_courses',
    title: 'Academic Focus',
    hiddenTitle: 'Triple Enrollment',
    description: 'You enrolled in three courses simultaneously. Your schedule began to take shape.',
    hiddenHint: 'Enroll in 3 or more courses.',
    rarity: 'silver',
    category: 'academic',
    visualizationPrompt: 'Three glowing course books floating in a triangular formation in a dark Academy library, each emitting different colored neon light, retro-futuristic academic setting',
    defaultImage: '/memory-images/three_courses.png',
  },
  {
    id: 'level_5',
    title: 'Rising Star',
    hiddenTitle: 'Level 5',
    description: 'Your experience crystallized into something tangible. Level 5. The Academy took notice.',
    hiddenHint: 'Reach character level 5.',
    rarity: 'silver',
    category: 'mastery',
    visualizationPrompt: 'A glowing level-up aura surrounding a student silhouette in a dark Academy hall, neon particles rising, holographic "LEVEL 5" text, retro-futuristic RPG aesthetic',
    defaultImage: '/memory-images/level_5.png',
  },
  {
    id: 'cub_bond',
    title: 'Unlikely Friendship',
    hiddenTitle: 'Bonded',
    description: 'Cub\'s affection for you reached its peak. Not every guide sticks around this long.',
    hiddenHint: 'Reach maximum Cub affection.',
    rarity: 'gold',
    category: 'social',
    visualizationPrompt: 'A student and a glowing polar bear mascot sitting together at a neon terminal in a dark Academy room, warm light radiating between them, friendship and trust, retro-futuristic atmosphere',
    defaultImage: '/memory-images/cub_bond.png',
  },
  {
    id: 'five_courses',
    title: 'Full Schedule',
    hiddenTitle: 'Academic Overachiever',
    description: 'Five courses. Some students never get this far. You filled every block on the board.',
    hiddenHint: 'Enroll in 5 or more courses.',
    rarity: 'gold',
    category: 'academic',
    visualizationPrompt: 'Five glowing holographic class schedule blocks filling a dark digital board, each a different neon color, organized and complete, retro Academy OS interface',
    defaultImage: '/memory-images/five_courses.png',
  },
  {
    id: 'ged_ready',
    title: 'The Threshold',
    hiddenTitle: 'GED Ready',
    description: 'Three stable skills in every domain. You stood at the edge of something historic.',
    hiddenHint: 'Achieve GED readiness across all 4 domains.',
    rarity: 'gold',
    category: 'mastery',
    visualizationPrompt: 'A glowing graduation portal opening in the Academy\'s Confluence Hall, four colored energy streams converging, a student standing at the threshold, dramatic neon lighting',
    defaultImage: '/memory-images/ged_ready.png',
  },
  {
    id: 'graduated',
    title: 'Departure',
    hiddenTitle: 'Graduation',
    description: 'You completed the Confluence Hall ceremony. Whatever awaits beyond the Academy — it begins now.',
    hiddenHint: 'Complete the GED graduation ceremony.',
    rarity: 'platinum',
    category: 'milestone',
    visualizationPrompt: 'A triumphant graduation moment inside a grand retro-futuristic hall, neon Academy seal glowing overhead, a student holding a holographic diploma, confetti of light particles, epic atmosphere',
    defaultImage: '/memory-images/graduated.png',
  },
];

export function getEarnedMemories(): EarnedMemory[] {
  try {
    const stored = localStorage.getItem(EARNED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function isMemoryEarned(id: string): boolean {
  return getEarnedMemories().some(m => m.id === id);
}

export function earnMemory(id: string): boolean {
  if (isMemoryEarned(id)) return false;
  const earned = getEarnedMemories();
  earned.push({ id, earnedAt: new Date().toISOString() });
  localStorage.setItem(EARNED_KEY, JSON.stringify(earned));
  return true;
}

export function saveMemoryImage(id: string, imageDataUrl: string): void {
  const earned = getEarnedMemories();
  const idx = earned.findIndex(m => m.id === id);
  if (idx !== -1) {
    earned[idx].imageDataUrl = imageDataUrl;
    localStorage.setItem(EARNED_KEY, JSON.stringify(earned));
  }
}

export function getEarnedMemory(id: string): EarnedMemory | undefined {
  return getEarnedMemories().find(m => m.id === id);
}

export const RARITY_COLORS: Record<MemoryRarity, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
};

export const RARITY_GLOW: Record<MemoryRarity, string> = {
  bronze: '#cd7f3260',
  silver: '#c0c0c060',
  gold: '#ffd70060',
  platinum: '#e5e4e260',
};

export function getRarityLabel(rarity: MemoryRarity): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    milestone: '#00ff00',
    academic: '#00ffff',
    social: '#ff69b4',
    discovery: '#cc66ff',
    mastery: '#ffaa00',
  };
  return map[category] ?? '#888';
}
