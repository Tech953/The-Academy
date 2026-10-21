import { describe, it, expect } from "vitest";
import {
  listTextbooks, getChapter, chaptersForSkill,
  expandChapter, expansionSeed, gradeExpansion, summarizeAttempts,
  type TextbookAttempt,
} from "./textSiphon";

describe("TextSiphon — textbook access over the unified store", () => {
  it("lists the four textbooks with their full question counts", () => {
    const books = listTextbooks();
    expect(books).toHaveLength(4);
    expect(books.reduce((n, b) => n + b.questionCount, 0)).toBe(87);
  });

  it("serves a canonical chapter with its target tags", () => {
    const ch = getChapter("ged-math", 5);
    expect(ch).not.toBeNull();
    expect(ch!.targetCodes).toEqual(expect.arrayContaining(["A.1", "A.2"]));
    expect(ch!.skillNodeIds).toContain("MATH.LINEQ.006");
    expect(ch!.dominantSkill).toBe("MATH.LINEQ.006");
    expect(ch!.questions.length).toBeGreaterThan(0);
    expect(getChapter("ged-math", 99)).toBeNull();
    expect(getChapter("nope", 1)).toBeNull();
  });

  it("finds chapters by skill across books", () => {
    const chapters = chaptersForSkill("MATH.ARITH.001");
    expect(chapters.some(c => c.bookId === "ged-math" && c.chapterNumber === 1)).toBe(true);
  });

  it("generates deterministic, gradable expansions for the chapter's own skills", () => {
    const seed = expansionSeed("Beck", "ged-math", 5, 1);
    const a = expandChapter("ged-math", 5, seed);
    const b = expandChapter("ged-math", 5, seed);
    expect(a).toEqual(b);
    expect(a.length).toBe(4);
    const ch = getChapter("ged-math", 5)!;
    for (const item of a) {
      expect(ch.skillNodeIds).toContain(item.skillNodeId);
      expect(["mcq", "fill_in", "drop_down", "short_answer"]).toContain(item.type);
      expect(item.provenance?.source).toBe("itemforge");
    }
    const allCorrect = Object.fromEntries(a.map(q => [q.id, q.answer]));
    expect(gradeExpansion(a, allCorrect).scorePercent).toBe(100);
    const attempt2 = expandChapter("ged-math", 5, expansionSeed("Beck", "ged-math", 5, 2));
    expect(attempt2.map(q => q.id)).not.toEqual(a.map(q => q.id));
  });

  it("summarizes the latest attempt of each kind", () => {
    const attempts: TextbookAttempt[] = [
      { bookId: "ged-math", chapterNumber: 5, kind: "self-check", scorePercent: 50, at: "2026-10-20T10:00:00Z" },
      { bookId: "ged-math", chapterNumber: 5, kind: "expansion", scorePercent: 75, at: "2026-10-20T11:00:00Z" },
      { bookId: "ged-math", chapterNumber: 5, kind: "self-check", scorePercent: 100, at: "2026-10-21T09:00:00Z" },
      { bookId: "ged-math", chapterNumber: 3, kind: "self-check", scorePercent: 0, at: "2026-10-21T09:00:00Z" },
    ];
    const s = summarizeAttempts(attempts, "ged-math", 5);
    expect(s.selfCheck?.scorePercent).toBe(100);
    expect(s.expansion?.scorePercent).toBe(75);
    expect(s.totalAttempts).toBe(3);
  });
});
