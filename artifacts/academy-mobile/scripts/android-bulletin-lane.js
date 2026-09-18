#!/usr/bin/env node

/**
 * Repeatable Android bulletin relaunch lane.
 *
 * The APK must be built with the `preview-lane` EAS profile. That profile
 * points the app at http://127.0.0.1:8765; this runner maps that port to the
 * host with `adb reverse`, so the refresh can be held open deterministically.
 */

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");

const DEFAULT_PACKAGE = "com.theacademy.mobile";
const DEFAULT_PORT = 8765;
const DEFAULT_TIMEOUT_MS = 30_000;
const REMOTE_MARKER = "NATIVE LANE REMOTE BULLETIN";

function usage() {
  return [
    "Usage: pnpm --filter @workspace/academy-mobile run android:bulletin-lane -- --apk path/to/preview-lane.apk",
    "",
    "Options:",
    "  --apk PATH       APK built with the preview-lane EAS profile (required)",
    "  --device ID      adb serial; required when multiple devices are attached",
    "  --package ID     Android package (default: com.theacademy.mobile)",
    "  --port PORT      local lane server port (default: 8765)",
    "  --timeout-ms N   per-check timeout (default: 30000)",
    "  --help           show this help",
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    apk: null,
    device: null,
    packageName: DEFAULT_PACKAGE,
    port: DEFAULT_PORT,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help") return { help: true, ...options };
    if (arg === "--apk" || arg === "--device" || arg === "--package" || arg === "--port" || arg === "--timeout-ms") {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a value.`);
      index += 1;
      if (arg === "--apk") options.apk = value;
      if (arg === "--device") options.device = value;
      if (arg === "--package") options.packageName = value;
      if (arg === "--port") options.port = Number(value);
      if (arg === "--timeout-ms") options.timeoutMs = Number(value);
      continue;
    }
    throw new Error(`Unknown argument: ${arg}\n\n${usage()}`);
  }

  if (!options.apk) throw new Error(`--apk is required.\n\n${usage()}`);
  if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65535) {
    throw new Error("--port must be a valid TCP port.");
  }
  if (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 1000) {
    throw new Error("--timeout-ms must be at least 1000.");
  }
  return options;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
    timeout: options.timeoutMs ?? 20_000,
  });
  if (result.error) {
    if (result.error.code === "ENOENT") {
      throw new Error(`${command} was not found. Install Android platform-tools and ensure \`adb\` is on PATH.`);
    }
    throw result.error;
  }
  if (result.status !== 0 && !options.allowFailure) {
    const detail = String(result.stderr || result.stdout || "").trim();
    throw new Error(`${command} ${args.join(" ")} failed${detail ? `: ${detail}` : "."}`);
  }
  return String(result.stdout || "");
}

function adb(serial, args, options = {}) {
  return run("adb", ["-s", serial, ...args], options);
}

function discoverDevice(requested) {
  let output;
  try {
    output = run("adb", ["devices"], { timeoutMs: 10_000 });
  } catch (error) {
    throw new Error(
      `Android tooling preflight failed: adb is unavailable. Install Android SDK platform-tools, put adb on PATH, and retry. ${error.message}`,
    );
  }

  const devices = output
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, status]) => serial && status === "device")
    .map(([serial]) => serial);
  const unauthorized = output
    .split(/\r?\n/)
    .filter((line) => /\bunauthorized\b|\boffline\b/.test(line));

  if (requested) {
    if (!devices.includes(requested)) {
      throw new Error(
        `Requested Android device "${requested}" is not ready. Accept the USB debugging prompt or boot an emulator, then confirm \`adb -s ${requested} get-state\` reports device.`,
      );
    }
    return requested;
  }
  if (devices.length === 1) return devices[0];
  if (devices.length === 0) {
    const suffix = unauthorized.length ? ` Unready entries: ${unauthorized.join("; ")}` : "";
    throw new Error(
      `No ready Android emulator/device was found.${suffix} Start an emulator or connect a device with USB debugging enabled, then retry.`,
    );
  }
  throw new Error(
    `Multiple Android devices are attached (${devices.join(", ")}). Re-run with --device SERIAL so the lane cannot target the wrong device.`,
  );
}

