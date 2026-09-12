import { describe, expect, it } from "vitest";

import { scoreToRelationshipTier } from "@workspace/game-engine";

import {
  computeRelationshipShift,
  shouldShowShift,
  type RelationshipShift,
} from "../lib/relationshipShift";

describe("computeRelationshipShift", () => {
  it("reports a positive shift with tiers matching the score mapping", () => {
    const shift = computeRelationshipShift(9, 3, 1000);
    expect(shift).not.toBeNull();
    expect(shift!.delta).toBe(3);
    expect(shift!.timestamp).toBe(1000);
    expect(shift!.fromTier).toBe(scoreToRelationshipTier(9));
    expect(shift!.toTier).toBe(scoreToRelationshipTier(12));
  });

  it("reports a negative shift", () => {
    const shift = computeRelationshipShift(20, -4, 1000);
    expect(shift?.delta).toBe(-4);
  });

  it("keeps tiers equal when no boundary is crossed", () => {
    const shift = computeRelationshipShift(1, 1, 1000)!;
    expect(shift.fromTier).toBe(shift.toTier);
  });

  it("clamps at the floor: negative tone at score 0 is a no-op", () => {
    expect(computeRelationshipShift(0, -5, 1000)).toBeNull();
  });

  it("clamps at the ceiling: positive tone at score 100 is a no-op", () => {
    expect(computeRelationshipShift(100, 5, 1000)).toBeNull();
  });

  it("partially clamps near the ceiling", () => {
    const shift = computeRelationshipShift(98, 5, 1000)!;
    expect(shift.delta).toBe(2);
  });

  it("returns null for a neutral (zero) delta", () => {
    expect(computeRelationshipShift(50, 0, 1000)).toBeNull();
  });
});

describe("shouldShowShift (display-once lifecycle)", () => {
  const shift: RelationshipShift = {
    delta: 2,
    fromTier: "stranger",
    toTier: "stranger",
    timestamp: 1234,
  };

  it("shows a fresh, never-seen shift", () => {
    expect(shouldShowShift(shift, undefined)).toBe(true);
  });

  it("does NOT replay a shift already seen (reopening the chat)", () => {
    // The UI marks the timestamp seen when it displays it or when the chat
    // is opened with a pre-existing shift; either way it must not show again.
    expect(shouldShowShift(shift, shift.timestamp)).toBe(false);
  });

  it("shows a newer shift for the same NPC after an older one was seen", () => {
    const newer = { ...shift, timestamp: 5678 };
    expect(shouldShowShift(newer, shift.timestamp)).toBe(true);
  });

  it("shows nothing when the NPC has no shift at all", () => {
    expect(shouldShowShift(undefined, undefined)).toBe(false);
    expect(shouldShowShift(undefined, 1234)).toBe(false);
  });
});
