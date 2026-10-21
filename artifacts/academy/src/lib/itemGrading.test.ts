import { describe, it, expect } from "vitest";
import type { GEDPracticeQuestion } from "@shared/schema";
import {
  normalizeAnswerText,
  parseNumericAnswer,
  gradeResponse,
  gradeExtendedResponse,
  displayAnswer,
  ER_MAX_TOTAL,
  ER_PASS_TOTAL,
} from "./itemGrading";

function q(partial: Partial<GEDPracticeQuestion>): GEDPracticeQuestion {
  return {
    id: "T.1", question: "?", type: "mcq", answer: "A",
    explanation: "", difficulty: "foundational", ...partial,
  };
}

describe("normalizeAnswerText", () => {
  it("lowercases, collapses whitespace, unifies dashes", () => {
    expect(normalizeAnswerText("  The  Answer—Key ")).toBe("the answer-key");
  });
});

describe("parseNumericAnswer", () => {
  it("parses numbers, fractions, percents, money", () => {
    expect(parseNumericAnswer("42")).toBe(42);
    expect(parseNumericAnswer("3/4")).toBe(0.75);
    expect(parseNumericAnswer("50%")).toBe(0.5);
    expect(parseNumericAnswer("$1,250")).toBe(1250);
    expect(parseNumericAnswer("-2.5")).toBe(-2.5);
  });
  it("rejects non-numeric text", () => {
    expect(parseNumericAnswer("ten")).toBeNull();
    expect(parseNumericAnswer("1/0")).toBeNull();
    expect(parseNumericAnswer("")).toBeNull();
  });
});

describe("gradeResponse — mcq", () => {
  const item = q({ type: "mcq", answer: "B" });
  it("grades by letter", () => {
    expect(gradeResponse(item, "B")).toBe(true);
    expect(gradeResponse(item, "A")).toBe(false);
    expect(gradeResponse(item, undefined)).toBe(false);
    expect(gradeResponse(item, "")).toBe(false);
  });
});

describe("gradeResponse — fill_in", () => {
  const item = q({ type: "fill_in", answer: "1/2", answerAliases: ["0.5", "50%"] });
  it("accepts equivalent numeric forms", () => {
    expect(gradeResponse(item, "1/2")).toBe(true);
    expect(gradeResponse(item, "0.5")).toBe(true);
    expect(gradeResponse(item, "50%")).toBe(true);
    expect(gradeResponse(item, " .5 ")).toBe(true);
  });
  it("rejects wrong values", () => {
    expect(gradeResponse(item, "1/3")).toBe(false);
    expect(gradeResponse(item, "half")).toBe(false);
  });
  const text = q({ type: "fill_in", answer: "Mitochondria", answerAliases: ["the mitochondria"] });
  it("matches text case-insensitively with aliases", () => {
    expect(gradeResponse(text, "mitochondria")).toBe(true);
    expect(gradeResponse(text, "The Mitochondria")).toBe(true);
    expect(gradeResponse(text, "nucleus")).toBe(false);
  });
});

describe("gradeResponse — drop_down", () => {
  const item = q({ type: "drop_down", answer: "announces", options: ["announce", "announces"] });
  it("grades the chosen completion", () => {
    expect(gradeResponse(item, "announces")).toBe(true);
    expect(gradeResponse(item, "announce")).toBe(false);
  });
});

describe("gradeResponse — drag_drop", () => {
  const item = q({ type: "drag_drop", answer: "First step | Second step | Third step", dragItems: ["Third step", "First step", "Second step"] });
  it("requires the exact token order", () => {
    expect(gradeResponse(item, "First step | Second step | Third step")).toBe(true);
    expect(gradeResponse(item, "Second step | First step | Third step")).toBe(false);
    expect(gradeResponse(item, "First step | Second step")).toBe(false);
  });
});

