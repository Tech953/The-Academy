const fs = require("fs");
const path = require("path");

const DEFAULT_PROFILE = "preview";
const REQUEST_TIMEOUT_MS = 15_000;
const EAS_CONFIG_PATH = path.resolve(__dirname, "..", "eas.json");

function readReleaseConfig(configPath = EAS_CONFIG_PATH) {
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(
      `[release-smoke] Could not read EAS release configuration at ${configPath}: ${error.message}`,
    );
  }
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

if (require.main === module) {
  const profile = process.argv[2] || process.env.RELEASE_PROFILE || DEFAULT_PROFILE;

  runReleaseSmokeCheck({ profile })
    .then(({ profile: checkedProfile, domain, healthUrl, aiUrl }) => {
      console.log(
        `[release-smoke] ${checkedProfile} passed for ${domain}: ${healthUrl} and ${aiUrl}`,
      );
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

module.exports = {
  getReleaseDomain,
  readReleaseConfig,
  runReleaseSmokeCheck,
};