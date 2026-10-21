import { describe, it, expect } from "vitest";
import type { GEDPracticeQuestion } from "@shared/schema";
import { mulberry32, seedFromString, forgeItem, forgeRun, TEMPLATES } from "./itemForge";
import { gradeResponse } from "./itemGrading";

const CTX = { gedCode: "TEST.1", skillNodeId: "MATH.ARITH.001", difficulty: "standard" as const };

function assertWellFormed(q: GEDPracticeQuestion) {
  expect(q.id).toBeTruthy();
  expect(q.provenance?.source).toBe("itemforge");
  switch (q.type) {
    case "mcq": {
      expect(q.choices).toBeDefined();
      const texts = ["A", "B", "C", "D"].map(l => q.choices![l as "A"]);
      expect(new Set(texts).size).toBe(4);
      expect(gradeResponse(q, q.answer)).toBe(true);
      const wrong = ["A", "B", "C", "D"].find(l => l !== q.answer)!;
      expect(gradeResponse(q, wrong)).toBe(false);
      break;
    }
    case "fill_in":
      expect(gradeResponse(q, q.answer)).toBe(true);
      break;
    case "drop_down":
      expect(q.options).toContain(q.answer);
      expect(gradeResponse(q, q.answer)).toBe(true);
      break;
    case "drag_drop": {
      const want = q.answer.split("|").map(s => s.trim()).sort();
      expect([...(q.dragItems ?? [])].sort()).toEqual(want);
      expect(gradeResponse(q, q.answer)).toBe(true);
      break;
    }
    default:
      throw new Error(`forge templates should not emit ${q.type} in this suite`);
  }
}

describe("mulberry32 / seedFromString", () => {
  it("is deterministic", () => {
    const a = mulberry32(42), b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it("hashes lesson codes stably and distinctly", () => {
    expect(seedFromString("MATH.1.1")).toBe(seedFromString("MATH.1.1"));
    expect(seedFromString("MATH.1.1")).not.toBe(seedFromString("MATH.1.2"));
  });
});

describe("forgeItem", () => {
  it("is a pure function of (template, seed, context)", () => {
    const one = forgeItem("linear-eq", 7, CTX);
    const two = forgeItem("linear-eq", 7, CTX);
    expect(two).toEqual(one);
    expect(forgeItem("linear-eq", 8, CTX)).not.toEqual(one);
  });

  it("every template produces well-formed, self-grading items across seeds and difficulties", () => {
    for (const t of TEMPLATES) {
      for (const difficulty of ["foundational", "standard", "extended"] as const) {
        for (let seed = 1; seed <= 25; seed++) {
          assertWellFormed(forgeItem(t.id, seed * 131 + difficulty.length, { ...CTX, difficulty }));
        }
      }
    }
  });

  it("records provenance with the exact seed and template", () => {
    const q = forgeItem("percent-of", 1234, CTX);
    expect(q.provenance).toEqual({ source: "itemforge", seed: 1234, template: "percent-of" });
    expect(q.id).toContain("percent-of");
  });

  it("forgeRun yields distinct items with consecutive seeds", () => {
    const run = forgeRun("probability", 500, 5, CTX);
    expect(run.map(q => q.provenance?.seed)).toEqual([500, 501, 502, 503, 504]);
    expect(new Set(run.map(q => q.id)).size).toBe(5);
  });

  it("punnett explanations enumerate the actual offspring", () => {
    const q = forgeItem("punnett", 3, CTX);
    expect(q.explanation).toMatch(/Punnett square/);
    expect(["0%", "25%", "50%", "75%", "100%"]).toContain(q.answer);
  });
});
