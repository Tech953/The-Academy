import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  analyzeDialogueTone,
  dayToWeek,
  getRelationshipProgress,
  scoreToRelationshipTier,
} from "@workspace/game-engine";
import { computeRelationshipShift } from "../lib/relationshipShift";

// This suite exercises production pure functions without Expo or a backend.
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => {
    throw new Error("Network access is forbidden in dialogue unit tests");
  }));
});
afterEach(() => {
  expect(fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe("dialogue tone contract", () => {
  it.each([
    ["thank you", 4, "happy", "warm"],
    ["thank you, I appreciate it", 6, "happy", "warm"],
    ["idiot", -4, "angry", "hostile"],
    ["idiot, useless", -7, "angry", "hostile"],
    ["When is the exam?", 2, "focused", "curious"],
    ["I am here.", 1, "neutral", "neutral"],
    ["", 1, "neutral", "neutral"],
    ["   ", 1, "neutral", "neutral"],
    ["THANK YOU", 4, "happy", "warm"],
    ["When is the exam?   ", 2, "focused", "curious"],
    ["thank thank thank", 4, "happy", "warm"],
    ["thank you, idiot", 1, "neutral", "neutral"],
    ["thank you, idiot?", 2, "focused", "curious"],
    ["thank you, appreciate it, idiot?", 4, "happy", "warm"],
    ["thank you, idiot, useless?", -4, "angry", "hostile"],
  ])("%j yields delta %i, %s emotion and %s sentiment", (message, delta, emotion, sentiment) => {
    expect(analyzeDialogueTone(message)).toEqual({ delta, emotion, sentiment });
  });
});

describe("relationship tier boundaries", () => {
  it.each([
    [-1, "stranger"], [0, "stranger"], [9, "stranger"],
    [10, "acquaintance"], [11, "acquaintance"], [29, "acquaintance"],
    [30, "friendly"], [31, "friendly"], [49, "friendly"],
    [50, "friend"], [51, "friend"], [69, "friend"],
    [70, "close"], [71, "close"], [89, "close"],
    [90, "trusted"], [91, "trusted"], [100, "trusted"], [101, "trusted"],
  ])("score %i maps to %s", (score, tier) => {
    expect(scoreToRelationshipTier(score)).toBe(tier);
  });

  it.each([
    [9, "thank you", 4, "stranger", "acquaintance"],
    [10, "idiot", -4, "acquaintance", "stranger"],
    [98, "thank you", 2, "trusted", "trusted"],
    [2, "idiot", -2, "stranger", "stranger"],
  ])("applies actual tone at score %i with clamping", (score, message, delta, fromTier, toTier) => {
    expect(computeRelationshipShift(score, analyzeDialogueTone(message).delta, 123))
      .toEqual({ delta, fromTier, toTier, timestamp: 123 });
  });

  it("cannot increase beyond 100 or decrease below 0", () => {
    expect(computeRelationshipShift(100, analyzeDialogueTone("thank you").delta, 123)).toBeNull();
    expect(computeRelationshipShift(0, analyzeDialogueTone("idiot").delta, 123)).toBeNull();
  });

  it.each([
    [0, "stranger", 0, 10, 0, "acquaintance"],
    [5, "stranger", 0, 10, 0.5, "acquaintance"],
    [10, "acquaintance", 10, 30, 0, "friendly"],
    [20, "acquaintance", 10, 30, 0.5, "friendly"],
    [50, "friend", 50, 70, 0, "close"],
    [80, "close", 70, 90, 0.5, "trusted"],
    [90, "trusted", 90, 100, 0, null],
    [100, "trusted", 90, 100, 1, null],
  ])("score %i reports %s progress toward %s", (score, tier, startScore, endScore, progress, nextTier) => {
    expect(getRelationshipProgress(score)).toEqual({
      score,
      tier,
      startScore,
      endScore,
      progress,
      nextTier,
    });
  });

  it("clamps progress input so a stale score cannot break the UI", () => {
    expect(getRelationshipProgress(-10)).toMatchObject({
      score: 0,
      tier: "stranger",
      progress: 0,
    });
    expect(getRelationshipProgress(125)).toMatchObject({
      score: 100,
      tier: "trusted",
      progress: 1,
      nextTier: null,
    });
  });
});

describe("one-indexed game weeks", () => {
  it.each([
    [-7, 1], [0, 1], [1, 1], [6, 1], [7, 1],
    [8, 2], [9, 2], [14, 2], [15, 3],
    [21, 3], [22, 4], [364, 52], [365, 53],
  ])("day %i maps to week %i", (day, week) => {
    expect(dayToWeek(day)).toBe(week);
  });
});