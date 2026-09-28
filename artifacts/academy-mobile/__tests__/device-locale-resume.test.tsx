import React, { useEffect } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const lifecycleMocks = vi.hoisted(() => {
  const state = { deviceLocale: "en" };
  const listeners = new Set<(nextState: string) => void>();

  return {
    state,
    listeners,
    getDeviceLocale: vi.fn(() => state.deviceLocale),
    addAppStateListener: vi.fn(
      (_eventName: string, listener: (nextState: string) => void) => {
        listeners.add(listener);
        return {
          remove: () => {
            listeners.delete(listener);
          },
        };
      },
    ),
    emitAppState(nextState: string) {
      for (const listener of [...listeners]) listener(nextState);
    },
  };
});

vi.mock("react-native", () => ({
  AppState: {
    addEventListener: lifecycleMocks.addAppStateListener,
  },
  Linking: {
    getInitialURL: vi.fn(async () => null),
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  },
}));

vi.mock("@/constants/locales", async () => {
  const actual = await vi.importActual<typeof import("../constants/locales")>(
    "@/constants/locales",
  );
  return {
    ...actual,
    getDeviceLocale: lifecycleMocks.getDeviceLocale,
  };
});

vi.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => false,
}));

vi.mock("@/lib/api", () => ({
  fetchContentPack: vi.fn(),
  hasApiConfig: () => false,
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
  resolveNpcReply: vi.fn(async (_params: unknown, fallback: () => string) => ({
    text: fallback(),
    source: "offline" as const,
  })),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { BULLETIN_LOCALE_STORAGE_KEY } from "../constants/locales";
import { GameProvider, useGame } from "../context/GameContext";

type Game = ReturnType<typeof useGame>;

function GameProbe({ onUpdate }: { onUpdate: (game: Game) => void }) {
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
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  renderer.unmount();
  throw new Error("Timed out waiting for GameProvider state");
}

async function mountGameProvider() {
  let game: Game | undefined;
  const onUpdate = (nextGame: Game) => {
    game = nextGame;
  };
  let renderer!: TestRenderer.ReactTestRenderer;

  await act(async () => {
    renderer = TestRenderer.create(
      <GameProvider>
        <GameProbe onUpdate={onUpdate} />
      </GameProvider>,
    );
  });
  await waitFor(() => game?.ready === true, renderer);

  return {
    getGame: () => game,
    renderer,
  };
}

function resumeApp() {
  act(() => {
    lifecycleMocks.emitAppState("background");
    lifecycleMocks.emitAppState("active");
  });
}

describe("device-default bulletin language on app resume", () => {
  beforeEach(() => {
    lifecycleMocks.state.deviceLocale = "en";
    lifecycleMocks.listeners.clear();
    lifecycleMocks.getDeviceLocale.mockClear();
    lifecycleMocks.addAppStateListener.mockClear();
  });

  afterEach(() => {
    lifecycleMocks.listeners.clear();
    delete (globalThis as { window?: unknown }).window;
  });

  it("refreshes the device locale when the app returns to the foreground", async () => {
    createLocalStorageFixture();
    const { getGame, renderer } = await mountGameProvider();

    expect(getGame()?.bulletinLocalePreference).toBeNull();
    expect(getGame()?.bulletinLocale).toBe("en");

    lifecycleMocks.state.deviceLocale = "es";
    lifecycleMocks.getDeviceLocale.mockClear();
    resumeApp();

    await waitFor(() => getGame()?.bulletinLocale === "es", renderer);
    expect(getGame()?.bulletinLocalePreference).toBeNull();
    expect(lifecycleMocks.getDeviceLocale).toHaveBeenCalledTimes(1);

    await act(async () => {
      renderer.unmount();
    });
  });

  it("keeps an explicit language unchanged when the app returns to the foreground", async () => {
    const localStorage = createLocalStorageFixture();
    localStorage.setItem(BULLETIN_LOCALE_STORAGE_KEY, "fr");
    const { getGame, renderer } = await mountGameProvider();

    expect(getGame()?.bulletinLocalePreference).toBe("fr");
    expect(getGame()?.bulletinLocale).toBe("fr");

    lifecycleMocks.state.deviceLocale = "ja";
    lifecycleMocks.getDeviceLocale.mockClear();
    resumeApp();

    expect(getGame()?.bulletinLocalePreference).toBe("fr");
    expect(getGame()?.bulletinLocale).toBe("fr");
    expect(lifecycleMocks.getDeviceLocale).not.toHaveBeenCalled();

    await act(async () => {
      renderer.unmount();
    });
  });
});