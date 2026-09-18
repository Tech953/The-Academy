const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const DEFAULT_PROFILE = "preview";
const RELEASE_REPORT_SCHEMA_VERSION = 1;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_REQUEST_ATTEMPTS = 3;
const RETRY_DELAY_MS = 250;
const EXPECTED_ANDROID_PACKAGE = "com.theacademy.mobile";
const EXPECTED_RELEASE_HOSTNAME = "theeacademy.replit.app";
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

function validateAndroidProfileIdentity({
  profileName,
  expectedDistribution,
  expectedBuildType,
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

  const releaseProfile = resolvedEasConfig?.build?.[profileName];
  if (!releaseProfile || typeof releaseProfile !== "object") {
    throw new Error(
      `[release-identity] EAS profile "${profileName}" is missing from eas.json.`,
    );
  }
  if (
    expectedDistribution !== undefined &&
    releaseProfile.distribution !== expectedDistribution
  ) {
    throw new Error(
      `[release-identity] EAS ${profileName} distribution must be "${expectedDistribution}" for an APK handoff; found ${releaseProfile.distribution || "missing"}.`,
    );
  }
  if (releaseProfile.android?.buildType !== expectedBuildType) {
    throw new Error(
      `[release-identity] EAS ${profileName} Android buildType must be "${expectedBuildType}"; found ${releaseProfile.android?.buildType || "missing"}.`,
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
    distribution: releaseProfile.distribution,
    buildType: releaseProfile.android.buildType,
  };
}

function validateAndroidPreviewIdentity(options = {}) {
  const identity = validateAndroidProfileIdentity({
    ...options,
    profileName: "preview",
    expectedDistribution: "internal",
    expectedBuildType: "apk",
  });

  return {
    androidPackage: identity.androidPackage,
    generatedAndroidPackage: identity.generatedAndroidPackage,
    previewDistribution: identity.distribution,
    previewBuildType: identity.buildType,
  };
}

function validateAndroidProductionIdentity(options = {}) {
  const identity = validateAndroidProfileIdentity({
    ...options,
    profileName: "production",
    expectedBuildType: "app-bundle",
  });

  return {
    androidPackage: identity.androidPackage,
    generatedAndroidPackage: identity.generatedAndroidPackage,
    productionBuildType: identity.buildType,
  };
}

function validateAndroidReleaseIdentity(profile = DEFAULT_PROFILE, options = {}) {
  if (profile === "preview") {
    return validateAndroidPreviewIdentity(options);
  }
  if (profile === "production") {
    return validateAndroidProductionIdentity(options);
  }
  throw new Error(
    `[release-identity] Unsupported Android release profile "${profile}". Expected "preview" or "production".`,
  );
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

function validateReleaseProfileHost(config, profile) {
  const domain = getReleaseDomain(config, profile);
  if (domain !== EXPECTED_RELEASE_HOSTNAME) {
    throw new Error(
      `[release-smoke] Profile "${profile}" must target the published Academy hostname "${EXPECTED_RELEASE_HOSTNAME}" over HTTPS; found "${domain}". Update build.${profile}.env.EXPO_PUBLIC_DOMAIN in eas.json.`,
    );
  }
  return domain;
}

function validateRequiredReleaseProfileHosts(config) {
  for (const profile of ["preview", "production"]) {
    if (!config?.build?.[profile] || typeof config.build[profile] !== "object") {
      throw new Error(
        `[release-smoke] Required release profile "${profile}" is missing from eas.json.`,
      );
    }
    validateReleaseProfileHost(config, profile);
  }
}

async function fetchWithTimeout(
  fetchImpl,
  url,
  init,
  timeoutMs = REQUEST_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
  {
    retryDelayMs = RETRY_DELAY_MS,
    sleepImpl = sleep,
    requestTimeoutMs = REQUEST_TIMEOUT_MS,
  } = {},
) {
  for (let attempt = 1; attempt <= MAX_REQUEST_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        fetchImpl,
        url,
        init,
        requestTimeoutMs,
      );
      if (!isRetryableResponse(response) || attempt === MAX_REQUEST_ATTEMPTS) {
        return { response, attempts: attempt };
      }
    } catch (error) {
      if (attempt === MAX_REQUEST_ATTEMPTS) {
        const retryError =
          error instanceof Error ? error : new Error(String(error));
        retryError.attempts = attempt;
        throw retryError;
      }
    }

    await sleepImpl(retryDelayMs);
  }

  throw new Error(`[release-smoke] Request retry limit reached for ${url}.`);
}

function withAttemptCounts(error, healthAttempts, aiAttempts) {
  const annotated = error instanceof Error ? error : new Error(String(error));
  annotated.healthAttempts = healthAttempts;
  annotated.aiAttempts = aiAttempts;
  return annotated;
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
  requestTimeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  const config = readReleaseConfig(configPath);
  const domain = validateReleaseProfileHost(config, profile);
  const baseUrl = `https://${domain}`;
  const healthUrl = `${baseUrl}/api/healthz`;
  const aiUrl = `${baseUrl}/api/ai/describe`;

  let healthResponse;
  let healthAttempts = 0;
  try {
    const healthResult = await fetchWithRetry(
      fetchImpl,
      healthUrl,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      },
      { retryDelayMs, sleepImpl, requestTimeoutMs },
    );
    healthResponse = healthResult.response;
    healthAttempts = healthResult.attempts;
  } catch (error) {
    throw withAttemptCounts(
      new Error(
        `[release-smoke] Health check could not reach ${healthUrl}: ${error.message}`,
      ),
      error.attempts ?? MAX_REQUEST_ATTEMPTS,
      0,
    );
  }

  if (!healthResponse.ok) {
    throw withAttemptCounts(
      new Error(
        `[release-smoke] Health check failed for profile "${profile}" at ${healthUrl}: HTTP ${healthResponse.status}.`,
      ),
      healthAttempts,
      0,
    );
  }

  try {
    const health = await readJson(healthResponse, "Health endpoint");
    if (health?.status !== "ok") {
      throw new Error(
        `[release-smoke] Health endpoint ${healthUrl} returned an unexpected payload; expected {"status":"ok"}.`,
      );
    }
  } catch (error) {
    throw withAttemptCounts(error, healthAttempts, 0);
  }

  let aiResponse;
  let aiAttempts = 0;
  try {
    const aiResult = await fetchWithRetry(
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
      { retryDelayMs, sleepImpl, requestTimeoutMs },
    );
    aiResponse = aiResult.response;
    aiAttempts = aiResult.attempts;
  } catch (error) {
    throw withAttemptCounts(
      new Error(
        `[release-smoke] AI enrichment check could not reach ${aiUrl}: ${error.message}`,
      ),
      healthAttempts,
      error.attempts ?? MAX_REQUEST_ATTEMPTS,
    );
  }

  if (!aiResponse.ok) {
    throw withAttemptCounts(
      new Error(
        `[release-smoke] AI enrichment check failed for profile "${profile}" at ${aiUrl}: HTTP ${aiResponse.status}.`,
      ),
      healthAttempts,
      aiAttempts,
    );
  }

  try {
    const aiPayload = await readJson(aiResponse, "AI enrichment endpoint");
    if (
      typeof aiPayload?.description !== "string" ||
      !aiPayload.description.trim()
    ) {
      throw new Error(
        `[release-smoke] AI enrichment endpoint ${aiUrl} returned no description.`,
      );
    }
  } catch (error) {
    throw withAttemptCounts(error, healthAttempts, aiAttempts);
  }

  return {
    profile,
    domain,
    healthUrl,
    aiUrl,
    healthAttempts,
    aiAttempts,
  };
}

