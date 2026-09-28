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
  getMobileCopy,
  MOBILE_COPY_KEYS,
  parseStoredBulletinLocale,
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
  getReleaseProfileApiDomain,
  getReleaseProfiles,
  readReleaseConfig,
  validateReleaseProfileHost,
  validateRequiredReleaseProfileHosts,
  validateGeneratedRuntimeApiHost,
  validateNativeHandoff,
  computeFileSha256: computeReleaseFileSha256,
  verifyInstallerChecksum,
  validateAndroidPreviewIdentity,
  validateAndroidProductionIdentity,
  runReleaseSmokeCheck,
  runReleaseSmokeChecks,
  summarizeReleaseSmokeResult,
  runOfflineGedFocusBoundaryCheck,
  writeReleaseReport,
  RELEASE_REPORT_SCHEMA_VERSION,
} = require("../scripts/check-release.js") as {
  RELEASE_REPORT_SCHEMA_VERSION: number;
  getReleaseDomain: (config: unknown, profile: string) => string;
  getReleaseProfileApiDomain: (
    config: unknown,
    profile: string,
  ) => string | null;
  getReleaseProfiles: (config: unknown) => string[];
  readReleaseConfig: (configPath?: string) => Record<string, unknown>;
  validateReleaseProfileHost: (config: unknown, profile: string) => string;
  validateRequiredReleaseProfileHosts: (config: unknown) => void;
  validateGeneratedRuntimeApiHost: (options: {
    profile: string;
    platform: "android" | "ios";
    easConfig?: unknown;
    generatedManifest?: unknown;
  }) => {
    status: string;
    profile: string;
    platform: string;
    expectedDomain: string | null;
    embeddedDomain: string | null;
  };
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
    androidVersionCode?: number;
    installerSha256?: string;
    installerSha256Source?: "local" | "eas";
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
    allowMissingChecksum?: boolean;
  }) => {
    status: string;
    artifactPath: string;
    installerSha256?: string;
    installerSha256Source?: "local" | "eas";
    reason?: string;
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
      healthUrl?: string | null;
      aiUrl?: string | null;
      healthAttempts: number;
      aiAttempts: number;
      error: Error;
    }>;
  }>;
  runOfflineGedFocusBoundaryCheck: (options?: {
    spawnSyncImpl?: (
      command: string,
      args: string[],
      options: {
        cwd: string;
        encoding: string;
        stdio: string[];
      },
    ) => {
      status: number | null;
      stdout?: string;
      stderr?: string;
    };
    projectPath?: string;
  }) => {
    status: string;
    test: string;
  };
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
      healthUrl?: string | null;
      aiUrl?: string | null;
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

const {
  runBuild,
  attachRuntimeApiDomain,
  validateGeneratedAndroidIdentity,
} = require("../scripts/build.js") as {
  runBuild: (options?: object) => Promise<unknown>;
  attachRuntimeApiDomain: (
    manifest: {
      extra: { expoClient: { extra?: Record<string, unknown> } };
    },
    apiDomain?: string | null,
  ) => {
    extra: { expoClient: { extra: Record<string, unknown> } };
  };
  validateGeneratedAndroidIdentity: (options?: {
    appConfig?: unknown;
    easConfig?: unknown;
    generatedManifest?: unknown;
    profile?: string;
    validateApiHost?: boolean;
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
    installerSha256Source?: "local" | "eas";
  };
  computeFileSha256: (filePath: string) => Promise<string>;
  attachInstallerChecksum: (buildMetadata: {
    installerPath: string | null;
    [key: string]: unknown;
  }) => Promise<
    Record<string, unknown> & {
      installerSha256: string | null;
      installerSha256Source?: "local" | "eas";
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
      failed: Array<{
        profile: string;
        domain?: string | null;
        healthUrl?: string | null;
        aiUrl?: string | null;
        error: Error;
      }>;
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

  it("accepts only supported persisted bulletin language values", () => {
    expect(parseStoredBulletinLocale("es")).toBe("es");
    expect(parseStoredBulletinLocale("pt")).toBeNull();
    expect(parseStoredBulletinLocale(null)).toBeNull();
  });
});

describe("mobile interface localization", () => {
  it.each(SUPPORTED_LOCALES)(
    "provides catalog copy for every migrated high-visibility key in %s",
    (locale) => {
      for (const key of MOBILE_COPY_KEYS) {
        expect(getMobileCopy(key, locale)).toBeTruthy();
      }
    },
  );

  it("falls back to English when a translated key is missing", () => {
    expect(
      getMobileCopy("weeklyFocus", "es", {
        en: { weeklyFocus: "WEEKLY FOCUS" },
        es: {},
      }),
    ).toBe("WEEKLY FOCUS");
  });
});

function createNativeHandoffSubprocessFixture({
  terminationSignal = "",
  easOutputProfile = "",
  checkOnly = false,
}: {
  terminationSignal?: string;
  easOutputProfile?: string;
  checkOnly?: boolean;
} = {}) {
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
const profile =
  process.env.EAS_OUTPUT_PROFILE ||
  process.env.RELEASE_PROFILE ||
  "preview";
const artifactExtension =
  process.env.EAS_ARTIFACT_EXTENSION ||
  (platform === "ios" ? "ipa" : profile === "production" ? "aab" : "apk");
fs.writeFileSync(
  process.env.EAS_RECORD_PATH,
  JSON.stringify({ args: process.argv.slice(2) }),
);
process.stdout.write(JSON.stringify([{
  id: "stub-build",
  status: "finished",
  profile,
  ...(platform === "android" && profile === "production"
    ? { androidVersionCode: 42 }
    : {}),
  ...(process.env.EAS_ARTIFACT_SHA256
    ? { artifacts: { sha256: process.env.EAS_ARTIFACT_SHA256 } }
    : {}),
  appVersion: "1.0.0",
  appIdentifier: "com.theacademy.mobile",
  completedAt: "2026-09-16T12:00:00.000Z",
  buildDetailsPageUrl: "https://expo.dev/builds/stub-build",
  artifactUrl: "https://expo.dev/builds/stub-build." + artifactExtension
}]));
if (process.env.EAS_TERMINATION_SIGNAL) {
  process.kill(process.pid, process.env.EAS_TERMINATION_SIGNAL);
}
const exitCode = Number(process.env.EAS_EXIT_CODE || "0");
if (exitCode !== 0) {
  process.stdout.write(
    "\\n" +
    "Error: Gradle stdout diagnostic for bounded report output.\\n".repeat(250) +
    "Error: Gradle task :app:bundleRelease failed; see https://example.invalid/build?token=stdout-private-token EXPO_TOKEN=stdout-private-token https://build-user:build-password@example.invalid\\n",
  );
  process.stdout.write("EXPO_TOKEN=irrelevant-stdout-private-token\\n");
  process.stderr.write(
    "ERROR: initial EAS worker diagnostics.\\n" +
    "ERROR: additional Gradle diagnostics.\\n".repeat(250) +
    "ERROR: EAS worker exited after Gradle failure.\\n" +
    "Authorization: Bearer stderr-private-token\\n" +
    "NPM_TOKEN=stderr-private-token\\n" +
    "-----BEGIN PRIVATE KEY-----\\nfixture-private-key\\n-----END PRIVATE KEY-----\\n",
  );
  process.exitCode = exitCode;
}
`,
    "utf8",
  );
  chmodSync(easCommandPath, 0o755);

  writeFileSync(
    preloadPath,
    `const checkReleasePath = ${JSON.stringify(checkReleasePath)};
const checkRelease = require(checkReleasePath);
const nativeRunReleaseSmokeChecks = checkRelease.runReleaseSmokeChecks;
const validateAndroidReleaseIdentity = checkRelease.validateAndroidReleaseIdentity;
if (process.env.RELEASE_IDENTITY_DRIFT === "production-autoIncrement") {
  checkRelease.validateAndroidReleaseIdentity = (profile, options) => {
    if (profile !== "production") {
      return validateAndroidReleaseIdentity(profile, options);
    }
    return validateAndroidReleaseIdentity(profile, {
      ...options,
      appConfig: {
        expo: { android: { package: "com.theacademy.mobile" } }
      },
      easConfig: {
        build: {
          production: {
            autoIncrement: false,
            android: { buildType: "app-bundle" }
          }
        }
      },
      generatedManifest: {
        extra: {
          expoClient: { android: { package: "com.theacademy.mobile" } }
        }
      }
    });
  };
}
const failed = process.env.RELEASE_PREFLIGHT_RESULT === "failed";
const hostFailure = process.env.RELEASE_PREFLIGHT_RESULT === "host-failure";
const recoveredProfiles = process.env.RELEASE_PREFLIGHT_RESULT === "recovered";
const timeoutRecovered =
  process.env.RELEASE_PREFLIGHT_RESULT === "timeout-recovered";
const timeoutPersistent =
  process.env.RELEASE_PREFLIGHT_RESULT === "timeout-persistent";
const configuredProfiles =
  process.env.RELEASE_PREFLIGHT_RESULT === "configured-profiles";
const hostValidation = hostFailure
  ? JSON.parse(process.env.RELEASE_HOST_VALIDATION_JSON || "null")
  : null;
const result = recoveredProfiles
  ? {
      profiles: ["preview", "production"],
      passed: [
        {
          profile: "preview",
          domain: "preview.example.com",
          healthUrl: "https://preview.example.com/api/healthz",
          aiUrl: "https://preview.example.com/api/ai/describe",
          healthAttempts: 2,
          aiAttempts: 1
        },
        {
          profile: "production",
          domain: "production.example.com",
          healthUrl: "https://production.example.com/api/healthz",
          aiUrl: "https://production.example.com/api/ai/describe",
          healthAttempts: 1,
          aiAttempts: 1
        }
      ],
      failed: []
    }
  : failed
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
        healthUrl: "https://production.example.com/api/healthz",
        aiUrl: "https://production.example.com/api/ai/describe",
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
  runReleaseSmokeChecks: async () => {
    if (hostFailure) {
      const error = new Error("EAS profile host contract failed.");
      error.code = "RELEASE_PROFILE_HOST_VALIDATION";
      error.hostValidation = hostValidation;
      throw error;
    }
    if (timeoutRecovered || timeoutPersistent) {
      const http = require("node:http");
      const requestCounts = new Map();
      const server = http.createServer((request, response) => {
        const requestPath = request.url || "/";
        const attempt = (requestCounts.get(requestPath) || 0) + 1;
        requestCounts.set(requestPath, attempt);
        const payload = requestPath.endsWith("/api/healthz")
          ? { status: "ok" }
          : { description: "A quiet room." };
        const respond = () => {
          if (request.destroyed || response.destroyed) return;
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify(payload));
        };

        if (timeoutPersistent || attempt === 1) {
          setTimeout(respond, 350);
        } else {
          respond();
        }
      });
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
      });
      const address = server.address();
      if (!address || typeof address === "string") {
        await new Promise((resolve) => server.close(resolve));
        throw new Error("Could not start the native handoff timeout fixture.");
      }

      try {
        return await nativeRunReleaseSmokeChecks({
          fetchImpl: (url, init) => {
            const endpoint = new URL(url);
            return fetch(
              "http://127.0.0.1:" + address.port + endpoint.pathname,
              init,
            );
          },
          retryDelayMs: 0,
          sleepImpl: async () => {},
          requestTimeoutMs: 100
        });
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
          server.closeAllConnections?.();
        });
      }
    }
    if (configuredProfiles) {
      let aiRequestCount = 0;
      const fetchImpl = async (url) => {
        if (url.endsWith("/api/healthz")) {
          return new Response(JSON.stringify({ status: "ok" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }

        aiRequestCount += 1;
        if (aiRequestCount >= 2 && aiRequestCount <= 4) {
          return new Response("Production AI unavailable.", { status: 503 });
        }
        return new Response(JSON.stringify({ description: "A quiet room." }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      };
      return nativeRunReleaseSmokeChecks({
        configPath: process.env.RELEASE_EAS_CONFIG_PATH,
        fetchImpl,
        retryDelayMs: 0,
        sleepImpl: async () => {}
      });
    }
    return result;
  }
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
    terminationSignal,
    easOutputProfile,
    checkOnly,
  };
}

function runNativeHandoffSubprocess(
  fixture: ReturnType<typeof createNativeHandoffSubprocessFixture>,
  preflightResult:
    | "failed"
    | "passed"
    | "host-failure"
    | "configured-profiles"
    | "recovered"
    | "timeout-recovered"
    | "timeout-persistent",
  easExitCode = "0",
  platform: "android" | "ios" = "android",
  profile = "preview",
  identityDrift = "",
  artifactExtension = "",
  easArtifactSha256 = "",
  hostValidation?: {
    profile: string;
    expectedPublishedHost: string;
    configuredHost: string;
    validationStage: string;
  },
  releaseEasConfigPath?: string,
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
       ...(fixture.checkOnly ? ["--check-only"] : []),
    ],
    {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8",
      env: {
        ...process.env,
        EAS_CLI_COMMAND: fixture.easCommandPath,
        EAS_RECORD_PATH: fixture.easRecordPath,
        EAS_TERMINATION_SIGNAL: fixture.terminationSignal,
        EAS_OUTPUT_PROFILE: fixture.easOutputProfile,
        RELEASE_PREFLIGHT_RESULT: preflightResult,
        EAS_EXIT_CODE: easExitCode,
        RELEASE_PLATFORM: platform,
        RELEASE_PROFILE: profile,
        RELEASE_REPORT_PATH: fixture.reportPath,
        RELEASE_IDENTITY_DRIFT: identityDrift,
        EAS_ARTIFACT_EXTENSION: artifactExtension,
        EAS_ARTIFACT_SHA256: easArtifactSha256,
        RELEASE_HOST_VALIDATION_JSON: hostValidation
          ? JSON.stringify(hostValidation)
          : "",
        RELEASE_EAS_CONFIG_PATH: releaseEasConfigPath || "",
      },
    },
  );
}

