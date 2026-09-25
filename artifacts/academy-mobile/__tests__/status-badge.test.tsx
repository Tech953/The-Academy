import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", async () => {
  const React = await import("react");
  const primitive = (tag: string) =>
    ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement(tag, props, children);

  return {
    Platform: {
      select: (options: Record<string, unknown>) =>
        options.default ?? options.ios ?? options.android,
    },
    StyleSheet: { create: <T,>(styles: T): T => styles },
    Text: primitive("span"),
    View: primitive("div"),
  };
});


vi.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    accent: "#ffff00",
    mutedForeground: "#b3b3b3",
    primary: "#00ff00",
  }),
}));

import { StatusBadge } from "@/components/StatusBadge";

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

describe("StatusBadge large-text layout", () => {
  it("lets a long status label wrap within its available width", () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <StatusBadge isOnline={false} enrichmentStatus="fallback" />,
      );
    });
    const container = renderer.root.findAllByType("div").find((instance) => {
      const style = flattenStyle(instance.props.style);
      return style.flexWrap === "wrap";
    });
    const label = renderer.root.findByType("span");

    expect(container).toBeDefined();
    expect(flattenStyle(container!.props.style)).toMatchObject({
      flexWrap: "wrap",
      maxWidth: "100%",
    });
    expect(flattenStyle(label.props.style)).toMatchObject({
      flexShrink: 1,
      minWidth: 0,
    });
    expect(label.children.join("")).not.toBe("");
  });
});
