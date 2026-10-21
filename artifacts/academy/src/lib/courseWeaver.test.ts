import { describe, it, expect } from "vitest";
import {
  analyzeProgress, weaveAssignments, gradeWovenAssignment,
  applyWovenGrade, classifyAssignments, studentSeed,
} from "./courseWeaver";
import { emptyProgress, type StudentCurriculumProgress } from "./gedCurriculum";

const NOW = new Date("2026-10-21T12:00:00Z");

function progressWith(entries: Record<string, { score: number; attempts: number }>): StudentCurriculumProgress {
  const p = emptyProgress();
  for (const [code, e] of Object.entries(entries)) {
    p.lessonProgress[code] = {
      lessonCode: code, completed: e.score >= 60,
      quizScore: e.score, attempts: e.attempts,
      lastAttemptAt: NOW.toISOString(),
    };
  }
  return p;
}

// Two students, identical curriculum, OPPOSITE histories.
const studentA = () => progressWith({
  "MATH.1.1": { score: 90, attempts: 1 },
  "MATH.2.1": { score: 30, attempts: 2 },   // fractions: struggling
  "MATH.2.2": { score: 40, attempts: 2 },
  "MATH.5.1": { score: 88, attempts: 1 },   // algebra: strong
  "MATH.6.1": { score: 92, attempts: 1 },
});
const studentB = () => progressWith({
  "MATH.1.1": { score: 85, attempts: 1 },
  "MATH.2.1": { score: 95, attempts: 1 },   // fractions: strong
  "MATH.2.2": { score: 90, attempts: 1 },
  "MATH.5.1": { score: 35, attempts: 2 },   // algebra: struggling
  "MATH.6.1": { score: 45, attempts: 1 },
});

describe("analyzeProgress", () => {
  it("derives per-skill standings from lesson records", () => {
    const standings = analyzeProgress(studentA());
    const frac = standings.find(s => s.skillNodeId === "MATH.FRAC.002")!;
    expect(frac.status).toBe("struggling");
    expect(frac.bestScore).toBe(40);
    expect(frac.attempts).toBe(4);
    const alge = standings.find(s => s.skillNodeId === "MATH.ALGE.005")!;
    expect(alge.status).toBe("mastered");
  });
});

describe("weaveAssignments — the differential acceptance", () => {
  it("two students with different histories receive different, target-appropriate coursework", () => {
    const wa = weaveAssignments({ studentId: "A", progress: studentA(), existing: [], now: NOW });
    const wb = weaveAssignments({ studentId: "B", progress: studentB(), existing: [], now: NOW });
    expect(wa.length).toBeGreaterThan(0);
    expect(wb.length).toBeGreaterThan(0);
    // Each student's FIRST target is their own weak skill.
    expect(wa[0].skillNodeId).toBe("MATH.FRAC.002");
    expect(wb[0].skillNodeId).toBe("MATH.ALGE.005");
    // Item sets are measurably different.
    const aIds = new Set(wa.flatMap(a => a.items.map(i => i.id)));
    const bIds = wb.flatMap(a => a.items.map(i => i.id));
    const shared = bIds.filter(id => aIds.has(id)).length;
    expect(shared).toBeLessThan(bIds.length / 3);
  });

  it("is deterministic per student, and per-student seeds make even identical histories diverge", () => {
    const p = studentA();
    const one = weaveAssignments({ studentId: "A", progress: p, existing: [], now: NOW });
    const two = weaveAssignments({ studentId: "A", progress: p, existing: [], now: NOW });
    expect(two).toEqual(one);
    const other = weaveAssignments({ studentId: "C", progress: p, existing: [], now: NOW });
    expect(other[0].skillNodeId).toBe(one[0].skillNodeId);       // same target…
    expect(other[0].items.map(i => i.id)).not.toEqual(one[0].items.map(i => i.id)); // …different items
    expect(studentSeed("A", "MATH.FRAC.002", 1)).not.toBe(studentSeed("C", "MATH.FRAC.002", 1));
  });

  it("adapts difficulty to the standing: struggling work is foundational-heavy", () => {
    const wa = weaveAssignments({ studentId: "A", progress: studentA(), existing: [], now: NOW });
    const foundational = wa[0].items.filter(i => i.difficulty === "foundational").length;
    expect(foundational).toBeGreaterThanOrEqual(3);
    expect(wa[0].items.some(i => i.difficulty === "extended")).toBe(false);
  });

  it("respects prerequisites: a fresh student is not offered ratio work before fractions", () => {
    const fresh = weaveAssignments({ studentId: "F", progress: emptyProgress(), existing: [], now: NOW, count: 10 });
    const skills = fresh.map(a => a.skillNodeId);
    expect(skills).not.toContain("MATH.RATIO.003"); // prereq MATH.FRAC.002 is unseen
    expect(skills).toContain("MATH.ARITH.001");     // root skill is offered
  });

  it("never double-weaves a skill with an active assignment", () => {
    const first = weaveAssignments({ studentId: "A", progress: studentA(), existing: [], now: NOW });
    const second = weaveAssignments({ studentId: "A", progress: studentA(), existing: first, now: NOW });
    const active = new Set(first.map(a => a.skillNodeId));
    expect(second.every(a => !active.has(a.skillNodeId))).toBe(true);
  });
});

describe("submission → grade → progress (closed loop)", () => {
  it("grades through the item engine and records into curriculum progress", () => {
    const progress = studentA();
    const [assignment] = weaveAssignments({ studentId: "A", progress, existing: [], now: NOW });
    const allCorrect: Record<string, string> = {};
    for (const q of assignment.items) allCorrect[q.id] = q.answer;
    const graded = gradeWovenAssignment(assignment, allCorrect, NOW);
    expect(graded.scorePercent).toBe(100);
    expect(graded.assignment.status).toBe("completed");
    const { passed } = applyWovenGrade(progress, graded.assignment);
    expect(passed).toBe(true);
    const frac = analyzeProgress(progress).find(s => s.skillNodeId === "MATH.FRAC.002")!;
    expect(frac.status).toBe("mastered");
    // And the weaver moves on: fractions is no longer the top target.
    const next = weaveAssignments({ studentId: "A", progress, existing: [graded.assignment], now: NOW });
    expect(next[0]?.skillNodeId).not.toBe("MATH.FRAC.002");
  });

  it("a failing submission keeps the skill targeted", () => {
    const progress = studentA();
    const [assignment] = weaveAssignments({ studentId: "A", progress, existing: [], now: NOW });
    const graded = gradeWovenAssignment(assignment, {}, NOW);
    expect(graded.scorePercent).toBe(0);
    applyWovenGrade(progress, graded.assignment);
    const frac = analyzeProgress(progress).find(s => s.skillNodeId === "MATH.FRAC.002")!;
    expect(frac.status).toBe("struggling");
  });
});

describe("classifyAssignments", () => {
  it("derives pending / missed / completed lists from data", () => {
    const [assignment] = weaveAssignments({ studentId: "A", progress: studentA(), existing: [], now: NOW });
    const later = new Date(NOW.getTime() + 3 * 24 * 3600 * 1000);
    const c1 = classifyAssignments([assignment], NOW);
    expect(c1.pending).toHaveLength(1);
    const c2 = classifyAssignments([assignment], later);
    expect(c2.overdue).toHaveLength(1);   // missed = past due, unsubmitted
    const graded = gradeWovenAssignment(assignment, {}, NOW);
    const c3 = classifyAssignments([graded.assignment], later);
    expect(c3.completed).toHaveLength(1);
  });
});
