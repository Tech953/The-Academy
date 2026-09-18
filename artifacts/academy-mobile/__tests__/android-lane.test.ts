import { describe, expect, it } from "vitest";

import {
  applyAndroidLaneStorageCommand,
  getAndroidLaneCommand,
} from "../lib/androidLane";
import { CONTENT_PACK_STORAGE_KEY, parseCachedContentPack } from "../lib/contentPackFallback";

function createStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("Android bulletin lane harness", () => {
  it("extracts only the lane command from the deep link", () => {
    expect(getAndroidLaneCommand("academy-mobile://?androidLane=expired")).toBe("expired");
    expect(getAndroidLaneCommand("academy-mobile://?other=expired")).toBeNull();
    expect(getAndroidLaneCommand("academy-mobile://?androidLane=bad%20value")).toBe("bad value");
  });

  it("writes intentionally corrupt native storage", async () => {
    const storage = createStorage();

    await applyAndroidLaneStorageCommand(storage, "corrupt", 1, 10);

    expect(storage.values.get(CONTENT_PACK_STORAGE_KEY)).toBe("{not-valid-json");
    expect(parseCachedContentPack(storage.values.get(CONTENT_PACK_STORAGE_KEY) ?? null, 10)).toBeNull();
  });

  it("writes a structurally valid but expired native pack", async () => {
    const storage = createStorage();

    await applyAndroidLaneStorageCommand(storage, "expired", 1, 10);

    const raw = storage.values.get(CONTENT_PACK_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.expiresAt).toBe(9);
    expect(parseCachedContentPack(raw!, 10)).toBeNull();
  });
});