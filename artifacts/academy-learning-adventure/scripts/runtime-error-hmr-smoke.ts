import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer as createNetServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { createServer } from "vite";

const runtimeErrorEvent = "runtime-error-plugin:error";
const runtimeErrorMarker = "academy-runtime-error-hmr-smoke";
const artifactRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const artifactConfigPath = path.join(
  artifactRoot,
  ".replit-artifact",
  "artifact.toml",
);

type CdpEnvelope = {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: { message: string };
};

export type CdpClient = {
  command(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  on(
    method: string,
    listener: (params: Record<string, unknown>) => void,
  ): () => void;
  close(): void;
};

type CdpPendingCommand = {
  resolve: (result: Record<string, unknown>) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

export type CdpTarget = {
  type: string;
  webSocketDebuggerUrl: string;
};

type RuntimeErrorPayload = {
  message?: string;
  stack?: string;
};

export async function freeLocalPort(): Promise<number> {
  const probe = createNetServer();
  return new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        probe.close();
        reject(new Error("Could not reserve a local port for the HMR smoke."));
        return;
      }
      probe.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve(address.port);
        }
      });
    });
  });
}

export function connectDevTools(webSocketUrl: string): Promise<CdpClient> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketUrl);
    const pending = new Map<number, CdpPendingCommand>();
    const listeners = new Map<
      string,
      Set<(params: Record<string, unknown>) => void>
    >();
    let nextId = 0;

    const failPending = (error: Error) => {
      for (const command of pending.values()) {
        clearTimeout(command.timeout);
        command.reject(error);
      }
      pending.clear();
    };

    socket.addEventListener(
      "message",
      (event) => {
        let message: CdpEnvelope;
        try {
          message = JSON.parse(String(event.data)) as CdpEnvelope;
        } catch {
          failPending(new Error("Chromium returned an invalid DevTools message."));
          return;
        }

        if (message.id !== undefined) {
          const command = pending.get(message.id);
          if (!command) return;
          clearTimeout(command.timeout);
          pending.delete(message.id);
          if (message.error) {
            command.reject(new Error(message.error.message));
          } else {
            command.resolve(message.result ?? {});
          }
          return;
        }

        if (message.method) {
          for (const listener of listeners.get(message.method) ?? []) {
            listener(message.params ?? {});
          }
        }
      },
      { passive: true },
    );

    socket.addEventListener("close", () => {
      failPending(new Error("Chromium closed the DevTools connection."));
    });
    socket.addEventListener("error", () => {
      failPending(new Error("Could not communicate with Chromium DevTools."));
    });

    const openTimeout = setTimeout(() => {
      reject(new Error("Timed out connecting to Chromium DevTools."));
      socket.close();
    }, 8_000);
    socket.addEventListener(
      "open",
      () => {
        clearTimeout(openTimeout);
        resolve({
          command(method, params = {}) {
            const id = ++nextId;
            return new Promise((commandResolve, commandReject) => {
              const timeout = setTimeout(() => {
                pending.delete(id);
                commandReject(
                  new Error(`Timed out waiting for Chromium command ${method}.`),
                );
              }, 8_000);
              pending.set(id, {
                resolve: commandResolve,
                reject: commandReject,
                timeout,
              });
              socket.send(JSON.stringify({ id, method, params }));
            });
          },
          on(method, listener) {
            const methodListeners = listeners.get(method) ?? new Set();
            methodListeners.add(listener);
            listeners.set(method, methodListeners);
            return () => {
              methodListeners.delete(listener);
              if (methodListeners.size === 0) listeners.delete(method);
            };
          },
          close() {
            socket.close();
          },
        });
      },
      { once: true },
    );
  });
}

