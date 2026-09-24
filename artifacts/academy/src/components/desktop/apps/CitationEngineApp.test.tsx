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

function renderCitationGenerator() {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<CitationEngineApp />);
  });
  return renderer;
}

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function startImport(renderer: TestRenderer.ReactTestRenderer, url: string) {
  const input = renderer.root.find((instance) => String(instance.type) === "input");
  act(() => {
    input.props.onChange({ target: { value: url } });
  });
  act(() => {
    input.props.onKeyDown({ key: "Enter" });
  });
}

async function flushPendingImport() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("Citation Engine URL import errors", () => {
  it("shows the timeout contract and retries the same URL", async () => {
    const responses = [
      response(504, {
        error: "URL metadata fetch timed out",
        retryable: true,
      }),
      response(200, {
        title: "Learning Through Practice",
        author: "Jordan Reader",
        date: "2023-05-02",
        publisher: "Education Review",
        description: "A study of learning strategies.",
        url: "https://example.com/article",
        host: "example.com",
      }),
    ];
    const fetcher = vi.fn(async (_input: string) => responses.shift()!);
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
      await Promise.resolve();
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1]?.[0]).toBe(requestedUrl);
    const result = textContent(renderer.root);
    expect(result).not.toContain("SIGNAL LOST");
    expect(result).not.toContain("RETRY");
    expect(result).toContain("EXTRACTED METADATA");
    expect(result).toContain("GENERATED CITATIONS");
    expect(result).toContain("Learning Through Practice");
    expect(result).toContain("Jordan Reader");
    expect(result).toContain("Education Review");
    expect(result).toContain("https://example.com/article");
    expect(result).toContain(
      "Jordan Reader (2023). Learning Through Practice.",
    );
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

  it.each([
    [502, "Bad Gateway", "<html><body>upstream error</body></html>", "Bad Gateway"],
    [500, "", "", "Failed to fetch URL"],
  ])(
    "shows a readable %s error when the response body is not JSON",
    async (status, statusText, body, expectedMessage) => {
      const fetcher = vi.fn(async (_input: string) =>
        new Response(body, { status, statusText }),
      );
      vi.stubGlobal("fetch", fetcher);
      const renderer = renderUrlImport();

      await act(async () => {
        findButton(renderer, "FETCH & CITE").props.onClick();
        await Promise.resolve();
      });

      expect(textContent(renderer.root)).toContain(
        `SIGNAL LOST: ${expectedMessage}`,
      );
      expect(buttons(renderer).some((button) => textContent(button).includes("RETRY"))).toBe(
        false,
      );
    },
  );

  it("does not let an older success replace a newer failure", async () => {
    const olderRequest = deferred<Response>();
    const newerRequest = deferred<Response>();
    const requests = [olderRequest.promise, newerRequest.promise];
    const fetcher = vi.fn((_input: string) => requests.shift()!);
    vi.stubGlobal("fetch", fetcher);
    const renderer = renderUrlImport();

    startImport(renderer, "https://example.com/older");
    startImport(renderer, "https://example.com/newer");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.map(([requestedUrl]) => requestedUrl)).toEqual([
      "/api/fetch-url-meta?url=https%3A%2F%2Fexample.com%2Folder",
      "/api/fetch-url-meta?url=https%3A%2F%2Fexample.com%2Fnewer",
    ]);

    newerRequest.resolve(response(502, { error: "newer request failed" }));
    await flushPendingImport();
    olderRequest.resolve(response(200, {
      title: "Stale older title",
      author: "Older author",
      date: "2020",
      publisher: "Older source",
      description: "",
      url: "https://example.com/older",
      host: "example.com",
    }));
    await flushPendingImport();

    expect(textContent(renderer.root)).toContain(
      "SIGNAL LOST: newer request failed",
    );
    expect(textContent(renderer.root)).not.toContain("Stale older title");
    expect(textContent(renderer.root)).not.toContain("EXTRACTED METADATA");
  });

  it("does not let an older failure erase newer metadata", async () => {
    const olderRequest = deferred<Response>();
    const newerRequest = deferred<Response>();
    const requests = [olderRequest.promise, newerRequest.promise];
    const fetcher = vi.fn((_input: string) => requests.shift()!);
    vi.stubGlobal("fetch", fetcher);
    const renderer = renderUrlImport();

    startImport(renderer, "https://example.com/older");
    startImport(renderer, "https://example.com/newer");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.map(([requestedUrl]) => requestedUrl)).toEqual([
      "/api/fetch-url-meta?url=https%3A%2F%2Fexample.com%2Folder",
      "/api/fetch-url-meta?url=https%3A%2F%2Fexample.com%2Fnewer",
    ]);

    newerRequest.resolve(response(200, {
      title: "Current newer title",
      author: "Newer author",
      date: "2025",
      publisher: "Newer source",
      description: "",
      url: "https://example.com/newer",
      host: "example.com",
    }));
    await flushPendingImport();
    olderRequest.resolve(response(503, { error: "stale older failure" }));
    await flushPendingImport();

    expect(textContent(renderer.root)).toContain("Current newer title");
    expect(textContent(renderer.root)).toContain("https://example.com/newer");
    expect(textContent(renderer.root)).not.toContain("SIGNAL LOST");
    expect(buttons(renderer).some((button) => textContent(button).includes("RETRY"))).toBe(
      false,
    );
  });

  it("aborts an in-flight request after closing and reopening Citation Engine", async () => {
    const pendingRequest = deferred<Response>();
    let requestSignal: AbortSignal | undefined;
    const fetcher = vi.fn((_input: string, init?: RequestInit) => {
      requestSignal = init?.signal as AbortSignal | undefined;
      requestSignal?.addEventListener("abort", () => {
        pendingRequest.reject(
          Object.assign(new Error("The operation was aborted"), {
            name: "AbortError",
          }),
        );
      }, { once: true });
      return pendingRequest.promise;
    });
    vi.stubGlobal("fetch", fetcher);
    const renderer = renderUrlImport();

    await act(async () => {
      findButton(renderer, "FETCH & CITE").props.onClick();
      await Promise.resolve();
    });
    expect(textContent(renderer.root)).toContain("FETCHING...");
    expect(fetcher).toHaveBeenCalledTimes(1);

    act(() => {
      renderer.unmount();
    });
    expect(requestSignal?.aborted).toBe(true);
    await flushPendingImport();

    let reopenedRenderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      reopenedRenderer = TestRenderer.create(<CitationEngineApp />);
    });

    act(() => {
      findButton(reopenedRenderer, "URL IMPORT").props.onClick();
    });

    const reopenedText = textContent(reopenedRenderer.root);
    expect(reopenedText).not.toContain("FETCHING...");
    expect(reopenedText).not.toContain("SIGNAL LOST");
    expect(reopenedText).not.toContain("RETRY");
    expect(reopenedText).not.toContain("EXTRACTED METADATA");
    expect(reopenedRenderer.root.find((instance) => String(instance.type) === "input").props.value)
      .toBe("");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("Citation Engine APA citations", () => {
  it("keeps non-empty author entries when the first author field is blank", () => {
    const renderer = renderCitationGenerator();
    act(() => {
      findButton(renderer, "+ ADD AUTHOR").props.onClick();
    });

    const authorInputs = renderer.root.findAll(
      instance =>
        String(instance.type) === "input" &&
        instance.props.placeholder === "Doe, Jane",
    );
    expect(authorInputs).toHaveLength(2);

    act(() => {
      authorInputs[1].props.onChange({ target: { value: "Smith, John" } });
      renderer.root.find(
        instance =>
          String(instance.type) === "input" &&
          instance.props.placeholder === "2024",
      ).props.onChange({ target: { value: "2024" } });
      renderer.root.find(
        instance =>
          String(instance.type) === "input" &&
          instance.props.placeholder === "Article or book title",
      ).props.onChange({ target: { value: "Citation completeness in education" } });
    });

    const output = textContent(renderer.root);
    expect(output).toContain("Smith, John");
    expect(output).toContain("Citation completeness in education");
  });
});