async function runReleaseSmokeChecks({
  configPath = EAS_CONFIG_PATH,
  fetchImpl = fetch,
  retryDelayMs = RETRY_DELAY_MS,
  sleepImpl = sleep,
} = {}) {
  const config = readReleaseConfig(configPath);
  validateRequiredReleaseProfileHosts(config);
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
        healthAttempts: error.healthAttempts ?? 0,
        aiAttempts: error.aiAttempts ?? 0,
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
      const healthAttempts =
        passed?.healthAttempts ?? failed?.healthAttempts ?? (passed ? 1 : 0);
      const aiAttempts =
        passed?.aiAttempts ?? failed?.aiAttempts ?? (passed ? 1 : 0);
      return {
        profile,
        domain: passed?.domain ?? failed?.domain ?? null,
        status: passed ? "passed" : "failed",
        healthUrl: passed?.healthUrl ?? null,
        aiUrl: passed?.aiUrl ?? null,
        healthAttempts,
        aiAttempts,
        recovered:
          Boolean(passed) && (healthAttempts > 1 || aiAttempts > 1),
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
  profile = "preview",
  platform = "android",
  handoffReportPath = DEFAULT_HANDOFF_REPORT_PATH,
} = {}) {
  const resolvedAppConfig =
    appConfig ?? readJsonFile(APP_CONFIG_PATH, "app.json");
  const resolvedEasConfig =
    easConfig ?? readJsonFile(EAS_CONFIG_PATH, "eas.json");
  const report =
    handoffReport ??
    readJsonFile(handoffReportPath, "native handoff report");
  if (platform !== "android" && platform !== "ios") {
    throw new Error(
      `[release-handoff] Unsupported handoff platform "${platform}". Expected "android" or "ios".`,
    );
  }
  const isIos = platform === "ios";
  const configuredPackage = isIos
    ? resolvedAppConfig?.expo?.ios?.bundleIdentifier
    : resolvedAppConfig?.expo?.android?.package;
  const configuredVersion = resolvedAppConfig?.expo?.version;
  const releaseProfile = resolvedEasConfig?.build?.[profile];
  const isProduction = profile === "production";
  const expectedBuildType = isIos
    ? "ipa"
    : isProduction
      ? "app-bundle"
      : "apk";
  const expectedArtifactExtension = isIos ? "ipa" : isProduction ? "aab" : "apk";
  const expectedDistribution = isProduction ? "store" : "internal";
  const expectedArtifactLabel = isIos
    ? `a ${isProduction ? "production store" : "preview internal"} iOS IPA (.ipa)`
    : isProduction
      ? "a production Android App Bundle (.aab) for store distribution"
      : "a preview internal APK (.apk)";
  const build = report?.build;
  const errors = [];

  if (!releaseProfile || typeof releaseProfile !== "object") {
    errors.push(`EAS profile "${profile}" is missing from eas.json`);
  } else {
    if (isIos) {
      if (
        (isProduction && releaseProfile.distribution === "internal") ||
        (!isProduction && releaseProfile.distribution !== "internal")
      ) {
        errors.push(
          `${profile} distribution must be "${expectedDistribution}" for ${expectedArtifactLabel} (found ${releaseProfile.distribution || "missing"})`,
        );
      }
    } else {
      if (isProduction) {
        if (releaseProfile.distribution === "internal") {
          errors.push(
            'production distribution must be "store" for an Android App Bundle (found internal)',
          );
        }
      } else if (releaseProfile.distribution !== "internal") {
        errors.push(
          `preview distribution must be "internal" for an APK handoff (found ${releaseProfile.distribution || "missing"})`,
        );
      }
      if (releaseProfile.android?.buildType !== expectedBuildType) {
        errors.push(
          `${profile} Android buildType must be "${expectedBuildType}" for ${expectedArtifactLabel}; found ${releaseProfile.android?.buildType || "missing"}`,
        );
      }
    }
  }

  if (report?.status !== "completed") {
    errors.push(
      `handoff status must be "completed" (found ${report?.status || "missing"})`,
    );
  }
  if (report?.platform !== platform) {
    errors.push(
      `handoff platform must be "${platform}" (found ${report?.platform || "missing"})`,
    );
  }
  if (report?.profile !== profile) {
    errors.push(
      `handoff profile must be "${profile}" (found ${report?.profile || "missing"})`,
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
    const hasExpectedArtifactType = new RegExp(
      `\\.${expectedArtifactExtension}(?:[?#]|$)`,
      "i",
    ).test(installerReference);
    const hasKnownArtifactType = /\.(?:apk|aab|ipa)(?:[?#]|$)/i.test(
      installerReference,
    );
    const hasEasBuildMetadata =
      typeof build.buildId === "string" &&
      build.buildId.trim().length > 0 &&
      typeof build.buildDetailsPageUrl === "string" &&
      /^https?:\/\//i.test(build.buildDetailsPageUrl);

    if (!installerReference) {
      errors.push("installerUrl or installerPath is missing");
    } else if (
      !hasExpectedArtifactType &&
      (isIos || isProduction || !hasEasBuildMetadata || hasKnownArtifactType)
    ) {
      errors.push(
        `installer reference must be ${expectedArtifactLabel}; found ${installerReference}`,
      );
    }
    if (!configuredVersion) {
      errors.push("app.json expo.version is missing");
    } else if (String(build.version) !== String(configuredVersion)) {
      errors.push(
        `build version "${build.version || "missing"}" does not match app.json "${configuredVersion}"`,
      );
    }
    const buildPackage = isIos
      ? build.bundleIdentifier ?? build.package
      : build.package;
    if (!configuredPackage) {
      errors.push(
        isIos
          ? "app.json expo.ios.bundleIdentifier is missing"
          : "app.json expo.android.package is missing",
      );
    } else if (buildPackage !== configuredPackage) {
      errors.push(
        isIos
          ? `build bundle identifier "${buildPackage || "missing"}" does not match app.json "${configuredPackage}"`
          : `build package "${buildPackage || "missing"}" does not match app.json "${configuredPackage}"`,
      );
    }
    if (typeof build.profile !== "string" || build.profile !== profile) {
      errors.push(
        `build profile must be "${profile}" (found ${build.profile || "missing"})`,
      );
    }
    if (
      typeof build.timestamp !== "string" ||
      Number.isNaN(new Date(build.timestamp).getTime())
    ) {
      errors.push("build timestamp is missing or invalid");
    }
    if (
      build.installerSha256 !== undefined &&
      build.installerSha256 !== null &&
      !/^[a-f0-9]{64}$/i.test(build.installerSha256)
    ) {
      errors.push("installerSha256 must be a 64-character SHA-256 hex digest");
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `[release-handoff] Installer handoff validation failed:\n- ${errors.join("\n- ")}`,
    );
  }

  return {
    status: "passed",
    platform,
    profile,
    distribution:
      releaseProfile?.distribution || expectedDistribution,
    buildType: expectedBuildType,
    version: String(build.version),
    ...(isIos
      ? { iosBundleIdentifier: configuredPackage }
      : { androidPackage: configuredPackage }),
    installerUrl: build.installerUrl || null,
    installerPath: build.installerPath || null,
    timestamp: build.timestamp,
    buildId: build.buildId || null,
  };
}

function computeFileSha256(filePath) {
  try {
    return crypto
      .createHash("sha256")
      .update(fs.readFileSync(filePath))
      .digest("hex");
  } catch (error) {
    throw new Error(
      `[release-checksum] Could not read installer artifact at ${filePath}: ${error.message}`,
    );
  }
}

function verifyInstallerChecksum({
  artifactPath,
  handoffReport,
  handoffReportPath = DEFAULT_HANDOFF_REPORT_PATH,
} = {}) {
  const report =
    handoffReport ??
    readJsonFile(handoffReportPath, "native handoff report");
  const expectedChecksum = report?.build?.installerSha256;

  if (!artifactPath) {
    throw new Error(
      "[release-checksum] An installer artifact path is required.",
    );
  }
  if (
    typeof expectedChecksum !== "string" ||
    !/^[a-f0-9]{64}$/i.test(expectedChecksum)
  ) {
    throw new Error(
      "[release-checksum] The handoff report has no local installer checksum; cloud-only handoffs remain valid without one.",
    );
  }

  const actualChecksum = computeFileSha256(artifactPath);
  if (actualChecksum.toLowerCase() !== expectedChecksum.toLowerCase()) {
    throw new Error(
      `[release-checksum] SHA-256 mismatch for ${artifactPath}: expected ${expectedChecksum}, found ${actualChecksum}.`,
    );
  }

  return {
    status: "passed",
    artifactPath,
    installerSha256: actualChecksum,
  };
}

function writeReleaseReport(reportPath, report) {
  const resolvedPath = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  fs.writeFileSync(
    resolvedPath,
    `${JSON.stringify(
      {
        ...report,
        schemaVersion: RELEASE_REPORT_SCHEMA_VERSION,
        generatedAt: new Date().toISOString(),
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
  const verifyChecksumIndex = args.indexOf("--verify-checksum");
  const allProfiles =
    args.includes("--all") ||
    args.includes("--all-profiles") ||
    process.env.RELEASE_PROFILE === "all";
  const profileFlagIndex = args.indexOf("--profile");
  const profile =
    (profileFlagIndex >= 0 ? args[profileFlagIndex + 1] : undefined) ||
    args.find(
      (argument, index) =>
        !argument.startsWith("--") &&
        ![
          "--report",
          "--verify-checksum",
          "--profile",
          "--platform",
        ].includes(
          args[index - 1],
        ),
    ) ||
    process.env.RELEASE_PROFILE ||
    DEFAULT_PROFILE;
  const platformFlagIndex = args.indexOf("--platform");
  const platform =
    (platformFlagIndex >= 0 ? args[platformFlagIndex + 1] : undefined) ||
    process.env.RELEASE_PLATFORM ||
    "android";
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

  if (verifyChecksumIndex >= 0) {
    const artifactPath = args[verifyChecksumIndex + 1];
    if (!artifactPath || artifactPath.startsWith("--")) {
      console.error("[release-checksum] --verify-checksum requires a file path.");
      process.exitCode = 1;
      return;
    }
    const handoffReportPath =
      process.env.RELEASE_HANDOFF_PATH || DEFAULT_HANDOFF_REPORT_PATH;
    try {
      const verification = verifyInstallerChecksum({
        artifactPath,
        handoffReportPath,
      });
      console.log(
        `[release-checksum] SHA-256 verified for ${verification.artifactPath}: ${verification.installerSha256}`,
      );
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
    return;
  }

  if (handoffOnly) {
    const handoffReportPath =
      process.env.RELEASE_HANDOFF_PATH || DEFAULT_HANDOFF_REPORT_PATH;
    try {
      const handoff = validateNativeHandoff({
        handoffReportPath,
        profile,
        platform,
      });
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
    androidIdentity = validateAndroidReleaseIdentity(
      allProfiles ? DEFAULT_PROFILE : profile,
    );
    console.log(
      `[release-identity] Android package ${androidIdentity.androidPackage} matches app.json, EAS ${allProfiles ? DEFAULT_PROFILE : profile} settings, and generated metadata.`,
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
  RELEASE_REPORT_SCHEMA_VERSION,
  EXPECTED_RELEASE_HOSTNAME,
  EXPECTED_ANDROID_PACKAGE,
  getReleaseDomain,
  getReleaseProfiles,
  validateReleaseProfileHost,
  validateRequiredReleaseProfileHosts,
  readReleaseConfig,
  validateNativeHandoff,
  computeFileSha256,
  verifyInstallerChecksum,
  validateAndroidProfileIdentity,
  validateAndroidPreviewIdentity,
  validateAndroidProductionIdentity,
  validateAndroidReleaseIdentity,
  runReleaseSmokeCheck,
  runReleaseSmokeChecks,
  summarizeReleaseSmokeResult,
  writeReleaseReport,
};