import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  customFetch,
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

  it("keeps retries bounded and exposes a safe final error", async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ error: "raw middleware detail" }), {
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
      userMessage: RATE_LIMITED_USER_MESSAGE,
      message: RATE_LIMITED_USER_MESSAGE,
    });
    expect(apiError.message).not.toContain("raw middleware detail");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});