import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { gameState } = vi.hoisted(() => ({
  gameState: { weeklyTheme: "" },
}));

vi.mock("react-native", async () => {
  const React = await import("react");
  const primitive = (tag: string) =>
    ({ children }: { children?: React.ReactNode }) => React.createElement(tag, null, children);

  return {
    KeyboardAvoidingView: primitive("main"),
    Platform: {
      OS: "web",
      select: (options: Record<string, unknown>) =>
        options.web ?? options.default ?? options.ios ?? options.android,
    },
    Pressable: ({
      children,
    }: {
      children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
    }) =>
      React.createElement(
        "button",
        null,
        typeof children === "function" ? children({ pressed: false }) : children,
      ),
    ScrollView: primitive("section"),
    StyleSheet: { create: <T,>(styles: T): T => styles },
    Text: primitive("span"),
    TextInput: primitive("input"),
    View: primitive("div"),
  };
});

vi.mock("@expo/vector-icons", async () => {
  const React = await import("react");
  return {
    Feather: () => React.createElement("span"),
  };
});

vi.mock("@/components/StatusBadge", async () => {
  const React = await import("react");
  return {
    StatusBadge: () => React.createElement("span"),
  };
});

vi.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    accent: "#00ff99",
    background: "#000000",
    border: "#333333",
    destructive: "#ff0000",
    foreground: "#ffffff",
    mutedForeground: "#999999",
    primary: "#00ff00",
  }),
}));

vi.mock("@/context/GameContext", () => ({
  useGame: () => ({
    dialogueHistory: {},
    dialogueLoading: false,
    enrichmentStatus: "offline",
    isOnline: false,
    relationships: {},
    relationshipShifts: {},
    resetNpcConversation: vi.fn(),
    sendDialogue: vi.fn(),
    weeklyTheme: gameState.weeklyTheme,
  }),
}));

import NpcScreen from "../app/(tabs)/npcs";
import { selectWeeklyTheme } from "../lib/themeSelection";

describe("NPC directory weekly theme cue", () => {
  beforeEach(() => {
    gameState.weeklyTheme = "";
  });

  it("renders the deterministic offline weekly theme before opening a conversation", () => {
    const offlineTheme = selectWeeklyTheme(null, 8);
    gameState.weeklyTheme = offlineTheme;

    const markup = renderToStaticMarkup(React.createElement(NpcScreen));

    expect(markup).toContain("CAMPUS DIRECTORY");
    expect(markup).toContain("WEEKLY CAMPUS THEME");
    expect(markup).toContain(offlineTheme);
    expect(markup).not.toContain("Say something...");
  });

  it("renders a synced content-pack theme instead of the offline fallback", () => {
    const day = 8;
    const offlineTheme = selectWeeklyTheme(null, day);
    const syncedTheme = "Student Showcase Week";
    gameState.weeklyTheme = selectWeeklyTheme({ weeklyTheme: syncedTheme }, day);

    const markup = renderToStaticMarkup(React.createElement(NpcScreen));

    expect(markup).toContain("CAMPUS DIRECTORY");
    expect(markup).toContain("WEEKLY CAMPUS THEME");
    expect(markup).toContain(syncedTheme);
    expect(markup).not.toContain(offlineTheme);
    expect(markup).not.toContain("Say something...");
  });
});