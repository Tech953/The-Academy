import { describe, it, expect } from "vitest";
import {
  percentToScaledScore,
  scaledScoreBand,
  bandForPercent,
  GED_PASSING_SCORE,
  GED_COLLEGE_READY_SCORE,
  GED_COLLEGE_READY_CREDIT_SCORE,
} from "./gedScale";

describe("percentToScaledScore — anchors", () => {
  it("hits every documented anchor exactly", () => {
    expect(percentToScaledScore(0)).toBe(100);
    expect(percentToScaledScore(60)).toBe(GED_PASSING_SCORE); // 145
    expect(percentToScaledScore(75)).toBe(GED_COLLEGE_READY_SCORE); // 165
    expect(percentToScaledScore(85)).toBe(GED_COLLEGE_READY_CREDIT_SCORE); // 175
    expect(percentToScaledScore(100)).toBe(200);
  });

  it("interpolates between anchors", () => {
    // Halfway along the 0→60 segment: 100 + 0.5 * 45 = 122.5 → 123
    expect(percentToScaledScore(30)).toBe(123);
    // Halfway along the 60→75 segment: 145 + 0.5 * 20 = 155
    expect(percentToScaledScore(67.5)).toBe(155);
  });

  it("clamps out-of-range input to the scale ends", () => {
    expect(percentToScaledScore(-25)).toBe(100);
    expect(percentToScaledScore(140)).toBe(200);
  });

  it("is monotonic non-decreasing across the whole range", () => {
    let prev = -Infinity;
    for (let p = 0; p <= 100; p += 1) {
      const s = percentToScaledScore(p);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });

  it("stays inside 100–200 for every input", () => {
    for (let p = -10; p <= 110; p += 1) {
      const s = percentToScaledScore(p);
      expect(s).toBeGreaterThanOrEqual(100);
      expect(s).toBeLessThanOrEqual(200);
    }
  });
});

describe("scaledScoreBand — official thresholds", () => {
  it("maps the band edges exactly", () => {
    expect(scaledScoreBand(100)).toBe("Below Passing");
    expect(scaledScoreBand(144)).toBe("Below Passing");
    expect(scaledScoreBand(145)).toBe("Passing");
    expect(scaledScoreBand(164)).toBe("Passing");
    expect(scaledScoreBand(165)).toBe("College Ready");
    expect(scaledScoreBand(174)).toBe("College Ready");
    expect(scaledScoreBand(175)).toBe("College Ready + Credit");
    expect(scaledScoreBand(200)).toBe("College Ready + Credit");
  });
});

describe("bandForPercent — the Phase 0 honesty property", () => {
  it("the internal pass bar (60%) is exactly the official passing band", () => {
    expect(bandForPercent(60)).toBe("Passing");
    expect(bandForPercent(59)).toBe("Below Passing");
  });

  it("higher mastery reaches the college-ready bands", () => {
    expect(bandForPercent(75)).toBe("College Ready");
    expect(bandForPercent(85)).toBe("College Ready + Credit");
    expect(bandForPercent(100)).toBe("College Ready + Credit");
  });
});
