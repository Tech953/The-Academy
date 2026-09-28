import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { gameState, scrollCalls, windowDimensions } = vi.hoisted(() => ({
  gameState: {
    weeklyTheme: "",
    bulletinLocale: "en" as string,
    dialogueHistory: {} as Record<string, Array<{ role: "player" | "npc"; text: string; timestamp: number }>>,
    relationships: {} as Record<string, { score: number }>,
  },
  scrollCalls: [] as Array<
    | { type: "scrollTo"; y: number; animated: boolean }
    | { type: "scrollToEnd"; animated: boolean }
  >,
  windowDimensions: { fontScale: 1 },
}));

vi.mock("react-native", async () => {
  const React = await import("react");
  const primitive = (tag: string) =>
    ({
      children,
      accessibilityRole,
      accessibilityLiveRegion,
      ...props
    }: {
      children?: React.ReactNode;
      accessibilityRole?: string;
      accessibilityLiveRegion?: "none" | "polite" | "assertive";
      [key: string]: unknown;
    }) =>
      React.createElement(
        tag,
        {
          ...props,
          ...(accessibilityRole ? { role: accessibilityRole } : {}),
          ...(accessibilityLiveRegion ? { "aria-live": accessibilityLiveRegion } : {}),
        },
        children,
      );

  return {
    KeyboardAvoidingView: primitive("main"),
    Platform: {
      OS: "web",
      select: (options: Record<string, unknown>) =>
        options.web ?? options.default ?? options.ios ?? options.android,
    },
    useWindowDimensions: () => ({
      width: 375,
      height: 812,
      scale: 1,
      fontScale: windowDimensions.fontScale,
    }),
    Pressable: ({
      children,
      disabled,
      onPress,
      accessibilityRole,
      accessibilityLabel,
      accessibilityHint,
    }: {
      children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
      disabled?: boolean;
      onPress?: () => void;
      accessibilityRole?: string;
      accessibilityLabel?: string;
      accessibilityHint?: string;
    }) =>
      React.createElement(
        "button",
        {
          disabled,
          onPress,
          ...(accessibilityRole ? { role: accessibilityRole } : {}),
          ...(accessibilityLabel ? { "aria-label": accessibilityLabel } : {}),
          ...(accessibilityHint ? { "aria-description": accessibilityHint } : {}),
        },
        typeof children === "function" ? children({ pressed: false }) : children,
      ),
    ScrollView: React.forwardRef<
      {
        scrollTo: (options: { y: number; animated?: boolean }) => void;
        scrollToEnd: (options?: { animated?: boolean }) => void;
      },
      { children?: React.ReactNode; [key: string]: unknown }
    >(({ children, ...props }, ref) => {
      React.useImperativeHandle(ref, () => ({
        scrollTo: ({ y, animated }) =>
          scrollCalls.push({ type: "scrollTo", y, animated: animated ?? false }),
        scrollToEnd: ({ animated } = {}) =>
          scrollCalls.push({ type: "scrollToEnd", animated: animated ?? false }),
      }));
      return React.createElement(
        "section",
        props as React.HTMLAttributes<HTMLElement>,
        children as React.ReactNode,
      );
    }),
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
    relationships: gameState.relationships,
    relationshipShifts: {},
    resetNpcConversation: vi.fn(),
    sendDialogue: vi.fn(),
    weeklyTheme: gameState.weeklyTheme,
    bulletinLocale: gameState.bulletinLocale,
  }),
}));

import NpcScreen from "../app/(tabs)/npcs";
import { selectWeeklyTheme } from "../lib/themeSelection";
import { getRelationshipProgress, NPCS } from "@workspace/game-engine";
import {
  formatMobileCopy,
  getMobileCopy,
  MOBILE_COPY_CATALOG,
  SUPPORTED_LOCALES,
  type MobileCopyKey,
} from "../constants/locales";

const CAMPUS_DIRECTORY_COPY_KEYS = [
  "campusDirectoryTitle",
  "weeklyCampusTheme",
  "weeklyTheme",
  "relationshipProgressTo",
  "relationshipMaxTier",
  "relationshipStatus",
  "relationshipNextTier",
  "relationshipTierStranger",
  "relationshipTierAcquaintance",
  "relationshipTierFriendly",
  "relationshipTierFriend",
  "relationshipTierClose",
  "relationshipTierTrusted",
  "weeklyThemeUpdated",
  "conversationThemeUpdated",
  "dismissThemeUpdateNotice",
  "updatedThemeRemainsVisible",
  "relationshipWarmer",
  "relationshipCooler",
  "relationshipNowTier",
  "awaitingResponse",
  "saySomething",
  "sendMessage",
  "backToDirectory",
] as const satisfies readonly MobileCopyKey[];

