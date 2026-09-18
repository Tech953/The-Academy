const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const {
  EXPECTED_ANDROID_PACKAGE,
  runReleaseSmokeChecks,
  summarizeReleaseSmokeResult,
  validateAndroidReleaseIdentity,
  writeReleaseReport,
} = require("./check-release.js");

const DEFAULT_PLATFORM = "android";
const DEFAULT_PROFILE = "preview";
const EXPECTED_APP_ID = EXPECTED_ANDROID_PACKAGE;
const EXPECTED_IOS_BUNDLE_ID = "com.theacademy.mobile";
const DEFAULT_REPORT_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  ".local",
  "outputs",
  "academy-mobile-native-handoff.json",
);

function readAppConfig() {
  const appConfigPath = path.resolve(__dirname, "..", "app.json");
  try {
    return JSON.parse(fs.readFileSync(appConfigPath, "utf8")).expo;
  } catch (error) {
    throw new Error(`[native-handoff] Could not read app.json: ${error.message}`);
  }
}

function validatePlatformIdentity(
  platform,
  profile = DEFAULT_PROFILE,
  identityOptions = {},
) {
  if (platform === "android") {
    return validateAndroidReleaseIdentity(profile, identityOptions);
  }

  const expo = readAppConfig();
  const configuredId =
    platform === "ios" ? expo?.ios?.bundleIdentifier : expo?.android?.package;
  const expectedId =
    platform === "ios" ? EXPECTED_IOS_BUNDLE_ID : EXPECTED_ANDROID_PACKAGE;

  if (configuredId !== expectedId) {
    throw new Error(
      `[native-handoff] ${platform} identity drift: expected ${expectedId}, found ${configuredId || "missing"} in app.json.`,
    );
  }

  return { appId: configuredId };
}

