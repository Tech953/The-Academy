import { describe, expect, it } from "vitest";

import {
  chainEvent,
  createWorldEvent,
  generateProceduralEvent,
  migrateWorldEvent,
  migrateRadiantAIState,
  radiantAI,
} from "../../academy/src/lib/radiantAI";
import { WORLD_EVENT_ENERGY } from "../../academy/src/lib/resonanceRadiantBridge";

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
  it("keeps explicit resonance energy for every canonical shared category", () => {
    expect(WORLD_EVENT_ENERGY).toEqual({
      academic: { force: 0.5, clarity: 0.6, order: 0.4, instability: 0.3 },
      competition: { force: 0.7, chaos: 0.3, growth: 0.4 },
      institutional: { clarity: 0.5, order: 0.4 },
      social: { connection: 0.6, harmony: 0.4, growth: 0.3 },
      crisis: { chaos: 0.9, fear: 0.7, instability: 0.8, entropy: 0.6 },
      discovery: { clarity: 0.5, growth: 0.4 },
      seasonal: { harmony: 0.4, growth: 0.3 },
      mystery: { instability: 0.5, curiosity: 0.5 },
    });
  });

  it.each([
    ["exam", "academic"],
    ["accident", "crisis"],
    ["announcement", "institutional"],
  ] as const)(
    "routes migrated legacy %s events through the canonical %s energy path",
    (legacyType, canonicalType) => {
      const migrated = migrateWorldEvent({
        ...createEvent(canonicalType),
        type: legacyType,
      });

      expect(migrated?.type).toBe(canonicalType);
      expect(WORLD_EVENT_ENERGY[migrated?.type ?? canonicalType]).toEqual(
        WORLD_EVENT_ENERGY[canonicalType],
      );
    },
  );

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