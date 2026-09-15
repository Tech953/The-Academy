import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiLimiter } from "../src/middleware/security";

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
  app.use(apiLimiter);
  app.get("/limited", (_req, res) => {
    res.json({ ok: true });
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
): Promise<Response> {
  const headers = forwardedFor ? { "x-forwarded-for": forwardedFor } : undefined;
  return fetch(`${testServer.baseUrl}/limited`, { headers });
}

describe("forwarded-client rate limiting", () => {
  it("keeps direct requests valid and isolates quotas by forwarded client", async () => {
    const testServer = await startRateLimitedServer();

    const directRequest = await request(testServer);
    expect(directRequest.status).toBe(200);

    for (let requestNumber = 0; requestNumber < 200; requestNumber += 1) {
      expect((await request(testServer, "203.0.113.10")).status).toBe(200);
    }

    expect((await request(testServer, "203.0.113.10")).status).toBe(429);
    expect((await request(testServer, "203.0.113.11")).status).toBe(200);
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