const NpcScreenWithInitialNpc = NpcScreen as React.ComponentType<{
  initialNpcId?: string | null;
}>;

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

describe("NPC directory weekly theme cue", () => {
  beforeEach(() => {
    gameState.weeklyTheme = "";
    gameState.bulletinLocale = "en";
    gameState.dialogueHistory = {};
    gameState.relationships = {};
    scrollCalls.length = 0;
    windowDimensions.fontScale = 1;
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
    expect(renderedText).toContain("WEEKLY THEME UPDATED");
    expect(renderedText).toContain("Welcome back to the Academy.");
    const notice = renderer.root
      .findAllByType("div")
      .find(instance => instance.props.role === "text" && instance.props["aria-live"] === "polite");
    expect(notice).toBeDefined();
    expect(renderer.root.findByType("input").props.value).toBe(
      "I want to ask about the new theme.",
    );
  });

  it("lets learners dismiss the notice without losing the updated compact cue", () => {
    gameState.weeklyTheme = "Careful Preparation";
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(NpcScreenWithInitialNpc, {
          initialNpcId: "receptionist_emily",
        }),
      );
    });

    gameState.weeklyTheme = "Student Showcase Week";
    act(() => {
      renderer.update(
        React.createElement(NpcScreenWithInitialNpc, {
          initialNpcId: "receptionist_emily",
        }),
      );
    });

    const dismissButton = renderer.root
      .findAllByType("button")
      .find(instance => instance.props["aria-label"] === "Dismiss weekly theme update notice");
    expect(dismissButton).toBeDefined();
    expect(dismissButton?.props["aria-description"]).toBe(
      "The updated weekly theme remains visible above.",
    );
    act(() => dismissButton?.props.onPress());

    const renderedText = renderer.root
      .findAll((instance: ReactTestInstance) => typeof instance.type === "string")
      .map(instance => instance.children.filter(child => typeof child === "string").join(""))
      .join(" ");
    expect(renderedText).not.toContain("WEEKLY THEME UPDATED");
    expect(renderedText).toContain("WEEKLY THEME");
    expect(renderedText).toContain("Student Showcase Week");
    renderer.unmount();
  });

  it("times out the notice while keeping the updated compact cue visible", () => {
    vi.useFakeTimers();
    let renderer!: TestRenderer.ReactTestRenderer;
    try {
      gameState.weeklyTheme = "Careful Preparation";
      act(() => {
        renderer = TestRenderer.create(
          React.createElement(NpcScreenWithInitialNpc, {
            initialNpcId: "receptionist_emily",
          }),
        );
      });

      gameState.weeklyTheme = "Student Showcase Week";
      act(() => {
        renderer.update(
          React.createElement(NpcScreenWithInitialNpc, {
            initialNpcId: "receptionist_emily",
          }),
        );
      });
      expect(
        renderer.root
          .findAllByType("div")
          .some(instance => instance.props.role === "text" && instance.props["aria-live"] === "polite"),
      ).toBe(true);

      act(() => {
        vi.advanceTimersByTime(6000);
      });

      const renderedText = renderer.root
        .findAll((instance: ReactTestInstance) => typeof instance.type === "string")
        .map(instance => instance.children.filter(child => typeof child === "string").join(""))
        .join(" ");
      expect(renderedText).not.toContain("WEEKLY THEME UPDATED");
      expect(renderedText).toContain("WEEKLY THEME");
      expect(renderedText).toContain("Student Showcase Week");
      renderer.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it("restores the reading position after a weekly theme changes the chat layout", () => {
    gameState.weeklyTheme = "Careful Preparation";
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

    act(() => {
      renderer.root.findByType("input").props.onChangeText("Keep this draft.");
    });

    const initialScrollView = renderer.root
      .findAllByType("section")
      .find((instance) => typeof instance.props.onScroll === "function");
    expect(initialScrollView).toBeDefined();
    act(() => {
      (initialScrollView!.props.onScroll as (event: {
        nativeEvent: { contentOffset: { y: number } };
      }) => void)({ nativeEvent: { contentOffset: { y: 180 } } });
    });

    gameState.weeklyTheme = "Community Science Showcase and Evening Study Sessions";
    act(() => {
      renderer.update(
        React.createElement(NpcScreenWithInitialNpc, {
          initialNpcId: "receptionist_emily",
        }),
      );
    });

    const updatedScrollView = renderer.root
      .findAllByType("section")
      .find((instance) => typeof instance.props.onLayout === "function");
    expect(updatedScrollView).toBeDefined();
    act(() => {
      (updatedScrollView!.props.onLayout as () => void)();
    });

    expect(scrollCalls).toContainEqual({
      type: "scrollTo",
      y: 180,
      animated: false,
    });
    expect(renderer.root.findByType("input").props.value).toBe("Keep this draft.");
    expect(renderer.root.findAllByType("span").some((instance) =>
      instance.children.includes("Welcome back to the Academy."),
    )).toBe(true);
    expect(renderer.root.findAllByType("span").some((instance) =>
      instance.children.includes("Community Science Showcase and Evening Study Sessions"),
    )).toBe(true);
  });

  it("lets a long theme wrap inside the compact cue on narrow layouts", () => {
    const longTheme =
      "Community Science Showcase and Evening Study Sessions";
    gameState.weeklyTheme = longTheme;

    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(NpcScreenWithInitialNpc, {
          initialNpcId: "receptionist_emily",
        }),
      );
    });

    const themeValue = renderer.root
      .findAllByType("span")
      .find(instance => instance.children.includes(longTheme));
    expect(themeValue).toBeDefined();
    expect(themeValue?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          flex: 1,
          flexShrink: 1,
          minWidth: 0,
        }),
      ]),
    );

    const themeCue = renderer.root
      .findAllByType("div")
      .find(instance =>
        Array.isArray(instance.props.style) &&
        instance.props.style.some(
          (style: unknown) =>
            Boolean(style) &&
            typeof style === "object" &&
            "alignItems" in (style as object) &&
            (style as { alignItems?: string }).alignItems === "flex-start",
        ),
      );
    expect(themeCue).toBeDefined();
    expect(flattenStyle(themeCue!.props.style)).toMatchObject({
      flexDirection: "row",
      maxWidth: "100%",
    });
  });

  it("separates and wraps the synced theme at large system text sizes", () => {
    const longTheme = "Community Science Showcase and Evening Study Sessions";
    const npc = NPCS.receptionist_emily;
    gameState.weeklyTheme = longTheme;
    windowDimensions.fontScale = 2;

    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(NpcScreenWithInitialNpc, {
          initialNpcId: "receptionist_emily",
        }),
      );
    });

    const themeCue = renderer.root.findAllByType("div").find((instance) => {
      const style = flattenStyle(instance.props.style);
      return style.borderLeftWidth === 2 && style.flexDirection === "column";
    });
    expect(themeCue).toBeDefined();
    expect(flattenStyle(themeCue!.props.style)).toMatchObject({
      alignItems: "stretch",
      maxWidth: "100%",
    });

    const cueText = themeCue!.findAllByType("span");
    expect(cueText.map((instance) => instance.children.join(""))).toEqual([
      "WEEKLY THEME",
      longTheme,
    ]);
    expect(flattenStyle(cueText[0].props.style)).toMatchObject({
      color: "#00ff99",
      flexShrink: 1,
      minWidth: 0,
    });
    expect(flattenStyle(cueText[1].props.style)).toMatchObject({
      color: "#ffffff",
      flex: 0,
      flexShrink: 1,
      minWidth: 0,
    });

    const renderedText = renderer.root
      .findAllByType("span")
      .map((instance) => instance.children.join(""))
      .join(" ");
    expect(renderedText).toContain(npc.name.toUpperCase());
    expect(renderedText).toContain(npc.title);
    expect(flattenStyle(
      renderer.root
        .findAllByType("span")
        .find((instance) => instance.children.some(
          (child) => typeof child === "string" && child.startsWith(npc.title),
        ))!.props.style,
    )).toMatchObject({ flexShrink: 1 });
    expect(renderer.root.findAllByType("button")).toHaveLength(2);

    const largeTextHeader = renderer.root.findAllByType("div").find((instance) => {
      const style = flattenStyle(instance.props.style);
      return style.borderBottomWidth === 1 && style.flexDirection === "column";
    });
    expect(largeTextHeader).toBeDefined();
    expect(flattenStyle(largeTextHeader!.props.style)).toMatchObject({
      alignItems: "stretch",
    });
  });
});