function escapeXml(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dumpUi(serial) {
  adb(serial, ["shell", "uiautomator", "dump", "/sdcard/academy-window.xml"], {
    allowFailure: true,
  });
  return adb(serial, ["exec-out", "cat", "/sdcard/academy-window.xml"], {
    allowFailure: true,
  });
}

function uiContains(serial, text) {
  const xml = dumpUi(serial);
  return new RegExp(`(?:text|content-desc)="[^"]*${escapeXml(text)}[^"]*"`, "i").test(xml);
}

function waitForUi(serial, text, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (uiContains(serial, text)) return;
    sleep(250);
  }
  const snapshot = dumpUi(serial).replace(/\s+/g, " ").slice(0, 1_500);
  throw new Error(`Timed out waiting for native UI text "${text}". Current UI: ${snapshot}`);
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function launch(serial, packageName) {
  adb(serial, ["shell", "monkey", "-p", packageName, "1"]);
}

function stop(serial, packageName) {
  adb(serial, ["shell", "am", "force-stop", packageName]);
}

function sendLaneCommand(serial, command, packageName) {
  const url = `academy-mobile://?androidLane=${encodeURIComponent(command)}`;
  adb(serial, [
    "shell",
    "am",
    "start",
    "-W",
    "-a",
    "android.intent.action.VIEW",
    "-d",
    url,
    packageName,
  ]);
}

function createRemotePack() {
  const generatedAt = Date.now();
  const event = (id) => ({
    id,
    title: REMOTE_MARKER,
    description: "A remote bulletin held open by the Android relaunch lane.",
    npcReaction: "The lane server is waiting for the app to display its cache.",
    playerHook: "Keep the cached bulletin visible while refresh is pending.",
    category: "lane",
    durationDays: 3,
    tags: ["lane", id],
  });
  return {
    schemaVersion: 1,
    version: "native-lane-remote",
    generatedAt,
    expiresAt: generatedAt + 86_400_000,
    worldSeed: 183,
    weeklyTheme: REMOTE_MARKER,
    themeContext: "This pack exists only to prove the native refresh boundary.",
    activeEvents: [event("native-lane-remote-1"), event("native-lane-remote-2"), event("native-lane-remote-3")],
    npcMoodShifts: [
      { npcId: "the-scholar", npcName: "The Scholar", emotionState: "focused", reason: "the lane is running" },
      { npcId: "the-rebel", npcName: "The Rebel", emotionState: "curious", reason: "the refresh is held" },
      { npcId: "the-mentor", npcName: "The Mentor", emotionState: "happy", reason: "the cache is visible" },
      { npcId: "the-optimist", npcName: "The Optimist", emotionState: "excited", reason: "the relaunch passed" },
    ],
    gedFocusAreas: [
      { subject: "math", topic: "Ratios & Proportions", whyNow: "The lane checks a valid study pack." },
      { subject: "science", topic: "Interpreting Data Tables", whyNow: "The lane checks a valid study pack." },
    ],
    generatedBy: "deterministic",
    rssHeadlines: [],
    eventsRepaired: false,
  };
}

function createLaneServer(port) {
  const remotePack = createRemotePack();
  const state = {
    mode: "remote",
    contentPackRequests: 0,
    heldResponses: [],
  };
  const server = http.createServer((request, response) => {
    if (request.url === "/api/content-pack") {
      state.contentPackRequests += 1;
      if (state.mode === "hold") {
        state.heldResponses.push(response);
        return;
      }
      if (state.mode === "error") {
        response.writeHead(503, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "lane fallback" }));
        return;
      }
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(remotePack));
      return;
    }

    if (request.url && request.url.startsWith("/api/")) {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ description: "Native bulletin lane response." }));
      return;
    }

    response.writeHead(404);
    response.end();
  });

  return {
    state,
    listen() {
      return new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, "127.0.0.1", resolve);
      });
    },
    setMode(mode) {
      state.mode = mode;
    },
    releaseHeld() {
      for (const response of state.heldResponses.splice(0)) {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(remotePack));
      }
    },
    close() {
      state.mode = "error";
      for (const response of state.heldResponses.splice(0)) response.destroy();
      return new Promise((resolve) => server.close(resolve));
    },
  };
}

