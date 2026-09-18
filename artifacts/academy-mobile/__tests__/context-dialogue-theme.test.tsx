import React, { useEffect } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  fetchContentPack: vi.fn(),
  generateNPCLine: vi.fn((options: { weeklyTheme?: string }) =>
    `Generated with ${options.weeklyTheme ?? "offline fallback"}`,
  ),
  resolveNpcReply: vi.fn(
    async (
      _params: unknown,
      offlineFallback: () => string,
    ) => ({ text: offlineFallback(), source: "offline" as const }),
  ),
}));

vi.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => true,
}));

vi.mock("@/lib/api", () => ({
  fetchContentPack: mocks.fetchContentPack,
  hasApiConfig: () => true,
}));

vi.mock("@/lib/gameFallbacks", () => ({
  resolveLocationDescription: vi.fn(async (params: { locationDescription: string }) => ({
    text: params.locationDescription,
    source: "offline" as const,
  })),
  resolveExamineDescription: vi.fn(async (params: { target: string }) => ({
    text: params.target,
    source: "offline" as const,
  })),
  resolveNpcReply: mocks.resolveNpcReply,
}));

vi.mock("@workspace/game-engine", async () => {
  const actual = await vi.importActual<typeof import("@workspace/game-engine")>(
    "@workspace/game-engine",
  );
  return {
    ...actual,
    generateNPCLine: mocks.generateNPCLine,
  };
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateOfflineContentPack } from "@workspace/game-engine";
import { GameProvider, useGame } from "../context/GameContext";

type Game = ReturnType<typeof useGame>;

function ThemeProbe({ onUpdate }: { onUpdate: (game: Game) => void }) {
  const game = useGame();

  useEffect(() => {
    onUpdate(game);
  }, [game, onUpdate]);

  return null;
}

function createLocalStorageFixture() {
  const values = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage },
  });

  return localStorage;
}

async function waitFor(
  predicate: () => boolean,
  renderer: TestRenderer.ReactTestRenderer,
) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (predicate()) return;
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }

  renderer.unmount();
  throw new Error("Timed out waiting for GameProvider state");
}

describe("GameProvider NPC dialogue weekly theme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("passes a restored synced theme to NPC fallback generation", async () => {
    const localStorage = createLocalStorageFixture();
    const day = 8;
    const syncedTheme = "Student Showcase Week";
    const syncedPack = {
      ...generateOfflineContentPack(day),
      version: "pack-dialogue-theme",
      generatedBy: "gpt" as const,
      weeklyTheme: syncedTheme,
      eventsRepaired: false,
    };

    localStorage.setItem(
      "academy-mobile-state-v1",
      JSON.stringify({ hasStarted: true, day }),
    );
    mocks.fetchContentPack.mockResolvedValueOnce(syncedPack).mockRejectedValueOnce(
      new Error("refresh unavailable"),
    );

    let firstGame: Game | undefined;
    let firstRenderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      firstRenderer = TestRenderer.create(
        <GameProvider>
          <ThemeProbe onUpdate={game => (firstGame = game)} />
        </GameProvider>,
      );
    });
    await waitFor(
      () =>
        firstGame?.ready === true &&
        firstGame.contentPack?.weeklyTheme === syncedTheme &&
        firstGame.contentPackStorageStatus === "stored",
      firstRenderer,
    );
    firstRenderer.unmount();

    let restoredGame: Game | undefined;
    let restoredRenderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      restoredRenderer = TestRenderer.create(
        <GameProvider>
          <ThemeProbe onUpdate={game => (restoredGame = game)} />
        </GameProvider>,
      );
    });
    await waitFor(
      () =>
        restoredGame?.ready === true &&
        restoredGame.contentPack?.weeklyTheme === syncedTheme &&
        restoredGame.contentPackLoading === false,
      restoredRenderer,
    );

    await act(async () => {
      await restoredGame!.sendDialogue("receptionist_emily", "What is happening on campus?");
    });

    expect(restoredGame?.weeklyTheme).toBe(syncedTheme);
    expect(mocks.generateNPCLine).toHaveBeenCalledWith(
      expect.objectContaining({ weeklyTheme: syncedTheme }),
    );
    expect(mocks.generateNPCLine).not.toHaveBeenCalledWith(
      expect.objectContaining({
        weeklyTheme: generateOfflineContentPack(day).weeklyTheme,
      }),
    );

    restoredRenderer.unmount();
  });

  it("lets an online learner retry a failed content refresh without changing progress", async () => {
    const localStorage = createLocalStorageFixture();
    localStorage.setItem(
      "academy-mobile-state-v1",
      JSON.stringify({ hasStarted: true, day: 1 }),
    );
    const connectedPack = {
      ...generateOfflineContentPack(1),
      version: "pack-after-retry",
      generatedBy: "gpt" as const,
      eventsRepaired: false,
    };
    mocks.fetchContentPack
      .mockRejectedValueOnce(new Error("initial refresh unavailable"))
      .mockResolvedValueOnce(connectedPack);

    let game: Game | undefined;
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <GameProvider>
          <ThemeProbe onUpdate={nextGame => (game = nextGame)} />
        </GameProvider>,
      );
    });
    await waitFor(
      () =>
        game?.ready === true &&
        game.enrichmentStatus === "fallback" &&
        game.contentPackLoading === false,
      renderer,
    );

    const initialProgress = game!.studyProgress;
    await act(async () => {
      await game!.refreshContentPack();
    });

    expect(game?.enrichmentStatus).toBe("live");
    expect(game?.contentPack?.version).toBe("pack-after-retry");
    expect(game?.studyProgress).toEqual(initialProgress);
    expect(mocks.fetchContentPack).toHaveBeenCalledTimes(2);
    renderer.unmount();
  });
});