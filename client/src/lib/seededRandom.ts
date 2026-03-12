/**
 * ═══════════════════════════════════════════════════════════
 *  THE ACADEMY — PHASE 1: DETERMINISTIC SEED ENGINE
 *  Mulberry32 PRNG — same seed always produces same sequence.
 *  World is reproducible without any AI or network access.
 * ═══════════════════════════════════════════════════════════
 */

export const WORLD_SEED = 12345;

// ── Mulberry32: fast, high-quality 32-bit PRNG ───────────────
export function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function (): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

// ── FNV-1a hash: string → stable 32-bit integer ──────────────
export function hashString(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash;
}

// ── Entity seed: world × entity-id × optional variant ────────
export function entitySeed(entityId: string, variant = 0): number {
  return (WORLD_SEED ^ hashString(entityId) ^ (variant * 0xdeadbeef)) >>> 0;
}

// ── Temporal seed: world × entity × in-game day offset ───────
//    In-game day advances every 24 real minutes of play.
export function temporalSeed(entityId: string, dayOffset = 0): number {
  return (WORLD_SEED ^ hashString(entityId) ^ (dayOffset * 0x9e3779b9)) >>> 0;
}

// ── Conversation seed: entity × player character ─────────────
export function conversationSeed(npcId: string, characterId: string): number {
  return (hashString(npcId) ^ hashString(characterId) ^ WORLD_SEED) >>> 0;
}

// ── Convenience class ─────────────────────────────────────────
export class SeededRandom {
  private rng: () => number;

  constructor(seed: number) {
    this.rng = mulberry32(seed);
  }

  static fromEntity(entityId: string, variant = 0) {
    return new SeededRandom(entitySeed(entityId, variant));
  }

  static fromTemporal(entityId: string, dayOffset = 0) {
    return new SeededRandom(temporalSeed(entityId, dayOffset));
  }

  static fromConversation(npcId: string, characterId: string) {
    return new SeededRandom(conversationSeed(npcId, characterId));
  }

  /** [0, 1) */
  next(): number { return this.rng(); }

  /** [min, max) */
  range(min: number, max: number): number {
    return min + this.rng() * (max - min);
  }

  /** Integer in [min, max] */
  int(min: number, max: number): number {
    return Math.floor(min + this.rng() * (max - min + 1));
  }

  /** Pick one element uniformly */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.rng() * arr.length)];
  }

  /** Pick N unique elements */
  sample<T>(arr: readonly T[], n: number): T[] {
    const copy = [...arr];
    const out: T[] = [];
    for (let i = 0; i < Math.min(n, copy.length); i++) {
      const idx = Math.floor(this.rng() * (copy.length - i));
      out.push(copy[idx]);
      copy[idx] = copy[copy.length - 1 - i];
    }
    return out;
  }

  /** Shuffle a copy of the array */
  shuffle<T>(arr: readonly T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /** Boolean with given probability (default 50%) */
  bool(p = 0.5): boolean { return this.rng() < p; }

  /** Weighted pick: weights need not sum to 1 */
  weighted<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.rng() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
}

// ── Fill template variables ───────────────────────────────────
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

// ── Seeded pick from array using string key ───────────────────
export function seededPick<T>(arr: readonly T[], key: string, variant = 0): T {
  const rng = new SeededRandom(entitySeed(key, variant));
  return rng.pick(arr);
}