function waitFor(predicate, description, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    sleep(250);
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

async function runAndroidBulletinLane(options) {
  const apkPath = path.resolve(options.apk);
  if (!fs.existsSync(apkPath)) {
    throw new Error(`APK was not found at ${apkPath}. Build it with \`eas build --profile preview-lane --platform android\` first.`);
  }

  const serial = discoverDevice(options.device);
  const laneServer = createLaneServer(options.port);
  await laneServer.listen();

  try {
    console.log(`[android-bulletin-lane] Installing ${apkPath} on ${serial}.`);
    adb(serial, ["install", "-r", "-d", apkPath], { timeoutMs: 120_000 });
    adb(serial, ["shell", "pm", "clear", options.packageName]);
    adb(serial, ["reverse", `tcp:${options.port}`, `tcp:${options.port}`]);

    console.log("[android-bulletin-lane] Starting a clean app and seeding a valid remote bulletin.");
    launch(serial, options.packageName);
    waitForUi(serial, "The Academy", options.timeoutMs);
    sendLaneCommand(serial, "seed", options.packageName);
    waitForUi(serial, REMOTE_MARKER, options.timeoutMs);
    if (laneServer.state.contentPackRequests < 1) {
      throw new Error("The app did not request /api/content-pack after the seed command.");
    }

    console.log("[android-bulletin-lane] Holding refresh open across force-stop and relaunch.");
    laneServer.setMode("hold");
    stop(serial, options.packageName);
    launch(serial, options.packageName);
    waitFor(() => laneServer.state.contentPackRequests >= 2 && laneServer.state.heldResponses.length >= 1, "a held refresh after relaunch", options.timeoutMs);
    waitForUi(serial, REMOTE_MARKER, options.timeoutMs);
    laneServer.releaseHeld();

    console.log("[android-bulletin-lane] Verifying expired native storage falls back locally.");
    laneServer.setMode("error");
    sendLaneCommand(serial, "expired", options.packageName);
    sleep(500);
    stop(serial, options.packageName);
    launch(serial, options.packageName);
    waitForUi(serial, "LOCAL FALLBACK", options.timeoutMs);
    if (uiContains(serial, REMOTE_MARKER)) {
      throw new Error("Expired native storage still displayed the remote bulletin marker.");
    }

    console.log("[android-bulletin-lane] Verifying corrupt native storage falls back locally.");
    sendLaneCommand(serial, "corrupt", options.packageName);
    sleep(500);
    stop(serial, options.packageName);
    launch(serial, options.packageName);
    waitForUi(serial, "LOCAL FALLBACK", options.timeoutMs);
    if (uiContains(serial, REMOTE_MARKER)) {
      throw new Error("Corrupt native storage still displayed the remote bulletin marker.");
    }

    console.log("[android-bulletin-lane] PASS: cached-first relaunch, expired storage, and corrupt storage.");
  } finally {
    laneServer.releaseHeld();
    await laneServer.close();
    adb(serial, ["reverse", "--remove", `tcp:${options.port}`], { allowFailure: true });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  await runAndroidBulletinLane(options);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[android-bulletin-lane] ERROR: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  createRemotePack,
  parseArgs,
  runAndroidBulletinLane,
};