import { describe, it, expect } from "vitest";
import { auditStore, formatAuditReport, FULL_TEST_VOLUME, OFFICIAL_DOMAINS } from "./auditor";

describe("auditStore — the Phase 3 gate over the unified store", () => {
  const report = auditStore();

  it("audits all four subjects", () => {
    expect(report.subjects.map(s => s.subject).sort()).toEqual(
      ["Language Arts", "Mathematical Reasoning", "Science", "Social Studies"].sort()
    );
  });

  it("finds no integrity problems in the shipped bank", () => {
    expect(report.integrityProblems).toEqual([]);
  });

  it("every official domain is assessed", () => {
    for (const s of report.subjects) {
      expect(s.missingDomains, `${s.subject} missing domains`).toEqual([]);
      for (const d of OFFICIAL_DOMAINS[s.subject]) {
        expect(s.byDomain[d], `${s.subject} / ${d}`).toBeGreaterThan(0);
      }
    }
  });

  it("every subject bank meets full-test volume", () => {
    for (const s of report.subjects) {
      expect(s.total, `${s.subject} volume`).toBeGreaterThanOrEqual(FULL_TEST_VOLUME[s.subject]);
      expect(s.volumeOk).toBe(true);
    }
  });

  it("every expected format is present per subject", () => {
    for (const s of report.subjects) {
      expect(s.formatGaps, `${s.subject} format gaps`).toEqual([]);
    }
  });

  it("mixes are within tolerance and overall acceptance passes", () => {
    for (const s of report.subjects) {
      for (const m of s.mixes) {
        expect(m.ok, `${s.subject}: ${m.name} at ${m.actualPct}%`).toBe(true);
      }
    }
    expect(report.acceptance.overall).toBe(true);
  });

  it("renders a readable report", () => {
    const text = formatAuditReport(report);
    expect(text).toContain("GED CONTENT AUDIT");
    expect(text).toContain("OVERALL PASS");
  });
});