function createReleaseSmokeCliSubprocessFixture(
  scenario:
    | "all-profiles"
    | "single-profile-failure"
    | "single-profile-recovered",
) {
  const fixtureDirectory = mkdtempSync(
    path.join(tmpdir(), "academy-release-smoke-cli-"),
  );
  const reportPath = path.join(fixtureDirectory, "release-report.json");
  const preloadPath = path.join(fixtureDirectory, "stub-fetch.cjs");

  writeFileSync(
    preloadPath,
    `const scenario = process.env.RELEASE_CLI_SCENARIO;
const jsonResponse = (payload) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
let requestCount = 0;
globalThis.fetch = async (url) => {
  if (scenario === "single-profile-failure") {
    if (url.endsWith("/api/healthz")) {
      return jsonResponse({ status: "ok" });
    }
    return new Response("AI endpoint unavailable.", { status: 503 });
  }
  if (scenario === "single-profile-recovered") {
    requestCount += 1;
    if (requestCount === 1) {
      return new Response("Temporary health outage.", { status: 503 });
    }
    return url.endsWith("/api/healthz")
      ? jsonResponse({ status: "ok" })
      : jsonResponse({ description: "A quiet room." });
  }

  requestCount += 1;
  if (requestCount === 1 || requestCount >= 5) {
    return new Response("Temporary endpoint unavailable.", { status: 503 });
  }
  return url.endsWith("/api/healthz")
    ? jsonResponse({ status: "ok" })
    : jsonResponse({ description: "A quiet room." });
};
`,
    "utf8",
  );

  return { fixtureDirectory, reportPath, preloadPath, scenario };
}

