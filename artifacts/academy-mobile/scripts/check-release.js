const fs = require("fs");
const path = require("path");

const DEFAULT_PROFILE = "preview";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_REQUEST_ATTEMPTS = 3;
const RETRY_DELAY_MS = 250;
const EXPECTED_ANDROID_PACKAGE = "com.theacademy.mobile";
const APP_CONFIG_PATH = path.resolve(__dirname, "..", "app.json");
const EAS_CONFIG_PATH = path.resolve(__dirname, "..", "eas.json");
const GENERATED_ANDROID_MANIFEST_PATH = path.resolve(
  __dirname,
  "..",
  "static-build",
  "android",
  "manifest.json",
);
const DEFAULT_REPORT_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  ".local",
  "outputs",
  "academy-mobile-release-smoke.json",
);
const DEFAULT_HANDOFF_REPORT_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  ".local",
  "outputs",
  "academy-mobile-native-handoff.json",
);

function readReleaseConfig(configPath = EAS_CONFIG_PATH) {
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(
      `[release-smoke] Could not read EAS release configuration at ${configPath}: ${error.message}`,
    );
  }
}

function readJsonFile(configPath, label) {
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(
      `[release-identity] Could not read ${label} at ${configPath}: ${error.message}`,
    );
  }
}

function validateAndroidPreviewIdentity({
  appConfig,
  easConfig,
  generatedManifest,
  appConfigPath = APP_CONFIG_PATH,
  easConfigPath = EAS_CONFIG_PATH,
  generatedManifestPath = GENERATED_ANDROID_MANIFEST_PATH,
} = {}) {
  const resolvedAppConfig =
    appConfig ?? readJsonFile(appConfigPath, "app.json");
  const resolvedEasConfig =
    easConfig ?? readJsonFile(easConfigPath, "eas.json");
  const resolvedGeneratedManifest =
    generatedManifest ??
    readJsonFile(generatedManifestPath, "generated Android manifest");

  const configuredPackage = resolvedAppConfig?.expo?.android?.package;
  if (configuredPackage !== EXPECTED_ANDROID_PACKAGE) {
    throw new Error(
      `[release-identity] Android package drift: expected ${EXPECTED_ANDROID_PACKAGE}, found ${configuredPackage || "missing"} in app.json.`,
    );
  }

  const previewProfile = resolvedEasConfig?.build?.preview;
  if (!previewProfile || typeof previewProfile !== "object") {
    throw new Error(
      '[release-identity] EAS profile "preview" is missing from eas.json.',
    );
  }
  if (previewProfile.distribution !== "internal") {
    throw new Error(
      `[release-identity] EAS preview distribution must be "internal" for an APK handoff; found ${previewProfile.distribution || "missing"}.`,
    );
  }
  if (previewProfile.android?.buildType !== "apk") {
    throw new Error(
      `[release-identity] EAS preview Android buildType must be "apk"; found ${previewProfile.android?.buildType || "missing"}.`,
    );
  }

  const generatedPackage =
    resolvedGeneratedManifest?.extra?.expoClient?.android?.package;
  if (!generatedPackage) {
    throw new Error(
      `[release-identity] Generated Android manifest is missing extra.expoClient.android.package at ${generatedManifestPath}. Run the mobile static build before the release check.`,
    );
  }
  if (generatedPackage !== configuredPackage) {
    throw new Error(
      `[release-identity] Generated Android package drift: app.json declares ${configuredPackage}, but generated Android metadata declares ${generatedPackage}. Rebuild the mobile static metadata before handoff.`,
    );
  }

  return {
    androidPackage: configuredPackage,
    generatedAndroidPackage: generatedPackage,
    previewDistribution: previewProfile.distribution,
    previewBuildType: previewProfile.android.buildType,
  };
}

function getReleaseProfiles(config) {
  const buildProfiles = config?.build;
  if (!buildProfiles || typeof buildProfiles !== "object") {
    throw new Error(
      "[release-smoke] EAS release configuration must define build profiles.",
    );
  }

  return Object.entries(buildProfiles)
    .filter(([, releaseProfile]) => {
      const env = releaseProfile?.env;
      return (
        env &&
        typeof env === "object" &&
        Object.prototype.hasOwnProperty.call(env, "EXPO_PUBLIC_DOMAIN")
      );
    })
    .map(([profile]) => profile);
}

