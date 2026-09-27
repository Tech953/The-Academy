import { spawn } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { createServer } from "vite";

import {
  artifactServicePaths,
  chromiumExecutable,
  connectDevTools,
  freeLocalPort,
  getPageTarget,
  servicePathCovers,
  stopBrowser,
  waitForDevToolsPort,
  type CdpClient,
} from "./runtime-error-hmr-smoke";

export type WorkerRequestKind = "Worker" | "SharedWorker";

export type ObservedWorkerRequest = {
  kind: WorkerRequestKind;
  source: string;
  url: string;
};

type WorkerSmokeResults = {
  source?: string;
  workerUrl?: string;
  sharedWorkerUrl?: string;
  rootWorkerRequestedUrl?: string;
  rootWorkerErrorUrl?: string;
};

type RawWorkerRequest = {
  kind: WorkerRequestKind;
  url: string;
};

function requestPath(url: string): string | undefined {
  try {
    return new URL(url, "http://localhost").pathname;
  } catch {
    return undefined;
  }
}

export function validateWorkerRequestPaths(
  previewPath: string,
  requests: ObservedWorkerRequest[],
): void {
  const escapingRequests = requests.filter((request) => {
    const pathname = requestPath(request.url);
    return !pathname || !pathname.startsWith(previewPath);
  });

  if (escapingRequests.length > 0) {
    const details = escapingRequests
      .map((request) => `${request.source}: ${request.url}`)
      .join(", ");
    throw new Error(
      `Browser Worker and SharedWorker requests bypass ${previewPath}: ${details}`,
    );
  }
}

function workerRequestKind(url: string): WorkerRequestKind | undefined {
  const pathname = requestPath(url);
  if (!pathname) return undefined;
  if (pathname.endsWith("/shared-worker.js")) return "SharedWorker";
  if (
    pathname.endsWith("/worker.js") ||
    pathname.endsWith("/root-only-worker.js")
  ) {
    return "Worker";
  }
  return undefined;
}

function completeResults(value: unknown): WorkerSmokeResults | undefined {
  if (!value || typeof value !== "object") return undefined;
  const results = value as WorkerSmokeResults;
  return results.source &&
    results.workerUrl &&
    results.sharedWorkerUrl &&
    results.rootWorkerRequestedUrl &&
    results.rootWorkerErrorUrl
    ? results
    : undefined;
}