function runReleaseSmokeCliSubprocess(
  fixture: ReturnType<typeof createReleaseSmokeCliSubprocessFixture>,
  allProfiles = false,
) {
  return spawnSync(
    process.execPath,
    [
      "--require",
      fixture.preloadPath,
      checkReleasePath,
      ...(allProfiles ? ["--all"] : ["preview"]),
      "--report",
      fixture.reportPath,
    ],
    {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8",
      env: {
        ...process.env,
        RELEASE_CLI_SCENARIO: fixture.scenario,
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

describe("offline GED release boundary", () => {
  it("runs the focused fixture test before release smoke requests", () => {
    const spawnSyncImpl = vi.fn(() => ({
      status: 0,
      stdout: "fixture passed",
      stderr: "",
    }));

    expect(
      runOfflineGedFocusBoundaryCheck({
        projectPath: "/fixture/academy-mobile",
        spawnSyncImpl,
      }),
    ).toEqual({
      status: "passed",
      test: "accepts every supported alias and falls back offline for an unknown label",
    });
    expect(spawnSyncImpl).toHaveBeenCalledWith(
      "pnpm",
      [
        "exec",
        "vitest",
        "run",
        "__tests__/offline.test.ts",
        "-t",
        "accepts every supported alias and falls back offline for an unknown label",
        "--reporter=dot",
      ],
      expect.objectContaining({
        cwd: "/fixture/academy-mobile",
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
  });

  it("surfaces focused fixture failures without making a network request", () => {
    expect(() =>
      runOfflineGedFocusBoundaryCheck({
        spawnSyncImpl: () => ({
          status: 1,
          stdout: "",
          stderr: "unknown GED label",
        }),
      }),
    ).toThrow(/GED focus boundary check failed[\s\S]*unknown GED label/);
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

  it("records local or EAS SHA-256 while keeping checksum-optional cloud handoffs valid", async () => {
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
      const easChecksum = "b".repeat(64);
      const providerMetadata = await attachInstallerChecksum({
        installerUrl: "https://example.invalid/academy-preview.apk",
        installerPath: null,
        installerSha256: easChecksum,
        installerSha256Source: "eas",
      });
      const localWithProviderMetadata = await attachInstallerChecksum({
        installerUrl: null,
        installerPath: artifactPath,
        installerSha256: easChecksum,
        installerSha256Source: "eas",
      });

      expect(localMetadata.installerSha256).toBe(expectedChecksum);
      expect(localMetadata.installerSha256Source).toBe("local");
      expect(localWithProviderMetadata).toMatchObject({
        installerSha256: expectedChecksum,
        installerSha256Source: "local",
      });
      expect(cloudMetadata.installerSha256).toBeNull();
      expect(cloudMetadata).not.toHaveProperty("installerSha256Source");
      expect(providerMetadata).toMatchObject({
        installerSha256: easChecksum,
        installerSha256Source: "eas",
      });
    } finally {
      rmSync(artifactDirectory, { recursive: true, force: true });
    }
  });

  it("normalizes a production AAB while allowing EAS auto-increment metadata", () => {
    const easChecksum = "A".repeat(64);
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
            sha256: easChecksum,
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
      androidVersionCode: 42,
      installerSha256: easChecksum.toLowerCase(),
      installerSha256Source: "eas",
    });
  });

  it("does not treat unrelated EAS hashes as installer checksums", () => {
    const normalized = normalizeBuildMetadata(
      {
        stdout: JSON.stringify([
          {
            id: "build-with-fingerprint",
            status: "finished",
            profile: "preview",
            appVersion: "1.0.0",
            appIdentifier: "com.theacademy.mobile",
            fingerprint: { hash: "f".repeat(64) },
            artifacts: {
              buildUrl: "https://example.invalid/academy-preview.apk",
              checksum: "not-a-sha256-digest",
            },
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
    );

    expect(normalized).not.toHaveProperty("installerSha256");
    expect(normalized).not.toHaveProperty("installerSha256Source");
  });

  it("rejects invalid Android version-code metadata", () => {
    expect(() =>
      normalizeBuildMetadata(
        {
          stdout: JSON.stringify([
            {
              id: "invalid-version-code",
              status: "finished",
              profile: "production",
              appVersion: "1.0.0",
              androidVersionCode: 0,
              appIdentifier: "com.theacademy.mobile",
              artifacts: {
                buildUrl: "https://example.invalid/academy-production.aab",
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
    ).toThrow(/invalid Android version code "0"/);
  });

  it("keeps production AAB metadata valid when EAS omits the version code", () => {
    const normalized = normalizeBuildMetadata(
      {
        stdout: JSON.stringify([
          {
            id: "production-without-version-code",
            status: "finished",
            profile: "production",
            appVersion: "1.0.0",
            appIdentifier: "com.theacademy.mobile",
            artifacts: {
              buildUrl: "https://example.invalid/academy-production.aab",
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
    );

    expect(normalized).toMatchObject({
      installerUrl: "https://example.invalid/academy-production.aab",
      version: "1.0.0",
    });
    expect(normalized).not.toHaveProperty("androidVersionCode");
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
    ).toThrow(
      /expected production Android App Bundle \(\.aab\) for store distribution; found .*\.apk/,
    );
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
            production: {
              autoIncrement: true,
              android: { buildType: "app-bundle" },
            },
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
    schemaVersion?: number;
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
      installerSha256Source?: "local" | "eas";
    };
  } => ({
      schemaVersion: RELEASE_REPORT_SCHEMA_VERSION,
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

  const runHandoffGateSubprocess = (
    handoffReport: ReturnType<typeof validHandoffReport>,
    installerPath: string,
    platform: "android" | "ios" = "android",
  ) => {
    const fixtureDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-handoff-gate-"),
    );
    const handoffReportPath = path.join(fixtureDirectory, "handoff-report.json");
    const releaseReportPath = path.join(fixtureDirectory, "release-report.json");
    writeFileSync(handoffReportPath, JSON.stringify(handoffReport), "utf8");
    const result = spawnSync(
      process.execPath,
      [
        checkReleasePath,
        "--handoff",
        "--platform",
        platform,
        "--profile",
        "preview",
        "--verify-checksum",
        installerPath,
      ],
      {
        cwd: path.resolve(__dirname, ".."),
        encoding: "utf8",
        env: {
          ...process.env,
          RELEASE_HANDOFF_PATH: handoffReportPath,
          RELEASE_REPORT_PATH: releaseReportPath,
          RELEASE_PLATFORM: platform,
          RELEASE_PROFILE: "preview",
        },
      },
    );

    return { fixtureDirectory, releaseReportPath, result };
  };

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

  const validIosHandoffReport = (): ReturnType<typeof validHandoffReport> => ({
    schemaVersion: RELEASE_REPORT_SCHEMA_VERSION,
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

  const preBumpHandoffReportV7 = (): ReturnType<typeof validHandoffReport> => ({
    schemaVersion: 7,
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
    const report = validHandoffReport();
    expect(report.schemaVersion).toBe(RELEASE_REPORT_SCHEMA_VERSION);
    expect(
      validateNativeHandoff({
        ...validHandoffConfig(),
        handoffReport: report,
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

  it.each([
    {
      label: "missing",
      createReport: () => {
        const report = validHandoffReport();
        delete report.schemaVersion;
        return report;
      },
      error: /schemaVersion is missing; expected schemaVersion \d+/,
    },
    {
      label: "pre-bump v7",
      createReport: preBumpHandoffReportV7,
      error: /schemaVersion 7 is older than the supported version; expected schemaVersion \d+.*checker that supports schemaVersion 7.*migrate a copy/s,
    },
    {
      label: "unsupported",
      createReport: () => {
        const report = validHandoffReport();
        report.schemaVersion = RELEASE_REPORT_SCHEMA_VERSION + 1;
        return report;
      },
      error: /schemaVersion \d+ is unsupported; expected schemaVersion \d+/,
    },
  ])(
    "rejects a handoff report with a $label schema version",
    ({ createReport, error }) => {
      expect(() =>
        validateNativeHandoff({
          ...validHandoffConfig(),
          handoffReport: createReport(),
        }),
      ).toThrow(error);
    },
  );

  it("rejects a pre-bump v7 report before checksum metadata is read", () => {
    const archivedReport = preBumpHandoffReportV7();

    expect(() =>
      verifyInstallerChecksum({
        artifactPath: "/tmp/not-used-academy-preview.apk",
        handoffReport: archivedReport,
      }),
    ).toThrow(
      /release-checksum\] Invalid handoff report: schemaVersion 7 is older than the supported version; expected schemaVersion \d+.*checker that supports schemaVersion 7.*migrate a copy.*archived original is unchanged/s,
    );
    expect(archivedReport.schemaVersion).toBe(7);
  });

  it("archives an unsupported handoff schema as an invalid report", () => {
    const report = validHandoffReport();
    report.schemaVersion = RELEASE_REPORT_SCHEMA_VERSION + 1;
    const gate = runHandoffGateSubprocess(
      report,
      "/tmp/not-used-academy-preview.apk",
    );

    try {
      expect(gate.result.status).toBe(1);
      expect(gate.result.stderr).toMatch(
        /Invalid handoff report: schemaVersion \d+ is unsupported/,
      );
      expect(gate.result.stderr).not.toMatch(/build failed|connectivity failed/i);

      const archivedReport = JSON.parse(
        readFileSync(gate.releaseReportPath, "utf8"),
      ) as Record<string, unknown>;
      expect(archivedReport).toMatchObject({
        schemaVersion: RELEASE_REPORT_SCHEMA_VERSION,
        command: "check-release --handoff",
        status: "failed",
        error: expect.stringContaining(
          "[release-handoff] Invalid handoff report:",
        ),
      });
      expect(archivedReport).not.toHaveProperty("failureStage");
      expect(archivedReport).not.toHaveProperty("summary");
      expect(archivedReport).not.toHaveProperty("build");
    } finally {
      rmSync(gate.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("accepts a complete iOS preview IPA handoff without contacting a device", () => {
    const validated = validateNativeHandoff({
      ...validIosHandoffConfig(),
      platform: "ios",
      handoffReport: validIosHandoffReport(),
    });

    expect(validated).toMatchObject({
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
    expect(validated).not.toHaveProperty("androidVersionCode");
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

  it("validates and verifies a cloud installer with EAS checksum provenance", () => {
    const artifactDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-eas-checksum-"),
    );
    const artifactPath = path.join(artifactDirectory, "academy-preview.apk");
    writeFileSync(artifactPath, "cloud-downloaded installer contents\n", "utf8");
    const report = validHandoffReport();
    report.build.installerSha256 = computeReleaseFileSha256(artifactPath);
    report.build.installerSha256Source = "eas";

    try {
      expect(
        validateNativeHandoff({
          ...validHandoffConfig(),
          handoffReport: report,
        }),
      ).toMatchObject({
        installerSha256: report.build.installerSha256,
        installerSha256Source: "eas",
      });
      expect(
        verifyInstallerChecksum({
          artifactPath,
          handoffReport: report,
        }),
      ).toEqual({
        status: "passed",
        artifactPath,
        installerSha256: report.build.installerSha256,
        installerSha256Source: "eas",
      });
    } finally {
      rmSync(artifactDirectory, { recursive: true, force: true });
    }
  });

  it("verifies the installer in the handoff gate and blocks checksum mismatches", () => {
    const artifactDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-gated-installer-"),
    );
    const artifactPath = path.join(artifactDirectory, "academy-preview.apk");
    writeFileSync(artifactPath, "verified package bytes\n", "utf8");
    const report = validHandoffReport();
    report.build.installerSha256 = computeReleaseFileSha256(artifactPath);
    report.build.installerSha256Source = "eas";

    try {
      const passingGate = runHandoffGateSubprocess(report, artifactPath);
      try {
        expect(passingGate.result.status).toBe(0);
        expect(passingGate.result.stdout).toContain(
          `[release-checksum] SHA-256 verified for ${artifactPath}: ${report.build.installerSha256}`,
        );
        expect(
          JSON.parse(readFileSync(passingGate.releaseReportPath, "utf8")),
        ).toMatchObject({ status: "passed" });
      } finally {
        rmSync(passingGate.fixtureDirectory, { recursive: true, force: true });
      }

      writeFileSync(artifactPath, "tampered package bytes\n", "utf8");
      const foundChecksum = computeReleaseFileSha256(artifactPath);
      const failingGate = runHandoffGateSubprocess(report, artifactPath);
      try {
        const mismatch = `[release-checksum] SHA-256 mismatch for ${artifactPath}: expected ${report.build.installerSha256}, found ${foundChecksum}.`;
        expect(failingGate.result.status).toBe(1);
        expect(failingGate.result.stderr).toContain(mismatch);
        expect(
          JSON.parse(readFileSync(failingGate.releaseReportPath, "utf8")),
        ).toMatchObject({
          status: "failed",
          error: mismatch,
        });
      } finally {
        rmSync(failingGate.fixtureDirectory, { recursive: true, force: true });
      }
    } finally {
      rmSync(artifactDirectory, { recursive: true, force: true });
    }
  });

  it("verifies a downloaded iOS IPA against its local handoff checksum", () => {
    const artifactDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-ios-gated-installer-"),
    );
    const localIpaPath = path.join(artifactDirectory, "academy-preview.ipa");
    const downloadedIpaPath = path.join(
      artifactDirectory,
      "downloaded-academy-preview.ipa",
    );
    writeFileSync(localIpaPath, "local IPA package bytes\n", "utf8");
    writeFileSync(downloadedIpaPath, "local IPA package bytes\n", "utf8");
    const report = validIosHandoffReport();
    report.build.installerUrl = null;
    report.build.installerPath = localIpaPath;
    report.build.installerSha256 = computeReleaseFileSha256(localIpaPath);
    report.build.installerSha256Source = "local";

    try {
      const passingGate = runHandoffGateSubprocess(
        report,
        downloadedIpaPath,
        "ios",
      );
      try {
        expect(passingGate.result.status).toBe(0);
        expect(passingGate.result.stdout).toContain(
          `[release-checksum] SHA-256 verified for ${downloadedIpaPath}: ${report.build.installerSha256}`,
        );
        expect(
          JSON.parse(readFileSync(passingGate.releaseReportPath, "utf8")),
        ).toMatchObject({
          status: "passed",
          handoff: {
            platform: "ios",
            installerSha256: report.build.installerSha256,
            installerSha256Source: "local",
          },
        });
      } finally {
        rmSync(passingGate.fixtureDirectory, { recursive: true, force: true });
      }

      writeFileSync(downloadedIpaPath, "modified IPA package bytes\n", "utf8");
      const foundChecksum = computeReleaseFileSha256(downloadedIpaPath);
      const failingGate = runHandoffGateSubprocess(
        report,
        downloadedIpaPath,
        "ios",
      );
      try {
        const mismatch = `[release-checksum] SHA-256 mismatch for ${downloadedIpaPath}: expected ${report.build.installerSha256}, found ${foundChecksum}.`;
        expect(failingGate.result.status).toBe(1);
        expect(failingGate.result.stderr).toContain(mismatch);
        expect(
          JSON.parse(readFileSync(failingGate.releaseReportPath, "utf8")),
        ).toMatchObject({
          status: "failed",
          error: mismatch,
        });
      } finally {
        rmSync(failingGate.fixtureDirectory, { recursive: true, force: true });
      }
    } finally {
      rmSync(artifactDirectory, { recursive: true, force: true });
    }
  });

  it("keeps cloud handoffs valid when the gate has no checksum to compare", () => {
    const artifactDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-cloud-installer-"),
    );
    const artifactPath = path.join(artifactDirectory, "academy-preview.apk");
    writeFileSync(artifactPath, "cloud package bytes\n", "utf8");
    const gateReport = validHandoffReport();
    const gate = runHandoffGateSubprocess(gateReport, artifactPath);

    try {
      expect(gate.result.status).toBe(0);
      expect(gate.result.stdout).toContain(
        `[release-checksum] Skipping file comparison for ${artifactPath}: no SHA-256 checksum is recorded.`,
      );
      expect(
        JSON.parse(readFileSync(gate.releaseReportPath, "utf8")),
      ).toMatchObject({ status: "passed" });
    } finally {
      rmSync(gate.fixtureDirectory, { recursive: true, force: true });
      rmSync(artifactDirectory, { recursive: true, force: true });
    }
  });

  it("keeps cloud-only iOS handoffs valid when no checksum is recorded", () => {
    const artifactDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-cloud-ios-installer-"),
    );
    const artifactPath = path.join(
      artifactDirectory,
      "downloaded-academy-preview.ipa",
    );
    writeFileSync(artifactPath, "cloud IPA package bytes\n", "utf8");
    const report = validIosHandoffReport();
    const gate = runHandoffGateSubprocess(report, artifactPath, "ios");

    try {
      expect(gate.result.status).toBe(0);
      expect(gate.result.stdout).toContain(
        `[release-checksum] Skipping file comparison for ${artifactPath}: no SHA-256 checksum is recorded.`,
      );
      expect(
        JSON.parse(readFileSync(gate.releaseReportPath, "utf8")),
      ).toMatchObject({
        status: "passed",
        handoff: { platform: "ios" },
      });
    } finally {
      rmSync(gate.fixtureDirectory, { recursive: true, force: true });
      rmSync(artifactDirectory, { recursive: true, force: true });
    }
  });

  it("blocks the handoff when a checksumed installer cannot be read", () => {
    const artifactDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-unreadable-installer-"),
    );
    const artifactPath = path.join(artifactDirectory, "missing-preview.apk");
    const report = validHandoffReport();
    report.build.installerSha256 = "a".repeat(64);
    const gate = runHandoffGateSubprocess(report, artifactPath);

    try {
      expect(gate.result.status).toBe(1);
      expect(gate.result.stderr).toContain(
        `[release-checksum] Could not read installer artifact at ${artifactPath}`,
      );
      expect(
        JSON.parse(readFileSync(gate.releaseReportPath, "utf8")),
      ).toMatchObject({ status: "failed" });
    } finally {
      rmSync(gate.fixtureDirectory, { recursive: true, force: true });
      rmSync(artifactDirectory, { recursive: true, force: true });
    }
  });

  it("keeps the standalone checksum command strict when no digest is recorded", () => {
    expect(() =>
      verifyInstallerChecksum({
        artifactPath: "/tmp/no-checksum-installer.apk",
        handoffReport: validHandoffReport(),
      }),
    ).toThrow(/no valid SHA-256 checksum/);
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
      androidVersionCode: 42,
      installerUrl:
        "https://example.invalid/academy-production.aab?sig=redacted",
      installerPath: null,
      timestamp: "2026-09-15T15:00:00.000Z",
      buildId: "build-123",
    });
  });

  it("rejects an invalid Android version code in a saved handoff", () => {
    const report = validHandoffReport();
    report.profile = "production";
    report.build.profile = "production";
    report.build.installerUrl =
      "https://example.invalid/academy-production.aab?sig=redacted";
    report.build.androidVersionCode = 0;

    expect(() =>
      validateNativeHandoff({
        ...validHandoffConfig(),
        profile: "production",
        handoffReport: report,
      }),
    ).toThrow(/build\.androidVersionCode must be a positive safe integer/);
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
          env: { EXPO_PUBLIC_DOMAIN: "academy.example.com" },
        },
        production: {
          autoIncrement: true,
          android: { buildType: "app-bundle" },
          env: { EXPO_PUBLIC_DOMAIN: "academy.example.com" },
        },
      },
    },
    generatedManifest: {
      extra: {
        expoClient: {
          android: { package: "com.theacademy.mobile" },
          extra: { academyApiDomain: "academy.example.com" },
        },
      },
    },
  });

  for (const profile of ["preview", "production"] as const) {
    for (const platform of ["android", "ios"] as const) {
      it(`matches the ${profile} EAS API host in the generated ${platform} runtime metadata`, () => {
        const easConfig = readReleaseConfig();
        const expectedDomain = getReleaseProfileApiDomain(
          easConfig,
          profile,
        );

        expect(
          validateGeneratedRuntimeApiHost({
            profile,
            platform,
            easConfig,
            generatedManifest: {
              extra: {
                expoClient: {
                  extra: { academyApiDomain: expectedDomain },
                },
              },
            },
          }),
        ).toEqual({
          status: "passed",
          profile,
          platform,
          expectedDomain,
          embeddedDomain: expectedDomain,
        });
      });
    }
  }

  it("names the selected profile, expected host, and embedded host on runtime drift", () => {
    const easConfig = readReleaseConfig();
    const expectedDomain = getReleaseProfileApiDomain(
      easConfig,
      "production",
    );

    expect(() =>
      validateGeneratedRuntimeApiHost({
        profile: "production",
        platform: "ios",
        easConfig,
        generatedManifest: {
          extra: {
            expoClient: {
              extra: { academyApiDomain: "stale.example.com" },
            },
          },
        },
      }),
    ).toThrow(
      `[release-identity] API host drift for profile "production" on ios: expected "${expectedDomain}", embedded "stale.example.com" in generated runtime metadata.`,
    );
  });

  it("allows offline-only profiles when generated runtime metadata has no API host", () => {
    const easConfig = {
      build: { development: { developmentClient: true } },
    };

    expect(
      validateGeneratedRuntimeApiHost({
        profile: "development",
        platform: "android",
        easConfig,
        generatedManifest: {
          extra: {
            expoClient: {
              extra: { academyApiDomain: null },
            },
          },
        },
      }),
    ).toMatchObject({
      status: "passed",
      expectedDomain: null,
      embeddedDomain: null,
    });
    expect(() =>
      getReleaseProfileApiDomain(
        { build: { preview: {} } },
        "preview",
      ),
    ).toThrow(/must define build\.preview\.env\.EXPO_PUBLIC_DOMAIN/);
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
    const easConfig = readReleaseConfig();
    const generatedManifest = {
      ...validIdentity().generatedManifest,
      extra: {
        ...validIdentity().generatedManifest.extra,
        expoClient: {
          ...validIdentity().generatedManifest.extra.expoClient,
          extra: {
            academyApiDomain: getReleaseProfileApiDomain(
              easConfig,
              "production",
            ),
          },
        },
      },
    };

    expect(
      validateAndroidProductionIdentity({
        ...validIdentity(),
        easConfig,
        generatedManifest,
      }),
    ).toEqual({
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

  it("reports production version-increment drift before an app-bundle handoff", () => {
    const identity = validIdentity();
    identity.easConfig.build.production.autoIncrement = false;

    expect(() => validateAndroidProductionIdentity(identity)).toThrow(
      /EAS production autoIncrement must be true to prevent Android version reuse; found false/,
    );

    const missingSettingIdentity = {
      ...validIdentity(),
      easConfig: {
        build: {
          production: {
            android: { buildType: "app-bundle" },
          },
        },
      },
    };
    expect(() =>
      validateAndroidProductionIdentity(missingSettingIdentity),
    ).toThrow(
      /EAS production autoIncrement must be true to prevent Android version reuse; found missing/,
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

  it("records a configured or absent API host in generated runtime metadata", () => {
    const manifest = {
      extra: {
        expoClient: {
          extra: { router: { origin: "https://replit.com/" } },
        },
      },
    };

    expect(attachRuntimeApiDomain(manifest, "academy.example.com")).toEqual({
      extra: {
        expoClient: {
          extra: {
            router: { origin: "https://replit.com/" },
            academyApiDomain: "academy.example.com",
          },
        },
      },
    });
    expect(
      attachRuntimeApiDomain(manifest, null).extra.expoClient.extra,
    ).toMatchObject({
      academyApiDomain: null,
    });
  });

  it("builds with the selected EAS host and validates both generated platforms", async () => {
    const startMetro = vi.fn(async (_apiDomain: string) => {});
    const updateManifest = vi.fn(
      (
        _manifests: unknown,
        _timestamp: string,
        _baseUrl: string,
        _assetsByHash: unknown,
        _apiDomain: string | null,
      ) => {},
    );
    const validateAndroid = vi.fn((_options: unknown) => {});
    const validateIos = vi.fn((_options: unknown) => {});

    await runBuild({
      profile: "production",
      getDeploymentDomainImpl: () => "static.example.com",
      getReleaseProfileApiDomainImpl: () => "academy.example.com",
      getExpoPublicReplIdImpl: () => undefined,
      prepareDirectoriesImpl: () => {},
      clearMetroCacheImpl: () => {},
      startMetroImpl: startMetro,
      downloadBundlesAndManifestsImpl: async () => ({
        ios: {},
        android: {},
      }),
      extractAssetsImpl: () => [],
      downloadAssetsImpl: async () => 0,
      updateBundleUrlsImpl: () => {},
      updateManifestsImpl: updateManifest,
      validateGeneratedAndroidIdentityImpl: validateAndroid,
      validateGeneratedRuntimeApiHostImpl: validateIos,
      timestamp: "host-validation-fixture",
    });

    expect(startMetro).toHaveBeenCalledWith(
      "academy.example.com",
      undefined,
    );
    expect(updateManifest).toHaveBeenCalledWith(
      { ios: {}, android: {} },
      "host-validation-fixture",
      "https://static.example.com",
      new Map(),
      "academy.example.com",
    );
    expect(validateAndroid).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: "production",
        validateApiHost: true,
      }),
    );
    expect(validateIos).toHaveBeenCalledWith({
      profile: "production",
      platform: "ios",
    });
  });

  it("keeps an explicitly offline build's API host unset", async () => {
    const startMetro = vi.fn(async (_apiDomain: string) => {});
    const updateManifest = vi.fn(
      (
        _manifests: unknown,
        _timestamp: string,
        _baseUrl: string,
        _assetsByHash: unknown,
        _apiDomain: string | null,
      ) => {},
    );
    const validateRuntimeApiHost = vi.fn((_options: unknown) => {});

    await runBuild({
      profile: "development",
      getDeploymentDomainImpl: () => "static.example.com",
      getReleaseProfileApiDomainImpl: () => null,
      getExpoPublicReplIdImpl: () => undefined,
      prepareDirectoriesImpl: () => {},
      clearMetroCacheImpl: () => {},
      startMetroImpl: startMetro,
      downloadBundlesAndManifestsImpl: async () => ({
        ios: {},
        android: {},
      }),
      extractAssetsImpl: () => [],
      downloadAssetsImpl: async () => 0,
      updateBundleUrlsImpl: () => {},
      updateManifestsImpl: updateManifest,
      validateGeneratedAndroidIdentityImpl: () => {},
      validateGeneratedRuntimeApiHostImpl: validateRuntimeApiHost,
      timestamp: "offline-build-fixture",
    });

    expect(startMetro).toHaveBeenCalledWith("", undefined);
    expect(updateManifest.mock.calls[0]?.[4]).toBeNull();
    expect(validateRuntimeApiHost).not.toHaveBeenCalled();
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

  it("records the selected Android profile in preview and production identity reports", () => {
    const reportDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-identity-report-"),
    );
    try {
      for (const androidProfile of ["preview", "production"]) {
        const reportPath = path.join(
          reportDirectory,
          `${androidProfile}-identity.json`,
        );
        const result = spawnSync(
          "pnpm",
          ["run", "check-release:identity", "--", "--report", reportPath],
          {
            cwd: path.resolve(__dirname, ".."),
            encoding: "utf8",
            env: { ...process.env, RELEASE_PROFILE: androidProfile },
          },
        );

        expect(result.status).toBe(0);
        const report = JSON.parse(readFileSync(reportPath, "utf8")) as {
          command: string;
          status: string;
          androidProfile: string;
          androidIdentity: {
            androidPackage: string;
            generatedAndroidPackage: string;
          };
        };
        expect(report).toMatchObject({
          schemaVersion: RELEASE_REPORT_SCHEMA_VERSION,
          command: "check-release --identity-only",
          status: "passed",
          androidProfile,
          androidIdentity: {
            androidPackage: "com.theacademy.mobile",
            generatedAndroidPackage: "com.theacademy.mobile",
          },
        });
      }
    } finally {
      rmSync(reportDirectory, { recursive: true, force: true });
    }
  });

  it("records the selected Android profile in failed identity reports", () => {
    const reportDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-identity-failure-"),
    );
    const reportPath = path.join(reportDirectory, "identity-failed.json");
    try {
      const result = spawnSync(
        "pnpm",
        ["run", "check-release:identity", "--", "--report", reportPath],
        {
          cwd: path.resolve(__dirname, ".."),
          encoding: "utf8",
          env: { ...process.env, RELEASE_PROFILE: "production-drift" },
        },
      );

      expect(result.status).toBe(1);
      const report = JSON.parse(readFileSync(reportPath, "utf8")) as {
        schemaVersion: number;
        command: string;
        status: string;
        androidProfile: string;
        error: string;
      };
      expect(report).toMatchObject({
        schemaVersion: RELEASE_REPORT_SCHEMA_VERSION,
        command: "check-release --identity-only",
        status: "failed",
        androidProfile: "production-drift",
      });
      expect(report.error).toMatch(/Unsupported Android release profile/);
    } finally {
      rmSync(reportDirectory, { recursive: true, force: true });
    }
  });

  it("uses the production profile as the published hostname source", () => {
    const config = readReleaseConfig();
    const publishedDomain = getReleaseDomain(config, "production");

    expect(validateReleaseProfileHost(config, "preview")).toBe(publishedDomain);
    expect(validateReleaseProfileHost(config, "production")).toBe(
      publishedDomain,
    );
  });

  it("attaches structured details to missing and mismatched host failures", () => {
    const config = readReleaseConfig();
    const publishedDomain = getReleaseDomain(config, "production");
    const missingPreviewConfig = JSON.parse(JSON.stringify(config)) as {
      build: Record<string, { env: Record<string, string> }>;
    };
    delete missingPreviewConfig.build.preview.env.EXPO_PUBLIC_DOMAIN;

    let missingPreviewError: unknown;
    try {
      validateReleaseProfileHost(missingPreviewConfig, "preview");
    } catch (error) {
      missingPreviewError = error;
    }
    expect(missingPreviewError).toMatchObject({
      code: "RELEASE_PROFILE_HOST_VALIDATION",
      hostValidation: {
        profile: "preview",
        expectedPublishedHost: publishedDomain,
        configuredHost: "missing",
        validationStage: "profile-host-validation",
      },
    });

    const mismatchedPreviewConfig = JSON.parse(JSON.stringify(config)) as {
      build: Record<string, { env: Record<string, string> }>;
    };
    mismatchedPreviewConfig.build.preview.env.EXPO_PUBLIC_DOMAIN =
      "https://wrong.example.com";

    let mismatchedPreviewError: unknown;
    try {
      validateReleaseProfileHost(mismatchedPreviewConfig, "preview");
    } catch (error) {
      mismatchedPreviewError = error;
    }
    expect(mismatchedPreviewError).toMatchObject({
      code: "RELEASE_PROFILE_HOST_VALIDATION",
      hostValidation: {
        profile: "preview",
        expectedPublishedHost: publishedDomain,
        configuredHost: "wrong.example.com",
        validationStage: "profile-host-validation",
      },
    });

    const missingProductionConfig = JSON.parse(JSON.stringify(config)) as {
      build: Record<string, { env: Record<string, string> }>;
    };
    delete missingProductionConfig.build.production.env.EXPO_PUBLIC_DOMAIN;

    let missingProductionError: unknown;
    try {
      validateRequiredReleaseProfileHosts(missingProductionConfig);
    } catch (error) {
      missingProductionError = error;
    }
    expect(missingProductionError).toMatchObject({
      code: "RELEASE_PROFILE_HOST_VALIDATION",
      hostValidation: {
        profile: "production",
        expectedPublishedHost: "unavailable",
        configuredHost: "missing",
        validationStage: "profile-host-validation",
      },
    });

    const invalidProductionConfig = JSON.parse(JSON.stringify(config)) as {
      build: Record<string, { env: Record<string, string> }>;
    };
    invalidProductionConfig.build.production.env.EXPO_PUBLIC_DOMAIN =
      "http://invalid.example.com";

    let invalidProductionError: unknown;
    try {
      validateRequiredReleaseProfileHosts(invalidProductionConfig);
    } catch (error) {
      invalidProductionError = error;
    }
    expect(invalidProductionError).toMatchObject({
      code: "RELEASE_PROFILE_HOST_VALIDATION",
      hostValidation: {
        profile: "production",
        expectedPublishedHost: "unavailable",
        configuredHost: "http://invalid.example.com",
        validationStage: "profile-host-validation",
      },
    });
  });

  it("requires preview and production to use the published Academy hostname", () => {
    const config = readReleaseConfig();
    const publishedDomain = getReleaseDomain(config, "production");

    expect(() => validateRequiredReleaseProfileHosts(config)).not.toThrow();
    expect(validateReleaseProfileHost(config, "preview")).toBe(
      publishedDomain,
    );
    expect(validateReleaseProfileHost(config, "production")).toBe(
      publishedDomain,
    );

    const driftedConfig = JSON.parse(JSON.stringify(config)) as {
      build: Record<string, { env: Record<string, string> }>;
    };
    driftedConfig.build.preview.env.EXPO_PUBLIC_DOMAIN =
      "https://wrong.example.com";
    expect(() => validateRequiredReleaseProfileHosts(driftedConfig)).toThrow(
      new Error(
        `[release-smoke] Profile "preview" must match the published Academy hostname "${publishedDomain}" from build.production.env.EXPO_PUBLIC_DOMAIN in eas.json; found "wrong.example.com". Update build.preview.env.EXPO_PUBLIC_DOMAIN to match the production profile.`,
      ),
    );

    const changedProductionConfig = JSON.parse(JSON.stringify(config)) as {
      build: Record<string, { env: Record<string, string> }>;
    };
    changedProductionConfig.build.production.env.EXPO_PUBLIC_DOMAIN =
      "academy-new.example.com";
    expect(() =>
      validateRequiredReleaseProfileHosts(changedProductionConfig),
    ).toThrow(
      new Error(
        `[release-smoke] Profile "preview" must match the published Academy hostname "academy-new.example.com" from build.production.env.EXPO_PUBLIC_DOMAIN in eas.json; found "${publishedDomain}". Update build.preview.env.EXPO_PUBLIC_DOMAIN to match the production profile.`,
      ),
    );
    changedProductionConfig.build.preview.env.EXPO_PUBLIC_DOMAIN =
      "academy-new.example.com";
    expect(() =>
      validateRequiredReleaseProfileHosts(changedProductionConfig),
    ).not.toThrow();

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
      const driftedConfig = JSON.parse(
        JSON.stringify(readReleaseConfig()),
      ) as {
        build: Record<string, { env: Record<string, string> }>;
      };
      driftedConfig.build.preview.env.EXPO_PUBLIC_DOMAIN = "wrong.example.com";
      writeFileSync(
        configPath,
        JSON.stringify(driftedConfig),
        "utf8",
      );

      await expect(
        runReleaseSmokeChecks({ configPath, fetchImpl }),
      ).rejects.toThrow(
        /Profile "preview" must match the published Academy hostname.*build\.production\.env\.EXPO_PUBLIC_DOMAIN.*found "wrong\.example\.com"/,
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

  it("exposes offline iOS handoff validation shortcuts for both profiles", () => {
    const scripts = JSON.parse(
      readFileSync(path.resolve(__dirname, "../package.json"), "utf8"),
    ).scripts as Record<string, string>;
    const previewCommand = scripts["check-release:handoff:ios"];
    const productionCommand = scripts["check-release:handoff:ios:production"];

    expect(previewCommand).toContain("check-release");
    expect(previewCommand).toContain("--handoff --platform ios --profile preview");
    expect(previewCommand).not.toContain("native-handoff");
    expect(previewCommand).not.toMatch(/\beas(?:-cli)?\b/i);

    expect(productionCommand).toContain("check-release");
    expect(productionCommand).toContain(
      "--handoff --platform ios --profile production",
    );
    expect(productionCommand).not.toContain("native-handoff");
    expect(productionCommand).not.toMatch(/\beas(?:-cli)?\b/i);
  });

  it("runs both iOS validation shortcuts against local handoff reports", () => {
    const fixtureDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-ios-handoff-shortcuts-"),
    );

    try {
      for (const { script, profile } of [
        { script: "check-release:handoff:ios", profile: "preview" },
        {
          script: "check-release:handoff:ios:production",
          profile: "production",
        },
      ]) {
        const handoffReportPath = path.join(
          fixtureDirectory,
          `${profile}-handoff.json`,
        );
        const releaseReportPath = path.join(
          fixtureDirectory,
          `${profile}-release.json`,
        );
        const handoffReport = validIosHandoffReport();
        handoffReport.profile = profile;
        handoffReport.build.profile = profile;
        handoffReport.build.installerUrl =
          `https://example.invalid/academy-${profile}.ipa`;
        writeFileSync(handoffReportPath, JSON.stringify(handoffReport), "utf8");

        const result = spawnSync("pnpm", ["run", script], {
          cwd: path.resolve(__dirname, ".."),
          encoding: "utf8",
          env: {
            ...process.env,
            RELEASE_HANDOFF_PATH: handoffReportPath,
            RELEASE_REPORT_PATH: releaseReportPath,
          },
        });

        expect(result.status, result.stderr).toBe(0);
        expect(result.stdout).toContain(
          "[release-handoff] Installer handoff passed.",
        );
        expect(
          JSON.parse(readFileSync(releaseReportPath, "utf8")),
        ).toMatchObject({
          status: "passed",
          handoff: { platform: "ios", profile },
        });
      }
    } finally {
      rmSync(fixtureDirectory, { recursive: true, force: true });
    }
  }, 20_000);

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
    const publishedDomain = getReleaseDomain(
      readReleaseConfig(),
      "production",
    );
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
      domain: publishedDomain,
    });

    expect(requests.map((request) => request.url)).toEqual([
      `https://${publishedDomain}/api/healthz`,
      `https://${publishedDomain}/api/ai/describe`,
    ]);
    expect(requests[1].init?.method).toBe("POST");
    expect(JSON.parse(String(requests[1].init?.body))).toMatchObject({
      type: "location",
      locationName: "Academy Library",
    });
  });

  it("uses the production hostname after every release profile is updated", async () => {
    const configDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-release-host-update-"),
    );
    const configPath = path.join(configDirectory, "eas.json");
    const config = JSON.parse(
      JSON.stringify(readReleaseConfig()),
    ) as {
      build: Record<string, { env: Record<string, string> }>;
    };
    const stalePreviewDomain = getReleaseDomain(config, "preview");
    const updatedDomain = "academy-new.example.com";
    const requests: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      requests.push(url);
      if (url.endsWith("/api/healthz")) {
        return okJson({ status: "ok" });
      }
      return okJson({ description: "A hush settles over the library." });
    }) as unknown as typeof fetch;

    try {
      config.build.production.env.EXPO_PUBLIC_DOMAIN = updatedDomain;
      writeFileSync(configPath, JSON.stringify(config), "utf8");

      await expect(
        runReleaseSmokeCheck({
          profile: "production",
          configPath,
          fetchImpl,
        }),
      ).rejects.toThrow(
        new Error(
          `[release-smoke] Profile "preview" must match the published Academy hostname "${updatedDomain}" from build.production.env.EXPO_PUBLIC_DOMAIN in eas.json; found "${stalePreviewDomain}". Update build.preview.env.EXPO_PUBLIC_DOMAIN to match the production profile.`,
        ),
      );
      await expect(
        runReleaseSmokeChecks({ configPath, fetchImpl }),
      ).rejects.toThrow(
        new Error(
          `[release-smoke] Profile "preview" must match the published Academy hostname "${updatedDomain}" from build.production.env.EXPO_PUBLIC_DOMAIN in eas.json; found "${stalePreviewDomain}". Update build.preview.env.EXPO_PUBLIC_DOMAIN to match the production profile.`,
        ),
      );
      expect(fetchImpl).not.toHaveBeenCalled();

      config.build.preview.env.EXPO_PUBLIC_DOMAIN = updatedDomain;
      writeFileSync(configPath, JSON.stringify(config), "utf8");

      const result = await runReleaseSmokeChecks({ configPath, fetchImpl });
      expect(result.passed.map(({ domain }) => domain)).toEqual([
        updatedDomain,
        updatedDomain,
      ]);
      expect(requests).toEqual([
        `https://${updatedDomain}/api/healthz`,
        `https://${updatedDomain}/api/ai/describe`,
        `https://${updatedDomain}/api/healthz`,
        `https://${updatedDomain}/api/ai/describe`,
      ]);
    } finally {
      rmSync(configDirectory, { recursive: true, force: true });
    }
  });

  it("reports an actionable health failure before calling AI", async () => {
    const previewDomain = getReleaseDomain(readReleaseConfig(), "preview");
    const fetchImpl = vi.fn(async () => new Response("not found", { status: 404 })) as unknown as typeof fetch;

    await expect(
      runReleaseSmokeCheck({ fetchImpl }),
    ).rejects.toThrow(
      `[release-smoke] Health check failed for profile "preview" at https://${previewDomain}/api/healthz: HTTP 404.`,
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
      const previewDomain = getReleaseDomain(readReleaseConfig(), "preview");
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
          new RegExp(
            `Health check could not reach https://${previewDomain.replaceAll(".", "\\.")}/api/healthz`,
          ),
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

  it("retries a timed-out local AI request and archives recovered attempt counts", async () => {
    let healthRequests = 0;
    let aiRequests = 0;
    const server = createServer((request, response) => {
      const respond = (payload: object) => {
        if (response.destroyed) return;
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(payload));
      };

      if (request.url === "/api/healthz") {
        healthRequests += 1;
        respond({ status: "ok" });
        return;
      }

      aiRequests += 1;
      if (aiRequests === 1) {
        setTimeout(() => respond({ description: "Recovered locally." }), 250);
        return;
      }
      respond({ description: "Recovered locally." });
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Local AI timeout fixture did not expose a port.");
      }
      const fetchImpl = ((url: string, init?: RequestInit) =>
        fetch(
          `http://127.0.0.1:${address.port}${new URL(url).pathname}`,
          init,
        )) as typeof fetch;

      const result = await runReleaseSmokeChecks({
        fetchImpl,
        requestTimeoutMs: 50,
        retryDelayMs: 0,
        sleepImpl: async () => {},
      });
      const report = archiveReleaseSummary(
        summarizeReleaseSmokeResult(result),
      );
      const summary = report.summary as {
        status: string;
        profiles: Array<{
          profile: string;
          healthAttempts: number;
          aiAttempts: number;
          recovered: boolean;
          error: string | null;
        }>;
      };

      expect(report.status).toBe("passed");
      expect(report.schemaVersion).toBe(RELEASE_REPORT_SCHEMA_VERSION);
      expect(healthRequests).toBe(2);
      expect(aiRequests).toBe(3);
      expect(summary.status).toBe("passed");
      expect(summary.profiles.find(({ profile }) => profile === "preview"))
        .toMatchObject({
          healthAttempts: 1,
          aiAttempts: 2,
          recovered: true,
          error: null,
        });
      expect(summary.profiles.find(({ profile }) => profile === "production"))
        .toMatchObject({
          healthAttempts: 1,
          aiAttempts: 1,
          recovered: false,
          error: null,
        });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections?.();
      });
    }
  });

  it("bounds persistent local AI timeouts and archives the final AI error", async () => {
    let healthRequests = 0;
    let aiRequests = 0;
    const server = createServer((request, response) => {
      const respond = (payload: object) => {
        if (response.destroyed) return;
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(payload));
      };

      if (request.url === "/api/healthz") {
        healthRequests += 1;
        respond({ status: "ok" });
        return;
      }

      aiRequests += 1;
      setTimeout(
        () => respond({ description: "Must not arrive before timeout." }),
        250,
      );
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Persistent AI timeout fixture did not expose a port.");
      }
      const fetchImpl = ((url: string, init?: RequestInit) =>
        fetch(
          `http://127.0.0.1:${address.port}${new URL(url).pathname}`,
          init,
        )) as typeof fetch;

      const result = await runReleaseSmokeChecks({
        fetchImpl,
        requestTimeoutMs: 50,
        retryDelayMs: 0,
        sleepImpl: async () => {},
      });
      const report = archiveReleaseSummary(
        summarizeReleaseSmokeResult(result),
      );
      const summary = report.summary as {
        status: string;
        profiles: Array<{
          profile: string;
          healthAttempts: number;
          aiAttempts: number;
          recovered: boolean;
          error: string | null;
        }>;
      };
      const preview = summary.profiles.find(
        ({ profile }) => profile === "preview",
      );
      const production = summary.profiles.find(
        ({ profile }) => profile === "production",
      );

      expect(report.status).toBe("failed");
      expect(summary.status).toBe("failed");
      expect(healthRequests).toBe(2);
      expect(aiRequests).toBe(6);
      expect(preview).toMatchObject({
        healthAttempts: 1,
        aiAttempts: 3,
        recovered: false,
        error: expect.stringMatching(
          /^\[release-smoke\] AI enrichment check could not reach https:\/\/[^/]+\/api\/ai\/describe: This operation was aborted$/,
        ),
      });
      expect(production).toMatchObject({
        healthAttempts: 1,
        aiAttempts: 3,
        recovered: false,
        error: expect.stringMatching(
          /^\[release-smoke\] AI enrichment check could not reach https:\/\/[^/]+\/api\/ai\/describe: This operation was aborted$/,
        ),
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections?.();
      });
    }
  });

  it("checks every configured domain profile and reports each profile", async () => {
    const publishedDomain = getReleaseDomain(
      readReleaseConfig(),
      "production",
    );
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.endsWith("/api/healthz")) {
        return okJson({ status: "ok" });
      }
      return okJson({ description: "A hush settles over the library." });
    }) as unknown as typeof fetch;

    await expect(runReleaseSmokeChecks({ fetchImpl })).resolves.toMatchObject({
      profiles: ["preview", "production"],
      passed: [
        { profile: "preview", domain: publishedDomain },
        { profile: "production", domain: publishedDomain },
      ],
      failed: [],
    });
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it("continues after a failed profile and returns a non-empty failure report", async () => {
    const previewDomain = getReleaseDomain(readReleaseConfig(), "preview");
    const productionDomain = getReleaseDomain(
      readReleaseConfig(),
      "production",
    );
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
    expect(result.failed[0].domain).toBe(previewDomain);
    expect(result.failed[0]).toMatchObject({
      healthUrl: `https://${previewDomain}/api/healthz`,
      aiUrl: `https://${previewDomain}/api/ai/describe`,
      healthAttempts: 3,
      aiAttempts: 0,
    });
    expect(result.passed).toMatchObject([
      {
        profile: "production",
        domain: productionDomain,
        healthAttempts: 1,
        aiAttempts: 1,
      },
    ]);
  });

  it("archives attempt counts when successful responses contain unusable JSON", async () => {
    const configDirectory = mkdtempSync(
      path.join(tmpdir(), "academy-release-invalid-payloads-"),
    );
    const configPath = path.join(configDirectory, "eas.json");

    try {
      const config = JSON.parse(JSON.stringify(readReleaseConfig())) as {
        build: Record<string, { env: Record<string, string> }>;
      };
      const publishedDomain = getReleaseDomain(config, "production");
      config.build.staging = {
        env: { EXPO_PUBLIC_DOMAIN: publishedDomain },
      };
      writeFileSync(configPath, JSON.stringify(config), "utf8");

      const responses = [
        new Response("Temporary health outage.", { status: 503 }),
        new Response("{ malformed health json", { status: 200 }),
        new Response("Temporary health outage.", { status: 503 }),
        okJson({ status: "ok" }),
        new Response("Temporary AI outage.", { status: 503 }),
        new Response("{ malformed AI json", { status: 200 }),
        okJson({ status: "ok" }),
        new Response("Temporary AI outage.", { status: 503 }),
        okJson({ description: "  " }),
      ];
      const fetchImpl = vi.fn(async () => {
        const response = responses.shift();
        if (!response) {
          throw new Error("Invalid-payload fixture ran out of responses.");
        }
        return response;
      }) as unknown as typeof fetch;

      const result = await runReleaseSmokeChecks({
        configPath,
        fetchImpl,
        retryDelayMs: 0,
        sleepImpl: async () => {},
      });
      const report = archiveReleaseSummary(
        summarizeReleaseSmokeResult(result),
      );
      const healthUrl = `https://${publishedDomain}/api/healthz`;
      const aiUrl = `https://${publishedDomain}/api/ai/describe`;

      assertStableReleaseReport(report, "failed", [
        "preview",
        "production",
        "staging",
      ]);
      expect(report.summary).toMatchObject({
        profiles: [
          {
            profile: "preview",
            domain: publishedDomain,
            status: "failed",
            healthUrl,
            aiUrl,
            healthAttempts: 2,
            aiAttempts: 0,
            recovered: false,
            error: expect.stringContaining(
              "[release-smoke] Health endpoint returned invalid JSON:",
            ),
          },
          {
            profile: "production",
            domain: publishedDomain,
            status: "failed",
            healthUrl,
            aiUrl,
            healthAttempts: 2,
            aiAttempts: 2,
            recovered: false,
            error: expect.stringContaining(
              "[release-smoke] AI enrichment endpoint returned invalid JSON:",
            ),
          },
          {
            profile: "staging",
            domain: publishedDomain,
            status: "failed",
            healthUrl,
            aiUrl,
            healthAttempts: 1,
            aiAttempts: 2,
            recovered: false,
            error: expect.stringContaining(
              `[release-smoke] AI enrichment endpoint ${aiUrl} returned no description.`,
            ),
          },
        ],
      });
      expect(fetchImpl).toHaveBeenCalledTimes(9);
    } finally {
      rmSync(configDirectory, { recursive: true, force: true });
    }
  });

  it("prints retry totals and recovery status in all-profile CLI output", () => {
    const fixture = createReleaseSmokeCliSubprocessFixture("all-profiles");
    try {
      const result = runReleaseSmokeCliSubprocess(fixture, true);

      expect(result.status).toBe(1);
      expect(result.stdout).toContain(
        "[release-smoke] preview passed after retries (health attempts: 2, AI attempts: 1).",
      );
      expect(result.stderr).toMatch(
        /production failed: \[release-smoke\] AI enrichment check failed for profile "production" at .*: HTTP 503\. \(health attempts: 1, AI attempts: 3\)/,
      );

      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        status: string;
        summary: {
          profiles: Array<{
            profile: string;
            healthAttempts: number;
            aiAttempts: number;
            recovered: boolean;
          }>;
        };
      };
      expect(report.status).toBe("failed");
      expect(report.summary.profiles).toMatchObject([
        {
          profile: "preview",
          healthAttempts: 2,
          aiAttempts: 1,
          recovered: true,
        },
        {
          profile: "production",
          healthAttempts: 1,
          aiAttempts: 3,
          recovered: false,
        },
      ]);
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("prints single-profile attempt totals without changing the report error", () => {
    const fixture = createReleaseSmokeCliSubprocessFixture(
      "single-profile-failure",
    );
    try {
      const result = runReleaseSmokeCliSubprocess(fixture);

      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(
        /\[release-smoke\] AI enrichment check failed for profile "preview" at .*: HTTP 503\.\s+\(health attempts: 1, AI attempts: 3\)/,
      );

      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as { error: string };
      expect(report.error).toMatch(
        /^\[release-smoke\] AI enrichment check failed for profile "preview".*HTTP 503\.$/,
      );
      expect(report.error).not.toContain("attempts:");
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("identifies a single profile that passed after retries", () => {
    const fixture =
      createReleaseSmokeCliSubprocessFixture("single-profile-recovered");
    try {
      const result = runReleaseSmokeCliSubprocess(fixture);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        "[release-smoke] preview passed after retries (health attempts: 2, AI attempts: 1).",
      );
      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        result: {
          healthAttempts: number;
          aiAttempts: number;
        };
      };
      expect(report.result).toEqual({
        profile: "preview",
        domain: expect.any(String),
        healthUrl: expect.any(String),
        aiUrl: expect.any(String),
        healthAttempts: 2,
        aiAttempts: 1,
      });
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
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
            healthUrl: "https://production.example.com/api/healthz",
            aiUrl: "https://production.example.com/api/ai/describe",
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
          healthUrl: "https://production.example.com/api/healthz",
          aiUrl: "https://production.example.com/api/ai/describe",
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

    expect(RELEASE_REPORT_SCHEMA_VERSION).toBe(8);
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

  it("archives every configured profile in native and legacy summaries", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    try {
      const config = JSON.parse(JSON.stringify(readReleaseConfig())) as {
        build: Record<string, { env: Record<string, string> }>;
      };
      const publishedDomain = getReleaseDomain(config, "production");
      config.build.staging = {
        env: { EXPO_PUBLIC_DOMAIN: publishedDomain },
      };
      const configPath = path.join(
        fixture.fixtureDirectory,
        "eas-with-staging.json",
      );
      writeFileSync(configPath, JSON.stringify(config), "utf8");

      const result = runNativeHandoffSubprocess(
        fixture,
        "configured-profiles",
        "0",
        "android",
        "preview",
        "",
        "",
        "",
        undefined,
        configPath,
      );

      const healthUrl = `https://${publishedDomain}/api/healthz`;
      const aiUrl = `https://${publishedDomain}/api/ai/describe`;
      const productionError =
        `[release-smoke] AI enrichment check failed for profile "production" at ${aiUrl}: HTTP 503.`;
      const passingSummary = (profile: string) => ({
        profile,
        domain: publishedDomain,
        status: "passed",
        healthUrl,
        aiUrl,
        healthAttempts: 1,
        aiAttempts: 1,
        recovered: false,
        error: null,
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        `Release connectivity failed before EAS build: production: ${productionError}`,
      );
      expect(existsSync(fixture.easRecordPath)).toBe(false);

      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        schemaVersion: number;
        status: string;
        summary: {
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
        allProfileConnectivity: {
          profiles: string[];
          passed: Array<{
            profile: string;
            domain: string;
            healthUrl: string;
            aiUrl: string;
            healthAttempts: number;
            aiAttempts: number;
          }>;
          failed: Array<{ profile: string; error: string }>;
        };
      };

      expect(report).toMatchObject({
        schemaVersion: RELEASE_REPORT_SCHEMA_VERSION,
        status: "failed",
        summary: {
          status: "failed",
          profiles: [
            passingSummary("preview"),
            {
              profile: "production",
              domain: publishedDomain,
              status: "failed",
              healthUrl,
              aiUrl,
              healthAttempts: 1,
              aiAttempts: 3,
              recovered: false,
              error: productionError,
            },
            passingSummary("staging"),
          ],
        },
        allProfileConnectivity: {
          profiles: ["preview", "production", "staging"],
          passed: [
            {
              profile: "preview",
              domain: publishedDomain,
              healthUrl,
              aiUrl,
              healthAttempts: 1,
              aiAttempts: 1,
            },
            {
              profile: "staging",
              domain: publishedDomain,
              healthUrl,
              aiUrl,
              healthAttempts: 1,
              aiAttempts: 1,
            },
          ],
          failed: [{ profile: "production", error: productionError }],
        },
      });
      expect(report.summary.profiles.map(({ profile }) => profile)).toEqual([
        "preview",
        "production",
        "staging",
      ]);
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("does not invoke EAS when a subprocess preflight fails", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    try {
      const result = runNativeHandoffSubprocess(fixture, "failed");

      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(
        /Release connectivity failed before EAS build: production: HTTP 503/,
      );
      expect(result.stderr).toContain(
        '[native-handoff] Retry totals for failed profile "production": health attempts: 3, AI attempts: 0.',
      );
      expect(existsSync(fixture.easRecordPath)).toBe(false);
      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        schemaVersion: number;
        status: string;
        androidProfile: string;
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
      expect(report).toMatchObject({
        schemaVersion: RELEASE_REPORT_SCHEMA_VERSION,
        status: "failed",
        androidProfile: "preview",
      });
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
            healthUrl: "https://production.example.com/api/healthz",
            aiUrl: "https://production.example.com/api/ai/describe",
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

  it("archives local health and AI timeout retries before starting EAS", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    try {
      const result = runNativeHandoffSubprocess(
        fixture,
        "timeout-recovered",
      );

      expect(result.status).toBe(0);
      expect(existsSync(fixture.easRecordPath)).toBe(true);

      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        status: string;
        connectivity: {
          healthAttempts: number;
          aiAttempts: number;
        };
        summary: {
          status: string;
          profiles: Array<{
            profile: string;
            healthAttempts: number;
            aiAttempts: number;
            recovered: boolean;
          }>;
        };
      };
      expect(report.status).toBe("completed");
      expect(report.connectivity).toMatchObject({
        healthAttempts: 2,
        aiAttempts: 2,
      });
      expect(report.summary.status).toBe("passed");
      expect(report.summary.profiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            profile: "preview",
            healthAttempts: 2,
            aiAttempts: 2,
            recovered: true,
          }),
          expect.objectContaining({
            profile: "production",
            healthAttempts: 1,
            aiAttempts: 1,
            recovered: false,
          }),
        ]),
      );
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("archives persistent local timeouts and blocks EAS", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    try {
      const result = runNativeHandoffSubprocess(
        fixture,
        "timeout-persistent",
      );

      expect(result.status).toBe(1);
      expect(existsSync(fixture.easRecordPath)).toBe(false);

      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        status: string;
        summary: {
          status: string;
          profiles: Array<{
            profile: string;
            healthAttempts: number;
            aiAttempts: number;
            recovered: boolean;
          }>;
        };
      };
      expect(report.status).toBe("failed");
      expect(report.summary.status).toBe("failed");
      expect(report.summary.profiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            profile: "preview",
            healthAttempts: 3,
            aiAttempts: 0,
            recovered: false,
          }),
          expect.objectContaining({
            profile: "production",
            healthAttempts: 3,
            aiAttempts: 0,
            recovered: false,
          }),
        ]),
      );
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("archives host-contract failures for the affected profile and blocks EAS", () => {
    const scenarios = [
      {
        platform: "android",
        selectedProfile: "production",
        hostValidation: {
          profile: "preview",
          expectedPublishedHost: "academy.example.com",
          configuredHost: "missing",
          validationStage: "profile-host-validation",
        },
      },
      {
        platform: "android",
        selectedProfile: "production",
        hostValidation: {
          profile: "preview",
          expectedPublishedHost: "academy.example.com",
          configuredHost: "wrong.example.com",
          validationStage: "profile-host-validation",
        },
      },
      {
        platform: "ios",
        selectedProfile: "preview",
        hostValidation: {
          profile: "production",
          expectedPublishedHost: "unavailable",
          configuredHost: "missing",
          validationStage: "profile-host-validation",
        },
      },
    ] as const;

    for (const scenario of scenarios) {
      const fixture = createNativeHandoffSubprocessFixture();
      try {
        const result = runNativeHandoffSubprocess(
          fixture,
          "host-failure",
          "0",
          scenario.platform,
          scenario.selectedProfile,
          "",
          "",
          "",
          scenario.hostValidation,
        );

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("EAS profile host contract failed.");
        expect(existsSync(fixture.easRecordPath)).toBe(false);

        const report = JSON.parse(
          readFileSync(fixture.reportPath, "utf8"),
        ) as {
          schemaVersion: number;
          platform: string;
          profile: string;
          status: string;
          failureStage: string;
          hostValidation: typeof scenario.hostValidation;
          summary: {
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
              error: string;
            }>;
          };
        };
        expect(report).toMatchObject({
          schemaVersion: RELEASE_REPORT_SCHEMA_VERSION,
          platform: scenario.platform,
          profile: scenario.selectedProfile,
          status: "failed",
          failureStage: "profile-host-validation",
          hostValidation: scenario.hostValidation,
          summary: {
            status: "failed",
            profiles: [
              {
                profile: scenario.hostValidation.profile,
                domain:
                  scenario.hostValidation.configuredHost === "missing"
                    ? null
                    : scenario.hostValidation.configuredHost,
                status: "failed",
                healthUrl: null,
                aiUrl: null,
                healthAttempts: 0,
                aiAttempts: 0,
                recovered: false,
              },
            ],
          },
        });

        const summaryError = report.summary.profiles[0].error;
        expect(summaryError).toContain(
          `expected published host "${scenario.hostValidation.expectedPublishedHost}"`,
        );
        expect(summaryError).toContain(
          `configured host "${scenario.hostValidation.configuredHost}"`,
        );
        expect(summaryError).toContain(
          `stage "${scenario.hostValidation.validationStage}"`,
        );
      } finally {
        rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
      }
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

  it("does not start production EAS when Android version increment is disabled", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    try {
      const result = runNativeHandoffSubprocess(
        fixture,
        "passed",
        "0",
        "android",
        "production",
        "production-autoIncrement",
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(
        /Aborted before EAS build: \[release-identity\] EAS production autoIncrement must be true to prevent Android version reuse; found false/,
      );
      expect(existsSync(fixture.easRecordPath)).toBe(false);
      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as Record<string, unknown>;
      expect(report).toMatchObject({
        schemaVersion: RELEASE_REPORT_SCHEMA_VERSION,
        platform: "android",
        profile: "production",
        androidProfile: "production",
        status: "failed",
        failureStage: "identity",
      });
      expect(report.error).toMatch(/autoIncrement must be true/);
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("reports recovered profile connectivity in native handoff output", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    try {
      const result = runNativeHandoffSubprocess(fixture, "recovered");

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        '[native-handoff] Release connectivity for profile "preview" passed after retries (health attempts: 2, AI attempts: 1).',
      );
      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        summary: {
          profiles: Array<{
            profile: string;
            healthAttempts: number;
            aiAttempts: number;
            recovered: boolean;
          }>;
        };
      };
      expect(report.summary.profiles[0]).toMatchObject({
        profile: "preview",
        healthAttempts: 2,
        aiAttempts: 1,
        recovered: true,
      });
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
        androidProfile: string;
        profile: string;
        status: string;
        build: Record<string, unknown>;
        summary: {
          status: string;
          profiles: Array<Record<string, unknown>>;
        };
      };
      expect(report.status).toBe("completed");
      expect(report.androidProfile).toBe("preview");
      expect(report.profile).toBe("preview");
      expect(report.build).not.toHaveProperty("androidVersionCode");
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

  it("completes a production store handoff when stub EAS returns an AAB", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    const providerChecksum = "c".repeat(64);
    try {
      const result = runNativeHandoffSubprocess(
        fixture,
        "passed",
        "0",
        "android",
        "production",
        "",
        "",
        providerChecksum,
      );

      expect(result.status).toBe(0);
      expect(JSON.parse(readFileSync(fixture.easRecordPath, "utf8"))).toEqual({
        args: [
          "build",
          "--platform",
          "android",
          "--profile",
          "production",
          "--json",
        ],
      });

      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as Record<string, unknown>;
      expect(report).toMatchObject({
        schemaVersion: RELEASE_REPORT_SCHEMA_VERSION,
        platform: "android",
        profile: "production",
        androidProfile: "production",
        status: "completed",
        build: {
          profile: "production",
          version: "1.0.0",
          androidVersionCode: 42,
          installerSha256: providerChecksum,
          installerSha256Source: "eas",
          installerUrl: "https://expo.dev/builds/stub-build.aab",
        },
      });
      expect(
        validateNativeHandoff({
          ...validHandoffConfig(),
          profile: "production",
          handoffReport: report,
        }),
      ).toMatchObject({
        status: "passed",
        platform: "android",
        profile: "production",
        distribution: "store",
        buildType: "app-bundle",
      });
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("fails the production handoff when stub EAS returns an APK", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    try {
      const result = runNativeHandoffSubprocess(
        fixture,
        "passed",
        "0",
        "android",
        "production",
        "",
        "apk",
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(
        /expected production Android App Bundle \(\.aab\) for store distribution; found .*\.apk/,
      );
      expect(JSON.parse(readFileSync(fixture.easRecordPath, "utf8"))).toEqual({
        args: [
          "build",
          "--platform",
          "android",
          "--profile",
          "production",
          "--json",
        ],
      });

      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as Record<string, unknown>;
      expect(report).toMatchObject({
        platform: "android",
        profile: "production",
        androidProfile: "production",
        status: "failed",
        failureStage: "build-metadata",
        easExitCode: 0,
      });
      expect(report.error).toMatch(
        /production Android App Bundle \(\.aab\) for store distribution/,
      );
      expect(report).not.toHaveProperty("build");
      expect(report.status).not.toBe("completed");
      expect(() =>
        validateNativeHandoff({
          ...validHandoffConfig(),
          profile: "production",
          handoffReport: report,
        }),
      ).toThrow(/handoff status must be "completed"/);
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
          androidVersionCode?: number;
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
      expect(report.build).not.toHaveProperty("androidVersionCode");
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("invokes the iOS production profile and archives IPA metadata", () => {
    const fixture = createNativeHandoffSubprocessFixture();
    try {
      const result = runNativeHandoffSubprocess(
        fixture,
        "passed",
        "0",
        "ios",
        "production",
      );

      expect(result.status).toBe(0);
      expect(JSON.parse(readFileSync(fixture.easRecordPath, "utf8"))).toEqual({
        args: [
          "build",
          "--platform",
          "ios",
          "--profile",
          "production",
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
        identity: { appId: string };
        build: {
          package: string;
          profile: string;
          installerUrl: string | null;
          installerPath: string | null;
          androidVersionCode?: number;
        };
      };
      expect(report).toMatchObject({
        status: "completed",
        platform: "ios",
        profile: "production",
        appId: "com.theacademy.mobile",
        identity: { appId: "com.theacademy.mobile" },
        build: {
          package: "com.theacademy.mobile",
          profile: "production",
          installerPath: null,
        },
      });
      expect(report.build.installerUrl).toMatch(/\.ipa$/);
      expect(report.build).not.toHaveProperty("androidVersionCode");
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("archives iOS check-only results without invoking EAS", () => {
    const fixture = createNativeHandoffSubprocessFixture({ checkOnly: true });
    try {
      const result = runNativeHandoffSubprocess(
        fixture,
        "passed",
        "0",
        "ios",
        "production",
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        'Release connectivity passed for profile "production".',
      );
      expect(result.stdout).toContain(
        "Check-only mode; EAS build was not started.",
      );
      expect(existsSync(fixture.easRecordPath)).toBe(false);

      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        status: string;
        platform: string;
        profile: string;
        appId: string;
        identity: { appId: string };
        connectivity: { profile: string; domain: string };
        summary: {
          status: string;
          profiles: Array<{ profile: string; status: string }>;
        };
      };
      expect(report).toMatchObject({
        status: "check-only",
        platform: "ios",
        profile: "production",
        appId: "com.theacademy.mobile",
        identity: { appId: "com.theacademy.mobile" },
        connectivity: {
          profile: "production",
          domain: "production.example.com",
        },
        summary: {
          status: "passed",
          profiles: [
            { profile: "preview", status: "passed" },
            { profile: "production", status: "passed" },
          ],
        },
      });
      expect(report).not.toHaveProperty("build");
      expect(report).not.toHaveProperty("easExitCode");
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("rejects preview EAS metadata for a production iOS handoff", () => {
    const fixture = createNativeHandoffSubprocessFixture({
      easOutputProfile: "preview",
    });
    try {
      const result = runNativeHandoffSubprocess(
        fixture,
        "passed",
        "0",
        "ios",
        "production",
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        'EAS profile "preview" does not match requested profile "production".',
      );
      expect(JSON.parse(readFileSync(fixture.easRecordPath, "utf8"))).toEqual({
        args: [
          "build",
          "--platform",
          "ios",
          "--profile",
          "production",
          "--json",
        ],
      });

      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        status: string;
        platform: string;
        profile: string;
        failureStage: string;
        easExitCode: number;
        error: string;
        summary: { status: string };
      };
      expect(report).toMatchObject({
        status: "failed",
        platform: "ios",
        profile: "production",
        failureStage: "build-metadata",
        easExitCode: 0,
        error:
          '[native-handoff] EAS profile "preview" does not match requested profile "production".',
        summary: { status: "passed" },
      });
      expect(report).not.toHaveProperty("build");
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
        schemaVersion: number;
        status: string;
        easExitCode: number;
        failureStage: string;
        error: string;
        easDiagnostics: {
          stdout: string;
          stderr: string;
        };
        summary: {
          status: string;
          profiles: Array<{ profile: string; status: string }>;
        };
      };
      expect(report).toMatchObject({
        schemaVersion: RELEASE_REPORT_SCHEMA_VERSION,
        status: "failed",
        easExitCode: 23,
        failureStage: "eas-build",
        error: "[native-handoff] EAS build failed with exit code 23.",
        easDiagnostics: {
          stdout: expect.stringContaining("Gradle task :app:bundleRelease failed"),
          stderr: expect.stringContaining("ERROR: EAS worker exited after Gradle failure."),
        },
        summary: {
          status: "passed",
          profiles: [
            { profile: "preview", status: "passed" },
            { profile: "production", status: "passed" },
          ],
        },
      });
      expect(report).not.toHaveProperty("easSignal");
      expect(report.easDiagnostics.stdout).toContain("[REDACTED]");
      expect(report.easDiagnostics.stdout).not.toContain("stdout-private-token");
      expect(report.easDiagnostics.stdout).not.toContain(
        "irrelevant-stdout-private-token",
      );
      expect(report.easDiagnostics.stdout).not.toContain("build-password");
      expect(report.easDiagnostics.stderr).toContain("[REDACTED]");
      expect(report.easDiagnostics.stderr).not.toContain("stderr-private-token");
      expect(report.easDiagnostics.stderr).not.toContain("fixture-private-key");
      expect(report.easDiagnostics.stderr).toContain("[REDACTED PRIVATE KEY]");
      expect(report.easDiagnostics.stdout.length).toBeLessThanOrEqual(4000);
      expect(report.easDiagnostics.stderr.length).toBeLessThanOrEqual(4000);
      expect(report.easDiagnostics.stdout).toContain(
        "[earlier diagnostics truncated]",
      );
      expect(report.easDiagnostics.stderr).toContain(
        "[earlier diagnostics truncated]",
      );
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("reports EAS signal termination separately from an exit-code failure", () => {
    const fixture = createNativeHandoffSubprocessFixture({
      terminationSignal: "SIGTERM",
    });
    try {
      const result = runNativeHandoffSubprocess(fixture, "passed");

      expect(result.status).toBe(1);
      expect(result.signal).toBeNull();
      expect(result.stdout).toMatch(
        /Release connectivity passed for profile "preview"/,
      );
      expect(result.stderr).toContain(
        "EAS build was terminated by signal SIGTERM.",
      );
      expect(existsSync(fixture.easRecordPath)).toBe(true);

      const report = JSON.parse(
        readFileSync(fixture.reportPath, "utf8"),
      ) as {
        schemaVersion: number;
        status: string;
        easExitCode: number | null;
        easSignal: string;
        failureStage: string;
        error: string;
        summary: {
          status: string;
          profiles: Array<{ profile: string; status: string }>;
        };
      };
      expect(report).toMatchObject({
        schemaVersion: RELEASE_REPORT_SCHEMA_VERSION,
        status: "failed",
        easExitCode: null,
        easSignal: "SIGTERM",
        failureStage: "eas-build",
        error: "[native-handoff] EAS build was terminated by signal SIGTERM.",
        summary: {
          status: "passed",
          profiles: [
            { profile: "preview", status: "passed" },
            { profile: "production", status: "passed" },
          ],
        },
      });
      expect(report).not.toHaveProperty("build");
    } finally {
      rmSync(fixture.fixtureDirectory, { recursive: true, force: true });
    }
  });
});