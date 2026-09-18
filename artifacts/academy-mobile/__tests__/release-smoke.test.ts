import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import * as fs from "node:fs";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  BULLETIN_SOURCE_MESSAGES,
  DEFAULT_LOCALE,
  getBulletinSourceMessage,
  resolveLocale,
  SUPPORTED_LOCALES,
} from "../constants/locales";
import {
  BULLETIN_REPAIR_ACCESSIBILITY_LABEL,
  getBulletinRepairAccessibility,
  shouldAnnounceBulletinRepair,
} from "../lib/bulletinAccessibility";

const {
  getReleaseDomain,
  getReleaseProfiles,
  readReleaseConfig,
  validateReleaseProfileHost,
  validateRequiredReleaseProfileHosts,
  validateNativeHandoff,
  computeFileSha256: computeReleaseFileSha256,
  verifyInstallerChecksum,
  validateAndroidPreviewIdentity,
  validateAndroidProductionIdentity,
  runReleaseSmokeCheck,
  runReleaseSmokeChecks,
  summarizeReleaseSmokeResult,
  writeReleaseReport,
  RELEASE_REPORT_SCHEMA_VERSION,
} = require("../scripts/check-release.js") as {
  RELEASE_REPORT_SCHEMA_VERSION: number;
  getReleaseDomain: (config: unknown, profile: string) => string;
  getReleaseProfiles: (config: unknown) => string[];
  readReleaseConfig: (configPath?: string) => Record<string, unknown>;
  validateReleaseProfileHost: (config: unknown, profile: string) => string;
  validateRequiredReleaseProfileHosts: (config: unknown) => void;
  validateNativeHandoff: (options: {
    handoffReport?: unknown;
    appConfig?: unknown;
    easConfig?: unknown;
    profile?: string;
    platform?: "android" | "ios";
  }) => {
    status: string;
    platform: string;
    profile: string;
    distribution: string;
    buildType: string;
    version: string;
    androidPackage?: string;
    iosBundleIdentifier?: string;
    installerUrl: string | null;
    installerPath: string | null;
    timestamp: string;
    buildId: string | null;
  };
  computeFileSha256: (filePath: string) => string;
  verifyInstallerChecksum: (options: {
    artifactPath: string;
    handoffReport?: unknown;
    handoffReportPath?: string;
  }) => {
    status: string;
    artifactPath: string;
    installerSha256: string;
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
  validateAndroidProductionIdentity: (options?: {
    appConfig?: unknown;
    easConfig?: unknown;
    generatedManifest?: unknown;
  }) => {
    androidPackage: string;
    generatedAndroidPackage: string;
    productionBuildType: string;
  };
  runReleaseSmokeCheck: (options: {
    profile?: string;
    configPath?: string;
    fetchImpl: typeof fetch;
    retryDelayMs?: number;
    sleepImpl?: (delayMs: number) => Promise<void>;
    requestTimeoutMs?: number;
  }) => Promise<{
    profile: string;
    domain: string;
    healthUrl: string;
    aiUrl: string;
    healthAttempts: number;
    aiAttempts: number;
  }>;
  runReleaseSmokeChecks: (options: {
    configPath?: string;
    fetchImpl: typeof fetch;
    retryDelayMs?: number;
    sleepImpl?: (delayMs: number) => Promise<void>;
    requestTimeoutMs?: number;
  }) => Promise<{
    profiles: string[];
    passed: Array<{
      profile: string;
      domain: string;
      healthUrl: string;
      aiUrl: string;
      healthAttempts: number;
      aiAttempts: number;
    }>;
    failed: Array<{
      profile: string;
      domain: string | null;
      healthAttempts: number;
      aiAttempts: number;
      error: Error;
    }>;
  }>;
  summarizeReleaseSmokeResult: (result: {
    profiles: string[];
    passed: Array<{
      profile: string;
      domain: string;
      healthUrl: string;
      aiUrl: string;
      healthAttempts?: number;
      aiAttempts?: number;
    }>;
    failed: Array<{
      profile: string;
      domain: string | null;
      healthAttempts?: number;
      aiAttempts?: number;
      error: Error;
    }>;
  }) => {
    status: string;
    profiles: Array<{
      profile: string;
      domain: string | null;
      status: string;
      healthUrl: string | null;
      aiUrl: string | null;
      error: string | null;
    }>;
  };
  writeReleaseReport: (
    reportPath: string,
    report: Record<string, unknown>,
    options?: {
      writeFileSyncImpl?: (
        filePath: string,
        data: string,
        encoding: "utf8",
      ) => void;
    },
  ) => string;
};

const { validateGeneratedAndroidIdentity } = require("../scripts/build.js") as {
  validateGeneratedAndroidIdentity: (options?: {
    appConfig?: unknown;
    easConfig?: unknown;
    generatedManifest?: unknown;
  }) => {
    androidPackage: string;
    generatedAndroidPackage: string;
    previewDistribution: string;
    previewBuildType: string;
  };
};

const {
  normalizeBuildMetadata,
  computeFileSha256,
  attachInstallerChecksum,
  parseArgs,
  validatePlatformIdentity,
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
      installerSha256?: string | null;
  };
  computeFileSha256: (filePath: string) => Promise<string>;
  attachInstallerChecksum: (buildMetadata: {
    installerPath: string | null;
    [key: string]: unknown;
  }) => Promise<
    Record<string, unknown> & {
      installerSha256: string | null;
    }
  >;
  parseArgs: (args: string[]) => {
    platform: string;
    profile: string;
    checkOnly: boolean;
    easArgs: string[];
  };
  validatePlatformIdentity: (
    platform: string,
    profile?: string,
    options?: {
      appConfig?: unknown;
      easConfig?: unknown;
      generatedManifest?: unknown;
    },
  ) => { appId?: string; androidPackage?: string; productionBuildType?: string };
  verifyAllProfileConnectivity: (options: {
    profile: string;
    runAllProfiles: () => Promise<{
      profiles: string[];
      passed: Array<{ profile: string; domain: string; healthUrl: string; aiUrl: string }>;
      failed: Array<{ profile: string; domain?: string | null; error: Error }>;
    }>;
  }) => Promise<{
    selected: { profile: string };
    allProfiles: {
      status: string;
      profiles: Array<{
        profile: string;
        domain: string | null;
        status: string;
        healthUrl: string | null;
        aiUrl: string | null;
        healthAttempts: number;
        aiAttempts: number;
        recovered: boolean;
        error: string | null;
      }>;
    };
    legacyAllProfiles: {
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

const nativeHandoffPath = path.resolve(
  __dirname,
  "../scripts/native-handoff.js",
);
const checkReleasePath = path.resolve(__dirname, "../scripts/check-release.js");
const buildScriptPath = path.resolve(__dirname, "../scripts/build.js");

describe("bulletin repair accessibility", () => {
  it("announces the repaired state with a concise polite text cue", () => {
    expect(getBulletinRepairAccessibility(true)).toEqual({
      accessible: true,
      accessibilityRole: "text",
      accessibilityLabel: BULLETIN_REPAIR_ACCESSIBILITY_LABEL,
      accessibilityLiveRegion: "polite",
    });
  });

  it("omits the cue from accessibility output for a fully remote bulletin", () => {
    expect(getBulletinRepairAccessibility(false)).toBeNull();
  });

  it("uses one-shot VoiceOver announcements without duplicating TalkBack cues", () => {
    expect(shouldAnnounceBulletinRepair("ios", false, true)).toBe(true);
    expect(shouldAnnounceBulletinRepair("ios", true, true)).toBe(false);
    expect(shouldAnnounceBulletinRepair("ios", false, false)).toBe(false);
    expect(shouldAnnounceBulletinRepair("android", false, true)).toBe(false);
  });
});

describe("bulletin source localization", () => {
  it.each(SUPPORTED_LOCALES)(
    "provides remote and repaired messages for %s",
    (locale) => {
      expect(BULLETIN_SOURCE_MESSAGES[locale].remote).toBeTruthy();
      expect(BULLETIN_SOURCE_MESSAGES[locale].repaired).toBeTruthy();
      expect(getBulletinSourceMessage(false, locale)).toBe(
        BULLETIN_SOURCE_MESSAGES[locale].remote,
      );
      expect(getBulletinSourceMessage(true, locale)).toBe(
        BULLETIN_SOURCE_MESSAGES[locale].repaired,
      );
    },
  );

  it("falls back to the default language for unknown or incomplete locales", () => {
    expect(resolveLocale("pt-BR")).toBe(DEFAULT_LOCALE);
    expect(
      getBulletinSourceMessage(true, "es", {
        es: {},
      }),
    ).toBe(BULLETIN_SOURCE_MESSAGES.en.repaired);
  });
});

function createNativeHandoffSubprocessFixture() {
  const fixtureDirectory = mkdtempSync(
    path.join(tmpdir(), "academy-native-handoff-"),
  );
  const easRecordPath = path.join(fixtureDirectory, "eas-invocation.json");
  const reportPath = path.join(fixtureDirectory, "handoff-report.json");
  const easCommandPath = path.join(fixtureDirectory, "record-eas.js");
  const preloadPath = path.join(fixtureDirectory, "stub-preflight.cjs");

  writeFileSync(
    easCommandPath,
    `#!/usr/bin/env node
const fs = require("node:fs");
const platform = process.env.RELEASE_PLATFORM || "android";
const profile = process.env.RELEASE_PROFILE || "preview";
const artifactExtension =
  platform === "ios" ? "ipa" : profile === "production" ? "aab" : "apk";
fs.writeFileSync(
  process.env.EAS_RECORD_PATH,
  JSON.stringify({ args: process.argv.slice(2) }),
);
process.stdout.write(JSON.stringify([{
  id: "stub-build",
  status: "finished",
  profile,
  appVersion: "1.0.0",
  appIdentifier: "com.theacademy.mobile",
  completedAt: "2026-09-16T12:00:00.000Z",
  buildDetailsPageUrl: "https://expo.dev/builds/stub-build",
  artifactUrl: "https://expo.dev/builds/stub-build." + artifactExtension
}]));
const exitCode = Number(process.env.EAS_EXIT_CODE || "0");
if (exitCode !== 0) {
  process.exit(exitCode);
}
`,
    "utf8",
  );
  chmodSync(easCommandPath, 0o755);

  writeFileSync(
    preloadPath,
    `const checkReleasePath = ${JSON.stringify(checkReleasePath)};
const checkRelease = require(checkReleasePath);
const failed = process.env.RELEASE_PREFLIGHT_RESULT === "failed";
const result = failed
  ? {
      profiles: ["preview", "production"],
      passed: [{
        profile: "preview",
        domain: "preview.example.com",
        healthUrl: "https://preview.example.com/api/healthz",
        aiUrl: "https://preview.example.com/api/ai/describe"
      }],
      failed: [{
        profile: "production",
        domain: "production.example.com",
         healthAttempts: 3,
         aiAttempts: 0,
        error: new Error("HTTP 503")
      }]
    }
  : {
      profiles: ["preview", "production"],
      passed: [
        {
          profile: "preview",
          domain: "preview.example.com",
          healthUrl: "https://preview.example.com/api/healthz",
          aiUrl: "https://preview.example.com/api/ai/describe"
        },
        {
          profile: "production",
          domain: "production.example.com",
          healthUrl: "https://production.example.com/api/healthz",
          aiUrl: "https://production.example.com/api/ai/describe"
        }
      ],
      failed: []
    };
require.cache[require.resolve(checkReleasePath)].exports = {
  ...checkRelease,
  runReleaseSmokeChecks: async () => result
};
`,
    "utf8",
  );

  return {
    fixtureDirectory,
    easRecordPath,
    easCommandPath,
    reportPath,
    preloadPath,
  };
}

function runNativeHandoffSubprocess(
  fixture: ReturnType<typeof createNativeHandoffSubprocessFixture>,
  preflightResult: "failed" | "passed",
  easExitCode = "0",
  platform: "android" | "ios" = "android",
  profile = "preview",
) {
  return spawnSync(
    process.execPath,
    [
      "--require",
      fixture.preloadPath,
      nativeHandoffPath,
       "--platform",
       platform,
      "--profile",
       profile,
    ],
    {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8",
      env: {
        ...process.env,
        EAS_CLI_COMMAND: fixture.easCommandPath,
        EAS_RECORD_PATH: fixture.easRecordPath,
        RELEASE_PREFLIGHT_RESULT: preflightResult,
        EAS_EXIT_CODE: easExitCode,
        RELEASE_PLATFORM: platform,
        RELEASE_PROFILE: profile,
        RELEASE_REPORT_PATH: fixture.reportPath,
      },
    },
  );
}

function runStaticBuildIdentitySubprocess() {
  const fixtureDirectory = mkdtempSync(
    path.join(tmpdir(), "academy-static-build-identity-"),
  );
  const fixtureScriptPath = path.join(fixtureDirectory, "run-build-fixture.cjs");
  const manifestPath = path.join(fixtureDirectory, "android-manifest.json");

  writeFileSync(
    fixtureScriptPath,
    `const fs = require("node:fs");
 const { main, validateGeneratedAndroidIdentity } = require(${JSON.stringify(buildScriptPath)});
const manifestPath = ${JSON.stringify(manifestPath)};
const events = [];
const appConfig = {
  expo: { android: { package: "com.theacademy.mobile" } }
};
const easConfig = {
  build: {
    preview: {
      distribution: "internal",
      android: { buildType: "apk" }
    }
  }
};

 main({
   setupSignalHandlersImpl: () => {},
  timestamp: "fixture-timestamp",
  getDeploymentDomainImpl: () => "fixture.example.com",
  getExpoPublicReplIdImpl: () => undefined,
  prepareDirectoriesImpl: () => events.push("prepare"),
  clearMetroCacheImpl: () => events.push("clear-cache"),
  startMetroImpl: async () => events.push("start-metro"),
  downloadBundlesAndManifestsImpl: async () => {
    events.push("download");
    return { ios: {}, android: {} };
  },
  extractAssetsImpl: () => {
    events.push("extract-assets");
    return [];
  },
  downloadAssetsImpl: async () => {
    events.push("download-assets");
    return 0;
  },
  updateBundleUrlsImpl: () => events.push("update-bundles"),
  updateManifestsImpl: () => {
    events.push("write-manifest");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        extra: { expoClient: { android: { package: "com.theacademy.drifted" } } }
      }),
    );
  },
  validateGeneratedAndroidIdentityImpl: () => {
    events.push("validate-identity");
    const generatedManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return validateGeneratedAndroidIdentity({
      appConfig,
      easConfig,
      generatedManifest,
    });
  },
 }).then(() => {
  console.log("__RESULT__" + JSON.stringify({
    events,
    manifest: JSON.parse(fs.readFileSync(manifestPath, "utf8")),
  }));
}).catch((error) => {
  console.log("__RESULT__" + JSON.stringify({
    events,
    manifest: JSON.parse(fs.readFileSync(manifestPath, "utf8")),
  }));
   console.error("Build failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
`,
    "utf8",
  );

  const result = spawnSync(process.execPath, [fixtureScriptPath], {
    cwd: path.resolve(__dirname, ".."),
    encoding: "utf8",
  });

  return { fixtureDirectory, result };
}

function assertStableReleaseReport(
  report: Record<string, unknown>,
  expectedStatus: "passed" | "failed",
  expectedProfiles: string[],
) {
  expect(report.schemaVersion).toBe(RELEASE_REPORT_SCHEMA_VERSION);
  expect(report.status).toBe(expectedStatus);
  const summary = report.summary as {
    status: string;
    profiles: Array<{
      profile: string;
      domain: string | null;
      status: string;
      error: string | null;
    }>;
  };
  expect(summary.status).toBe(expectedStatus);
  expect(summary.profiles.map(({ profile }) => profile)).toEqual(
    expectedProfiles,
  );

  for (const entry of summary.profiles) {
    expect(typeof entry.profile).toBe("string");
    expect("domain" in entry).toBe(true);
    expect(entry.domain === null || typeof entry.domain === "string").toBe(true);
    expect(["passed", "failed"]).toContain(entry.status);
    expect(entry.error === null || typeof entry.error === "string").toBe(true);
  }
}

function archiveReleaseSummary(summary: {
  status: string;
  profiles: unknown[];
}) {
  const reportDirectory = mkdtempSync(
    path.join(tmpdir(), "academy-release-report-"),
  );
  const reportPath = path.join(reportDirectory, "release-smoke.json");
  try {
    writeReleaseReport(reportPath, {
      command: "check-release --all",
      status: summary.status,
      summary,
    });
    return JSON.parse(readFileSync(reportPath, "utf8")) as Record<
      string,
      unknown
    >;
  } finally {
    rmSync(reportDirectory, { recursive: true, force: true });
  }
}

describe("release report archival", () => {
  it("preserves the existing report when a write is interrupted", () => {
    const reportDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-release-report-interrupted-"),
    );
    const reportPath = path.join(reportDirectory, "release.json");
    const existingReport = '{"schemaVersion":1,"status":"passed"}\n';
    writeFileSync(reportPath, existingReport, "utf8");
    const interruptedWrite = (filePath: string, data: string) => {
      const descriptor = fs.openSync(filePath, "w");
      fs.writeSync(descriptor, data.slice(0, 20));
      fs.closeSync(descriptor);
      throw new Error("simulated interruption");
    };

    try {
      expect(() =>
        writeReleaseReport(reportPath, {
          command: "check-release --all",
          status: "failed",
        }, { writeFileSyncImpl: interruptedWrite }),
      ).toThrow(/Could not archive report/);
      expect(readFileSync(reportPath, "utf8")).toBe(existingReport);
      expect(readdirSync(reportDirectory)).toEqual(["release.json"]);
    } finally {
      rmSync(reportDirectory, { recursive: true, force: true });
    }
  });

  it("keeps the original check failure visible when the failure report cannot be archived", () => {
    const reportDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-release-report-unwritable-"),
    );
    try {
      const result = spawnSync(
        process.execPath,
        [
          checkReleasePath,
          "--profile",
          "missing-profile",
          "--report",
          reportDirectory,
        ],
        {
          cwd: path.resolve(__dirname, ".."),
          encoding: "utf8",
        },
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(
        /Unsupported Android release profile "missing-profile"/,
      );
      expect(result.stderr).toMatch(
        /Could not archive failure report: \[release-report\] Could not archive report/,
      );
      expect(readdirSync(reportDirectory)).toEqual([]);
    } finally {
      rmSync(reportDirectory, { recursive: true, force: true });
    }
  });
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

  it("records a SHA-256 for a local installer and leaves cloud-only handoffs valid", async () => {
    const artifactDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-installer-"),
    );
    const artifactPath = path.join(artifactDirectory, "academy-preview.apk");
    writeFileSync(artifactPath, "test installer contents\n", "utf8");

    try {
      const expectedChecksum = await computeFileSha256(artifactPath);
      const localMetadata = await attachInstallerChecksum({
        installerUrl: null,
        installerPath: artifactPath,
      });
      const cloudMetadata = await attachInstallerChecksum({
        installerUrl: "https://example.invalid/academy-preview.apk",
        installerPath: null,
      });

      expect(localMetadata.installerSha256).toBe(expectedChecksum);
      expect(cloudMetadata.installerSha256).toBeNull();
    } finally {
      rmSync(artifactDirectory, { recursive: true, force: true });
    }
  });

  it("normalizes a production AAB while allowing EAS auto-increment metadata", () => {
    const output = {
      stdout: JSON.stringify([
        {
          id: "production-build-123",
          status: "finished",
          profile: "production",
          appVersion: "1.0.0",
          androidVersionCode: 42,
          appIdentifier: "com.theacademy.mobile",
          completedAt: "2026-09-15T15:00:00.000Z",
          buildDetailsPageUrl: "https://expo.dev/builds/production-build-123",
          artifacts: {
            buildUrl: "https://example.invalid/academy-production.aab",
          },
        },
      ]),
      stderr: "",
    };

    expect(
      normalizeBuildMetadata(output, {
        platform: "android",
        profile: "production",
        appConfig,
        capturedAt: "2026-09-15T15:01:00.000Z",
      }),
    ).toMatchObject({
      installerUrl: "https://example.invalid/academy-production.aab",
      version: "1.0.0",
      package: "com.theacademy.mobile",
      profile: "production",
    });
  });

  it("rejects an APK when a production handoff expects an AAB", () => {
    expect(() =>
      normalizeBuildMetadata(
        {
          stdout: JSON.stringify([
            {
              id: "production-apk",
              status: "finished",
              profile: "production",
              appVersion: "1.0.0",
              appIdentifier: "com.theacademy.mobile",
              artifacts: {
                buildUrl: "https://example.invalid/academy-production.apk",
              },
            },
          ]),
          stderr: "",
        },
        {
          platform: "android",
          profile: "production",
          appConfig,
          capturedAt: "2026-09-15T15:01:00.000Z",
        },
      ),
    ).toThrow(/expected production Android App Bundle \(\.aab\); found .*\.apk/);
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

describe("native handoff platform selection", () => {
  it("supports the guarded iOS preview and production arguments", () => {
    expect(
      parseArgs([
        "--platform",
        "ios",
        "--profile",
        "production",
        "--check-only",
      ]),
    ).toEqual({
      platform: "ios",
      profile: "production",
      checkOnly: true,
      easArgs: [],
    });
    expect(validatePlatformIdentity("ios")).toEqual({
      appId: "com.theacademy.mobile",
    });
  });

  it("selects the production Android identity validator for production handoffs", () => {
    expect(
      validatePlatformIdentity("android", "production", {
        appConfig: {
          expo: { android: { package: "com.theacademy.mobile" } },
        },
        easConfig: {
          build: {
            production: { android: { buildType: "app-bundle" } },
          },
        },
        generatedManifest: {
          extra: { expoClient: { android: { package: "com.theacademy.mobile" } } },
        },
      }),
    ).toEqual({
      androidPackage: "com.theacademy.mobile",
      generatedAndroidPackage: "com.theacademy.mobile",
      productionBuildType: "app-bundle",
    });
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
        production: {
          android: { buildType: "app-bundle" },
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
      androidVersionCode?: number;
      installerSha256?: string | null;
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

  const validIosHandoffConfig = () => ({
    appConfig: {
      expo: {
        version: "1.0.0",
        ios: { bundleIdentifier: "com.theacademy.mobile" },
      },
    },
    easConfig: {
      build: {
        preview: {
          distribution: "internal",
        },
        production: {},
      },
    },
  });

  const validIosHandoffReport = () => ({
    status: "completed",
    platform: "ios",
    profile: "preview",
    build: {
      installerUrl: "https://example.invalid/academy-preview.ipa?sig=redacted",
      installerPath: null,
      version: "1.0.0",
      package: "com.theacademy.mobile",
      profile: "preview",
      timestamp: "2026-09-15T15:00:00.000Z",
      buildId: "ios-build-123",
      buildDetailsPageUrl: "https://expo.dev/builds/ios-build-123",
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

  it("accepts a complete iOS preview IPA handoff without contacting a device", () => {
    expect(
      validateNativeHandoff({
        ...validIosHandoffConfig(),
        platform: "ios",
        handoffReport: validIosHandoffReport(),
      }),
    ).toMatchObject({
      status: "passed",
      platform: "ios",
      profile: "preview",
      distribution: "internal",
      buildType: "ipa",
      version: "1.0.0",
      iosBundleIdentifier: "com.theacademy.mobile",
      installerUrl: "https://example.invalid/academy-preview.ipa?sig=redacted",
      installerPath: null,
    });
  });

  it("rejects a non-IPA reference in an iOS handoff", () => {
    const report = validIosHandoffReport();
    report.build.installerUrl =
      "https://example.invalid/academy-preview.apk?sig=redacted";

    expect(() =>
      validateNativeHandoff({
        ...validIosHandoffConfig(),
        platform: "ios",
        handoffReport: report,
      }),
    ).toThrow(
      /installer reference must be a preview internal iOS IPA \(\.ipa\); found .*\.apk/,
    );
  });

  it("reports iOS status, platform, profile, version, and bundle-ID drift", () => {
    const report = validIosHandoffReport();
    report.status = "starting";
    report.platform = "android";
    report.profile = "production";
    report.build.profile = "production";
    report.build.version = "0.9.0";
    report.build.package = "com.theacademy.old";

    expect(() =>
      validateNativeHandoff({
        ...validIosHandoffConfig(),
        platform: "ios",
        handoffReport: report,
      }),
    ).toThrow(
      /handoff status must be "completed".*handoff platform must be "ios".*handoff profile must be "preview".*build version "0\.9\.0" does not match app\.json "1\.0\.0".*build bundle identifier "com\.theacademy\.old" does not match app\.json "com\.theacademy\.mobile".*build profile must be "preview"/s,
    );
  });

  it("verifies a downloaded installer against the recorded SHA-256", () => {
    const artifactDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-checksum-"),
    );
    const artifactPath = path.join(artifactDirectory, "academy-preview.apk");
    writeFileSync(artifactPath, "downloaded installer contents\n", "utf8");
    const report = validHandoffReport();
    report.build.installerSha256 = computeReleaseFileSha256(artifactPath);

    try {
      expect(
        verifyInstallerChecksum({
          artifactPath,
          handoffReport: report,
        }),
      ).toEqual({
        status: "passed",
        artifactPath,
        installerSha256: report.build.installerSha256,
      });

      writeFileSync(artifactPath, "tampered installer contents\n", "utf8");
      expect(() =>
        verifyInstallerChecksum({
          artifactPath,
          handoffReport: report,
        }),
      ).toThrow(/SHA-256 mismatch/);
    } finally {
      rmSync(artifactDirectory, { recursive: true, force: true });
    }
  });

  it("accepts a complete production AAB handoff with auto-increment metadata", () => {
    const report = validHandoffReport();
    report.profile = "production";
    report.build.profile = "production";
    report.build.installerUrl =
      "https://example.invalid/academy-production.aab?sig=redacted";
    report.build.androidVersionCode = 42;

    expect(
      validateNativeHandoff({
        ...validHandoffConfig(),
        profile: "production",
        handoffReport: report,
      }),
    ).toEqual({
      status: "passed",
      platform: "android",
      profile: "production",
      distribution: "store",
      buildType: "app-bundle",
      version: "1.0.0",
      androidPackage: "com.theacademy.mobile",
      installerUrl:
        "https://example.invalid/academy-production.aab?sig=redacted",
      installerPath: null,
      timestamp: "2026-09-15T15:00:00.000Z",
      buildId: "build-123",
    });
  });

  it("rejects an APK reference in a production handoff", () => {
    const report = validHandoffReport();
    report.profile = "production";
    report.build.profile = "production";
    report.build.installerUrl =
      "https://example.invalid/academy-production.apk?sig=redacted";

    expect(() =>
      validateNativeHandoff({
        ...validHandoffConfig(),
        profile: "production",
        handoffReport: report,
      }),
    ).toThrow(
      /installer reference must be a production Android App Bundle \(\.aab\) for store distribution; found .*\.apk/,
    );
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
        production: {
          android: { buildType: "app-bundle" },
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

  it("matches Android identity across app, EAS production, and generated metadata", () => {
    expect(validateAndroidProductionIdentity(validIdentity())).toEqual({
      androidPackage: "com.theacademy.mobile",
      generatedAndroidPackage: "com.theacademy.mobile",
      productionBuildType: "app-bundle",
    });
  });

  it("reports production build-type drift before an app-bundle handoff", () => {
    expect(() =>
      validateAndroidProductionIdentity({
        ...validIdentity(),
        easConfig: {
          build: {
            production: {
              android: { buildType: "apk" },
            },
          },
        },
      }),
    ).toThrow(
      /production Android buildType must be "app-bundle"; found apk/,
    );
  });

  it("reports production package drift before an app-bundle handoff", () => {
    expect(() =>
      validateAndroidProductionIdentity({
        ...validIdentity(),
        appConfig: {
          expo: { android: { package: "com.theacademy.other" } },
        },
      }),
    ).toThrow(
      /Android package drift: expected com\.theacademy\.mobile, found com\.theacademy\.other/,
    );
  });

  it("runs the same Android identity validator used by the static build", () => {
    expect(validateGeneratedAndroidIdentity(validIdentity())).toEqual({
      androidPackage: "com.theacademy.mobile",
      generatedAndroidPackage: "com.theacademy.mobile",
      previewDistribution: "internal",
      previewBuildType: "apk",
    });
  });

  it("fails the static build identity step when regenerated metadata drifts", () => {
    expect(() =>
      validateGeneratedAndroidIdentity({
        ...validIdentity(),
        generatedManifest: {
          extra: { expoClient: { android: { package: "com.theacademy.other" } } },
        },
      }),
    ).toThrow(
      /Generated Android package drift: app\.json declares com\.theacademy\.mobile, but generated Android metadata declares com\.theacademy\.other/,
    );
  });

  it("writes static metadata before the subprocess identity guard runs", () => {
    const { fixtureDirectory, result } = runStaticBuildIdentitySubprocess();
    try {
      expect(result.status).toBe(1);
      expect(result.stdout).not.toContain("Build complete!");
      expect(result.stderr).toMatch(
        /Build failed: \[release-identity\] Generated Android package drift: app\.json declares com\.theacademy\.mobile, but generated Android metadata declares com\.theacademy\.drifted/,
      );

      const marker = result.stdout.match(/__RESULT__(\{.*\})\s*$/s);
      expect(marker).not.toBeNull();
      const details = JSON.parse(marker?.[1] ?? "") as {
        events: string[];
        manifest: {
          extra: { expoClient: { android: { package: string } } };
        };
      };
      expect(details.events).toEqual([
        "prepare",
        "clear-cache",
        "start-metro",
        "download",
        "extract-assets",
        "download-assets",
        "write-manifest",
        "validate-identity",
      ]);
      expect(details.manifest.extra.expoClient.android.package).toBe(
        "com.theacademy.drifted",
      );
    } finally {
      rmSync(fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("keeps the standalone check-release identity report workflow covered", () => {
    const reportDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-identity-report-"),
    );
    const reportPath = path.join(reportDirectory, "identity.json");
    try {
      const result = spawnSync(
        "pnpm",
        ["run", "check-release:identity", "--", "--report", reportPath],
        {
          cwd: path.resolve(__dirname, ".."),
          encoding: "utf8",
        },
      );

      expect(result.status).toBe(0);
      const report = JSON.parse(
        readFileSync(reportPath, "utf8"),
      ) as {
        command: string;
        status: string;
        androidIdentity: {
          androidPackage: string;
          generatedAndroidPackage: string;
        };
      };
      expect(report).toMatchObject({
        command: "check-release --identity-only",
        status: "passed",
        androidIdentity: {
          androidPackage: "com.theacademy.mobile",
          generatedAndroidPackage: "com.theacademy.mobile",
        },
      });
    } finally {
      rmSync(reportDirectory, { recursive: true, force: true });
    }
  });

  it("reads the preview hostname from eas.json", () => {
    const config = readReleaseConfig();
    expect(getReleaseDomain(config, "preview")).toBe("theeacademy.replit.app");
  });

  it("requires the published Academy hostname for preview and production", () => {
    const config = readReleaseConfig();

    expect(() => validateRequiredReleaseProfileHosts(config)).not.toThrow();
    expect(validateReleaseProfileHost(config, "preview")).toBe(
      "theeacademy.replit.app",
    );
    expect(validateReleaseProfileHost(config, "production")).toBe(
      "theeacademy.replit.app",
    );

    for (const profile of ["preview", "production"]) {
      const driftedConfig = JSON.parse(JSON.stringify(config)) as {
        build: Record<string, { env: Record<string, string> }>;
      };
      driftedConfig.build[profile].env.EXPO_PUBLIC_DOMAIN =
        "https://wrong.example.com";

      expect(() => validateRequiredReleaseProfileHosts(driftedConfig)).toThrow(
        new RegExp(
          `Profile "${profile}" must target the published Academy hostname "theeacademy\\.replit\\.app" over HTTPS; found "wrong\\.example\\.com"`,
        ),
      );
    }

    const missingHostConfig = JSON.parse(JSON.stringify(config)) as {
      build: Record<string, { env: Record<string, string> }>;
    };
    delete missingHostConfig.build.production.env.EXPO_PUBLIC_DOMAIN;
    expect(() => validateRequiredReleaseProfileHosts(missingHostConfig)).toThrow(
      /Profile "production" must define build\.production\.env\.EXPO_PUBLIC_DOMAIN/,
    );
  });

  it("blocks smoke requests when a required profile host drifts", async () => {
    const configDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-release-host-"),
    );
    const configPath = path.join(configDirectory, "eas.json");
    const fetchImpl = vi.fn() as unknown as typeof fetch;

    try {
      writeFileSync(
        configPath,
        JSON.stringify({
          build: {
            preview: {
              distribution: "internal",
              env: { EXPO_PUBLIC_DOMAIN: "wrong.example.com" },
            },
            production: {
              env: { EXPO_PUBLIC_DOMAIN: "TheeAcademy.replit.app" },
            },
          },
        }),
        "utf8",
      );

      await expect(
        runReleaseSmokeChecks({ configPath, fetchImpl }),
      ).rejects.toThrow(
        /Profile "preview" must target the published Academy hostname/,
      );
      expect(fetchImpl).not.toHaveBeenCalled();
    } finally {
      rmSync(configDirectory, { recursive: true, force: true });
    }
  });

  it("keeps iOS and Android release commands on the shared handoff preflight", () => {
    const scripts = JSON.parse(
      readFileSync(path.resolve(__dirname, "../package.json"), "utf8"),
    ).scripts as Record<string, string>;

    expect(scripts["release:preview"]).toContain("RELEASE_PLATFORM=android");
    expect(scripts["release:production"]).toContain("RELEASE_PLATFORM=android");
    expect(scripts["release:preview:ios"]).toContain("RELEASE_PLATFORM=ios");
    expect(scripts["release:production:ios"]).toContain("RELEASE_PLATFORM=ios");
    expect(scripts["release:preview:ios"]).toContain("native-handoff");
    expect(scripts["release:production:ios"]).toContain("native-handoff");
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
      .mockResolvedValueOnce(new Response("upstream unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response("upstream unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response("upstream unavailable", { status: 503 })) as unknown as typeof fetch;

    await expect(
      runReleaseSmokeCheck({
        fetchImpl,
        retryDelayMs: 0,
        sleepImpl: async () => {},
      }),
    ).rejects.toMatchObject({
      message: expect.stringMatching(
        /AI enrichment check failed.*https:\/\/theeacademy\.replit\.app\/api\/ai\/describe.*HTTP 503/i,
      ),
      healthAttempts: 1,
      aiAttempts: 3,
    });
  });

  it("retries a transient AI 5xx response and succeeds", async () => {
    const sleepImpl = vi.fn(async () => {});
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(okJson({ status: "ok" }))
      .mockResolvedValueOnce(new Response("upstream unavailable", { status: 503 }))
      .mockResolvedValueOnce(okJson({ description: "Recovered description." })) as unknown as typeof fetch;

    await expect(
      runReleaseSmokeCheck({
        fetchImpl,
        retryDelayMs: 0,
        sleepImpl,
      }),
    ).resolves.toMatchObject({
      profile: "preview",
      healthAttempts: 1,
      aiAttempts: 2,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleepImpl).toHaveBeenCalledTimes(1);
  });

  it("exhausts retries for transient network failures and preserves the error", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValue(new Error("socket reset")) as unknown as typeof fetch;
    const sleepImpl = vi.fn(async () => {});

    await expect(
      runReleaseSmokeCheck({
        fetchImpl,
        retryDelayMs: 0,
        sleepImpl,
      }),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/Health check could not reach .*socket reset/),
      healthAttempts: 3,
      aiAttempts: 0,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleepImpl).toHaveBeenCalledTimes(2);
  });

  it("retries a timed-out local health request and continues after recovery", async () => {
    let healthRequests = 0;
    const server = createServer((request, response) => {
      if (request.url === "/api/healthz") {
        healthRequests += 1;
        if (healthRequests === 1) {
          setTimeout(() => {
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ status: "ok" }));
          }, 80);
          return;
        }
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ status: "ok" }));
        return;
      }

      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ description: "Recovered locally." }));
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Local timeout fixture did not expose a port.");
      }
      const fetchImpl = ((url: string, init?: RequestInit) =>
        fetch(
          `http://127.0.0.1:${address.port}${new URL(url).pathname}`,
          init,
        )) as typeof fetch;

      await expect(
        runReleaseSmokeCheck({
          fetchImpl,
          requestTimeoutMs: 15,
          retryDelayMs: 0,
          sleepImpl: async () => {},
        }),
      ).resolves.toMatchObject({
        profile: "preview",
        healthAttempts: 2,
        aiAttempts: 1,
      });
      expect(healthRequests).toBe(2);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("bounds persistent local timeouts and preserves the final health error", async () => {
    let healthRequests = 0;
    const server = createServer((request, response) => {
      if (request.url === "/api/healthz") {
        healthRequests += 1;
        setTimeout(() => {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ status: "ok" }));
        }, 60);
        return;
      }

      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ description: "Should not be reached." }));
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Local timeout fixture did not expose a port.");
      }
      const fetchImpl = ((url: string, init?: RequestInit) =>
        fetch(
          `http://127.0.0.1:${address.port}${new URL(url).pathname}`,
          init,
        )) as typeof fetch;

      await expect(
        runReleaseSmokeCheck({
          fetchImpl,
          requestTimeoutMs: 15,
          retryDelayMs: 0,
          sleepImpl: async () => {},
        }),
      ).rejects.toMatchObject({
        message: expect.stringMatching(
          /Health check could not reach https:\/\/theeacademy\.replit\.app\/api\/healthz/,
        ),
        healthAttempts: 3,
        aiAttempts: 0,
      });
      expect(healthRequests).toBe(3);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
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
      .mockResolvedValueOnce(new Response("preview unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response("preview unavailable", { status: 503 }))
      .mockResolvedValueOnce(okJson({ status: "ok" }))
      .mockResolvedValueOnce(okJson({ description: "Production description." })) as unknown as typeof fetch;

    const result = await runReleaseSmokeChecks({
      fetchImpl,
      retryDelayMs: 0,
      sleepImpl: async () => {},
    });

    expect(result.profiles).toEqual(["preview", "production"]);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toMatchObject({ profile: "preview" });
    expect(result.failed[0].error.message).toMatch(/HTTP 503/);
    expect(result.failed[0].domain).toBe("theeacademy.replit.app");
    expect(result.failed[0]).toMatchObject({
      healthAttempts: 3,
      aiAttempts: 0,
    });
    expect(result.passed).toMatchObject([
      {
        profile: "production",
        domain: "theeacademy.replit.app",
        healthAttempts: 1,
        aiAttempts: 1,
      },
    ]);
  });

  it("summarizes every profile with stable machine-readable results", () => {
    expect(
      summarizeReleaseSmokeResult({
        profiles: ["preview", "production"],
        passed: [
          {
            profile: "preview",
            domain: "preview.example.com",
            healthUrl: "https://preview.example.com/api/healthz",
            aiUrl: "https://preview.example.com/api/ai/describe",
            healthAttempts: 1,
            aiAttempts: 2,
          },
        ],
        failed: [
          {
            profile: "production",
            domain: "production.example.com",
            healthAttempts: 3,
            aiAttempts: 0,
            error: new Error("HTTP 503"),
          },
        ],
      }),
    ).toEqual({
      status: "failed",
      profiles: [
        {
          profile: "preview",
          domain: "preview.example.com",
          status: "passed",
          healthUrl: "https://preview.example.com/api/healthz",
          aiUrl: "https://preview.example.com/api/ai/describe",
          healthAttempts: 1,
          aiAttempts: 2,
          recovered: true,
          error: null,
        },
        {
          profile: "production",
          domain: "production.example.com",
          status: "failed",
          healthUrl: null,
          aiUrl: null,
          healthAttempts: 3,
          aiAttempts: 0,
          recovered: false,
          error: "HTTP 503",
        },
      ],
    });
  });

  it("archives an all-pass report with the stable profile contract", () => {
    const report = archiveReleaseSummary(
      summarizeReleaseSmokeResult({
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
      }),
    );

    assertStableReleaseReport(report, "passed", ["preview", "production"]);
    expect(
      (report.summary as { profiles: Array<{ error: string | null }> }).profiles
        .map(({ error }) => error),
    ).toEqual([null, null]);
  });

  it("publishes the current schema version for archived reports", () => {
    const report = archiveReleaseSummary({
      status: "passed",
      profiles: [],
    });

    expect(RELEASE_REPORT_SCHEMA_VERSION).toBe(1);
    expect(report.schemaVersion).toBe(RELEASE_REPORT_SCHEMA_VERSION);
  });

  it("archives mixed results without losing the failed profile details", () => {
    const report = archiveReleaseSummary(
      summarizeReleaseSmokeResult({
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
          {
            profile: "production",
            domain: "production.example.com",
            error: new Error("HTTP 503"),
          },
        ],
      }),
    );

    assertStableReleaseReport(report, "failed", ["preview", "production"]);
    expect(report.summary).toMatchObject({
      profiles: [
        { profile: "preview", status: "passed", error: null },
        {
          profile: "production",
          domain: "production.example.com",
          status: "failed",
          error: "HTTP 503",
        },
      ],
    });
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
        {
          profile: "production",
          domain: "production.example.com",
          error: new Error("HTTP 503"),
        },
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
        status: "passed",
        profiles: [
          {
            profile: "preview",
            domain: "preview.example.com",
            status: "passed",
            healthUrl: "https://preview.example.com/api/healthz",
            aiUrl: "https://preview.example.com/api/ai/describe",
            healthAttempts: 1,
            aiAttempts: 1,
            recovered: false,
            error: null,
          },
          {
            profile: "production",
            domain: "production.example.com",
            status: "passed",
            healthUrl: "https://production.example.com/api/healthz",
            aiUrl: "https://production.example.com/api/ai/describe",
            healthAttempts: 1,
            aiAttempts: 1,
            recovered: false,
            error: null,
          },
        ],
      },
      legacyAllProfiles: {
        profiles: ["preview", "production"],
        failed: [],
      },
    });
  });

  it("does not invoke EAS when a subprocess preflight fails", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    try {
      const result = runNativeHandoffSubprocess(fixture, "failed");

      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(
        /Release connectivity failed before EAS build: production: HTTP 503/,
      );
      expect(existsSync(fixture.easRecordPath)).toBe(false);
      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        status: string;
        summary: {
          status: string;
          profiles: Array<{
            profile: string;
            domain: string | null;
            status: string;
            healthUrl: string | null;
            aiUrl: string | null;
            error: string | null;
          }>;
        };
        allProfileConnectivity: {
          profiles: string[];
          failed: Array<{ profile: string; error: string }>;
        };
      };
      expect(report.status).toBe("failed");
      expect(report.summary).toEqual({
        status: "failed",
        profiles: [
          {
            profile: "preview",
            domain: "preview.example.com",
            status: "passed",
            healthUrl: "https://preview.example.com/api/healthz",
            aiUrl: "https://preview.example.com/api/ai/describe",
            healthAttempts: 1,
            aiAttempts: 1,
            recovered: false,
            error: null,
          },
          {
            profile: "production",
            domain: "production.example.com",
            status: "failed",
            healthUrl: null,
            aiUrl: null,
            healthAttempts: 3,
            aiAttempts: 0,
            recovered: false,
            error: "HTTP 503",
          },
        ],
      });
      expect(report.allProfileConnectivity).toEqual({
        profiles: ["preview", "production"],
        passed: [
          {
            profile: "preview",
            domain: "preview.example.com",
            healthUrl: "https://preview.example.com/api/healthz",
            aiUrl: "https://preview.example.com/api/ai/describe",
          },
        ],
        failed: [{ profile: "production", error: "HTTP 503" }],
      });
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("does not invoke iOS EAS when the all-profile preflight fails", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    try {
      const result = runNativeHandoffSubprocess(
        fixture,
        "failed",
        "0",
        "ios",
        "preview",
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(
        /Release connectivity failed before EAS build: production: HTTP 503/,
      );
      expect(existsSync(fixture.easRecordPath)).toBe(false);
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("invokes the stubbed EAS command after every subprocess preflight passes", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    try {
      const result = runNativeHandoffSubprocess(fixture, "passed");

      expect(result.status).toBe(0);
      expect(existsSync(fixture.easRecordPath)).toBe(true);
      expect(JSON.parse(readFileSync(fixture.easRecordPath, "utf8"))).toEqual({
        args: [
          "build",
          "--platform",
          "android",
          "--profile",
          "preview",
          "--json",
        ],
      });
      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        status: string;
        summary: {
          status: string;
          profiles: Array<Record<string, unknown>>;
        };
      };
      expect(report.status).toBe("completed");
      expect(report.summary).toEqual({
        status: "passed",
        profiles: [
          {
            profile: "preview",
            domain: "preview.example.com",
            status: "passed",
            healthUrl: "https://preview.example.com/api/healthz",
            aiUrl: "https://preview.example.com/api/ai/describe",
            healthAttempts: 1,
            aiAttempts: 1,
            recovered: false,
            error: null,
          },
          {
            profile: "production",
            domain: "production.example.com",
            status: "passed",
            healthUrl: "https://production.example.com/api/healthz",
            aiUrl: "https://production.example.com/api/ai/describe",
            healthAttempts: 1,
            aiAttempts: 1,
            recovered: false,
            error: null,
          },
        ],
      });
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("invokes iOS EAS after preflight and preserves the iOS bundle identifier", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    try {
      const result = runNativeHandoffSubprocess(
        fixture,
        "passed",
        "0",
        "ios",
        "preview",
      );

      expect(result.status).toBe(0);
      expect(JSON.parse(readFileSync(fixture.easRecordPath, "utf8"))).toEqual({
        args: [
          "build",
          "--platform",
          "ios",
          "--profile",
          "preview",
          "--json",
        ],
      });

      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        status: string;
        platform: string;
        profile: string;
        appId: string;
        build: {
          package: string;
          installerUrl: string | null;
        };
      };
      expect(report).toMatchObject({
        status: "completed",
        platform: "ios",
        profile: "preview",
        appId: "com.theacademy.mobile",
        build: {
          package: "com.theacademy.mobile",
        },
      });
      expect(report.build.installerUrl).toMatch(/\.ipa$/);
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("reports an EAS build failure after a successful preflight", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    try {
      const result = runNativeHandoffSubprocess(fixture, "passed", "23");

      expect(result.status).toBe(23);
      expect(result.stdout).toMatch(
        /Release connectivity passed for profile "preview"/,
      );
      expect(result.stderr).toMatch(
        /EAS build failed with exit code 23/,
      );
      expect(existsSync(fixture.easRecordPath)).toBe(true);

      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        status: string;
        easExitCode: number;
        failureStage: string;
        error: string;
        summary: {
          status: string;
          profiles: Array<{ profile: string; status: string }>;
        };
      };
      expect(report).toMatchObject({
        status: "failed",
        easExitCode: 23,
        failureStage: "eas-build",
        error: "[native-handoff] EAS build failed with exit code 23.",
        summary: {
          status: "passed",
          profiles: [
            { profile: "preview", status: "passed" },
            { profile: "production", status: "passed" },
          ],
        },
      });
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });
});