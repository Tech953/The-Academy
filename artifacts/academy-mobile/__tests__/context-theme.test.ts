import { describe, expect, it } from "vitest";

import { generateOfflineContentPack } from "@workspace/game-engine";
import { selectWeeklyTheme } from "../lib/themeSelection";

describe("GameContext weekly theme selection", () => {
  it("shows the generated offline theme before a content-pack response arrives", async () => {
    const day = 8;
    const offlineTheme = generateOfflineContentPack(day).weeklyTheme;
    let resolvePack: (pack: { weeklyTheme: string }) => void = () => {};
    const syncedPack = new Promise<{ weeklyTheme: string }>((resolve) => {
      resolvePack = resolve;
    });

    // The provider has no remote pack yet, so the cue is immediately usable.
    expect(selectWeeklyTheme(null, day)).toBe(offlineTheme);

    resolvePack({ weeklyTheme: "Student Showcase Week" });
    expect(selectWeeklyTheme(await syncedPack, day)).toBe("Student Showcase Week");
  });

  it("lets a valid synced theme replace the offline theme", () => {
    const day = 8;
    const offlineTheme = generateOfflineContentPack(day).weeklyTheme;

    expect(selectWeeklyTheme({ weeklyTheme: "Student Showcase Week" }, day)).toBe(
      "Student Showcase Week",
    );
    expect(selectWeeklyTheme({ weeklyTheme: "   " }, day)).toBe(offlineTheme);
  });

  it("does not mutate relationship scores or dialogue history", () => {
    const gameState = {
      relationships: {
        archivist: { score: 42, tier: "friendly", emotion: "focused" },
      },
      dialogueHistory: {
        archivist: [{ role: "npc", text: "Keep going.", timestamp: 123 }],
      },
    };
    const beforeThemeUpdate = structuredClone(gameState);

    selectWeeklyTheme(null, 8);
    selectWeeklyTheme({ weeklyTheme: "Student Showcase Week" }, 8);

    expect(gameState).toEqual(beforeThemeUpdate);
  });
});