import express from "express";
import rateLimit from "express-rate-limit";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import router from "../src/routes";
import { registerRoutes } from "../src/routes/routes";
import { logger } from "../src/lib/logger";
import {
  aiLimiter,
  apiLimiter,
  BoundedMemoryStore,
  contentPackLimiter,
  createRateLimitStore,
  handleRateLimitStoreError,
  PostgresRateLimitStore,
  RATE_LIMIT_CAPACITY_LOG_COOLDOWN_MS,
  RateLimitStoreError,
  type RateLimitStorePool,
  normalizeRateLimitIp,
  rateLimitKeyGenerator,
  SPECIALIZED_ROUTE_REFERENCES,
  shouldUseSharedRateLimitStore,
  SPECIALIZED_LIMITED_PATHS,
  SPECIALIZED_ROUTE_POLICY,
  shouldSkipGeneralApiLimit,
  validateSpecializedRouteReferences,
} from "../src/middleware/security";
import type { IStorage } from "../src/storage";

type TestServer = {
  server: Server;
  baseUrl: string;
};

type RouteLayer = {
  route?: {
    path?: string;
    methods?: Record<string, boolean>;
    stack?: Array<{ handle: unknown }>;
  };
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

async function startRateLimitedServer(trustProxyHops = 1): Promise<TestServer> {
  const app = express();
  app.set("trust proxy", trustProxyHops);
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
  it("uses PostgreSQL only for production environments with a database", () => {
    expect(
      shouldUseSharedRateLimitStore({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://example.invalid/academy",
      }),
    ).toBe(true);
    expect(
      shouldUseSharedRateLimitStore({
        NODE_ENV: "development",
        DATABASE_URL: "postgres://example.invalid/academy",
      }),
    ).toBe(false);
    expect(
      shouldUseSharedRateLimitStore({
        NODE_ENV: "production",
      }),
    ).toBe(false);
  });

  it("rejects production rate limiting without a database", () => {
    expect(() => createRateLimitStore("api", { NODE_ENV: "production" })).toThrow(
      "DATABASE_URL is required for production rate limiting",
    );
    expect(
      createRateLimitStore("api", { NODE_ENV: "production", DATABASE_URL: "postgres://example.invalid/academy" }),
    ).toBeInstanceOf(PostgresRateLimitStore);
    expect(createRateLimitStore("api", { NODE_ENV: "development" })).toBeInstanceOf(
      BoundedMemoryStore,
    );
  });

  it("returns a safe error when the shared PostgreSQL limiter store fails", async () => {
    const query = vi.fn(async () => {
      throw new Error("database credentials should not reach clients");
    });
    const pool = { query } as unknown as RateLimitStorePool;
    const store = new PostgresRateLimitStore("test", async () => pool);
    const limiter = rateLimit({
      windowMs: 60_000,
      max: 1,
      store,
      keyGenerator: rateLimitKeyGenerator,
      standardHeaders: true,
      legacyHeaders: false,
    });
    const app = express();
    app.use("/api", limiter);
    app.get("/api/locations", (_req, res) => res.json([]));
    app.use(handleRateLimitStoreError);
    const server = app.listen(0);
    openServers.add(server);
    await new Promise<void>(resolve => server.once("listening", () => resolve()));
    const address = server.address() as AddressInfo;

    const response = await fetch(`http://127.0.0.1:${address.port}/api/locations`);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Rate limiting is temporarily unavailable. Please try again shortly.",
    });
    expect(query).toHaveBeenCalledTimes(1);
    await expect(store.increment("test-client")).rejects.toBeInstanceOf(RateLimitStoreError);
  });

  it("cleans expired shared rows without deleting active or renewed windows", async () => {
    type FakeRow = { totalHits: number; resetTime: Date };
    const rows = new Map<string, FakeRow>();
    const activeResetTime = new Date(Date.now() + 60_000);
    rows.set("shared:active-client", { totalHits: 7, resetTime: activeResetTime });
    rows.set("shared:expired-client", {
      totalHits: 4,
      resetTime: new Date(Date.now() - 1),
    });
    const query = vi.fn(async (text: string, values: unknown[] = []) => {
      if (text.includes("CREATE TABLE")) return { rows: [] };
      if (text.includes("DELETE FROM")) {
        const now = Date.now();
        for (const [rowKey, row] of rows) {
          if (row.resetTime.getTime() <= now) rows.delete(rowKey);
        }
        return { rows: [] };
      }
      if (text.includes("INSERT INTO")) {
        const limiterName = String(values[0]);
        const clientKey = String(values[1]);
        const windowMs = Number(values[2]);
        const rowKey = `${limiterName}:${clientKey}`;
        const existing = rows.get(rowKey);
        const now = Date.now();
        const row = existing && existing.resetTime.getTime() > now
          ? {
              totalHits: existing.totalHits + 1,
              resetTime: existing.resetTime,
            }
          : {
              totalHits: 1,
              resetTime: new Date(now + windowMs),
            };
        rows.set(rowKey, row);
        return {
          rows: [{
            total_hits: row.totalHits,
            reset_time: row.resetTime,
          }],
        };
      }
      throw new Error(`Unexpected SQL: ${text}`);
    });
    const pool = { query } as unknown as RateLimitStorePool;
    const firstStore = new PostgresRateLimitStore("shared", async () => pool);
    const secondStore = new PostgresRateLimitStore("shared", async () => pool);
    const storeOptions = { windowMs: 60_000 } as Parameters<
      NonNullable<typeof firstStore.init>
    >[0];
    firstStore.init(storeOptions);
    secondStore.init(storeOptions);

    await Promise.all([
      firstStore.increment("new-client-one"),
      secondStore.increment("new-client-two"),
      firstStore.increment("expired-client"),
      secondStore.increment("expired-client"),
    ]);

    expect(rows.get("shared:active-client")).toEqual({
      totalHits: 7,
      resetTime: activeResetTime,
    });
    expect(rows.get("shared:expired-client")?.totalHits).toBe(2);
    expect(rows.get("shared:expired-client")?.resetTime.getTime()).toBeGreaterThan(Date.now());
    expect(
      query.mock.calls.filter(([text]) => text.includes("DELETE FROM")).length,
    ).toBe(4);
    expect(query.mock.calls.every(([text]) =>
      !text.includes("DELETE FROM") || text.includes("reset_time <= NOW()"),
    )).toBe(true);
  });

  it("bounds local rate-limit state and expires inactive identities", async () => {
    vi.useFakeTimers();
    const store = new BoundedMemoryStore(2);
    store.init({ windowMs: 1_000 } as Parameters<NonNullable<typeof store.init>>[0]);

    try {
      await store.increment("first-client");
      await store.increment("second-client");
      await store.increment("third-client");

      expect(await store.get("first-client")).toBeUndefined();
      expect((await store.get("third-client"))?.totalHits).toBe(1);

      vi.advanceTimersByTime(1_001);

      expect(await store.get("second-client")).toBeUndefined();
      expect(await store.get("third-client")).toBeUndefined();
    } finally {
      store.shutdown();
      vi.useRealTimers();
    }
  });

  it("reports bounded-store pressure without logging normal traffic or every eviction", async () => {
    vi.useFakeTimers();
    const warning = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    const store = new BoundedMemoryStore(2);
    store.init({ windowMs: 120_000 } as Parameters<NonNullable<typeof store.init>>[0]);

    try {
      await store.increment("first-client");
      await store.increment("second-client");
      expect(store.getStats()).toEqual({
        activeKeys: 2,
        maxKeys: 2,
        capacityPressureEvents: 0,
        evictionCount: 0,
      });
      expect(warning).not.toHaveBeenCalled();

      await store.increment("third-client");
      await store.increment("fourth-client");
      expect(store.getStats()).toEqual({
        activeKeys: 2,
        maxKeys: 2,
        capacityPressureEvents: 2,
        evictionCount: 2,
      });
      expect(warning).toHaveBeenCalledTimes(1);
      expect(warning.mock.calls[0]?.[0]).toMatchObject({
        store: "bounded-memory-rate-limit",
        maxKeys: 2,
        activeKeys: 1,
        capacityPressureEvents: 1,
        evictionCount: 1,
      });

      vi.advanceTimersByTime(RATE_LIMIT_CAPACITY_LOG_COOLDOWN_MS + 1);
      await store.increment("fifth-client");
      expect(store.getStats().evictionCount).toBe(3);
      expect(warning).toHaveBeenCalledTimes(2);
    } finally {
      warning.mockRestore();
      store.shutdown();
      vi.useRealTimers();
    }
  });

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

  it("shares quota between IPv4 and its IPv4-mapped IPv6 identity", async () => {
    const testServer = await startRateLimitedServer();
    const ipv4 = "198.51.100.50";
    const mappedIpv4 = "::ffff:198.51.100.50";
    const distinctMappedIpv4 = "::ffff:198.51.100.51";

    expect(normalizeRateLimitIp(mappedIpv4)).toBe(ipv4);
    expect(normalizeRateLimitIp(distinctMappedIpv4)).toBe("198.51.100.51");
    expect(normalizeRateLimitIp("2001:db8:10::10")).toBe("2001:db8:10::10");
    expect(
      rateLimitKeyGenerator({
        ip: ipv4,
        socket: { remoteAddress: "192.0.2.1" },
      }),
    ).toBe(rateLimitKeyGenerator({
      ip: mappedIpv4,
      socket: { remoteAddress: "192.0.2.1" },
    }));

    for (let requestNumber = 0; requestNumber < 200; requestNumber += 1) {
      expect((await request(testServer, ipv4)).status).toBe(200);
    }

    expect((await request(testServer, mappedIpv4)).status).toBe(429);
    expect((await request(testServer, distinctMappedIpv4)).status).toBe(200);
  });

  it("falls back to the trusted socket for malformed forwarded identities", () => {
    const trustedSocket = { remoteAddress: "192.0.2.44" };

    expect(rateLimitKeyGenerator({
      ip: "not-an-ip",
      socket: trustedSocket,
    })).toBe(rateLimitKeyGenerator({
      ip: trustedSocket.remoteAddress,
      socket: trustedSocket,
    }));
    expect(rateLimitKeyGenerator({
      ip: "::ffff:not-an-ip",
      socket: trustedSocket,
    })).toBe(rateLimitKeyGenerator({
      ip: trustedSocket.remoteAddress,
      socket: trustedSocket,
    }));
    expect(rateLimitKeyGenerator({
      ip: "not-an-ip",
      socket: { remoteAddress: "::ffff:192.0.2.45" },
    })).toBe(rateLimitKeyGenerator({
      ip: "192.0.2.45",
      socket: { remoteAddress: "192.0.2.45" },
    }));
  });

  it("shares the HTTP quota with the trusted socket when X-Forwarded-For is malformed", async () => {
    await apiLimiter.resetKey("127.0.0.1");
    const testServer = await startRateLimitedServer();
    const malformedForwardedFor = "not-an-ip";
    const distinctClient = "198.51.100.70";

    expect((await request(testServer)).status).toBe(200);
    for (let requestNumber = 1; requestNumber < 200; requestNumber += 1) {
      expect((await request(testServer, malformedForwardedFor)).status).toBe(200);
    }

    expect((await request(testServer)).status).toBe(429);
    expect((await request(testServer, distinctClient)).status).toBe(200);
  });

  it("uses the socket peer as the quota identity when no proxy hops are trusted", async () => {
    await apiLimiter.resetKey("127.0.0.1");
    const testServer = await startRateLimitedServer(0);

    // TRUST_PROXY_HOPS=0 ignores every forwarded address and uses the
    // directly connected socket peer for the limiter identity.
    for (let requestNumber = 0; requestNumber < 200; requestNumber += 1) {
      expect((await request(testServer, "198.51.100.80")).status).toBe(200);
    }

    expect((await request(testServer, "203.0.113.80")).status).toBe(429);
  });

  it("uses the first untrusted address when two proxy hops are trusted", async () => {
    await apiLimiter.resetKey("127.0.0.1");
    const testServer = await startRateLimitedServer(2);
    const firstUntrustedAddress = "198.51.100.90";
    const trustedProxyAddress = "203.0.113.90";

    // TRUST_PROXY_HOPS=2 trusts the socket and the rightmost forwarded
    // address, so the leftmost address is the limiter identity.
    for (let requestNumber = 0; requestNumber < 200; requestNumber += 1) {
      expect(
        (await request(
          testServer,
          `${firstUntrustedAddress}, ${trustedProxyAddress}`,
        )).status,
      ).toBe(200);
    }

    expect(
      (
        await request(
          testServer,
          `${firstUntrustedAddress}, 203.0.113.91`,
        )
      ).status,
    ).toBe(429);
    expect(
      (await request(testServer, `198.51.100.91, ${trustedProxyAddress}`)).status,
    ).toBe(200);
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

  it("uses only the configured trust depth from a multi-hop forwarded chain", async () => {
    const testServer = await startRateLimitedServer();
    const olderHop = "198.51.100.60";
    const immediateClient = "198.51.100.61";
    const alternateOlderHop = "203.0.113.200";
    const distinctClient = "198.51.100.62";

    for (let requestNumber = 0; requestNumber < 200; requestNumber += 1) {
      expect(
        (await request(testServer, `${olderHop}, ${immediateClient}`)).status,
      ).toBe(200);
    }

    // TRUST_PROXY_HOPS=1 means the rightmost forwarded address is the
    // client identity; older forwarded entries cannot create another bucket.
    expect((await request(testServer, immediateClient)).status).toBe(429);
    expect(
      (await request(testServer, `${alternateOlderHop}, ${immediateClient}`)).status,
    ).toBe(429);
    expect((await request(testServer, distinctClient)).status).toBe(200);
  });

  it("skips health and specialized routes from the general quota", () => {
    const policyEntries = Object.values(SPECIALIZED_ROUTE_POLICY);
    expect(policyEntries.map(entry => entry.path)).toEqual(SPECIALIZED_LIMITED_PATHS);
    expect(policyEntries.every(entry => entry.quotaBoundary.length > 0)).toBe(true);
    expect(policyEntries.filter(entry => entry.limiterFamily === "ai")).toHaveLength(5);
    expect(policyEntries.filter(entry => entry.limiterFamily === "content-pack")).toHaveLength(1);
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

  it("validates generated route references against the canonical policy", () => {
    expect(() => validateSpecializedRouteReferences(SPECIALIZED_ROUTE_REFERENCES)).not.toThrow();

    const missingReference = SPECIALIZED_ROUTE_REFERENCES.slice(1);
    expect(() => validateSpecializedRouteReferences(missingReference)).toThrow(
      /missing route reference/,
    );

    const renamedReference = SPECIALIZED_ROUTE_REFERENCES.map(reference =>
      reference.key === "aiDescribe"
        ? { ...reference, path: "/api/ai/renamed" }
        : reference,
    );
    expect(() => validateSpecializedRouteReferences(renamedReference)).toThrow(
      /path mismatch for aiDescribe/,
    );

    const wrongFamilyReference = SPECIALIZED_ROUTE_REFERENCES.map(reference =>
      reference.key === "contentPackRefresh"
        ? { ...reference, limiterFamily: "ai" as const }
        : reference,
    );
    expect(() => validateSpecializedRouteReferences(wrongFamilyReference)).toThrow(
      /limiter family mismatch for contentPackRefresh/,
    );
  });

  it("mounts every specialized route with its policy limiter family", async () => {
    const app = express();
    await registerRoutes(app, {
      storage: {
        getAllLocations: vi.fn(async () => []),
      } as unknown as IStorage,
      skipContentRefresh: true,
    });

    const routeStack =
      (app as unknown as { router?: { stack?: RouteLayer[] } }).router?.stack ?? [];

    for (const routePolicy of Object.values(SPECIALIZED_ROUTE_POLICY)) {
      const routeLayer = routeStack.find(
        layer =>
          layer.route?.path === `/api${routePolicy.path}` &&
          layer.route.methods?.post === true,
      );
      const expectedLimiter =
        routePolicy.limiterFamily === "ai" ? aiLimiter : contentPackLimiter;

      expect(routeLayer).toBeDefined();
      expect(routeLayer?.route?.stack?.[0]?.handle).toBe(expectedLimiter);
    }
  });

  it("rejects an invalid proxy-hop configuration before the API starts", async () => {
    const previousValue = process.env.TRUST_PROXY_HOPS;

    try {
      for (const invalidValue of ["one", "-1"]) {
        process.env.TRUST_PROXY_HOPS = invalidValue;
        vi.resetModules();

        await expect(import("../src/app")).rejects.toThrow(
          /TRUST_PROXY_HOPS must be a non-negative integer/,
        );
      }

      process.env.TRUST_PROXY_HOPS = "9007199254740992";
      vi.resetModules();
      await expect(import("../src/app")).rejects.toThrow(
        /TRUST_PROXY_HOPS is out of range/,
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