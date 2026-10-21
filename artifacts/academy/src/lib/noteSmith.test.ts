import { describe, it, expect } from "vitest";
import { generateReferenceNotes } from "./noteSmith";
import { getChapter } from "./textSiphon";
import { emptyProgress, recordQuizAttempt, type StudentCurriculumProgress } from "./gedCurriculum";

const NOW = new Date("2026-10-21T12:00:00Z");

function weakArithmeticStudent(): StudentCurriculumProgress {
  const p = emptyProgress();
  p.lessonProgress["MATH.1.1"] = { lessonCode: "MATH.1.1", completed: false, quizScore: 35, attempts: 2 };
  p.lessonProgress["MATH.1.2"] = { lessonCode: "MATH.1.2", completed: false, quizScore: 25, attempts: 2 };
  p.lessonProgress["MATH.5.1"] = { lessonCode: "MATH.5.1", completed: true, quizScore: 94, attempts: 1 };
  return p;
}

describe("Notesmith — per-student reference notes", () => {
  it("writes a note for a weak target, tagged from the unified store", () => {
    const notes = generateReferenceNotes("Beck", weakArithmeticStudent(), NOW);
    const arith = notes.find(n => n.skillNodeId === "MATH.ARITH.001");
    expect(arith).toBeDefined();
    expect(arith!.status).toBe("struggling");
    // Lesson codes AND textbook target codes on the same note.
    expect(arith!.targetCodes).toEqual(expect.arrayContaining(["MATH.1.1", "Q.1", "Q.2"]));
    expect(arith!.keyTerms.length).toBeGreaterThan(0);
    expect(arith!.studyPoints.length).toBeGreaterThan(0);
    expect(arith!.workedExample).not.toBeNull();
    expect(arith!.standingLine).toContain("35%");
    // No note for the mastered algebra skill.
    expect(notes.some(n => n.skillNodeId === "MATH.ALGE.005")).toBe(false);
  });

  it("ACCEPTANCE: the note and the textbook chapter on the same target are consistent", () => {
    const notes = generateReferenceNotes("Beck", weakArithmeticStudent(), NOW);
    const arith = notes.find(n => n.skillNodeId === "MATH.ARITH.001")!;
    expect(arith.textbookChapters.length).toBeGreaterThan(0);
    const cited = arith.textbookChapters[0];
    const chapter = getChapter(cited.bookId, cited.chapterNumber)!;
    // Same skill tag on both sides…
    expect(chapter.skillNodeIds).toContain(arith.skillNodeId);
    // …and shared target codes between the note and the chapter.
    const shared = chapter.targetCodes.filter(c => arith.targetCodes.includes(c));
    expect(shared.length).toBeGreaterThan(0);
    // Both artifacts carry their stamps: chapter is canonical, note is current.
    expect(arith.generatedAt).toBe(NOW.toISOString());
  });

  it("notes regenerate as mastery changes — improve and the note retires", () => {
    const p = weakArithmeticStudent();
    expect(generateReferenceNotes("Beck", p, NOW).some(n => n.skillNodeId === "MATH.ARITH.001")).toBe(true);
    recordQuizAttempt(p, "MATH.1.1", 95, "Mathematical Reasoning");
    recordQuizAttempt(p, "MATH.1.2", 90, "Mathematical Reasoning");
    const after = generateReferenceNotes("Beck", p, NOW);
    expect(after.some(n => n.skillNodeId === "MATH.ARITH.001")).toBe(false);
  });

  it("a student with no weak targets gets no notes", () => {
    const p = emptyProgress();
    p.lessonProgress["MATH.1.1"] = { lessonCode: "MATH.1.1", completed: true, quizScore: 97, attempts: 1 };
    expect(generateReferenceNotes("Beck", p, NOW)).toEqual([]);
  });
});
