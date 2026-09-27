import React, { useEffect } from "react";
import TestRenderer, {
  act,
  type ReactTestInstance,
} from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  fetchContentPack: vi.fn(),
  apiConfigured: true,
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
  hasApiConfig: () => mocks.apiConfigured,
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
import StudyScreen from "../app/(tabs)/study";
import {
  BULLETIN_LOCALE_STORAGE_KEY,
  getDeviceLocale,
} from "../constants/locales";
import { GameProvider, useGame } from "../context/GameContext";
import { CONTENT_PACK_STORAGE_KEY } from "../lib/contentPackFallback";

type Game = ReturnType<typeof useGame>;

function ThemeProbe({ onUpdate }: { onUpdate: (game: Game) => void }) {
  const game = useGame();

  useEffect(() => {
    onUpdate(game);
  }, [game, onUpdate]);

  return null;
}

function textContent(instance: ReactTestInstance): string {
  return instance.children
    .map((child) =>
      typeof child === "string" ? child : textContent(child as ReactTestInstance),
    )
    .join("");
}

function visibleText(renderer: TestRenderer.ReactTestRenderer): string[] {
  return renderer.root
    .findAll((instance) => String(instance.type) === "Text")
    .map(textContent);
}

function findPressableWithText(
  renderer: TestRenderer.ReactTestRenderer,
  text: string,
): ReactTestInstance | undefined {
  return renderer.root
    .findAll((instance) => String(instance.type) === "Pressable")
    .find((pressable) => textContent(pressable).includes(text));
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
    mocks.apiConfigured = true;
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("keeps the offline theme visible while an invalid cached pack is discarded", async () => {
    const localStorage = createLocalStorageFixture();
    const day = 8;
    const offlineTheme = generateOfflineContentPack(day).weeklyTheme;
    localStorage.setItem(
      "academy-mobile-state-v1",
      JSON.stringify({ hasStarted: true, day }),
    );
    localStorage.setItem(CONTENT_PACK_STORAGE_KEY, "{not-json");

    let releaseRefresh!: (
      pack: ReturnType<typeof generateOfflineContentPack>,
    ) => void;
    mocks.fetchContentPack.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          releaseRefresh = resolve;
        }),
    );

    let game: Game | undefined;
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <GameProvider>
          <ThemeProbe onUpdate={nextGame => (game = nextGame)} />
        </GameProvider>,
      );
    });

    try {
      await waitFor(
        () =>
          game?.ready === true &&
          game.contentPackLoading === true &&
          game.contentPack === null &&
          game.weeklyTheme === offlineTheme &&
          localStorage.getItem(CONTENT_PACK_STORAGE_KEY) === null,
        renderer,
      );

      expect(game?.weeklyTheme).toBe(offlineTheme);
      expect(mocks.fetchContentPack).toHaveBeenCalledTimes(1);

      await act(async () => {
        releaseRefresh({
          ...generateOfflineContentPack(day),
          version: "offline-after-cache-repair",
        });
      });
      await waitFor(
        () =>
          game?.contentPackLoading === false &&
          game.contentPack?.version === "offline-after-cache-repair",
        renderer,
      );
    } finally {
      renderer.unmount();
    }
  });

  it("shows a cached synced theme while refresh is pending, then uses the refreshed theme", async () => {
    const localStorage = createLocalStorageFixture();
    const day = 8;
    const cachedTheme = "Cached Student Showcase Week";
    const refreshedTheme = "New Campus Arts Week";
    const cachedPack = {
      ...generateOfflineContentPack(day),
      version: "cached-synced-theme",
      generatedBy: "gpt" as const,
      weeklyTheme: cachedTheme,
      eventsRepaired: false,
    };
    const refreshedPack = {
      ...generateOfflineContentPack(day),
      version: "refreshed-synced-theme",
      generatedBy: "gpt" as const,
      weeklyTheme: refreshedTheme,
      eventsRepaired: false,
    };

    localStorage.setItem(
      "academy-mobile-state-v1",
      JSON.stringify({ hasStarted: true, day }),
    );
    localStorage.setItem(CONTENT_PACK_STORAGE_KEY, JSON.stringify(cachedPack));

    let releaseRefresh!: (
      pack: ReturnType<typeof generateOfflineContentPack>,
    ) => void;
    mocks.fetchContentPack.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          releaseRefresh = resolve;
        }),
    );

    let game: Game | undefined;
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <GameProvider>
          <ThemeProbe onUpdate={nextGame => (game = nextGame)} />
        </GameProvider>,
      );
    });

    try {
      await waitFor(
        () =>
          game?.ready === true &&
          game.contentPackLoading === true &&
          game.contentPack?.version === cachedPack.version,
        renderer,
      );

      expect(game?.contentPack?.weeklyTheme).toBe(cachedTheme);
      expect(game?.weeklyTheme).toBe(cachedTheme);
      expect(mocks.fetchContentPack).toHaveBeenCalledTimes(1);

      await act(async () => {
        releaseRefresh(refreshedPack);
      });
      await waitFor(
        () =>
          game?.contentPackLoading === false &&
          game.contentPack?.version === refreshedPack.version,
        renderer,
      );

      expect(game?.contentPack?.weeklyTheme).toBe(refreshedTheme);
      expect(game?.weeklyTheme).toBe(refreshedTheme);
      expect(game?.weeklyTheme).not.toBe(generateOfflineContentPack(day).weeklyTheme);
    } finally {
      renderer.unmount();
    }
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

  it("preserves study progress while an online learner retries content refresh", async () => {
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
      gedFocusAreas: [
        {
          subject: "Math Reasoning",
          topic: "Ratios & Proportions",
          whyNow: "A connected pack brings a new math focus.",
        },
        {
          subject: "Science",
          topic: "Interpreting Data Tables",
          whyNow: "A connected pack keeps a second focus area.",
        },
      ],
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

    const firstQuestion = game!.getQuizSet("math")[0];
    let firstAnswerResult = false;
    await act(async () => {
      firstAnswerResult = game!.answerQuestion(firstQuestion, firstQuestion.answer);
    });
    expect(firstAnswerResult).toBe(true);
    await waitFor(
      () =>
        game?.studyProgress.math.answered === 1 &&
        game.studyProgress.math.correct === 1,
      renderer,
    );
    const initialProgress = game!.studyProgress;

    await act(async () => {
      await game!.refreshContentPack();
    });

    expect(game?.enrichmentStatus).toBe("live");
    expect(game?.contentPack?.version).toBe("pack-after-retry");
    expect(game?.studyProgress).toEqual(initialProgress);
    const refreshedQuestion = game!.getQuizSet("math")[0];
    expect(refreshedQuestion.id).not.toBe(firstQuestion.id);

    const incorrectChoice =
      refreshedQuestion.choices?.find(
        choice => choice.trim().toLowerCase() !== refreshedQuestion.answer.trim().toLowerCase(),
      ) ?? "__incorrect__";
    let refreshedAnswerResult = false;
    await act(async () => {
      refreshedAnswerResult = game!.answerQuestion(
        refreshedQuestion,
        incorrectChoice,
      );
    });
    expect(refreshedAnswerResult).toBe(false);
    await waitFor(
      () =>
        game?.studyProgress.math.answered === 2 &&
        game.studyProgress.math.correct === 1,
      renderer,
    );
    expect(mocks.fetchContentPack).toHaveBeenCalledTimes(2);
    renderer.unmount();
  });

  it("keeps answered study progress and fallback status after a failed retry", async () => {
    const localStorage = createLocalStorageFixture();
    localStorage.setItem(
      "academy-mobile-state-v1",
      JSON.stringify({ hasStarted: true, day: 1 }),
    );
    mocks.fetchContentPack
      .mockRejectedValueOnce(new Error("initial refresh unavailable"))
      .mockRejectedValueOnce(new Error("retry refresh unavailable"));

    let game: Game | undefined;
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <GameProvider>
          <>
            <StudyScreen />
            <ThemeProbe onUpdate={nextGame => (game = nextGame)} />
          </>
        </GameProvider>,
      );
    });

    try {
      await waitFor(
        () =>
          game?.ready === true &&
          game.enrichmentStatus === "fallback" &&
          game.contentPackLoading === false,
        renderer,
      );
      expect(visibleText(renderer)).toContain("LIVE ENRICHMENT UNAVAILABLE");

      const mathButton = findPressableWithText(renderer, "Math Reasoning");
      expect(mathButton).toBeDefined();
      await act(async () => {
        mathButton?.props.onPress();
      });

      const answeredQuestion = game!.getQuizSet("math")[0];
      const answerButton = findPressableWithText(
        renderer,
        answeredQuestion.answer,
      );
      expect(answerButton).toBeDefined();
      await act(async () => {
        answerButton?.props.onPress();
      });
      await waitFor(
        () =>
          game?.studyProgress.math.answered === 1 &&
          game.studyProgress.math.correct === 1,
        renderer,
      );
      const answerFeedback = `CORRECT — ${answeredQuestion.explanation}`;
      expect(visibleText(renderer)).toContain(answerFeedback);

      const answeredProgress = game!.studyProgress;
      expect(answeredProgress.math).toEqual({ answered: 1, correct: 1 });
      const answeredLogEntry = game!.log.at(-1);
      expect(answeredLogEntry).toMatchObject({
        type: "quiz",
        text: `Correct! ${answeredQuestion.explanation}`,
      });
      const answeredXp = game!.xp;

      const retryButton = findPressableWithText(
        renderer,
        "RETRY LIVE REFRESH",
      );
      expect(retryButton).toBeDefined();
      await act(async () => {
        await retryButton?.props.onPress();
      });
      await waitFor(
        () =>
          game?.enrichmentStatus === "fallback" &&
          game.contentPackLoading === false,
        renderer,
      );

      expect(mocks.fetchContentPack).toHaveBeenCalledTimes(2);
      expect(game?.studyProgress).toEqual(answeredProgress);
      expect(game?.log.at(-1)).toEqual(answeredLogEntry);
      expect(game?.xp).toBe(answeredXp);
      expect(visibleText(renderer)).toContain("LIVE ENRICHMENT UNAVAILABLE");
      expect(visibleText(renderer)).toContain(
        "Bundled study content is active. You can keep answering questions.",
      );
      expect(visibleText(renderer)).toContain(answerFeedback);

      const backButton = findPressableWithText(renderer, "< MATH");
      expect(backButton).toBeDefined();
      await act(async () => {
        backButton?.props.onPress();
      });
      expect(visibleText(renderer)).toContain("1/1 correct");
    } finally {
      renderer.unmount();
    }
  });

  it("restores the latest progress after several rapid offline answers", async () => {
    const localStorage = createLocalStorageFixture();
    mocks.apiConfigured = false;
    localStorage.setItem(
      "academy-mobile-state-v1",
      JSON.stringify({ hasStarted: true, day: 1 }),
    );

    const storageKey = "academy-mobile-state-v1";
    const originalSetItem = AsyncStorage.setItem.bind(AsyncStorage);
    const pendingStateWrites: Array<{ commit: () => Promise<void> }> = [];
    let activeStateWrites = 0;
    let maxConcurrentStateWrites = 0;
    const setItemSpy = vi
      .spyOn(AsyncStorage, "setItem")
      .mockImplementation((key, value) => {
        if (key !== storageKey) return originalSetItem(key, value);
        const snapshot = JSON.parse(value) as {
          studyProgress?: { math?: { answered?: number } };
        };
        if ((snapshot.studyProgress?.math?.answered ?? 0) === 0) {
          return originalSetItem(key, value);
        }

        activeStateWrites += 1;
        maxConcurrentStateWrites = Math.max(
          maxConcurrentStateWrites,
          activeStateWrites,
        );
        return new Promise<void>((resolve, reject) => {
          pendingStateWrites.push({
            commit: async () => {
              try {
                await originalSetItem(key, value);
                resolve();
              } catch (error) {
                reject(error);
                throw error;
              } finally {
                activeStateWrites -= 1;
              }
            },
          });
        });
      });

    let firstGame: Game | undefined;
    let relaunchedGame: Game | undefined;
    let firstRenderer: TestRenderer.ReactTestRenderer | null = null;
    let relaunchedRenderer: TestRenderer.ReactTestRenderer | null = null;
    try {
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
          firstGame.contentPackLoading === false &&
          firstGame.isOnline === false,
        firstRenderer!,
      );

      const questions = firstGame!.getQuizSet("math").slice(0, 3);
      expect(questions).toHaveLength(3);
      expect(new Set(questions.map(question => question.id)).size).toBe(3);
      for (const question of questions) {
        await act(async () => {
          expect(firstGame!.answerQuestion(question, question.answer)).toBe(true);
        });
      }
      await waitFor(
        () =>
          firstGame?.studyProgress.math.answered === questions.length &&
          firstGame.studyProgress.math.correct === questions.length,
        firstRenderer!,
      );

      for (let writeIndex = 0; writeIndex < questions.length; writeIndex += 1) {
        await waitFor(
          () => pendingStateWrites.length > 0,
          firstRenderer!,
        );
        const pendingWrite = pendingStateWrites.pop()!;
        await act(async () => {
          await pendingWrite.commit();
        });
      }

      const persisted = JSON.parse(
        localStorage.getItem(storageKey) ?? "{}",
      ) as {
        studyProgress?: { math?: { answered?: number; correct?: number } };
      };
      expect(persisted.studyProgress?.math).toEqual({
        answered: questions.length,
        correct: questions.length,
      });
      expect(maxConcurrentStateWrites).toBe(1);
      await act(async () => {
        firstRenderer?.unmount();
      });
      firstRenderer = null;
      setItemSpy.mockRestore();

      await act(async () => {
        relaunchedRenderer = TestRenderer.create(
          <GameProvider>
            <ThemeProbe onUpdate={game => (relaunchedGame = game)} />
          </GameProvider>,
        );
      });
      await waitFor(
        () =>
          relaunchedGame?.ready === true &&
          relaunchedGame.studyProgress.math.answered === questions.length &&
          relaunchedGame.studyProgress.math.correct === questions.length,
        relaunchedRenderer!,
      );

      expect(relaunchedGame?.isOnline).toBe(false);
      expect(relaunchedGame?.getQuizSet("math")[0]).toBeDefined();
      expect(mocks.fetchContentPack).not.toHaveBeenCalled();
      await act(async () => {
        relaunchedRenderer?.unmount();
      });
      relaunchedRenderer = null;
    } finally {
      await act(async () => {
        firstRenderer?.unmount();
        relaunchedRenderer?.unmount();
      });
      setItemSpy.mockRestore();
    }
  });

  it("persists a selected bulletin language and resets to the device locale", async () => {
    const localStorage = createLocalStorageFixture();
    mocks.apiConfigured = false;
    localStorage.setItem(BULLETIN_LOCALE_STORAGE_KEY, "es");

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
        game.bulletinLocalePreference === "es" &&
        game.bulletinLocale === "es",
      renderer,
    );

    await act(async () => {
      game!.setBulletinLocalePreference(null);
    });
    await waitFor(
      () =>
        game?.bulletinLocalePreference === null &&
        game.bulletinLocale === getDeviceLocale(),
      renderer,
    );

    expect(localStorage.getItem(BULLETIN_LOCALE_STORAGE_KEY)).toBeNull();
    renderer.unmount();
  });
});