const INSTALLER_PATTERN = /\.(?:apk|aab|ipa)(?:[?#][^\s"'\\<>]*)?$/i;

function cleanArtifactCandidate(value) {
  return String(value).replace(/[),.;]+$/, "");
}

function isInstallerCandidate(value) {
  return INSTALLER_PATTERN.test(cleanArtifactCandidate(value));
}

function addArtifactCandidate(value, urls, paths) {
  if (typeof value !== "string" || !isInstallerCandidate(value)) return;
  const candidate = cleanArtifactCandidate(value);
  if (/^https?:\/\//i.test(candidate)) {
    urls.add(candidate);
  } else {
    paths.add(candidate.replace(/^file:\/\//i, ""));
  }
}

function collectArtifactCandidates(value, urls, paths) {
  if (typeof value === "string") {
    addArtifactCandidate(value, urls, paths);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectArtifactCandidates(entry, urls, paths));
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.values(value).forEach((entry) =>
    collectArtifactCandidates(entry, urls, paths),
  );
}

function parseJsonPayloads(text) {
  const candidates = [text.trim(), ...text.split(/\r?\n/).map((line) => line.trim())];
  const parsed = [];
  const seen = new Set();
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    try {
      parsed.push(JSON.parse(candidate));
    } catch {
      // EAS can interleave human-readable output with JSON; ignore those lines.
    }
  }
  return parsed;
}

function flattenBuildRecords(payloads) {
  return payloads.flatMap((payload) =>
    Array.isArray(payload) ? payload.filter((entry) => entry && typeof entry === "object") : [payload],
  );
}

function findFirstValue(value, keys) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findFirstValue(entry, keys);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  for (const key of keys) {
    if (value[key] !== undefined && value[key] !== null && value[key] !== "") {
      return value[key];
    }
  }
  for (const entry of Object.values(value)) {
    const found = findFirstValue(entry, keys);
    if (found !== undefined) return found;
  }
  return undefined;
}

function extractBuildMetadata(output) {
  const combinedOutput = `${output.stdout ?? ""}\n${output.stderr ?? ""}`;
  const payloads = parseJsonPayloads(combinedOutput);
  const records = flattenBuildRecords(payloads);
  const installerUrls = new Set();
  const installerPaths = new Set();

  records.forEach((record) =>
    collectArtifactCandidates(record, installerUrls, installerPaths),
  );
  for (const candidate of combinedOutput.match(/https?:\/\/[^\s"'\\<>]+/gi) ?? []) {
    addArtifactCandidate(candidate, installerUrls, installerPaths);
  }
  for (const candidate of combinedOutput.match(/[^\s"'\\<>]+?\.(?:apk|aab|ipa)(?:[?#][^\s"'\\<>]*)?/gi) ?? []) {
    addArtifactCandidate(candidate, installerUrls, installerPaths);
  }

  return {
    installerUrls: [...installerUrls],
    installerPaths: [...installerPaths],
    easRecords: records.slice(-3),
  };
}

function normalizeBuildTimestamp(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const date = new Date(
    typeof value === "number" && value < 1_000_000_000_000 ? value * 1000 : value,
  );
  if (Number.isNaN(date.getTime())) {
    throw new Error(`[native-handoff] Incomplete EAS build metadata: invalid build timestamp "${value}".`);
  }
  return date.toISOString();
}

function normalizeBuildMetadata(
  output,
  { platform, profile, appConfig, capturedAt = new Date().toISOString() } = {},
) {
  const extracted = extractBuildMetadata(output);
  const record = extracted.easRecords.at(-1) ?? {};
  const expo = appConfig?.expo ?? appConfig ?? {};
  const expectedArtifactExtension =
    platform === "android" && profile === "production"
      ? "aab"
      : platform === "android"
        ? "apk"
        : "ipa";
  const expectedArtifactLabel =
    platform === "android" && profile === "production"
      ? "production Android App Bundle (.aab)"
      : platform === "android"
        ? "preview Android APK (.apk)"
        : "iOS IPA (.ipa)";
  const configuredPackage =
    platform === "ios" ? expo.ios?.bundleIdentifier : expo.android?.package;
  const outputPackage = findFirstValue(record, [
    "appIdentifier",
    "applicationIdentifier",
    "bundleIdentifier",
    "package",
    "identifier",
  ]);
  const version =
    findFirstValue(record, ["appVersion", "version"]) ?? expo.version;
  const outputProfile = findFirstValue(record, ["buildProfile", "profile"]);
  const timestampValue = findFirstValue(record, [
    "completedAt",
    "finishedAt",
    "createdAt",
    "timestamp",
  ]);
  const installerCandidates = [
    ...extracted.installerUrls.map((value) => ({ kind: "url", value })),
    ...extracted.installerPaths.map((value) => ({ kind: "path", value })),
  ];
  const expectedInstaller = installerCandidates.find(({ value }) =>
    new RegExp(`\\.${expectedArtifactExtension}(?:[?#]|$)`, "i").test(value),
  );
  const installerUrl =
    expectedInstaller?.kind === "url" ? expectedInstaller.value : null;
  const installerPath =
    expectedInstaller?.kind === "path" ? expectedInstaller.value : null;
  const missing = [];

  if (!installerUrl && !installerPath) {
    if (installerCandidates.length > 0) {
      throw new Error(
        `[native-handoff] Incomplete EAS build metadata: expected ${expectedArtifactLabel}; found ${installerCandidates
          .map(({ value }) => value)
          .join(", ")}.`,
      );
    }
    missing.push(
      platform === "android" && profile === "production"
        ? "installer URL or local AAB path"
        : platform === "android"
          ? "installer URL or local APK path"
          : "installer URL or local IPA path",
    );
  }
  if (!version) missing.push("version");
  if (!configuredPackage && !outputPackage) missing.push("package identity");
  if (!profile) missing.push("profile");
  if (!capturedAt) missing.push("capture timestamp");
  if (missing.length > 0) {
    throw new Error(
      `[native-handoff] Incomplete EAS build metadata: missing ${missing.join(", ")}.`,
    );
  }
  if (outputPackage && configuredPackage && outputPackage !== configuredPackage) {
    throw new Error(
      `[native-handoff] EAS package identity "${outputPackage}" does not match app.json "${configuredPackage}".`,
    );
  }
  if (expo.version && String(version) !== String(expo.version)) {
    throw new Error(
      `[native-handoff] EAS version "${version}" does not match app.json "${expo.version}".`,
    );
  }
  if (outputProfile && outputProfile !== profile) {
    throw new Error(
      `[native-handoff] EAS profile "${outputProfile}" does not match requested profile "${profile}".`,
    );
  }

  return {
    installerUrl,
    installerPath,
    version: String(version),
    package: configuredPackage ?? outputPackage,
    profile,
    timestamp: normalizeBuildTimestamp(timestampValue, capturedAt),
    buildId: findFirstValue(record, ["id", "buildId"]) ?? null,
    buildDetailsPageUrl: findFirstValue(record, ["buildDetailsPageUrl"]) ?? null,
  };
}

function computeFileSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function attachInstallerChecksum(buildMetadata) {
  if (!buildMetadata.installerPath) {
    return { ...buildMetadata, installerSha256: null };
  }

  try {
    return {
      ...buildMetadata,
      installerSha256: await computeFileSha256(buildMetadata.installerPath),
    };
  } catch {
    return { ...buildMetadata, installerSha256: null };
  }
}

function parseArgs(args) {
  const effectiveArgs = args[0] === "--" ? args.slice(1) : args;
  const parsed = {
    easArgs: [],
    platform: process.env.RELEASE_PLATFORM || DEFAULT_PLATFORM,
    profile: process.env.RELEASE_PROFILE || DEFAULT_PROFILE,
    checkOnly: false,
  };

  for (let index = 0; index < effectiveArgs.length; index += 1) {
    const argument = effectiveArgs[index];
    if (argument === "--platform") {
      parsed.platform = effectiveArgs[++index];
    } else if (argument === "--profile") {
      parsed.profile = effectiveArgs[++index];
    } else if (argument === "--check-only") {
      parsed.checkOnly = true;
    } else {
      parsed.easArgs.push(argument);
    }
  }

  if (!parsed.platform || !parsed.profile) {
    throw new Error("--platform and --profile require non-empty values.");
  }

  return parsed;
}

function easCommand() {
  const configured = process.env.EAS_CLI_COMMAND;
  if (configured) {
    return { command: configured, prefix: [] };
  }

  return {
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    prefix: ["--yes", "eas-cli"],
  };
}

function summarizeConnectivity(result) {
  return {
    profiles: result.profiles,
    passed: result.passed,
    failed: result.failed.map(({ profile, error }) => ({
      profile,
      error: error instanceof Error ? error.message : String(error),
    })),
  };
}

async function verifyAllProfileConnectivity({
  profile,
  runAllProfiles = runReleaseSmokeChecks,
} = {}) {
  const result = await runAllProfiles();
  const summary = summarizeReleaseSmokeResult(result);
  const legacySummary = summarizeConnectivity(result);

  if (result.failed.length > 0) {
    const details = result.failed
      .map(
        ({ profile: failedProfile, error }) =>
          `${failedProfile}: ${error instanceof Error ? error.message : String(error)}`,
      )
      .join("; ");
    const error = new Error(
      `[native-handoff] Release connectivity failed before EAS build: ${details}`,
    );
    error.connectivitySummary = summary;
    error.legacyConnectivitySummary = legacySummary;
    throw error;
  }

  const selected = result.passed.find((candidate) => candidate.profile === profile);
  if (!selected) {
    throw new Error(
      `[native-handoff] Selected release profile "${profile}" was not included in the all-profile smoke check.`,
    );
  }

  return {
    selected,
    allProfiles: summary,
    legacyAllProfiles: legacySummary,
  };
}

async function main() {
  const { easArgs, platform, profile, checkOnly } = parseArgs(
    process.argv.slice(2),
  );

  const reportPath = process.env.RELEASE_REPORT_PATH || DEFAULT_REPORT_PATH;
  const identity = validatePlatformIdentity(platform, profile);
  const appConfig = readAppConfig();
  const reportBase = {
    command: "native-handoff",
    platform,
    profile,
    identity,
    appId:
      platform === "ios"
        ? appConfig.ios.bundleIdentifier
        : appConfig.android.package,
  };
  let connectivityCheck;
  try {
    connectivityCheck = await verifyAllProfileConnectivity({ profile });
  } catch (error) {
    if (error?.connectivitySummary) {
      writeReleaseReport(reportPath, {
        ...reportBase,
        status: "failed",
        summary: error.connectivitySummary,
        allProfileConnectivity: error.legacyConnectivitySummary,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }

  const connectivity = connectivityCheck.selected;
  const reportWithConnectivity = {
    ...reportBase,
    connectivity,
    summary: connectivityCheck.allProfiles,
    allProfileConnectivity: connectivityCheck.legacyAllProfiles,
  };
  writeReleaseReport(reportPath, {
    ...reportWithConnectivity,
    status: checkOnly ? "check-only" : "starting",
  });
  console.log(
    `[native-handoff] Release connectivity passed for profile "${profile}".`,
  );

  if (checkOnly) {
    console.log("[native-handoff] Check-only mode; EAS build was not started.");
    return;
  }

  const eas = easCommand();
  const jsonFlag = easArgs.includes("--json") ? [] : ["--json"];
  const result = spawnSync(
    eas.command,
    [
      ...eas.prefix,
      "build",
      "--platform",
      platform,
      "--profile",
      profile,
      ...jsonFlag,
      ...easArgs,
    ],
    {
      cwd: path.resolve(__dirname, ".."),
      stdio: ["inherit", "pipe", "pipe"],
      encoding: "utf8",
    },
  );

  if (result.error) {
    throw new Error(
      `[native-handoff] Could not start EAS CLI: ${result.error.message}`,
    );
  }
  const output = {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
  process.stdout.write(output.stdout);
  process.stderr.write(output.stderr);
  let buildMetadata = null;
  if (result.status === 0) {
    try {
      buildMetadata = await attachInstallerChecksum(
        normalizeBuildMetadata(output, {
          platform,
          profile,
          appConfig,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      writeReleaseReport(reportPath, {
        ...reportWithConnectivity,
        status: "failed",
        failureStage: "build-metadata",
        easExitCode: result.status,
        error: message,
      });
      throw error;
    }
  }
  writeReleaseReport(reportPath, {
    ...reportWithConnectivity,
    status: result.status === 0 ? "completed" : "failed",
    easExitCode: result.status,
    ...(result.status !== 0
      ? {
          failureStage: "eas-build",
          error: `[native-handoff] EAS build failed with exit code ${result.status ?? "unknown"}.`,
        }
      : {}),
    ...(buildMetadata ? { build: buildMetadata } : {}),
  });
  if (result.status !== 0) {
    console.error(
      `[native-handoff] EAS build failed with exit code ${result.status ?? "unknown"}.`,
    );
  }
  console.log(`[native-handoff] Report written to ${reportPath}`);
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[native-handoff] Aborted before EAS build: ${message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  extractBuildMetadata,
  normalizeBuildMetadata,
  computeFileSha256,
  attachInstallerChecksum,
  parseArgs,
  summarizeConnectivity,
  validatePlatformIdentity,
  verifyAllProfileConnectivity,
};