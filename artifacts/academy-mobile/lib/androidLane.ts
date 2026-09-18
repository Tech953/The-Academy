import {
  generateOfflineContentPack,
  type ContentPack,
} from "@workspace/game-engine";

import { CONTENT_PACK_STORAGE_KEY, type ContentPackStorage } from "./contentPackFallback";

export const ANDROID_LANE_STORAGE_PARAM = "androidLane";
export const ANDROID_LANE_ENABLED = process.env.EXPO_PUBLIC_ANDROID_LANE === "1";

export type AndroidLaneStorageCommand = "corrupt" | "expired";

export function getAndroidLaneCommand(url: string): string | null {
  const match = url.match(/[?&]androidLane=([^&#]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export async function applyAndroidLaneStorageCommand(
  storage: ContentPackStorage,
  command: AndroidLaneStorageCommand,
  day: number,
  now = Date.now(),
): Promise<void> {
  if (command === "corrupt") {
    await storage.setItem(CONTENT_PACK_STORAGE_KEY, "{not-valid-json");
    return;
  }

  const expiredPack: ContentPack = {
    ...generateOfflineContentPack(day),
    generatedAt: now - 2,
    expiresAt: now - 1,
  };
  await storage.setItem(CONTENT_PACK_STORAGE_KEY, JSON.stringify(expiredPack));
}