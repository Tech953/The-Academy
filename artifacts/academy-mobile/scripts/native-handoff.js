const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const {
  runReleaseSmokeCheck,
  writeReleaseReport,
} = require("./check-release.js");

const DEFAULT_PLATFORM = "android";
const DEFAULT_PROFILE = "preview";
const EXPECTED_APP_ID = "com.theacademy.mobile";
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

function validatePlatformIdentity(platform) {
  const expo = readAppConfig();
  const configuredId =
    platform === "ios" ? expo?.ios?.bundleIdentifier : expo?.android?.package;

  if (configuredId !== EXPECTED_APP_ID) {
    throw new Error(
      `[native-handoff] ${platform} identity drift: expected ${EXPECTED_APP_ID}, found ${configuredId || "missing"} in app.json.`,
    );
  }
}

function extractBuildMetadata(output) {
  const combinedOutput = output.stdout + "\n" + output.stderr;
  const installerUrls = [
    ...new Set(
      combinedOutput.match(
        /https?:\/\/[^\s"'\\]+(?:\.apk|\.aab|\.ipa)(?:\?[^\s"'\\]+)?/gi,
      ) ?? [],
    ),
  ];
  const jsonLines = combinedOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{") || line.startsWith("["));
  const parsed = [];
  for (const line of jsonLines) {
    try {
      parsed.push(JSON.parse(line));
    } catch {
      // EAS can interleave human-readable output with JSON; ignore non-JSON lines.
    }
  }

  return {
    installerUrls,
    easRecords: parsed.slice(-3),
  };
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

async function main() {
  const { easArgs, platform, profile, checkOnly } = parseArgs(
    process.argv.slice(2),
  );

  validatePlatformIdentity(platform);
  const connectivity = await runReleaseSmokeCheck({ profile });
  const reportPath = process.env.RELEASE_REPORT_PATH || DEFAULT_REPORT_PATH;
  const appConfig = readAppConfig();
  writeReleaseReport(reportPath, {
    command: "native-handoff",
    status: checkOnly ? "check-only" : "starting",
    platform,
    profile,
    appId:
      platform === "ios"
        ? appConfig.ios.bundleIdentifier
        : appConfig.android.package,
    connectivity,
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
  const buildMetadata = extractBuildMetadata(output);
  writeReleaseReport(reportPath, {
    command: "native-handoff",
    status: result.status === 0 ? "completed" : "failed",
    platform,
    profile,
    appId:
      platform === "ios"
        ? appConfig.ios.bundleIdentifier
        : appConfig.android.package,
    connectivity,
    easExitCode: result.status,
    ...buildMetadata,
  });
  console.log(`[native-handoff] Report written to ${reportPath}`);
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[native-handoff] Aborted before EAS build: ${message}`);
  process.exitCode = 1;
});