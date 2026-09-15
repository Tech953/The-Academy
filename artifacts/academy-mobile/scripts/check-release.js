const fs = require("fs");
const path = require("path");

const DEFAULT_PROFILE = "preview";
const REQUEST_TIMEOUT_MS = 15_000;
const EAS_CONFIG_PATH = path.resolve(__dirname, "..", "eas.json");
const DEFAULT_REPORT_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  ".local",
  "outputs",
  "academy-mobile-release-smoke.json",
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
} = {}) {
  const config = readReleaseConfig(configPath);
  const domain = getReleaseDomain(config, profile);
  const baseUrl = `https://${domain}`;
  const healthUrl = `${baseUrl}/api/healthz`;
  const aiUrl = `${baseUrl}/api/ai/describe`;

  let healthResponse;
  try {
    healthResponse = await fetchWithTimeout(fetchImpl, healthUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
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
    aiResponse = await fetchWithTimeout(fetchImpl, aiUrl, {
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
    });
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
    try {
      passed.push(
        await runReleaseSmokeCheck({
          profile,
          configPath,
          fetchImpl,
        }),
      );
    } catch (error) {
      failed.push({
        profile,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  return { profiles, passed, failed };
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

  const check = allProfiles
    ? runReleaseSmokeChecks().then((result) => {
        const report = writeReleaseReport(reportPath, {
          command: "check-release --all",
          ...result,
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
  getReleaseDomain,
  getReleaseProfiles,
  readReleaseConfig,
  runReleaseSmokeCheck,
  runReleaseSmokeChecks,
  writeReleaseReport,
};