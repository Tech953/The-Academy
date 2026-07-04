/**
 * ═══════════════════════════════════════════════════════════
 *  THE ACADEMY — CONTENT PACK SCHEMA
 *  Shared between server (generation) and client (consumption).
 *  Generated weekly by cron, distributed to all installs.
 * ═══════════════════════════════════════════════════════════
 */

export interface PackWorldEvent {
  id: string;
  title: string;
  description: string;
  npcReaction: string;
  playerHook: string;
  category: string;
  durationDays: number;
  tags: string[];
}

export interface PackNpcMood {
  npcId: string;
  npcName: string;
  emotionState: string;
  reason: string;            // Short flavor reason: "anxious about the exam"
}

export interface PackGEDFocus {
  subject: string;           // 'math' | 'language_arts' | 'science' | 'social_studies'
  topic: string;
  whyNow: string;            // Flavor text connecting it to weekly theme
}

export interface ContentPack {
  version: string;           // "pack-2026-W11"
  generatedAt: number;       // Unix ms
  expiresAt: number;         // Unix ms (generatedAt + 7 days)
  worldSeed: number;         // Always 12345 for deterministic fallback
  weeklyTheme: string;       // "A week of unexpected discoveries"
  themeContext: string;      // 2–3 sentence flavor paragraph
  activeEvents: PackWorldEvent[];
  npcMoodShifts: PackNpcMood[];
  gedFocusAreas: PackGEDFocus[];
  generatedBy: 'gpt' | 'deterministic';
  rssHeadlines?: string[];   // Real-world headlines that seeded this week's events
}

/** One week in milliseconds */
export const PACK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** localStorage key for the client-cached pack */
export const CONTENT_PACK_STORAGE_KEY = 'academy-content-pack-v1';

/** API endpoint */
export const CONTENT_PACK_ENDPOINT = '/api/content-pack';

/** Is a pack still valid (not expired)? */
export function isPackFresh(pack: ContentPack): boolean {
  return Date.now() < pack.expiresAt;
}

/** ISO week string like "2026-W11" */
export function currentWeekKey(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
