export const MAX_RATE_LIMIT_RETRIES = 1;
export const RATE_LIMITED_USER_MESSAGE =
  "This request is temporarily limited. Please try again shortly.";

function parseRetryAfter(value: string | null, now: number): number | null {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds * 1_000);
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : Math.max(0, timestamp - now);
}

function parseRateLimitReset(value: string | null): number | null {
  if (!value) return null;

  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0
    ? Math.ceil(seconds * 1_000)
    : null;
}

/**
 * Resolve the server-provided delay for a rate-limited request. Retry-After
 * is authoritative; RateLimit-Reset is the fallback used by standard
 * rate-limit implementations that omit Retry-After.
 */
export function getRateLimitRetryDelayMs(
  headers: Headers,
  now = Date.now(),
): number | null {
  return (
    parseRetryAfter(headers.get("retry-after"), now) ??
    parseRateLimitReset(headers.get("ratelimit-reset"))
  );
}

export function waitForRateLimitRetry(
  delayMs: number,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(signal.reason ?? new DOMException("The request was aborted.", "AbortError"));
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);

    const onAbort = () => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
      reject(signal?.reason ?? new DOMException("The request was aborted.", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export class RateLimitError extends Error {
  readonly name = "RateLimitError";
  readonly status = 429;
  readonly retryAfterMs: number | null;
  readonly userMessage = RATE_LIMITED_USER_MESSAGE;

  constructor(
    readonly requestPath: string,
    retryAfterMs: number | null,
  ) {
    super(RATE_LIMITED_USER_MESSAGE);
    Object.setPrototypeOf(this, new.target.prototype);
    this.retryAfterMs = retryAfterMs;
  }
}

export function isRateLimitError(error: unknown): error is {
  status: 429;
  retryAfterMs: number | null;
  userMessage: string;
} {
  return (
    error instanceof RateLimitError ||
    (typeof error === "object" &&
      error !== null &&
      (error as { status?: unknown }).status === 429 &&
      typeof (error as { userMessage?: unknown }).userMessage === "string")
  );
}