import { describe, expect, it, vi } from "vitest";

const {
  getReleaseDomain,
  getReleaseProfiles,
  readReleaseConfig,
  validateAndroidPreviewIdentity,
  runReleaseSmokeCheck,
  runReleaseSmokeChecks,
} = require("../scripts/check-release.js") as {
  getReleaseDomain: (config: unknown, profile: string) => string;
  getReleaseProfiles: (config: unknown) => string[];
  readReleaseConfig: (configPath?: string) => Record<string, unknown>;
  validateAndroidPreviewIdentity: (options?: {
    appConfig?: unknown;
    easConfig?: unknown;
    generatedManifest?: unknown;
  }) => {
    androidPackage: string;
    generatedAndroidPackage: string;
    previewDistribution: string;
    previewBuildType: string;
  };
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
  runReleaseSmokeChecks: (options: {
    configPath?: string;
    fetchImpl: typeof fetch;
  }) => Promise<{
    profiles: string[];
    passed: Array<{
      profile: string;
      domain: string;
      healthUrl: string;
      aiUrl: string;
    }>;
    failed: Array<{ profile: string; error: Error }>;
  }>;
};

const { verifyAllProfileConnectivity } = require("../scripts/native-handoff.js") as {
  verifyAllProfileConnectivity: (options: {
    profile: string;
    runAllProfiles: () => Promise<{
      profiles: string[];
      passed: Array<{ profile: string; domain: string; healthUrl: string; aiUrl: string }>;
      failed: Array<{ profile: string; error: Error }>;
    }>;
  }) => Promise<{
    selected: { profile: string };
    allProfiles: {
      profiles: string[];
      passed: Array<{ profile: string }>;
      failed: Array<{ profile: string; error: string }>;
    };
  }>;
};

const okJson = (payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

describe("release smoke check", () => {
  const validIdentity = () => ({
    appConfig: {
      expo: { android: { package: "com.theacademy.mobile" } },
    },
    easConfig: {
      build: {
        preview: {
          distribution: "internal",
          android: { buildType: "apk" },
        },
      },
    },
    generatedManifest: {
      extra: { expoClient: { android: { package: "com.theacademy.mobile" } } },
    },
  });

  it("matches Android identity across app, EAS preview, and generated metadata", () => {
    expect(validateAndroidPreviewIdentity(validIdentity())).toEqual({
      androidPackage: "com.theacademy.mobile",
      generatedAndroidPackage: "com.theacademy.mobile",
      previewDistribution: "internal",
      previewBuildType: "apk",
    });
  });

  it("reports Android package drift before an APK handoff", () => {
    expect(() =>
      validateAndroidPreviewIdentity({
        ...validIdentity(),
        appConfig: {
          expo: { android: { package: "com.theacademy.other" } },
        },
      }),
    ).toThrow(
      /Android package drift: expected com\.theacademy\.mobile, found com\.theacademy\.other/,
    );
  });

  it("reports preview profile drift before an APK handoff", () => {
    expect(() =>
      validateAndroidPreviewIdentity({
        ...validIdentity(),
        easConfig: {
          build: {
            preview: {
              distribution: "internal",
              android: { buildType: "app-bundle" },
            },
          },
        },
      }),
    ).toThrow(/preview Android buildType must be "apk"/);
  });

  it("reports generated Android metadata drift before an APK handoff", () => {
    expect(() =>
      validateAndroidPreviewIdentity({
        ...validIdentity(),
        generatedManifest: {
          extra: { expoClient: { android: { package: "com.theacademy.other" } } },
        },
      }),
    ).toThrow(
      /Generated Android package drift: app\.json declares com\.theacademy\.mobile, but generated Android metadata declares com\.theacademy\.other/,
    );
  });

  it("reads the preview hostname from eas.json", () => {
    const config = readReleaseConfig();
    expect(getReleaseDomain(config, "preview")).toBe("theeacademy.replit.app");
  });

  it("discovers only build profiles that define a public domain", () => {
    expect(
      getReleaseProfiles({
        build: {
          development: { developmentClient: true },
          preview: { env: { EXPO_PUBLIC_DOMAIN: "preview.example.com" } },
          production: { env: { EXPO_PUBLIC_DOMAIN: "production.example.com" } },
        },
      }),
    ).toEqual(["preview", "production"]);
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

  it("checks every configured domain profile and reports each profile", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.endsWith("/api/healthz")) {
        return okJson({ status: "ok" });
      }
      return okJson({ description: "A hush settles over the library." });
    }) as unknown as typeof fetch;

    await expect(runReleaseSmokeChecks({ fetchImpl })).resolves.toMatchObject({
      profiles: ["preview", "production"],
      passed: [
        { profile: "preview", domain: "theeacademy.replit.app" },
        { profile: "production", domain: "theeacademy.replit.app" },
      ],
      failed: [],
    });
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it("continues after a failed profile and returns a non-empty failure report", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("preview unavailable", { status: 503 }))
      .mockResolvedValueOnce(okJson({ status: "ok" }))
      .mockResolvedValueOnce(okJson({ description: "Production description." })) as unknown as typeof fetch;

    const result = await runReleaseSmokeChecks({ fetchImpl });

    expect(result.profiles).toEqual(["preview", "production"]);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toMatchObject({ profile: "preview" });
    expect(result.failed[0].error.message).toMatch(/HTTP 503/);
    expect(result.passed).toMatchObject([
      { profile: "production", domain: "theeacademy.replit.app" },
    ]);
  });

  it("blocks the native handoff when any profile fails", async () => {
    const runAllProfiles = vi.fn(async () => ({
      profiles: ["preview", "production"],
      passed: [
        {
          profile: "preview",
          domain: "preview.example.com",
          healthUrl: "https://preview.example.com/api/healthz",
          aiUrl: "https://preview.example.com/api/ai/describe",
        },
      ],
      failed: [
        { profile: "production", error: new Error("HTTP 503") },
      ],
    }));

    await expect(
      verifyAllProfileConnectivity({
        profile: "preview",
        runAllProfiles,
      }),
    ).rejects.toThrow(
      /Release connectivity failed before EAS build: production: HTTP 503/,
    );
    expect(runAllProfiles).toHaveBeenCalledTimes(1);
  });

  it("returns the selected profile after every profile passes", async () => {
    const runAllProfiles = vi.fn(async () => ({
      profiles: ["preview", "production"],
      passed: [
        {
          profile: "preview",
          domain: "preview.example.com",
          healthUrl: "https://preview.example.com/api/healthz",
          aiUrl: "https://preview.example.com/api/ai/describe",
        },
        {
          profile: "production",
          domain: "production.example.com",
          healthUrl: "https://production.example.com/api/healthz",
          aiUrl: "https://production.example.com/api/ai/describe",
        },
      ],
      failed: [],
    }));

    await expect(
      verifyAllProfileConnectivity({
        profile: "production",
        runAllProfiles,
      }),
    ).resolves.toMatchObject({
      selected: { profile: "production" },
      allProfiles: {
        profiles: ["preview", "production"],
        failed: [],
      },
    });
  });
});