function getReleaseDomain(config, profile) {
  const releaseProfile = config?.build?.[profile];
  const rawDomain = releaseProfile?.env?.EXPO_PUBLIC_DOMAIN;

  if (!rawDomain || typeof rawDomain !== "string") {
    throw new Error(
      `[release-smoke] Profile "${profile}" must define build.${profile}.env.EXPO_PUBLIC_DOMAIN in eas.json.`,
    );
  }

  const trimmedDomain = rawDomain.trim();
  const parsed = new URL(
    /^https?:\/\//i.test(trimmedDomain)
      ? trimmedDomain
      : `https://${trimmedDomain}`,
  );

  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      `[release-smoke] Profile "${profile}" has an invalid public hostname "${rawDomain}". Set EXPO_PUBLIC_DOMAIN to an HTTPS hostname only.`,
    );
  }

  return parsed.hostname;
}

async function fetchWithTimeout(fetchImpl, url, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function isRetryableResponse(response) {
  return response.status >= 500 && response.status <= 599;
}

async function fetchWithRetry(
  fetchImpl,
  url,
  init,
  { retryDelayMs = RETRY_DELAY_MS, sleepImpl = sleep } = {},
) {
  for (let attempt = 1; attempt <= MAX_REQUEST_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(fetchImpl, url, init);
      if (!isRetryableResponse(response) || attempt === MAX_REQUEST_ATTEMPTS) {
        return response;
      }
    } catch (error) {
      if (attempt === MAX_REQUEST_ATTEMPTS) {
        throw error;
      }
    }

    await sleepImpl(retryDelayMs);
  }

  throw new Error(`[release-smoke] Request retry limit reached for ${url}.`);
}

async function readJson(response, label) {
  try {
    return await response.json();
  } catch (error) {
    throw new Error(
      `[release-smoke] ${label} returned invalid JSON: ${error.message}`,
    );
  }
}

async function runReleaseSmokeCheck({
  profile = DEFAULT_PROFILE,
  configPath = EAS_CONFIG_PATH,
  fetchImpl = fetch,
  retryDelayMs = RETRY_DELAY_MS,
  sleepImpl = sleep,
} = {}) {
  const config = readReleaseConfig(configPath);
  const domain = getReleaseDomain(config, profile);
  const baseUrl = `https://${domain}`;
  const healthUrl = `${baseUrl}/api/healthz`;
  const aiUrl = `${baseUrl}/api/ai/describe`;

  let healthResponse;
  try {
    healthResponse = await fetchWithRetry(
      fetchImpl,
      healthUrl,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      },
      { retryDelayMs, sleepImpl },
    );
  } catch (error) {
    throw new Error(
      `[release-smoke] Health check could not reach ${healthUrl}: ${error.message}`,
    );
  }

  if (!healthResponse.ok) {
    throw new Error(
      `[release-smoke] Health check failed for profile "${profile}" at ${healthUrl}: HTTP ${healthResponse.status}.`,
    );
  }

  const health = await readJson(healthResponse, "Health endpoint");
  if (health?.status !== "ok") {
    throw new Error(
      `[release-smoke] Health endpoint ${healthUrl} returned an unexpected payload; expected {"status":"ok"}.`,
    );
  }

  let aiResponse;
  try {
    aiResponse = await fetchWithRetry(
      fetchImpl,
      aiUrl,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "location",
          locationName: "Academy Library",
          locationDescription: "A quiet room lined with books.",
          npcsPresent: [],
          interactables: [],
        }),
      },
      { retryDelayMs, sleepImpl },
    );
  } catch (error) {
    throw new Error(
      `[release-smoke] AI enrichment check could not reach ${aiUrl}: ${error.message}`,
    );
  }

  if (!aiResponse.ok) {
    throw new Error(
      `[release-smoke] AI enrichment check failed for profile "${profile}" at ${aiUrl}: HTTP ${aiResponse.status}.`,
    );
  }

  const aiPayload = await readJson(aiResponse, "AI enrichment endpoint");
  if (typeof aiPayload?.description !== "string" || !aiPayload.description.trim()) {
    throw new Error(
      `[release-smoke] AI enrichment endpoint ${aiUrl} returned no description.`,
    );
  }

  return {
    profile,
    domain,
    healthUrl,
    aiUrl,
  };
}

