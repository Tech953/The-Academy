import React from "react";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RssFeedWidget } from "./RssFeedWidget";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function textContent(instance: ReactTestInstance): string {
  return instance.children
    .map(child =>
      typeof child === "string" ? child : textContent(child as ReactTestInstance),
    )
    .join("");
}

function renderWidget() {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <RssFeedWidget
        primaryColor="#00ff00"
        accentCyan="#00ffff"
        accentAmber="#ffff00"
      />,
    );
  });
  return renderer;
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function setLocalStorage() {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
}

async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  setLocalStorage();
});

afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage;
  vi.unstubAllGlobals();
});

describe("RSS feed widget errors", () => {
  it("explains the HTTPS policy and keeps retry available", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(403, { error: "feed must use https" }),
    );
    vi.stubGlobal("fetch", fetcher);
    const renderer = renderWidget();

    await settle();

    const rendered = textContent(renderer.root);
    expect(rendered).toContain(
      "SIGNAL LOST: This feed requires HTTPS. Choose an HTTPS feed.",
    );
    expect(rendered).not.toContain("SIGNAL LOST: 403");
    const retryButton = renderer.root
      .findAll(instance => String(instance.type) === "button")
      .find(instance => textContent(instance).includes("RETRY"));
    expect(retryButton).toBeDefined();

    await act(async () => {
      retryButton?.props.onClick();
      await Promise.resolve();
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("keeps temporary upstream failures on the existing numeric path", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(502, { error: "upstream unavailable" }),
    );
    vi.stubGlobal("fetch", fetcher);
    const renderer = renderWidget();

    await settle();

    expect(textContent(renderer.root)).toContain("SIGNAL LOST: 502");
    expect(textContent(renderer.root)).not.toContain("Choose an HTTPS feed");
    expect(
      renderer.root
        .findAll(instance => String(instance.type) === "button")
        .some(instance => textContent(instance).includes("RETRY")),
    ).toBe(true);
  });
});