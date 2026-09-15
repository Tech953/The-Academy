import { createServer, type Server } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

const {
  createMetroRequestUrl,
  findAvailableMetroPort,
  getConfiguredMetroPort,
} = require("../scripts/metro-port.js") as {
  createMetroRequestUrl: (
    port: number,
    pathname: string,
    query?: Record<string, string>,
  ) => string;
  findAvailableMetroPort: (
    preferredPort: number,
    options?: {
      isAvailable?: (port: number) => boolean | Promise<boolean>;
      maxSearch?: number;
    },
  ) => Promise<number>;
  getConfiguredMetroPort: (
    env?: Record<string, string | undefined>,
  ) => number;
};

const listeners: Server[] = [];

function listenOn(port: number) {
  return new Promise<Server>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      listeners.push(server);
      resolve(server);
    });
  });
}

async function findConsecutiveFreePorts() {
  for (let preferred = 20_000; preferred < 30_000; preferred += 1) {
    let first: Server | undefined;
    let second: Server | undefined;

    try {
      first = await listenOn(preferred);
      second = await listenOn(preferred + 1);
      first.close();
      second.close();
      listeners.splice(-2, 2);
      return preferred;
    } catch {
      first?.close();
      second?.close();
      listeners.splice(-2, 2);
    }
  }

  throw new Error("Could not find two consecutive free test ports");
}

afterEach(async () => {
  await Promise.all(
    listeners.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        }),
    ),
  );
});

describe("Metro port selection", () => {
  it("moves to the next available port when the preferred port is occupied", async () => {
    const preferred = await findConsecutiveFreePorts();
    await listenOn(preferred);

    await expect(findAvailableMetroPort(preferred)).resolves.toBe(preferred + 1);
  });

  it("honors EXPO_METRO_PORT before the legacy METRO_PORT override", () => {
    expect(
      getConfiguredMetroPort({
        EXPO_METRO_PORT: "9123",
        METRO_PORT: "9124",
      }),
    ).toBe(9123);
  });

  it.each(["abc", "1023", "65536", "12.5"])(
    "rejects invalid configured port %s with an actionable diagnostic",
    (value) => {
      expect(() =>
        getConfiguredMetroPort({ EXPO_METRO_PORT: value }),
      ).toThrow(
        `Invalid Metro port "${value}". Set EXPO_METRO_PORT or METRO_PORT to an integer between 1024 and 65535.`,
      );
    },
  );

  it("uses the selected port for bundle, manifest, and asset requests", () => {
    const selectedPort = 20_321;
    const urls = [
      createMetroRequestUrl(
        selectedPort,
        "/artifacts/academy-mobile/node_modules/expo-router/entry.bundle",
        {
          platform: "android",
          dev: "false",
          minify: "true",
        },
      ),
      createMetroRequestUrl(selectedPort, "/manifest"),
      createMetroRequestUrl(selectedPort, "/assets/images/icon.png"),
    ].map((request) => new URL(request));

    expect(urls.map((url) => url.port)).toEqual([
      String(selectedPort),
      String(selectedPort),
      String(selectedPort),
    ]);
    expect(urls[0].searchParams.get("platform")).toBe("android");
    expect(urls[1].pathname).toBe("/manifest");
    expect(urls[2].pathname).toBe("/assets/images/icon.png");
  });

  it("reports the full search range when every candidate is occupied", async () => {
    await expect(
      findAvailableMetroPort(20_400, {
        isAvailable: async () => false,
        maxSearch: 3,
      }),
    ).rejects.toThrow(
      "Could not find an available Metro port from 20400 through 20402.",
    );
  });
});