async function runReleaseSmokeChecks({
  configPath = EAS_CONFIG_PATH,
  fetchImpl = fetch,
  retryDelayMs = RETRY_DELAY_MS,
  sleepImpl = sleep,
} = {}) {
  const config = readReleaseConfig(configPath);
  const profiles = getReleaseProfiles(config);

  if (profiles.length === 0) {
    throw new Error(
      "[release-smoke] No EAS build profiles define EXPO_PUBLIC_DOMAIN in eas.json.",
    );
  }

  const passed = [];
  const failed = [];

  for (const profile of profiles) {
    let domain = null;
    try {
      domain = getReleaseDomain(config, profile);
    } catch {
      // Preserve the profile in the machine-readable failure summary.
    }
    try {
      passed.push(
        await runReleaseSmokeCheck({
          profile,
          configPath,
          fetchImpl,
          retryDelayMs,
          sleepImpl,
        }),
      );
    } catch (error) {
      failed.push({
        profile,
        domain,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  return { profiles, passed, failed };
}

function summarizeReleaseSmokeResult(result) {
  const passedByProfile = new Map(
    result.passed.map((entry) => [entry.profile, entry]),
  );
  const failedByProfile = new Map(
    result.failed.map((entry) => [entry.profile, entry]),
  );

  return {
    status: result.failed.length > 0 ? "failed" : "passed",
    profiles: result.profiles.map((profile) => {
      const passed = passedByProfile.get(profile);
      const failed = failedByProfile.get(profile);
      return {
        profile,
        domain: passed?.domain ?? failed?.domain ?? null,
        status: passed ? "passed" : "failed",
        healthUrl: passed?.healthUrl ?? null,
        aiUrl: passed?.aiUrl ?? null,
        error: failed
          ? failed.error instanceof Error
            ? failed.error.message
            : String(failed.error)
          : null,
      };
    }),
  };
}

function validateNativeHandoff({
  handoffReport,
  appConfig,
  easConfig,
  handoffReportPath = DEFAULT_HANDOFF_REPORT_PATH,
} = {}) {
  const resolvedAppConfig =
    appConfig ?? readJsonFile(APP_CONFIG_PATH, "app.json");
  const resolvedEasConfig =
    easConfig ?? readJsonFile(EAS_CONFIG_PATH, "eas.json");
  const report =
    handoffReport ??
    readJsonFile(handoffReportPath, "native handoff report");
  const configuredPackage = resolvedAppConfig?.expo?.android?.package;
  const configuredVersion = resolvedAppConfig?.expo?.version;
  const previewProfile = resolvedEasConfig?.build?.preview;
  const build = report?.build;
  const errors = [];

  if (!previewProfile || typeof previewProfile !== "object") {
    errors.push('EAS profile "preview" is missing from eas.json');
  } else {
    if (previewProfile.distribution !== "internal") {
      errors.push(
        `preview distribution must be "internal" (found ${previewProfile.distribution || "missing"})`,
      );
    }
    if (previewProfile.android?.buildType !== "apk") {
      errors.push(
        `preview Android buildType must be "apk" (found ${previewProfile.android?.buildType || "missing"})`,
      );
    }
  }

  if (report?.status !== "completed") {
    errors.push(
      `handoff status must be "completed" (found ${report?.status || "missing"})`,
    );
  }
  if (report?.platform !== "android") {
    errors.push(
      `handoff platform must be "android" (found ${report?.platform || "missing"})`,
    );
  }
  if (report?.profile !== "preview") {
    errors.push(
      `handoff profile must be "preview" (found ${report?.profile || "missing"})`,
    );
  }
  if (!build || typeof build !== "object") {
    errors.push("handoff build metadata is missing");
  } else {
    const installerUrl =
      typeof build.installerUrl === "string" ? build.installerUrl.trim() : "";
    const installerPath =
      typeof build.installerPath === "string" ? build.installerPath.trim() : "";
    const installerReference = installerUrl || installerPath;
    const hasExpectedArtifactType = /\.apk(?:[?#]|$)/i.test(installerReference);
    const hasEasBuildMetadata =
      typeof build.buildId === "string" &&
      build.buildId.trim().length > 0 &&
      typeof build.buildDetailsPageUrl === "string" &&
      /^https?:\/\//i.test(build.buildDetailsPageUrl);

    if (!installerReference) {
      errors.push("installerUrl or installerPath is missing");
    } else if (!hasExpectedArtifactType && !hasEasBuildMetadata) {
      errors.push(
        "installer reference is not an .apk and has no EAS buildId/buildDetailsPageUrl metadata",
      );
    }
    if (!configuredVersion) {
      errors.push("app.json expo.version is missing");
    } else if (String(build.version) !== String(configuredVersion)) {
      errors.push(
        `build version "${build.version || "missing"}" does not match app.json "${configuredVersion}"`,
      );
    }
    if (!configuredPackage) {
      errors.push("app.json expo.android.package is missing");
    } else if (build.package !== configuredPackage) {
      errors.push(
        `build package "${build.package || "missing"}" does not match app.json "${configuredPackage}"`,
      );
    }
    if (typeof build.profile !== "string" || build.profile !== "preview") {
      errors.push(
        `build profile must be "preview" (found ${build.profile || "missing"})`,
      );
    }
    if (
      typeof build.timestamp !== "string" ||
      Number.isNaN(new Date(build.timestamp).getTime())
    ) {
      errors.push("build timestamp is missing or invalid");
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `[release-handoff] Installer handoff validation failed:\n- ${errors.join("\n- ")}`,
    );
  }

  return {
    status: "passed",
    platform: "android",
    profile: "preview",
    distribution: "internal",
    buildType: "apk",
    version: String(build.version),
    androidPackage: configuredPackage,
    installerUrl: build.installerUrl || null,
    installerPath: build.installerPath || null,
    timestamp: build.timestamp,
    buildId: build.buildId || null,
  };
}

function writeReleaseReport(reportPath, report) {
  const resolvedPath = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  fs.writeFileSync(
    resolvedPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        ...report,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return resolvedPath;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const identityOnly = args.includes("--identity-only");
  const handoffOnly =
    args.includes("--handoff") || args.includes("--validate-handoff");
  const allProfiles =
    args.includes("--all") ||
    args.includes("--all-profiles") ||
    process.env.RELEASE_PROFILE === "all";
  const profile =
    args.find(
      (argument, index) =>
        !argument.startsWith("--") && args[index - 1] !== "--report",
    ) ||
    process.env.RELEASE_PROFILE ||
    DEFAULT_PROFILE;
  const reportFlagIndex = args.indexOf("--report");
  if (
    reportFlagIndex >= 0 &&
    (!args[reportFlagIndex + 1] ||
      args[reportFlagIndex + 1].startsWith("--"))
  ) {
    console.error("[release-smoke] --report requires a file path.");
    process.exitCode = 1;
    return;
  }
  const reportPath =
    reportFlagIndex >= 0
      ? args[reportFlagIndex + 1]
      : process.env.RELEASE_REPORT_PATH || DEFAULT_REPORT_PATH;

  if (handoffOnly) {
    const handoffReportPath =
      process.env.RELEASE_HANDOFF_PATH || DEFAULT_HANDOFF_REPORT_PATH;
    try {
      const handoff = validateNativeHandoff({ handoffReportPath });
      const report = writeReleaseReport(reportPath, {
        command: "check-release --handoff",
        status: "passed",
        handoff,
      });
      console.log(
        `[release-handoff] Installer handoff passed. Report written to ${report}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      writeReleaseReport(reportPath, {
        command: "check-release --handoff",
        status: "failed",
        error: message,
      });
      console.error(message);
      process.exitCode = 1;
    }
    return;
  }

  let androidIdentity;
  try {
    androidIdentity = validateAndroidPreviewIdentity();
    console.log(
      `[release-identity] Android package ${androidIdentity.androidPackage} matches app.json, EAS preview APK settings, and generated metadata.`,
    );
    if (identityOnly) {
      const report = writeReleaseReport(reportPath, {
        command: "check-release --identity-only",
        status: "passed",
        androidIdentity,
      });
      console.log(`[release-identity] Report written to ${report}`);
      return;
    }
  } catch (error) {
    writeReleaseReport(reportPath, {
      command: `check-release ${identityOnly ? "--identity-only" : profile}`,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  const check = allProfiles
    ? runReleaseSmokeChecks().then((result) => {
        const summary = summarizeReleaseSmokeResult(result);
        const report = writeReleaseReport(reportPath, {
          command: "check-release --all",
          androidIdentity,
          ...result,
          status: summary.status,
          summary,
        });
        const { passed, failed } = result;
        for (const result of passed) {
          console.log(
            `[release-smoke] ${result.profile} passed for ${result.domain}: ${result.healthUrl} and ${result.aiUrl}`,
          );
        }
        for (const failure of failed) {
          console.error(
            `[release-smoke] ${failure.profile} failed: ${failure.error.message}`,
          );
        }
        console.log(`[release-smoke] Report written to ${report}`);
        if (failed.length > 0) {
          process.exitCode = 1;
        }
      })
    : runReleaseSmokeCheck({ profile }).then((result) => {
        const report = writeReleaseReport(reportPath, {
          command: `check-release ${result.profile}`,
          status: "passed",
          androidIdentity,
          result,
        });
        const { profile: checkedProfile, domain, healthUrl, aiUrl } = result;
        console.log(
          `[release-smoke] ${checkedProfile} passed for ${domain}: ${healthUrl} and ${aiUrl}`,
        );
        console.log(`[release-smoke] Report written to ${report}`);
      });

  check
    .catch((error) => {
      writeReleaseReport(reportPath, {
        command: `check-release ${allProfiles ? "--all" : profile}`,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(error.message);
      process.exitCode = 1;
    });
}

module.exports = {
  EXPECTED_ANDROID_PACKAGE,
  getReleaseDomain,
  getReleaseProfiles,
  readReleaseConfig,
  validateNativeHandoff,
  validateAndroidPreviewIdentity,
  runReleaseSmokeCheck,
  runReleaseSmokeChecks,
  summarizeReleaseSmokeResult,
  writeReleaseReport,
};