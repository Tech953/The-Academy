import { describe, expect, it } from "vitest";

import {
  chainEvent,
  createWorldEvent,
  generateProceduralEvent,
  migrateRadiantAIState,
  radiantAI,
} from "../../academy/src/lib/radiantAI";

const createEvent = (type: Parameters<typeof createWorldEvent>[0]) =>
  createWorldEvent(
    type,
    "Test event",
    "A test event for migration coverage.",
    60_000,
    ["Library"],
    [],
    false,
  );

describe("Radiant event identifiers", () => {
  it("normalizes legacy inputs and new procedural events to shared categories", () => {
    expect(createEvent("exam").type).toBe("academic");
    expect(createEvent("accident").type).toBe("crisis");
    expect(createEvent("announcement").type).toBe("institutional");
    expect(generateProceduralEvent("exam", 60_000).type).toBe("academic");
    expect(generateProceduralEvent("accident", 60_000).type).toBe("crisis");
  });

  it("migrates legacy event names while preserving old save data", () => {
    const legacyState = JSON.stringify({
      npcs: [],
      events: [
        { ...createEvent("academic"), type: "exam" },
        { ...createEvent("crisis"), type: "accident" },
        { ...createEvent("institutional"), type: "announcement" },
        createEvent("competition"),
      ],
      factions: [],
      tickCounter: 4,
    });

    const migrated = JSON.parse(migrateRadiantAIState(legacyState));

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.tickCounter).toBe(4);
    expect(migrated.events.map((event: { type: string }) => event.type)).toEqual([
      "academic",
      "crisis",
      "institutional",
      "competition",
    ]);
  });

  it("loads legacy active events into the manager before canonical chaining", () => {
    const legacyState = JSON.stringify({
      npcs: [],
      events: [{ ...createEvent("academic"), type: "exam" }],
      factions: [],
      tickCounter: 0,
    });

    radiantAI.deserialize(legacyState);
    const loaded = JSON.parse(radiantAI.serialize());
    expect(loaded.events[0].type).toBe("academic");

    const followUp = chainEvent(createEvent("academic"), {
      chainProbability: 1,
      maxChainDepth: 1,
    });

    expect(followUp).not.toBeNull();
    expect(["social", "institutional"]).toContain(followUp?.type);
  });
});