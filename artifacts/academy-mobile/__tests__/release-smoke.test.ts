import { describe, expect, it, vi } from "vitest";

const {
  getReleaseDomain,
  readReleaseConfig,
  runReleaseSmokeCheck,
} = require("../scripts/check-release.js") as {
  getReleaseDomain: (config: unknown, profile: string) => string;
  readReleaseConfig: (configPath?: string) => Record<string, unknown>;
  runReleaseSmokeCheck: (options: {
    profile?: string;
    configPath?: string;
    fetchImpl: typeof fetch;
  }) => Promise<{
    profile: string;
    domain: string;
    healthUrl: string;
    aiUrl: string;
  }>;
};

const okJson = (payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

describe("release smoke check", () => {
  it("reads the preview hostname from eas.json", () => {
    const config = readReleaseConfig();
    expect(getReleaseDomain(config, "preview")).toBe("theeacademy.replit.app");
  });

  it("rejects release profiles without an HTTPS hostname", () => {
    expect(() =>
      getReleaseDomain(
        { build: { preview: { env: { EXPO_PUBLIC_DOMAIN: "https://user:pass@example.com/path" } } } },
        "preview",
      ),
    ).toThrow(/invalid public hostname/i);
  });

  it("checks health and AI enrichment using the release hostname", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      requests.push({ url, init });
      if (url.endsWith("/api/healthz")) {
        return okJson({ status: "ok" });
      }
      return okJson({ description: "A hush settles over the library." });
    }) as unknown as typeof fetch;

    await expect(
      runReleaseSmokeCheck({ profile: "production", fetchImpl }),
    ).resolves.toMatchObject({
      profile: "production",
      domain: "theeacademy.replit.app",
    });

    expect(requests.map((request) => request.url)).toEqual([
      "https://theeacademy.replit.app/api/healthz",
      "https://theeacademy.replit.app/api/ai/describe",
    ]);
    expect(requests[1].init?.method).toBe("POST");
    expect(JSON.parse(String(requests[1].init?.body))).toMatchObject({
      type: "location",
      locationName: "Academy Library",
    });
  });

  it("reports an actionable health failure before calling AI", async () => {
    const fetchImpl = vi.fn(async () => new Response("not found", { status: 404 })) as unknown as typeof fetch;

    await expect(
      runReleaseSmokeCheck({ fetchImpl }),
    ).rejects.toThrow(
      /Health check failed for profile "preview".*https:\/\/theeacademy\.replit\.app\/api\/healthz.*HTTP 404/i,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("reports an actionable AI enrichment failure", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(okJson({ status: "ok" }))
      .mockResolvedValueOnce(new Response("upstream unavailable", { status: 503 })) as unknown as typeof fetch;

    await expect(
      runReleaseSmokeCheck({ fetchImpl }),
    ).rejects.toThrow(
      /AI enrichment check failed.*https:\/\/theeacademy\.replit\.app\/api\/ai\/describe.*HTTP 503/i,
    );
  });
});