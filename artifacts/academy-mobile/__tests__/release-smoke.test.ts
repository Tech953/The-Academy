import { describe, expect, it, vi } from "vitest";

const {
  getReleaseDomain,
  getReleaseProfiles,
  readReleaseConfig,
  validateNativeHandoff,
  validateAndroidPreviewIdentity,
  runReleaseSmokeCheck,
  runReleaseSmokeChecks,
} = require("../scripts/check-release.js") as {
  getReleaseDomain: (config: unknown, profile: string) => string;
  getReleaseProfiles: (config: unknown) => string[];
  readReleaseConfig: (configPath?: string) => Record<string, unknown>;
  validateNativeHandoff: (options: {
    handoffReport?: unknown;
    appConfig?: unknown;
    easConfig?: unknown;
  }) => {
    status: string;
    platform: string;
    profile: string;
    distribution: string;
    buildType: string;
    version: string;
    androidPackage: string;
    installerUrl: string | null;
    installerPath: string | null;
    timestamp: string;
    buildId: string | null;
  };
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

const {
  normalizeBuildMetadata,
  verifyAllProfileConnectivity,
} = require("../scripts/native-handoff.js") as {
  normalizeBuildMetadata: (
    output: { stdout: string; stderr: string },
    options: {
      platform: string;
      profile: string;
      capturedAt: string;
      appConfig: unknown;
    },
  ) => {
    installerUrl: string | null;
    installerPath: string | null;
    version: string;
    package: string;
    profile: string;
    timestamp: string;
    buildId: string | null;
    buildDetailsPageUrl: string | null;
  };
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

describe("native handoff build metadata", () => {
  const appConfig = {
    expo: {
      version: "1.0.0",
      android: { package: "com.theacademy.mobile" },
    },
  };

  it("normalizes a completed EAS APK response into a durable handoff record", () => {
    const output = {
      stdout: JSON.stringify([
        {
          id: "build-123",
          status: "finished",
          profile: "preview",
          appVersion: "1.0.0",
          appIdentifier: "com.theacademy.mobile",
          completedAt: "2026-09-15T15:00:00.000Z",
          buildDetailsPageUrl: "https://expo.dev/builds/build-123",
          artifacts: {
            buildUrl: "https://example.invalid/academy-preview.apk?token=redacted",
          },
        },
      ]),
      stderr: "",
    };

    expect(
      normalizeBuildMetadata(output, {
        platform: "android",
        profile: "preview",
        appConfig,
        capturedAt: "2026-09-15T15:01:00.000Z",
      }),
    ).toEqual({
      installerUrl: "https://example.invalid/academy-preview.apk?token=redacted",
      installerPath: null,
      version: "1.0.0",
      package: "com.theacademy.mobile",
      profile: "preview",
      timestamp: "2026-09-15T15:00:00.000Z",
      buildId: "build-123",
      buildDetailsPageUrl: "https://expo.dev/builds/build-123",
    });
  });

  it("accepts a local APK path when the build was run locally", () => {
    expect(
      normalizeBuildMetadata(
        {
          stdout: JSON.stringify([
            {
              id: "local-build",
              status: "finished",
              artifactPath: "/tmp/academy-preview.apk",
            },
          ]),
          stderr: "",
        },
        {
          platform: "android",
          profile: "preview",
          appConfig,
          capturedAt: "2026-09-15T15:01:00.000Z",
        },
      ),
    ).toMatchObject({
      installerUrl: null,
      installerPath: "/tmp/academy-preview.apk",
      version: "1.0.0",
      package: "com.theacademy.mobile",
      profile: "preview",
      timestamp: "2026-09-15T15:01:00.000Z",
    });
  });

  it("fails clearly instead of creating a handoff without an installer", () => {
    expect(() =>
      normalizeBuildMetadata(
        {
          stdout: JSON.stringify([
            {
              id: "incomplete-build",
              status: "finished",
              appVersion: "1.0.0",
              appIdentifier: "com.theacademy.mobile",
            },
          ]),
          stderr: "",
        },
        {
          platform: "android",
          profile: "preview",
          appConfig,
          capturedAt: "2026-09-15T15:01:00.000Z",
        },
      ),
    ).toThrow(/Incomplete EAS build metadata: missing installer URL or local APK path/);
  });
});

describe("release smoke check", () => {
  const validHandoffConfig = () => ({
    appConfig: {
      expo: {
        version: "1.0.0",
        android: { package: "com.theacademy.mobile" },
      },
    },
    easConfig: {
      build: {
        preview: {
          distribution: "internal",
          android: { buildType: "apk" },
        },
      },
    },
  });

  const validHandoffReport = (): {
    status: string;
    platform: string;
    profile: string;
    build: {
      installerUrl: string | null;
      installerPath: string | null;
      version: string;
      package: string;
      profile: string;
      timestamp: string;
      buildId: string | null;
      buildDetailsPageUrl: string | null;
    };
  } => ({
      status: "completed",
      platform: "android",
      profile: "preview",
      build: {
        installerUrl: "https://example.invalid/academy-preview.apk?sig=redacted",
        installerPath: null,
        version: "1.0.0",
        package: "com.theacademy.mobile",
        profile: "preview",
        timestamp: "2026-09-15T15:00:00.000Z",
        buildId: "build-123",
        buildDetailsPageUrl: "https://expo.dev/builds/build-123",
      },
    });

  it("accepts a complete preview APK handoff without contacting a device", () => {
    expect(
      validateNativeHandoff({
        ...validHandoffConfig(),
        handoffReport: validHandoffReport(),
      }),
    ).toEqual({
      status: "passed",
      platform: "android",
      profile: "preview",
      distribution: "internal",
      buildType: "apk",
      version: "1.0.0",
      androidPackage: "com.theacademy.mobile",
      installerUrl: "https://example.invalid/academy-preview.apk?sig=redacted",
      installerPath: null,
      timestamp: "2026-09-15T15:00:00.000Z",
      buildId: "build-123",
    });
  });

  it("accepts an EAS artifact URL when build metadata identifies the build", () => {
    const report = validHandoffReport();
    report.build.installerUrl = "https://expo.dev/artifacts/build-123";

    expect(
      validateNativeHandoff({
        ...validHandoffConfig(),
        handoffReport: report,
      }),
    ).toMatchObject({
      status: "passed",
      installerUrl: "https://expo.dev/artifacts/build-123",
    });
  });

  it("reports actionable errors for stale version and package metadata", () => {
    const report = validHandoffReport();
    report.build.version = "0.9.0";
    report.build.package = "com.theacademy.old";

    expect(() =>
      validateNativeHandoff({
        ...validHandoffConfig(),
        handoffReport: report,
      }),
    ).toThrow(
      /build version "0\.9\.0" does not match app\.json "1\.0\.0".*build package "com\.theacademy\.old" does not match app\.json "com\.theacademy\.mobile"/s,
    );
  });

  it("rejects missing installer references and non-preview handoffs", () => {
    const report = validHandoffReport();
    report.profile = "production";
    report.build.profile = "production";
    report.build.installerUrl = null;
    report.build.installerPath = null;
    report.build.buildId = null;
    report.build.buildDetailsPageUrl = null;

    expect(() =>
      validateNativeHandoff({
        ...validHandoffConfig(),
        handoffReport: report,
      }),
    ).toThrow(
      /handoff profile must be "preview".*installerUrl or installerPath is missing.*build profile must be "preview"/s,
    );
  });

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