describe("Campus Directory localized labels", () => {
  beforeEach(() => {
    gameState.weeklyTheme = "Campus Research Week";
    gameState.bulletinLocale = "en";
    gameState.dialogueHistory = {};
    gameState.relationships = {};
    windowDimensions.fontScale = 1;
  });

  it.each(SUPPORTED_LOCALES)(
    "renders the directory and all relationship tiers in %s",
    (locale) => {
      gameState.bulletinLocale = locale;
      const npc = Object.values(NPCS)[0];
      if (!npc) throw new Error("Campus Directory must contain at least one NPC.");

      for (const key of CAMPUS_DIRECTORY_COPY_KEYS) {
        expect(MOBILE_COPY_CATALOG[locale]?.[key], `${locale} is missing ${key}`).toBeTruthy();
      }

      const directoryMarkup = renderToStaticMarkup(React.createElement(NpcScreen));
      expect(directoryMarkup).toContain(getMobileCopy("campusDirectoryTitle", locale));
      expect(directoryMarkup).toContain(getMobileCopy("weeklyCampusTheme", locale));

      const tierCases = [
        ["stranger", "relationshipTierStranger"],
        ["acquaintance", "relationshipTierAcquaintance"],
        ["friendly", "relationshipTierFriendly"],
        ["friend", "relationshipTierFriend"],
        ["close", "relationshipTierClose"],
        ["trusted", "relationshipTierTrusted"],
      ] as const;

      for (const [tier, copyKey] of tierCases) {
        const score = Array.from({ length: 101 }, (_, value) => value).find(
          (value) => getRelationshipProgress(value).tier === tier,
        );
        if (score === undefined) {
          throw new Error(`No score maps to relationship tier ${tier}.`);
        }
        gameState.relationships = { [npc.id]: { score } };
        const markup = renderToStaticMarkup(React.createElement(NpcScreen));
        expect(markup).toContain(getMobileCopy(copyKey, locale));

        const relationship = getRelationshipProgress(score);
        if (relationship.nextTier) {
          const nextTierCopyKey = tierCases.find(
            ([candidateTier]) => candidateTier === relationship.nextTier,
          )?.[1];
          if (!nextTierCopyKey) {
            throw new Error(`Missing copy key for relationship tier ${relationship.nextTier}.`);
          }
          expect(markup).toContain(
            formatMobileCopy("relationshipProgressTo", locale, {
              progress: Math.round(relationship.progress * 100),
              tier: getMobileCopy(nextTierCopyKey, locale),
            }),
          );
        } else {
          expect(markup).toContain(getMobileCopy("relationshipMaxTier", locale));
        }
      }
    },
  );

  it("renders translated relationship details and composer labels in an open profile", () => {
    const locale = "fr";
    gameState.bulletinLocale = locale;
    gameState.relationships = { receptionist_emily: { score: 40 } };

    const markup = renderToStaticMarkup(
      React.createElement(NpcScreenWithInitialNpc, {
        initialNpcId: "receptionist_emily",
      }),
    );

    expect(markup).toContain(getMobileCopy("weeklyTheme", locale));
    expect(markup).toContain(getMobileCopy("relationshipTierFriendly", locale));
    expect(markup).toContain(
      formatMobileCopy("relationshipStatus", locale, {
        score: 40,
        endScore: 50,
      }),
    );
    expect(markup).toContain(
      formatMobileCopy("relationshipNextTier", locale, {
        tier: getMobileCopy("relationshipTierFriend", locale),
      }),
    );
    expect(markup).toContain(`placeholder="${getMobileCopy("saySomething", locale)}"`);
    expect(markup).toContain(`aria-label="${getMobileCopy("sendMessage", locale)}"`);
    expect(markup).toContain(`aria-label="${getMobileCopy("backToDirectory", locale)}"`);
  });

  it("uses English fallback for missing translated directory and tier labels", () => {
    gameState.bulletinLocale = "es";
    const spanishCopy = MOBILE_COPY_CATALOG.es;
    expect(spanishCopy).toBeDefined();

    const previousDirectoryTitle = spanishCopy!.campusDirectoryTitle;
    const previousStrangerTier = spanishCopy!.relationshipTierStranger;
    delete spanishCopy!.campusDirectoryTitle;
    delete spanishCopy!.relationshipTierStranger;

    try {
      const markup = renderToStaticMarkup(React.createElement(NpcScreen));
      expect(markup).toContain(getMobileCopy("campusDirectoryTitle", "en"));
      expect(markup).toContain(getMobileCopy("relationshipTierStranger", "en"));
    } finally {
      spanishCopy!.campusDirectoryTitle = previousDirectoryTitle;
      spanishCopy!.relationshipTierStranger = previousStrangerTier;
    }
  });
});
