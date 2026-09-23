import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  customFetch,
  getRateLimitQuotaCategory,
  getRateLimitRetryDelayMs,
  RATE_LIMITED_USER_MESSAGE,
} from "../../../lib/api-client-react/src";

describe("shared rate-limit client contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers Retry-After and falls back to RateLimit-Reset", () => {
    expect(
      getRateLimitRetryDelayMs(
        new Headers({
          "retry-after": "2",
          "ratelimit-reset": "30",
        }),
      ),
    ).toBe(2_000);

    expect(
      getRateLimitRetryDelayMs(
        new Headers({
          "ratelimit-reset": "7",
        }),
      ),
    ).toBe(7_000);
  });

  it("accepts only documented rate-limit quota categories", () => {
    expect(getRateLimitQuotaCategory({ quota: "ai" })).toBe("ai");
    expect(getRateLimitQuotaCategory({ quota: "internal-limiter-name" })).toBeNull();
    expect(getRateLimitQuotaCategory({ quota: 42 })).toBeNull();
  });

  it("retries a rate-limited request once using the server-provided delay", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "busy" }), {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": "0",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetcher);

    await expect(
      customFetch<{ ok: boolean }>("/api/test", { responseType: "json" }),
    ).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("propagates cancellation during the retry delay without sending again", async () => {
    const controller = new AbortController();
    const abortReason = new DOMException("screen closed", "AbortError");
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ error: "busy" }), {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": "60",
        },
      }),
    );
    vi.stubGlobal("fetch", fetcher);

    const retryPromise = customFetch("/api/test", {
      responseType: "json",
      signal: controller.signal,
    });
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    controller.abort(abortReason);

    const error = await retryPromise.catch((caught: unknown) => caught);
    expect(error).toBe(abortReason);
    expect(error).not.toBeInstanceOf(ApiError);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("replays a Request body and headers on a rate-limited retry", async () => {
    const attempts: Array<{ body: string; requestHeader: string | null; initHeader: string | null }> = [];
    const fetcher = vi
      .fn()
      .mockImplementationOnce(async (input: Request, init: RequestInit) => {
        attempts.push({
          body: await input.clone().text(),
          initHeader: new Headers(init.headers).get("x-request-id"),
          requestHeader: input.headers.get("x-request-id"),
        });
        return new Response(JSON.stringify({ error: "busy" }), {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": "0",
          },
        });
      })
      .mockImplementationOnce(async (input: Request, init: RequestInit) => {
        attempts.push({
          body: await input.clone().text(),
          initHeader: new Headers(init.headers).get("x-request-id"),
          requestHeader: input.headers.get("x-request-id"),
        });
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      });
    vi.stubGlobal("fetch", fetcher);

    const request = new Request("https://academy.test/api/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": "request-123",
      },
      body: JSON.stringify({ answer: "same-payload" }),
    });

    await expect(
      customFetch<{ ok: boolean }>(request, { responseType: "json" }),
    ).resolves.toEqual({ ok: true });
    expect(attempts).toEqual([
      {
        body: '{"answer":"same-payload"}',
        initHeader: "request-123",
        requestHeader: "request-123",
      },
      {
        body: '{"answer":"same-payload"}',
        initHeader: "request-123",
        requestHeader: "request-123",
      },
    ]);
  });

  it("fails clearly instead of retrying a non-replayable body", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("one-shot-payload"));
        controller.close();
      },
    });
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ error: "busy" }), {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": "0",
        },
      }),
    );
    vi.stubGlobal("fetch", fetcher);

    await expect(
      customFetch("/api/test", {
        method: "POST",
        body: stream,
        responseType: "json",
      }),
    ).rejects.toThrow(
      "cannot retry a rate-limited request with a non-replayable body",
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("keeps retries bounded and exposes a safe final error", async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ error: "raw middleware detail", quota: "ai" }), {
        status: 429,
        headers: {
          "content-type": "application/json",
          "ratelimit-reset": "0",
        },
      }),
    );
    vi.stubGlobal("fetch", fetcher);

    const error = await customFetch("/api/test", { responseType: "json" }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError).toMatchObject({
      status: 429,
      isRateLimited: true,
      retryAfterMs: 0,
      quotaCategory: "ai",
      userMessage: RATE_LIMITED_USER_MESSAGE,
      message: RATE_LIMITED_USER_MESSAGE,
    });
    expect(apiError.message).not.toContain("raw middleware detail");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});