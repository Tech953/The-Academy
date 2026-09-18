import React from "react";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const { gameState, announceForAccessibility } = vi.hoisted(() => ({
  gameState: {
    bulletinEventsRepaired: false,
    contentPack: null as null | {
      weeklyTheme: string;
      activeEvents: Array<{ title: string; description: string }>;
    },
  },
  announceForAccessibility: vi.fn(),
}));

vi.mock("react-native", async () => {
  const React = await import("react");
  const host = (name: string) =>
    ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => React.createElement(name, props, children);

  return {
    AccessibilityInfo: {
      announceForAccessibility,
    },
    ActivityIndicator: host("ActivityIndicator"),
    KeyboardAvoidingView: host("KeyboardAvoidingView"),
    Platform: {
      OS: "android",
      select: (options: Record<string, unknown>) =>
        options.android ?? options.default,
    },
    Pressable: host("Pressable"),
    ScrollView: host("ScrollView"),
    StyleSheet: {
      create: <T,>(styles: T): T => styles,
    },
    Text: host("Text"),
    TextInput: host("TextInput"),
    View: host("View"),
  };
});

vi.mock("@/components/CrtButton", async () => {
  const React = await import("react");
  return {
    CrtButton: ({ label }: { label: string }) =>
      React.createElement("button", { "data-label": label }, label),
  };
});

vi.mock("@/components/StatusBadge", async () => {
  const React = await import("react");
  return {
    StatusBadge: () => React.createElement("StatusBadge"),
  };
});

vi.mock("@/components/TerminalLine", async () => {
  const React = await import("react");
  return {
    TerminalLine: () => React.createElement("TerminalLine"),
  };
});

vi.mock("@/context/GameContext", () => ({
  useGame: () => ({
    advanceDay: vi.fn(),
    bulletinEventsRepaired: gameState.bulletinEventsRepaired,
    contentPack: gameState.contentPack,
    currentLocationId: "courtyard",
    day: 1,
    enrichmentStatus: "offline",
    examine: vi.fn(),
    examineLoading: null,
    hasStarted: true,
    isOnline: false,
    locationLoading: false,
    log: [],
    ready: true,
    refreshLocationDescription: vi.fn(),
    travelTo: vi.fn(),
    week: 1,
  }),
}));

vi.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    accent: "#ffff00",
    background: "#000000",
    border: "#00ff00",
    foreground: "#00ff00",
    mutedForeground: "#b3b3b3",
    primary: "#00ff00",
  }),
}));

vi.mock("@workspace/game-engine", () => ({
  LOCATIONS: {
    courtyard: {
      exits: [],
      interactables: [],
      name: "Courtyard",
      npcIds: [],
      type: "academic",
    },
  },
  NPCS: {},
}));

import AdventureScreen from "../app/(tabs)/index";
import { BULLETIN_REPAIR_ACCESSIBILITY_LABEL } from "../lib/bulletinAccessibility";

function renderScreen() {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(AdventureScreen));
  });
  return renderer;
}

function findRepairCue(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findAll(
    (instance: ReactTestInstance) =>
      typeof instance.type === "string" &&
      instance.props.accessibilityLabel === BULLETIN_REPAIR_ACCESSIBILITY_LABEL,
  );
}

describe("rendered bulletin accessibility", () => {
  it("renders the repaired bulletin cue with the expected native props", () => {
    gameState.bulletinEventsRepaired = true;
    gameState.contentPack = {
      activeEvents: [
        { description: "A local event was added.", title: "Study session" },
      ],
      weeklyTheme: "Careful Preparation",
    };

    const renderer = renderScreen();
    const cues = findRepairCue(renderer);

    expect(cues).toHaveLength(1);
    expect(cues[0].props).toMatchObject({
      accessibilityLabel: BULLETIN_REPAIR_ACCESSIBILITY_LABEL,
      accessibilityLiveRegion: "polite",
      accessibilityRole: "text",
      accessible: true,
    });
  });

  it("does not render an accessible repair cue for a fully remote bulletin", () => {
    gameState.bulletinEventsRepaired = false;
    gameState.contentPack = {
      activeEvents: [
        { description: "A remote event was received.", title: "Campus forum" },
      ],
      weeklyTheme: "Careful Preparation",
    };

    const renderer = renderScreen();

    expect(findRepairCue(renderer)).toHaveLength(0);
    expect(
      renderer.root.findAll(
        (instance: ReactTestInstance) =>
          instance.props.accessibilityLiveRegion === "polite",
      ),
    ).toHaveLength(0);
  });
});