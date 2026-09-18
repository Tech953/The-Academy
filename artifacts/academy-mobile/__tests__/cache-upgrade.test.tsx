import React, { useEffect } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  fetchContentPack: vi.fn(),
}));

vi.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => true,
}));

vi.mock("@/lib/api", () => ({
  fetchContentPack: mocks.fetchContentPack,
  hasApiConfig: () => true,
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateOfflineContentPack } from "@workspace/game-engine";
import { GameProvider, useGame } from "../context/GameContext";
import { CONTENT_PACK_STORAGE_KEY } from "../lib/contentPackFallback";

type Game = ReturnType<typeof useGame>;

function UpgradeProbe({ onUpdate }: { onUpdate: (game: Game) => void }) {
  const game = useGame();

  useEffect(() => {
    onUpdate(game);
  }, [game, onUpdate]);

  return null;
}

function createNativeStorageFixture() {
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
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (predicate()) return;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  renderer.unmount();
  throw new Error("Timed out waiting for the app-upgrade cache state");
}

describe("native bulletin cache across app upgrades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("shows a previous-version cache before the newer build's refresh resolves", async () => {
    const storage = createNativeStorageFixture();
    const previousVersionPack = {
      ...generateOfflineContentPack(1),
      version: "pack-written-by-previous-app",
    } as Record<string, unknown>;
    delete previousVersionPack.schemaVersion;
    delete previousVersionPack.eventsRepaired;
    storage.setItem(
      CONTENT_PACK_STORAGE_KEY,
      JSON.stringify(previousVersionPack),
    );
    storage.setItem("academy-mobile-state-v1", JSON.stringify({ hasStarted: true, day: 1 }));

    let releaseRefresh!: (pack: ReturnType<typeof generateOfflineContentPack>) => void;
    mocks.fetchContentPack.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = resolve;
        }),
    );

    let game: Game | undefined;
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <GameProvider>
          <UpgradeProbe onUpdate={(nextGame) => (game = nextGame)} />
        </GameProvider>,
      );
    });

    await waitFor(
      () =>
        game?.ready === true &&
        game.contentPackLoading === true &&
        game.contentPack?.version === "pack-written-by-previous-app",
        renderer,
    );
    expect(game?.contentPack?.schemaVersion).toBe(1);
    expect(game?.contentPack?.eventsRepaired).toBe(false);
    expect(mocks.fetchContentPack).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseRefresh(generateOfflineContentPack(1));
    });
    await waitFor(() => game?.contentPackLoading === false, renderer);
    renderer.unmount();
  });

  it("keeps the bulletin visible while provider cache health recovers", async () => {
    const storage = createNativeStorageFixture();
    storage.setItem(
      "academy-mobile-state-v1",
      JSON.stringify({ hasStarted: true, day: 1 }),
    );

    const failedWritePack = {
      ...generateOfflineContentPack(1),
      version: "pack-visible-after-write-failure",
    };
    const recoveredPack = {
      ...generateOfflineContentPack(1),
      version: "pack-written-after-recovery",
    };
    let allowContentPackWrites = false;
    const setItemSpy = vi.spyOn(AsyncStorage, "setItem").mockImplementation(
      async (key, value) => {
        if (key === CONTENT_PACK_STORAGE_KEY && !allowContentPackWrites) {
          throw new Error("native storage unavailable");
        }
        storage.setItem(key, value);
      },
    );
    mocks.fetchContentPack.mockResolvedValueOnce(failedWritePack);

    let releaseRecovery!: (pack: typeof recoveredPack) => void;
    mocks.fetchContentPack.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseRecovery = resolve;
        }),
    );

    let game: Game | undefined;
    let renderer!: TestRenderer.ReactTestRenderer;
    try {
      await act(async () => {
        renderer = TestRenderer.create(
          <GameProvider>
            <UpgradeProbe onUpdate={(nextGame) => (game = nextGame)} />
          </GameProvider>,
        );
      });

      await waitFor(
        () =>
          game?.ready === true &&
          game.contentPackLoading === false &&
          game.contentPack?.version === failedWritePack.version &&
          game.contentPackStorageStatus === "write-failed",
        renderer,
      );
      expect(game?.contentPack?.version).toBe(failedWritePack.version);
      expect(game?.contentPackStorageStatus).toBe("write-failed");

      allowContentPackWrites = true;
      await act(async () => {
        void game?.refreshContentPack();
        await Promise.resolve();
      });
      await waitFor(
        () =>
          mocks.fetchContentPack.mock.calls.length === 2 &&
          game?.contentPackLoading === true &&
          game.contentPack?.version === failedWritePack.version &&
          game.contentPackStorageStatus === "write-failed",
        renderer,
      );
      expect(game?.contentPack?.version).toBe(failedWritePack.version);
      expect(game?.contentPackStorageStatus).toBe("write-failed");

      await act(async () => {
        releaseRecovery(recoveredPack);
      });
      await waitFor(
        () =>
          game?.contentPackLoading === false &&
          game.contentPackStorageStatus === "stored" &&
          game.contentPack?.version === recoveredPack.version,
        renderer,
      );
      expect(game?.contentPackStorageStatus).toBe("stored");
      expect(setItemSpy).toHaveBeenCalledWith(
        CONTENT_PACK_STORAGE_KEY,
        expect.stringContaining(recoveredPack.version),
      );
    } finally {
      renderer?.unmount();
      setItemSpy.mockRestore();
    }
  });

  it.each([
    {
      label: "expired",
      raw: () => {
        const pack = generateOfflineContentPack(1);
        return JSON.stringify({ ...pack, expiresAt: pack.generatedAt });
      },
    },
    {
      label: "malformed",
      raw: () => "{legacy-cache-is-not-json",
    },
  ])(
    "rejects $label legacy storage and uses deterministic local events",
    async ({ raw }) => {
      const storage = createNativeStorageFixture();
      storage.setItem(CONTENT_PACK_STORAGE_KEY, raw());
      storage.setItem(
        "academy-mobile-state-v1",
        JSON.stringify({ hasStarted: true, day: 1 }),
      );
      mocks.fetchContentPack.mockRejectedValueOnce(new Error("refresh held unavailable"));

      let game: Game | undefined;
      let renderer!: TestRenderer.ReactTestRenderer;
      await act(async () => {
        renderer = TestRenderer.create(
          <GameProvider>
            <UpgradeProbe onUpdate={(nextGame) => (game = nextGame)} />
          </GameProvider>,
        );
      });

      await waitFor(
        () =>
          game?.ready === true &&
          game.contentPackLoading === false &&
          game.enrichmentStatus === "fallback" &&
          game.contentPack?.generatedBy === "deterministic",
        renderer,
      );
      expect(game?.contentPack?.activeEvents).toHaveLength(3);
      renderer.unmount();
    },
  );
});