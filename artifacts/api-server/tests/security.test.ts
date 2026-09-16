import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import router from "../src/routes";
import { registerRoutes } from "../src/routes/routes";
import {
  apiLimiter,
  SPECIALIZED_LIMITED_PATHS,
  shouldSkipGeneralApiLimit,
} from "../src/middleware/security";
import type { IStorage } from "../src/storage";

type TestServer = {
  server: Server;
  baseUrl: string;
};

const openServers = new Set<Server>();

afterEach(async () => {
  await Promise.all(
    [...openServers].map(
      server =>
        new Promise<void>(resolve => {
          server.close(() => resolve());
        }),
    ),
  );
  openServers.clear();
});

async function startRateLimitedServer(): Promise<TestServer> {
  const app = express();
  app.set("trust proxy", 1);
  app.use("/api", apiLimiter);
  app.use("/api", router);
  await registerRoutes(app, {
    storage: {
      getAllLocations: vi.fn(async () => []),
    } as unknown as IStorage,
    skipContentRefresh: true,
  });

  const server = app.listen(0);
  openServers.add(server);
  await new Promise<void>(resolve => server.once("listening", () => resolve()));
  const address = server.address() as AddressInfo;
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function request(
  testServer: TestServer,
  forwardedFor?: string,
  path = "/api/locations",
): Promise<Response> {
  const headers = forwardedFor ? { "x-forwarded-for": forwardedFor } : undefined;
  return fetch(`${testServer.baseUrl}${path}`, { headers });
}

describe("forwarded-client rate limiting", () => {
  it("keeps direct requests valid and isolates quotas by forwarded client", async () => {
    const testServer = await startRateLimitedServer();

    const directRequest = await request(testServer);
    expect(directRequest.status).toBe(200);
    expect((await request(testServer, undefined, "/api/healthz")).status).toBe(200);

    for (let requestNumber = 0; requestNumber < 200; requestNumber += 1) {
      expect((await request(testServer, "203.0.113.10")).status).toBe(200);
    }

    const blockedRequest = await request(testServer, "203.0.113.10");
    expect(blockedRequest.status).toBe(429);
    expect(blockedRequest.headers.get("ratelimit-limit")).toBe("200");
    expect(blockedRequest.headers.get("ratelimit-remaining")).toBe("0");
    expect(blockedRequest.headers.get("ratelimit-policy")).toBe("200;w=900");
    expect(blockedRequest.headers.get("ratelimit-reset")).toMatch(/^\d+$/);
    expect(blockedRequest.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(blockedRequest.headers.get("x-ratelimit-limit")).toBeNull();
    expect(blockedRequest.headers.get("x-ratelimit-remaining")).toBeNull();
    expect(blockedRequest.headers.get("x-ratelimit-reset")).toBeNull();
    expect((await request(testServer, "203.0.113.11")).status).toBe(200);
  });

  it("keeps IPv6 forwarded clients isolated from one another", async () => {
    const testServer = await startRateLimitedServer();
    // Keep these in different prefixes because IPv6 limiters may group
    // addresses by subnet when deriving a client key.
    const firstClient = "2001:db8:10::10";
    const secondClient = "2001:db8:11::11";

    for (let requestNumber = 0; requestNumber < 200; requestNumber += 1) {
      expect((await request(testServer, firstClient)).status).toBe(200);
    }

    const blockedRequest = await request(testServer, firstClient);
    expect(blockedRequest.status).toBe(429);
    expect((await request(testServer, secondClient)).status).toBe(200);
  });

  it("skips health and specialized routes from the general quota", () => {
    expect(shouldSkipGeneralApiLimit({ path: "/api/healthz" })).toBe(false);
    expect(shouldSkipGeneralApiLimit({ path: "/healthz" })).toBe(true);
    expect(shouldSkipGeneralApiLimit({ path: "/ai/describe" })).toBe(true);
    expect(shouldSkipGeneralApiLimit({ path: "/content-pack/refresh" })).toBe(true);
    expect(shouldSkipGeneralApiLimit({ path: "/locations" })).toBe(false);

    for (const specializedPath of SPECIALIZED_LIMITED_PATHS) {
      expect(shouldSkipGeneralApiLimit({ path: specializedPath })).toBe(true);
      expect(shouldSkipGeneralApiLimit({ path: `/api${specializedPath}` })).toBe(false);
    }
  });

  it("rejects an invalid proxy-hop configuration before the API starts", async () => {
    const previousValue = process.env.TRUST_PROXY_HOPS;
    process.env.TRUST_PROXY_HOPS = "one";
    vi.resetModules();

    try {
      await expect(import("../src/app")).rejects.toThrow(
        /TRUST_PROXY_HOPS must be a non-negative integer/,
      );
    } finally {
      if (previousValue === undefined) {
        delete process.env.TRUST_PROXY_HOPS;
      } else {
        process.env.TRUST_PROXY_HOPS = previousValue;
      }
      vi.resetModules();
    }
  });
});