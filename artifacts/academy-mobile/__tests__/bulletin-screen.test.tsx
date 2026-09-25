import React, { useEffect, useState } from "react";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const { gameState, announceForAccessibility } = vi.hoisted(() => ({
  gameState: {
    bulletinEventsRepaired: false,
    contentPackLoading: false,
    contentPack: null as null | {
      weeklyTheme: string;
      activeEvents: Array<{ title: string; description: string }>;
    },
    day: 1,
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
    contentPackLoading: gameState.contentPackLoading,
    currentLocationId: "courtyard",
    day: gameState.day,
    enrichmentStatus: "offline",
    examine: vi.fn(),
    examineLoading: null,
    hasStarted: true,
    isOnline: false,
    locationLoading: false,
    log: [],
    ready: true,
    refreshContentPack: vi.fn(),
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

function flattenText(value: unknown): string {
  if (Array.isArray(value)) return value.map(flattenText).join("");
  return typeof value === "string" ? value : "";
}

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (result, item) => ({ ...result, ...flattenStyle(item) }),
      {},
    );
  }
  return style && typeof style === "object"
    ? (style as Record<string, unknown>)
    : {};
}

function renderedText(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAll((instance: ReactTestInstance) => String(instance.type) === "Text")
    .map((instance) => flattenText(instance.props.children))
    .join("\n");
}

type BulletinPack = NonNullable<typeof gameState.contentPack>;
type RefreshController = {
  beginDayRefresh: () => void;
  resolve: (pack: BulletinPack) => void;
};

function RefreshHarness({
  initialPack,
  onReady,
}: {
  initialPack: BulletinPack;
  onReady: (controller: RefreshController) => void;
}) {
  const [refreshState, setRefreshState] = useState({
    contentPack: initialPack,
    contentPackLoading: false,
    day: 1,
  });

  // The screen consumes the same context-shaped state that the provider
  // exposes. Keeping it in a stateful harness makes the rendered test cover
  // the visible loading transition without duplicating provider internals.
  gameState.contentPack = refreshState.contentPack;
  gameState.contentPackLoading = refreshState.contentPackLoading;
  gameState.day = refreshState.day;

  useEffect(() => {
    onReady({
      beginDayRefresh: () => {
        setRefreshState((previous) => ({
          ...previous,
          contentPackLoading: true,
          day: previous.day + 1,
        }));
      },
      resolve: (pack) => {
        setRefreshState((previous) => ({
          ...previous,
          contentPack: pack,
          contentPackLoading: false,
        }));
      },
    });
  }, [onReady]);

  return React.createElement(AdventureScreen);
}

describe("rendered bulletin accessibility", () => {
  beforeEach(() => {
    gameState.bulletinEventsRepaired = false;
    gameState.contentPackLoading = false;
    gameState.contentPack = null;
    gameState.day = 1;
  });

  it("keeps a long synced theme distinct and wrappable in the bulletin", () => {
    const longTheme =
      "Community Science Showcase and Evening Study Sessions";
    gameState.contentPack = {
      activeEvents: [
        {
          description: "Students can bring projects and review their notes.",
          title: "Community study forum",
        },
      ],
      weeklyTheme: longTheme,
    };

    const renderer = renderScreen();
    const textNodes = renderer.root.findAll(
      (instance: ReactTestInstance) => String(instance.type) === "Text",
    );
    const label = textNodes.find(
      (instance) => flattenText(instance.props.children) === "CAMPUS BULLETIN",
    );
    const theme = textNodes.find(
      (instance) => flattenText(instance.props.children) === longTheme.toUpperCase(),
    );
    const bulletin = renderer.root
      .findAll((instance: ReactTestInstance) => String(instance.type) === "View")
      .find((instance) => flattenStyle(instance.props.style).borderStyle === "dashed");

    expect(label).toBeDefined();
    expect(theme).toBeDefined();
    expect(theme?.props.numberOfLines).toBeUndefined();
    expect(flattenStyle(theme?.props.style)).toMatchObject({
      flexShrink: 1,
      minWidth: 0,
      maxWidth: "100%",
    });
    expect(bulletin).toBeDefined();
    expect(flattenStyle(bulletin?.props.style)).toMatchObject({
      maxWidth: "100%",
      minWidth: 0,
    });
    expect(renderedText(renderer)).toContain(longTheme.toUpperCase());
    expect(renderedText(renderer)).toContain(
      "Community study forum: Students can bring projects and review their notes.",
    );
    expect(renderer.root.findAllByType("button").length).toBeGreaterThan(0);
  });

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

  it("keeps the current bulletin visible during a day-change refresh", async () => {
    const currentPack = {
      activeEvents: [
        {
          description: "The current bulletin remains available.",
          title: "Current study session",
        },
      ],
      weeklyTheme: "Current Preparation",
    };
    const nextPack = {
      activeEvents: [
        {
          description: "The replacement bulletin is now available.",
          title: "Next study session",
        },
      ],
      weeklyTheme: "Next Preparation",
    };
    let controller!: RefreshController;
    const onReady = (nextController: RefreshController) => {
      controller = nextController;
    };
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(RefreshHarness, {
          initialPack: currentPack,
          onReady,
        }),
      );
    });

    expect(renderedText(renderer)).toContain("Current study session");
    expect(renderedText(renderer)).not.toContain("Next study session");
    expect(renderedText(renderer)).toContain("CURRENT PREPARATION");
    expect(renderedText(renderer)).not.toContain("NEXT PREPARATION");

    await act(async () => {
      controller.beginDayRefresh();
    });

    expect(gameState.day).toBe(2);
    expect(gameState.contentPackLoading).toBe(true);
    expect(renderedText(renderer)).toContain("Current study session");
    expect(renderedText(renderer)).not.toContain("Next study session");
    expect(renderedText(renderer)).toContain("CURRENT PREPARATION");
    expect(renderedText(renderer)).not.toContain("NEXT PREPARATION");

    await act(async () => {
      controller.resolve(nextPack);
    });

    expect(gameState.contentPackLoading).toBe(false);
    expect(renderedText(renderer)).not.toContain("Current study session");
    expect(renderedText(renderer)).toContain("Next study session");
    expect(renderedText(renderer)).not.toContain("CURRENT PREPARATION");
    expect(renderedText(renderer)).toContain("NEXT PREPARATION");
    renderer.unmount();
  });
});