async function waitFor<T>(
  read: () => T | undefined,
  description: string,
  timeoutMs = 10_000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = read();
    if (value !== undefined) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

export async function waitForDevToolsPort(
  browser: ReturnType<typeof spawn>,
  profileDirectory: string,
): Promise<number> {
  const portFile = path.join(profileDirectory, "DevToolsActivePort");
  await waitFor(() => {
    if (browser.exitCode !== null) {
      throw new Error(
        `Chromium exited before DevTools started (code ${browser.exitCode}).`,
      );
    }
    if (!existsSync(portFile)) return undefined;
    const port = Number(readFileSync(portFile, "utf8").split(/\r?\n/)[0]);
    return Number.isInteger(port) && port > 0 ? port : undefined;
  }, "Chromium's DevTools port");
  return Number(readFileSync(portFile, "utf8").split(/\r?\n/)[0]);
}

export async function getPageTarget(port: number): Promise<CdpTarget> {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) {
        const targets = (await response.json()) as CdpTarget[];
        const page = targets.find(
          (target) => target.type === "page" && target.webSocketDebuggerUrl,
        );
        if (page) return page;
      }
    } catch {
      // Chromium may need a moment after creating DevToolsActivePort.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Timed out waiting for Chromium's page target.");
}

export function chromiumExecutable(): string {
  if (process.env.CHROMIUM_PATH) {
    if (!existsSync(process.env.CHROMIUM_PATH)) {
      throw new Error(
        `CHROMIUM_PATH does not point to an executable: ${process.env.CHROMIUM_PATH}`,
      );
    }
    return process.env.CHROMIUM_PATH;
  }
  return existsSync("/repl/tools/bin/chromium")
    ? "/repl/tools/bin/chromium"
    : "chromium";
}

export function artifactServicePaths(): string[] {
  const toml = readFileSync(artifactConfigPath, "utf8");
  const paths: string[] = [];
  for (const match of toml.matchAll(/^\s*paths\s*=\s*\[([^\]]*)\]/gm)) {
    for (const pathMatch of (match[1] ?? "").matchAll(/"([^"]+)"/g)) {
      if (pathMatch[1]) paths.push(pathMatch[1]);
    }
  }
  return paths;
}

export function servicePathCovers(
  servicePath: string,
  requestPath: string,
): boolean {
  const normalizedServicePath = servicePath.endsWith("/")
    ? servicePath
    : `${servicePath}/`;
  return (
    requestPath === servicePath.replace(/\/$/, "") ||
    requestPath.startsWith(normalizedServicePath)
  );
}

export async function stopBrowser(
  browser: ReturnType<typeof spawn>,
): Promise<void> {
  if (browser.exitCode !== null || browser.signalCode !== null) return;
  browser.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      browser.kill("SIGKILL");
      resolve();
    }, 1_500);
    browser.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

