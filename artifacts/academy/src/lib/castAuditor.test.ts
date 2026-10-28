import { describe, it, expect } from 'vitest';
import { auditCastEngram } from './castAuditor';
import type { CastEngram } from './cast/schema';
import { validEngram } from './cast/fixtures';

function ruleStatus(
  report: ReturnType<typeof auditCastEngram>,
  rule: string,
): string | undefined {
  return report.results.find((r) => r.rule === rule)?.status;
}

describe('auditCastEngram — 7.0 gate skeleton', () => {
  it('passes the implemented rules and reports the rest pending', () => {
    const report = auditCastEngram(validEngram());
    expect(ruleStatus(report, 'schema')).toBe('pass');
    expect(ruleStatus(report, 'id-collision')).toBe('pass');
    expect(ruleStatus(report, 'no-ged-content')).toBe('pass');
    expect(ruleStatus(report, 'voice-descriptor')).toBe('pass');
    expect(ruleStatus(report, 'determinism')).toBe('pending');
    expect(ruleStatus(report, 'resolves')).toBe('pending');
    expect(report.failures).toEqual([]);
    // Honest skeleton state: nothing is fully gated until 7.2 completes it.
    expect(report.passed).toBe(false);
    expect(report.complete).toBe(false);
  });

  it('fails id-collision when the id matches a faculty seed', () => {
    const report = auditCastEngram(validEngram({ id: 'faculty-rla' }), {
      facultyIds: ['faculty-rla'],
    });
    expect(ruleStatus(report, 'id-collision')).toBe('fail');
    expect(report.failures.some((f) => f.rule === 'id-collision')).toBe(true);
  });

  it('fails no-ged-content when an answer key is embedded', () => {
    const bad = validEngram() as CastEngram & { answerKey: string };
    bad.answerKey = 'A';
    const report = auditCastEngram(bad);
    expect(ruleStatus(report, 'no-ged-content')).toBe('fail');
    expect(report.failures.some((f) => f.rule === 'no-ged-content')).toBe(true);
  });

  it('fails voice-descriptor when the voice profile carries audio', () => {
    const bad = validEngram() as CastEngram & {
      voiceProfile: CastEngram['voiceProfile'] & { audioUrl: string };
    };
    bad.voiceProfile.audioUrl = 'https://example.invalid/clip.mp3';
    const report = auditCastEngram(bad);
    expect(ruleStatus(report, 'voice-descriptor')).toBe('fail');
  });

  it('fails schema when a required field is missing', () => {
    const bad = validEngram() as Partial<CastEngram>;
    delete (bad as Record<string, unknown>).baseline;
    const report = auditCastEngram(bad as CastEngram);
    expect(ruleStatus(report, 'schema')).toBe('fail');
    expect(report.failures.some((f) => f.rule === 'schema')).toBe(true);
  });

  it('never mutates the engram', () => {
    const engram = validEngram();
    const before = JSON.stringify(engram);
    auditCastEngram(engram);
    expect(JSON.stringify(engram)).toBe(before);
  });
});
