/**
 * Thin fetch layer for The Academy's online AI endpoints.
 *
 * The backend (artifacts/api-server) is not represented in the OpenAPI spec
 * yet, so this mirrors the sibling web frontend's approach of calling the
 * shared-proxy `/api/...` routes directly with same-origin fetch.
 *
 * Every call is wrapped with a short timeout and normalized errors so
 * GameContext can transparently fall back to the offline content engine.
 */

const REQUEST_TIMEOUT_MS = 9000;

/**
 * `EXPO_PUBLIC_DOMAIN` is injected by the Replit dev workflow or baked into
 * the EAS preview/production profiles. It contains only the public deployment
 * hostname; no credentials belong in this value. Rather than throwing and
 * letting every online call blow up with a config error, we report "no
 * backend configured" so callers can proactively treat the app as offline
 * instead of racing a fetch that can never succeed.
 */
export function hasApiConfig(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_DOMAIN);
}

function getApiBaseUrl(): string | null {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}/api` : null;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("No backend configured (EXPO_PUBLIC_DOMAIN unset) — using offline content.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Request to ${path} failed with status ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function getJson<T>(path: string): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("No backend configured (EXPO_PUBLIC_DOMAIN unset) — using offline content.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Request to ${path} failed with status ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export interface DescribeLocationParams {
  locationName: string;
  locationDescription: string;
  npcsPresent: string[];
  interactables: string[];
}

export async function fetchLocationDescription(
  params: DescribeLocationParams,
): Promise<string> {
  const data = await postJson<{ description: string }>("/ai/describe", {
    type: "location",
    locationName: params.locationName,
    locationDescription: params.locationDescription,
    npcsPresent: params.npcsPresent,
    interactables: params.interactables,
  });
  return data.description;
}

export interface DescribeExamineParams {
  target: string;
  locationName: string;
  locationDescription: string;
}

export async function fetchExamineDescription(
  params: DescribeExamineParams,
): Promise<string> {
  const data = await postJson<{ description: string }>("/ai/describe", {
    type: "examine",
    target: params.target,
    locationName: params.locationName,
    locationDescription: params.locationDescription,
  });
  return data.description;
}

export interface NpcDialogueParams {
  npcName: string;
  npcTitle: string;
  npcRole: string;
  npcFaction?: string | null;
  npcBackstory: string;
  playerMessage: string;
  playerName: string;
  locationName: string;
  conversationHistory: Array<{ isFromPlayer: boolean; content: string }>;
}

export async function fetchNpcDialogue(
  params: NpcDialogueParams,
): Promise<string> {
  const data = await postJson<{ response: string }>("/npc-dialogue", {
    npcName: params.npcName,
    npcTitle: params.npcTitle,
    npcRole: params.npcRole,
    npcFaction: params.npcFaction ?? undefined,
    npcBackstory: params.npcBackstory,
    playerMessage: params.playerMessage,
    playerName: params.playerName,
    locationName: params.locationName,
    conversationHistory: params.conversationHistory,
  });
  return data.response;
}

export interface ContentPackEvent {
  id: string;
  title: string;
  description: string;
  npcReaction: string;
  playerHook: string;
  category: string;
  durationDays: number;
  tags: string[];
}

export interface ContentPack {
  version: string;
  generatedAt: number;
  expiresAt: number;
  worldSeed: number;
  weeklyTheme: string;
  themeContext: string;
  activeEvents: ContentPackEvent[];
  npcMoodShifts: Array<{
    npcId: string;
    npcName: string;
    emotionState: string;
    reason: string;
  }>;
  gedFocusAreas: Array<{ subject: string; topic: string; whyNow: string }>;
  generatedBy: "gpt" | "deterministic";
  rssHeadlines?: string[];
}

export async function fetchContentPack(): Promise<ContentPack> {
  return getJson<ContentPack>("/content-pack");
}