export async function validateRuntimeErrorHmr(
  previewPath: string,
): Promise<void> {
  const temporaryRoot = mkdtempSync(
    path.join(os.tmpdir(), "academy-runtime-error-hmr-"),
  );
  const profileDirectory = path.join(temporaryRoot, "chromium-profile");
  mkdirSync(profileDirectory);
  writeFileSync(
    path.join(temporaryRoot, "index.html"),
    "<!doctype html><html><head></head><body><main>HMR smoke</main></body></html>",
  );

  let server: Awaited<ReturnType<typeof createServer>> | undefined;
  let browser: ReturnType<typeof spawn> | undefined;
  let devTools: CdpClient | undefined;
  try {
    const serverPort = await freeLocalPort();
    server = await createServer({
      configFile: false,
      root: temporaryRoot,
      base: previewPath,
      mode: "development",
      logLevel: "silent",
      plugins: [runtimeErrorOverlay()],
      server: {
        host: "127.0.0.1",
        port: serverPort,
        strictPort: true,
        allowedHosts: true,
      },
    });
    await server.listen();
    if (server.config.command !== "serve") {
      throw new Error("Runtime error HMR smoke must run in Vite serve mode.");
    }
    const address = server.httpServer?.address();
    if (!address || typeof address === "string") {
      throw new Error("Vite did not expose its development server port.");
    }
    const pageUrl = `http://127.0.0.1:${address.port}${previewPath}`;
    const htmlResponse = await fetch(pageUrl);
    if (!htmlResponse.ok) {
      throw new Error(
        `Nested smoke page returned HTTP ${htmlResponse.status} at ${pageUrl}.`,
      );
    }
    const html = await htmlResponse.text();
    const expectedClientUrl = `${previewPath}@vite/client`;
    if (!html.includes(expectedClientUrl)) {
      throw new Error(
        `@replit/vite-plugin-runtime-error-modal did not use ${expectedClientUrl}.`,
      );
    }
    if (/["'`]\/@vite\/client(?:[?#][^"'`]*)?["'`]/.test(html)) {
      throw new Error(
        `@replit/vite-plugin-runtime-error-modal emitted root-only client URL "/@vite/client" under ${previewPath}.`,
      );
    }

    const websocketPaths: string[] = [];
    const runtimeReports: RuntimeErrorPayload[] = [];
    server.ws.on("connection", (_client, request) => {
      websocketPaths.push(
        new URL(request.url ?? "/", "http://localhost").pathname,
      );
    });
    server.ws.on(runtimeErrorEvent, (payload: RuntimeErrorPayload) => {
      runtimeReports.push(payload);
    });

    browser = spawn(
      chromiumExecutable(),
      [
        "--headless=new",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-background-networking",
        "--no-first-run",
        "--no-default-browser-check",
        "--remote-debugging-port=0",
        "--remote-allow-origins=*",
        `--user-data-dir=${profileDirectory}`,
        "about:blank",
      ],
      { stdio: "ignore" },
    );

    const browserError = new Promise<never>((_resolve, reject) => {
      browser?.once("error", reject);
    });
    const debugPort = await Promise.race([
      waitForDevToolsPort(browser, profileDirectory),
      browserError,
    ]);
    const pageTarget = await getPageTarget(debugPort);
    devTools = await connectDevTools(pageTarget.webSocketDebuggerUrl);
    await devTools.command("Page.enable");
    await devTools.command("Runtime.enable");

    let pageLoaded = false;
    const removeLoadListener = devTools.on("Page.loadEventFired", () => {
      pageLoaded = true;
    });
    const navigation = await devTools.command("Page.navigate", {
      url: pageUrl,
    });
    if (navigation.errorText) {
      throw new Error(`Chromium could not navigate to ${pageUrl}.`);
    }
    await waitFor(() => pageLoaded || undefined, "nested smoke page load");
    removeLoadListener();

    const connectedPaths = await waitFor(
      () => (websocketPaths.length > 0 ? websocketPaths : undefined),
      `the HMR websocket under ${previewPath}`,
    );
    const rootOnlyPaths = connectedPaths.filter(
      (requestPath) =>
        requestPath !== previewPath.replace(/\/$/, "") &&
        !requestPath.startsWith(previewPath),
    );
    if (rootOnlyPaths.length > 0) {
      throw new Error(
        `@replit/vite-plugin-runtime-error-modal connected its HMR websocket at root-only path(s) ${rootOnlyPaths.join(", ")} instead of beneath ${previewPath}.`,
      );
    }

    const servicePaths = artifactServicePaths();
    const unregisteredPaths = connectedPaths.filter(
      (requestPath) =>
        !servicePaths.some((servicePath) =>
          servicePathCovers(servicePath, requestPath),
        ),
    );
    if (unregisteredPaths.length > 0) {
      throw new Error(
        `Runtime error HMR websocket path(s) ${unregisteredPaths.join(", ")} are not covered by the Academy service paths in artifact.toml.`,
      );
    }

    const runtimeEvaluation = await devTools.command("Runtime.evaluate", {
      expression: `setTimeout(() => { throw new Error(${JSON.stringify(runtimeErrorMarker)}); }, 0);`,
      returnByValue: true,
    });
    if (runtimeEvaluation.exceptionDetails) {
      throw new Error("Chromium could not trigger the runtime error fixture.");
    }
    const report = await waitFor(
      () => runtimeReports.find((payload) => payload.message === runtimeErrorMarker),
      `the runtime error report over HMR at ${previewPath}`,
    );
    if (!report.stack) {
      throw new Error(
        `The nested runtime error report did not include a stack at ${previewPath}.`,
      );
    }
  } finally {
    devTools?.close();
    if (browser) await stopBrowser(browser);
    await server?.close();
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}