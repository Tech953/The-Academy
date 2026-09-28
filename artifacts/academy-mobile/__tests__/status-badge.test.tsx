import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

import {
  getMobileCopy,
  MOBILE_COPY_CATALOG,
  SUPPORTED_LOCALES,
  type MobileCopyKey,
  type SupportedLocale,
} from "@/constants/locales";
import type { EnrichmentStatus } from "@/lib/enrichmentStatus";

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

const STATUS_CASES = [
  { status: "live", copyKey: "statusLiveAi" },
  { status: "offline", copyKey: "statusLocalMode" },
  { status: "fallback", copyKey: "statusLocalFallback" },
  { status: "checking", copyKey: "statusCheckingApi" },
  { status: "rate_limited", copyKey: "statusRetryLater" },
] as const satisfies ReadonlyArray<{
  status: EnrichmentStatus;
  copyKey: MobileCopyKey;
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

function renderBadge(status: EnrichmentStatus, locale: SupportedLocale) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <StatusBadge
        isOnline={status !== "offline"}
        enrichmentStatus={status}
        locale={locale}
      />,
    );
  });
  return renderer;
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

describe("StatusBadge localization", () => {
  for (const locale of SUPPORTED_LOCALES) {
    describe(locale, () => {
      it.each(STATUS_CASES)(
        "renders the selected locale's $status label and accessibility text",
        ({ status, copyKey }) => {
          const expectedStatus = MOBILE_COPY_CATALOG[locale]?.[copyKey];
          const expectedMode = MOBILE_COPY_CATALOG[locale]?.contentMode;

          expect(expectedStatus).toBeTruthy();
          expect(expectedMode).toBeTruthy();
          expect(getMobileCopy(copyKey, locale)).toBe(expectedStatus);

          const renderer = renderBadge(status, locale);
          const accessibilityNode = renderer.root.findByProps({
            accessibilityRole: "text",
          });
          const visibleLabel = renderer.root.findByType("span");

          expect(visibleLabel.children.join("")).toBe(expectedStatus);
          expect(accessibilityNode.props.accessibilityLabel).toBe(
            `${expectedMode}: ${expectedStatus}`,
          );
          act(() => renderer.unmount());
        },
      );
    });
  }

  it("falls back to English when translated badge and mode keys are missing", () => {
    const spanishCopy = MOBILE_COPY_CATALOG.es;
    expect(spanishCopy).toBeDefined();

    const previousStatus = spanishCopy!.statusLiveAi;
    const previousMode = spanishCopy!.contentMode;
    delete spanishCopy!.statusLiveAi;
    delete spanishCopy!.contentMode;

    try {
      const renderer = renderBadge("live", "es");
      const accessibilityNode = renderer.root.findByProps({
        accessibilityRole: "text",
      });
      const visibleLabel = renderer.root.findByType("span");
      const englishStatus = getMobileCopy("statusLiveAi", "en");
      const englishMode = getMobileCopy("contentMode", "en");

      expect(getMobileCopy("statusLiveAi", "es")).toBe(englishStatus);
      expect(getMobileCopy("contentMode", "es")).toBe(englishMode);
      expect(visibleLabel.children.join("")).toBe(englishStatus);
      expect(accessibilityNode.props.accessibilityLabel).toBe(
        `${englishMode}: ${englishStatus}`,
      );
      act(() => renderer.unmount());
    } finally {
      spanishCopy!.statusLiveAi = previousStatus;
      spanishCopy!.contentMode = previousMode;
    }
  });
});
