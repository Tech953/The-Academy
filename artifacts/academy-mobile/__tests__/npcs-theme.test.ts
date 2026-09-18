import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { gameState } = vi.hoisted(() => ({
  gameState: {
    weeklyTheme: "",
    dialogueHistory: {} as Record<string, Array<{ role: "player" | "npc"; text: string; timestamp: number }>>,
  },
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
      disabled,
      onPress,
    }: {
      children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
      disabled?: boolean;
      onPress?: () => void;
    }) =>
      React.createElement(
        "button",
        { disabled, onPress },
        typeof children === "function" ? children({ pressed: false }) : children,
      ),
    ScrollView: primitive("section"),
    StyleSheet: { create: <T,>(styles: T): T => styles },
    Text: primitive("span"),
    TextInput: ({
      onChangeText,
      placeholder,
      value,
    }: {
      onChangeText?: (value: string) => void;
      placeholder?: string;
      value?: string;
    }) => React.createElement("input", { onChangeText, placeholder, value }),
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
    dialogueHistory: gameState.dialogueHistory,
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

const NpcScreenWithInitialNpc = NpcScreen as React.ComponentType<{
  initialNpcId?: string | null;
}>;

describe("NPC directory weekly theme cue", () => {
  beforeEach(() => {
    gameState.weeklyTheme = "";
    gameState.dialogueHistory = {};
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

  it("keeps the synced theme visible while an NPC conversation is open", () => {
    const syncedTheme = "Student Showcase Week";
    gameState.weeklyTheme = syncedTheme;

    const markup = renderToStaticMarkup(
      React.createElement(NpcScreenWithInitialNpc, { initialNpcId: "receptionist_emily" }),
    );

    expect(markup).toContain("WEEKLY THEME");
    expect(markup).toContain(syncedTheme);
    expect(markup).toContain("Say something...");
    expect(markup).not.toContain("CAMPUS DIRECTORY");
  });

  it("updates an open chat cue without losing its draft or dialogue history", () => {
    const offlineTheme = selectWeeklyTheme(null, 8);
    const syncedTheme = "Student Showcase Week";
    gameState.weeklyTheme = offlineTheme;
    gameState.dialogueHistory = {
      receptionist_emily: [
        { role: "npc", text: "Welcome back to the Academy.", timestamp: 1 },
      ],
    };

    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(NpcScreenWithInitialNpc, {
          initialNpcId: "receptionist_emily",
        }),
      );
    });

    const input = renderer.root.findByType("input");
    act(() => {
      input.props.onChangeText("I want to ask about the new theme.");
    });

    expect(renderer.root.findByType("input").props.value).toBe(
      "I want to ask about the new theme.",
    );

    gameState.weeklyTheme = syncedTheme;
    act(() => {
      renderer.update(
        React.createElement(NpcScreenWithInitialNpc, {
          initialNpcId: "receptionist_emily",
        }),
      );
    });

    const renderedText = renderer.root
      .findAll((instance: ReactTestInstance) => typeof instance.type === "string")
      .map(instance => instance.children.filter(child => typeof child === "string").join(""))
      .join(" ");

    expect(renderedText).toContain(syncedTheme);
    expect(renderedText).toContain("Welcome back to the Academy.");
    expect(renderer.root.findByType("input").props.value).toBe(
      "I want to ask about the new theme.",
    );
  });
});