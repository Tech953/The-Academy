import { generateOfflineContentPack } from "@workspace/game-engine";

import type { ContentPack } from "@workspace/game-engine";

/**
 * Keep the theme cue usable while a remote pack is still loading, then let a
 * valid synced theme replace the generated one without touching game state.
 */
export function selectWeeklyTheme(
  contentPack: Pick<ContentPack, "weeklyTheme"> | null,
  day: number,
): string {
  const syncedTheme = contentPack?.weeklyTheme.trim();
  return syncedTheme || generateOfflineContentPack(day).weeklyTheme;
}