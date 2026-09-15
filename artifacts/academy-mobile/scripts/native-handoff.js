const { spawnSync } = require("node:child_process");
const path = require("node:path");

const {
  runReleaseSmokeCheck,
} = require("./check-release.js");

const DEFAULT_PLATFORM = "android";
const DEFAULT_PROFILE = "preview";

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

  await runReleaseSmokeCheck({ profile });
  console.log(
    `[native-handoff] Release connectivity passed for profile "${profile}".`,
  );

  if (checkOnly) {
    console.log("[native-handoff] Check-only mode; EAS build was not started.");
    return;
  }

  const eas = easCommand();
  const result = spawnSync(
    eas.command,
    [
      ...eas.prefix,
      "build",
      "--platform",
      platform,
      "--profile",
      profile,
      ...easArgs,
    ],
    {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
    },
  );

  if (result.error) {
    throw new Error(
      `[native-handoff] Could not start EAS CLI: ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[native-handoff] Aborted before EAS build: ${message}`);
  process.exitCode = 1;
});