async function waitForWorkerResults(
  devTools: CdpClient,
): Promise<WorkerSmokeResults> {
  const deadline = Date.now() + 10_000;
  let lastValue: unknown;
  while (Date.now() < deadline) {
    const response = await devTools.command("Runtime.evaluate", {
      expression: "window.__academyWorkerSmokeResults",
      returnByValue: true,
    });
    const evaluated = response.result as { value?: unknown } | undefined;
    lastValue = evaluated?.value;
    const results = completeResults(evaluated?.value);
    if (results) return results;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(
    `Timed out waiting for Worker, SharedWorker, and root-only browser requests. Last page result: ${JSON.stringify(lastValue)}`,
  );
}

async function waitForPageLoad(
  devTools: CdpClient,
  pageUrl: string,
): Promise<void> {
  let pageLoaded = false;
  const removeLoadListener = devTools.on("Page.loadEventFired", () => {
    pageLoaded = true;
  });
  try {
    const navigation = await devTools.command("Page.navigate", {
      url: pageUrl,
    });
    if (navigation.errorText) {
      throw new Error(`Chromium could not navigate to ${pageUrl}.`);
    }

    const deadline = Date.now() + 10_000;
    while (!pageLoaded && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!pageLoaded) {
      throw new Error(`Timed out waiting for the worker smoke page at ${pageUrl}.`);
    }
  } finally {
    removeLoadListener();
  }
}

function writeWorkerFixture(temporaryRoot: string): void {
  writeFileSync(
    path.join(temporaryRoot, "index.html"),
    `<!doctype html>
      <html>
        <head><meta charset="utf-8"></head>
        <body><script type="module" src="./main.js"></script></body>
      </html>`,
  );
  writeFileSync(
    path.join(temporaryRoot, "main.js"),
    `
      const results = { source: import.meta.url };
      window.__academyWorkerSmokeResults = results;

      const worker = new Worker(
        new URL("./worker.js", import.meta.url),
        { type: "module" },
      );
      worker.addEventListener("message", (event) => {
        results.workerUrl = event.data;
      });
      worker.postMessage("report-url");

      const sharedWorker = new SharedWorker(
        new URL("./shared-worker.js", import.meta.url),
        { type: "module", name: "academy-worker-url-smoke" },
      );
      sharedWorker.port.addEventListener("message", (event) => {
        results.sharedWorkerUrl = event.data;
      });
      sharedWorker.port.start();
      sharedWorker.port.postMessage("report-url");

      const rootWorkerRequestedUrl = "/workers/root-only-worker.js";
      results.rootWorkerRequestedUrl = rootWorkerRequestedUrl;
      const rootOnlyWorker = new Worker(rootWorkerRequestedUrl);
      rootOnlyWorker.addEventListener("error", (event) => {
        results.rootWorkerErrorUrl =
          event.filename || rootWorkerRequestedUrl;
      });
    `,
  );
  writeFileSync(
    path.join(temporaryRoot, "worker.js"),
    `self.addEventListener("message", () => self.postMessage(self.location.href));`,
  );
  writeFileSync(
    path.join(temporaryRoot, "shared-worker.js"),
    `
      self.onconnect = (event) => {
        const port = event.ports[0];
        port.onmessage = () => port.postMessage(self.location.href);
        port.start();
      };
    `,
  );
  const rootWorkerPath = path.join(
    temporaryRoot,
    "workers",
    "root-only-worker.js",
  );
  mkdirSync(path.dirname(rootWorkerPath), { recursive: true });
  writeFileSync(
    rootWorkerPath,
    `self.addEventListener("message", () => self.postMessage(self.location.href));`,
  );
}

export async function validateWorkerUrlRequests(
  previewPath: string,
): Promise<void> {
  const temporaryRoot = mkdtempSync(
    path.join(os.tmpdir(), "academy-worker-url-smoke-"),
  );
  const profileDirectory = path.join(temporaryRoot, "chromium-profile");
  mkdirSync(profileDirectory);
  writeWorkerFixture(temporaryRoot);

  let server: Awaited<ReturnType<typeof createServer>> | undefined;
  let browser: ReturnType<typeof spawn> | undefined;
  let devTools: CdpClient | undefined;
  const runtimeErrors: string[] = [];
  const consoleErrors: string[] = [];
  const requests: RawWorkerRequest[] = [];
  let removeRuntimeListeners = () => {};
  try {
    const serverPort = await freeLocalPort();
    server = await createServer({
      configFile: false,
      root: temporaryRoot,
      base: previewPath,
      mode: "development",
      logLevel: "silent",
      server: {
        host: "127.0.0.1",
        port: serverPort,
        strictPort: true,
        allowedHosts: true,
      },
    });
    await server.listen();

    const httpServer = server.httpServer;
    const address = httpServer?.address();
    if (!address || typeof address === "string") {
      throw new Error("Vite did not expose its worker smoke server port.");
    }
    const pageUrl = `http://127.0.0.1:${address.port}${previewPath}`;
    // Vite strips its base from req.url in middleware, so capture it first.
    httpServer.prependListener("request", (request) => {
      if (!request.url) return;
      const requestUrl = new URL(request.url, pageUrl).href;
      const kind = workerRequestKind(requestUrl);
      if (kind) requests.push({ kind, url: requestUrl });
    });
    const htmlResponse = await fetch(pageUrl);
    if (!htmlResponse.ok) {
      throw new Error(
        `Nested worker smoke page returned HTTP ${htmlResponse.status} at ${pageUrl}.`,
      );
    }
    const html = await htmlResponse.text();
    const expectedMainUrl = `${previewPath}main.js`;
    if (!html.includes(expectedMainUrl)) {
      throw new Error(
        `Worker smoke page did not load its main script under ${expectedMainUrl}.`,
      );
    }

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
    const removeExceptionListener = devTools.on(
      "Runtime.exceptionThrown",
      (params) => {
        const details = params.exceptionDetails as
          | {
              text?: string;
              exception?: { description?: string };
            }
          | undefined;
        runtimeErrors.push(
          details?.exception?.description ??
            details?.text ??
            JSON.stringify(details),
        );
      },
    );
    const removeConsoleListener = devTools.on(
      "Runtime.consoleAPICalled",
      (params) => {
        if (params.type === "error") consoleErrors.push(JSON.stringify(params));
      },
    );
    removeRuntimeListeners = () => {
      removeExceptionListener();
      removeConsoleListener();
    };

    await waitForPageLoad(devTools, pageUrl);
    let results: WorkerSmokeResults;
    try {
      results = await waitForWorkerResults(devTools);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `${reason} Observed requests: ${requests.map((request) => `${request.kind} ${request.url}`).join(", ") || "(none)"}. Browser exceptions: ${runtimeErrors.join(" | ") || "(none)"}. Console errors: ${consoleErrors.join(" | ") || "(none)"}`,
        { cause: error },
      );
    }
    const source =
      results.source || new URL(`${previewPath}main.js`, pageUrl).href;
    const observedRequests: ObservedWorkerRequest[] = requests.map(
      (request) => ({ ...request, source }),
    );
    const expectedWorkerPath = requestPath(results.workerUrl ?? "");
    const expectedSharedWorkerPath = requestPath(results.sharedWorkerUrl ?? "");
    const expectedRootWorkerPath = requestPath(
      results.rootWorkerRequestedUrl ?? "",
    );
    const workerRequest = observedRequests.find(
      (request) =>
        request.kind === "Worker" &&
        requestPath(request.url) === expectedWorkerPath,
    );
    const sharedWorkerRequest = observedRequests.find(
      (request) =>
        request.kind === "SharedWorker" &&
        requestPath(request.url) === expectedSharedWorkerPath,
    );
    const rootWorkerRequest = observedRequests.find(
      (request) =>
        request.kind === "Worker" &&
        requestPath(request.url) === expectedRootWorkerPath,
    );

    if (!workerRequest || !sharedWorkerRequest || !rootWorkerRequest) {
      throw new Error(
        `Chromium did not report all worker script requests. Observed: ${observedRequests.map((request) => `${request.kind} ${request.url}`).join(", ")}`,
      );
    }
    if (!results.rootWorkerErrorUrl) {
      throw new Error(
        `The root-only Worker request did not fail as expected: ${rootWorkerRequest.url}`,
      );
    }

    const safeRequests = [workerRequest, sharedWorkerRequest];
    validateWorkerRequestPaths(previewPath, safeRequests);

    const servicePaths = artifactServicePaths();
    const uncoveredRequests = safeRequests.filter((request) => {
      const pathname = requestPath(request.url);
      return (
        !pathname ||
        !servicePaths.some((servicePath) =>
          servicePathCovers(servicePath, pathname),
        )
      );
    });
    if (uncoveredRequests.length > 0) {
      throw new Error(
        `Nested Worker request path(s) are not covered by Academy service paths in artifact.toml: ${uncoveredRequests.map((request) => `${request.source}: ${request.url}`).join(", ")}`,
      );
    }

    let rootOnlyDiagnostic: Error | undefined;
    try {
      validateWorkerRequestPaths(previewPath, [rootWorkerRequest]);
    } catch (error) {
      rootOnlyDiagnostic =
        error instanceof Error ? error : new Error(String(error));
    }
    if (
      !rootOnlyDiagnostic ||
      !rootOnlyDiagnostic.message.includes(rootWorkerRequest.source) ||
      !rootOnlyDiagnostic.message.includes(rootWorkerRequest.url)
    ) {
      throw new Error(
        `Root-only browser Worker request did not produce a source-and-URL diagnostic: ${rootWorkerRequest.source}: ${rootWorkerRequest.url}`,
      );
    }

    console.log(
      `✓ Browser Worker ${workerRequest.url} and SharedWorker ${sharedWorkerRequest.url} stay under ${previewPath}`,
    );
    console.log(`  Root-only request rejected: ${rootOnlyDiagnostic.message}`);
  } finally {
    removeRuntimeListeners();
    devTools?.close();
    if (browser) await stopBrowser(browser);
    await server?.close();
    rmSync(temporaryRoot, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
}