describe("gradeResponse — hot_spot", () => {
  const item = q({
    type: "hot_spot", answer: "zone-b",
    hotSpot: { backdrop: "panel", zones: [{ id: "zone-a", label: "A part", x: 0, y: 0, w: 10, h: 10 }, { id: "zone-b", label: "B part", x: 20, y: 0, w: 10, h: 10 }] },
  });
  it("grades by zone id and displays the zone label", () => {
    expect(gradeResponse(item, "zone-b")).toBe(true);
    expect(gradeResponse(item, "zone-a")).toBe(false);
    expect(displayAnswer(item)).toBe("B part");
  });
});

describe("gradeResponse — short_answer", () => {
  const aliasItem = q({ type: "short_answer", answer: "10", answerAliases: ["10 units", "ten"] });
  it("accepts aliases and numeric equivalents", () => {
    expect(gradeResponse(aliasItem, "10 units")).toBe(true);
    expect(gradeResponse(aliasItem, "The answer is 10")).toBe(false); // not an alias match
  });
  const kwItem = q({
    type: "short_answer", answer: "model",
    answerKeywords: ["ocean|sea", "heat|temperature"],
  });
  it("requires every keyword group, alternates allowed", () => {
    expect(gradeResponse(kwItem, "The ocean stores heat and releases it slowly.")).toBe(true);
    expect(gradeResponse(kwItem, "The sea affects temperature near the coast.")).toBe(true);
    expect(gradeResponse(kwItem, "The ocean is very large.")).toBe(false);
  });
  it("fails closed when nothing machine-gradable is authored", () => {
    expect(gradeResponse(q({ type: "short_answer", answer: "anything" }), "anything else")).toBe(false);
  });
});

describe("gradeExtendedResponse — simulated rubric", () => {
  const item = q({
    type: "extended_response", answer: "",
    stimulus: [
      { label: "Text A", text: "The city should expand its bus network because ridership has doubled and traffic congestion downtown costs drivers hours every week." },
      { label: "Text B", text: "Expanding the bus network would waste taxpayer money since remote work has reduced commuting and the budget deficit is growing." },
    ],
  });
  const strong = [
    "Text A presents the stronger argument because its evidence is specific and current. Ridership has doubled, and the congestion downtown it describes affects every driver daily.",
    "",
    "First, Text A connects expanded service to real demand, while Text B relies on the assumption that remote work has permanently reduced commuting. Furthermore, Text B offers no data about the deficit it mentions. For example, Text A's point about traffic costs is a concrete harm that more buses directly address.",
    "",
    "However, the opposing view in Text B raises a fair concern about taxpayer money. Although that concern matters, it is still weaker because Text A shows the investment answers a growing need. In conclusion, Text A is better supported.",
  ].join("\n");
  it("scores a structured, evidence-using essay near the top of the scale", () => {
    const score = gradeExtendedResponse(item, strong);
    expect(score.simulated).toBe(true);
    expect(score.maxTotal).toBe(ER_MAX_TOTAL);
    expect(score.trait1).toBe(3);
    expect(score.trait2).toBe(2);
    expect(score.total).toBeGreaterThanOrEqual(ER_PASS_TOTAL);
    expect(gradeResponse(item, strong)).toBe(true);
  });
  it("scores a stub at zero", () => {
    const score = gradeExtendedResponse(item, "Buses are good.");
    expect(score.total).toBe(0);
    expect(gradeResponse(item, "Buses are good.")).toBe(false);
  });
  it("detects a missing counterargument in Trait 1", () => {
    const noCounter = [
      "Text A presents the stronger argument because ridership has doubled and congestion downtown is severe.",
      "",
      "First, the evidence about ridership is specific. Second, the traffic argument is concrete and current. Text B discusses remote work, commuting patterns, and the budget deficit facing the city.",
      "",
      "In conclusion, Text A is better supported by the evidence presented in both passages overall today.",
    ].join("\n");
    const score = gradeExtendedResponse(item, noCounter);
    expect(score.trait1).toBe(2); // position + both-source evidence, no counter
  });
});
