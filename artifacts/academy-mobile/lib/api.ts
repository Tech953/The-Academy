/**
 * ═══════════════════════════════════════════════════════════
 *  THE ACADEMY — SMART FETCH LAYER (offline-first)
 *  Every helper tries the live API first, then falls back to
 *  the deterministic offline content engine. Callers always get
 *  a usable result plus a `source` flag so the UI can show which
 *  path served it.
 * ═══════════════════════════════════════════════════════════
 */

import { SeededRandom, hashString } from "./seededRandom";
import { generateNPCLine } from "./offlineContentEngine";
import type {
  Archetype,
  EmotionState,
  RelationshipTier,
} from "./dialogueTemplates";
import type { ContentPack } from "./contentPack";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
export const API_BASE = DOMAIN ? `https://${DOMAIN}` : "";

export type Source = "online" | "offline";
export interface Served<T> {
  data: T;
  source: Source;
}

async function withTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function postJson<T>(
  path: string,
  body: unknown,
  timeoutMs = 12000,
): Promise<T> {
  const res = await withTimeout(
    `${API_BASE}${path}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

// ── Connectivity ────────────────────────────────────────────────

export async function checkHealth(timeoutMs = 6000): Promise<boolean> {
  if (!API_BASE) return false;
  try {
    const res = await withTimeout(
      `${API_BASE}/api/healthz`,
      { method: "GET" },
      timeoutMs,
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ── Content pack (reference-content update channel) ──────────────

export async function fetchContentPack(): Promise<ContentPack> {
  const res = await withTimeout(
    `${API_BASE}/api/content-pack`,
    { method: "GET" },
    15000,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ContentPack;
}

// ── Offline atmospheric description generator ───────────────────

const LOCATION_ATMOS: string[] = [
  "Dust motes drift through a shaft of afternoon light, and the air carries the faint smell of chalk and old paper.",
  "Somewhere down the corridor a clock ticks with institutional patience, marking hours no one seems to keep.",
  "The walls hold the quiet hum of accumulated study — equations half-erased, ink pressed into decades of wood.",
  "A radiator knocks softly. The Neo-Gothic arches overhead frame a stillness that feels almost watchful.",
  "Reference books lean against one another like tired scholars, their spines cracked from a hundred readings.",
  "The light here is amber and low, the kind that makes you speak more quietly than you meant to.",
];

const EXAMINE_ATMOS: string[] = [
  "You lean in. Beneath the wear, there is craft — someone cared about this once, and the care lingers.",
  "Running your fingers over its surface, you feel the small history worked into it: notches, ink stains, the residue of use.",
  "It carries the weight of something meant to teach. You sense it wants to be understood, not merely looked at.",
  "There is a faint mark here, half a symbol, as though knowledge itself had tried to leave a note.",
];

function offlineDescribe(
  type: "location" | "examine",
  locationName: string,
  base?: string,
  target?: string,
): string {
  const seedKey =
    type === "location" ? locationName : `${locationName}:${target ?? ""}`;
  const rng = new SeededRandom(hashString(seedKey));
  const pool = type === "location" ? LOCATION_ATMOS : EXAMINE_ATMOS;
  const flavor = rng.pick(pool);
  if (type === "location") {
    const lead = base ? `${base} ` : "";
    return `${lead}${flavor}`;
  }
  const lead = target ? `You focus on the ${target}. ` : "";
  return `${lead}${flavor}`;
}

export interface DescribeContext {
  locationName: string;
  locationDescription?: string;
  target?: string;
  characterClass?: string;
  characterFaction?: string;
  npcsPresent?: string[];
  interactables?: string[];
}

export async function describe(
  type: "location" | "examine",
  ctx: DescribeContext,
): Promise<Served<string>> {
  try {
    const json = await postJson<{ description?: string }>("/api/ai/describe", {
      type,
      ...ctx,
    });
    if (json.description && json.description.trim().length > 0) {
      return { data: json.description.trim(), source: "online" };
    }
    throw new Error("empty description");
  } catch {
    return {
      data: offlineDescribe(
        type,
        ctx.locationName,
        ctx.locationDescription,
        ctx.target,
      ),
      source: "offline",
    };
  }
}

// ── NPC dialogue ────────────────────────────────────────────────

export interface NpcContext {
  npcId: string;
  npcName: string;
  npcTitle?: string;
  archetype: Archetype;
  emotionState: EmotionState;
  relationshipTier: RelationshipTier;
  playerName?: string;
  locationName?: string;
  conversationHistory?: { isFromPlayer: boolean; content: string }[];
}

export async function npcReply(
  playerMessage: string,
  ctx: NpcContext,
): Promise<Served<string>> {
  try {
    const json = await postJson<{ response?: string }>("/api/npc-dialogue", {
      npcName: ctx.npcName,
      npcTitle: ctx.npcTitle,
      playerMessage,
      conversationHistory: ctx.conversationHistory,
      npcRole: ctx.archetype,
      locationName: ctx.locationName,
      playerName: ctx.playerName,
    });
    if (json.response && json.response.trim().length > 0) {
      return { data: json.response.trim(), source: "online" };
    }
    throw new Error("empty response");
  } catch {
    const line = generateNPCLine({
      npcId: ctx.npcId,
      npcName: ctx.npcName,
      archetype: ctx.archetype,
      emotionState: ctx.emotionState,
      lineType: "response",
      playerName: ctx.playerName ?? "you",
      topic: playerMessage.slice(0, 40),
      dayOffset: Math.floor(Date.now() / 86400000),
    });
    return { data: line, source: "offline" };
  }
}
