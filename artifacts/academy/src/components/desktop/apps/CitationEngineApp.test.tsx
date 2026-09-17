import React from "react";
import TestRenderer, {
  act,
  type ReactTestInstance,
} from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CitationEngineApp } from "./CitationEngineApp";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  vi.unstubAllGlobals();
});

function textContent(instance: ReactTestInstance): string {
  return instance.children
    .map((child) =>
      typeof child === "string" ? child : textContent(child as ReactTestInstance),
    )
    .join("");
}

function buttons(renderer: TestRenderer.ReactTestRenderer): ReactTestInstance[] {
  return renderer.root.findAll((instance) => String(instance.type) === "button");
}

function findButton(
  renderer: TestRenderer.ReactTestRenderer,
  label: string,
): ReactTestInstance {
  const button = buttons(renderer).find((instance) => textContent(instance).includes(label));
  expect(button).toBeDefined();
  return button!;
}

function renderUrlImport() {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<CitationEngineApp />);
  });

  act(() => {
    findButton(renderer, "URL IMPORT").props.onClick();
  });

  const input = renderer.root.find((instance) => String(instance.type) === "input");
  act(() => {
    input.props.onChange({ target: { value: "https://example.com/article" } });
  });

  return renderer;
}

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("Citation Engine URL import errors", () => {
  it("shows the timeout contract and retries the same URL", async () => {
    const fetcher = vi.fn(async () =>
      response(504, {
        error: "URL metadata fetch timed out",
        retryable: true,
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    const renderer = renderUrlImport();

    await act(async () => {
      findButton(renderer, "FETCH & CITE").props.onClick();
      await Promise.resolve();
    });

    expect(textContent(renderer.root)).toContain(
      "SIGNAL LOST: URL metadata fetch timed out",
    );
    const retryButton = findButton(renderer, "RETRY");
    expect(retryButton.props["aria-label"]).toBe("Retry URL import");
    const requestedUrl = fetcher.mock.calls[0]?.[0];

    await act(async () => {
      retryButton.props.onClick();
      await Promise.resolve();
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1]?.[0]).toBe(requestedUrl);
  });

  it.each([
    [500, "Could not retrieve URL: upstream unavailable"],
    [502, "upstream 502"],
  ])("keeps ordinary %s errors distinct from timeout handling", async (status, error) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response(status, { error })),
    );
    const renderer = renderUrlImport();

    await act(async () => {
      findButton(renderer, "FETCH & CITE").props.onClick();
      await Promise.resolve();
    });

    expect(textContent(renderer.root)).toContain(`SIGNAL LOST: ${error}`);
    expect(buttons(renderer).some((button) => textContent(button).includes("RETRY"))).toBe(
      false,
    );
  });
});