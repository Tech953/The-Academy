import { describe, it, expect } from 'vitest';
import { auditCastBank, auditCastEngram } from './castAuditor';
import type { CastEngram } from './cast/schema';
import { validEngram } from './cast/fixtures';
import { generateCastBank, generateEngram } from './cast/generator';

function ruleStatus(
  report: ReturnType<typeof auditCastEngram>,
  rule: string,
): string | undefined {
  return report.results.find((r) => r.rule === rule)?.status;
}

describe('auditCastEngram — 7.0 gate skeleton', () => {
  it('passes the implemented rules and reports the rest pending without caller context', () => {
    const report = auditCastEngram(validEngram());
    expect(ruleStatus(report, 'schema')).toBe('pass');
    expect(ruleStatus(report, 'id-collision')).toBe('pass');
    expect(ruleStatus(report, 'no-ged-content')).toBe('pass');
    expect(ruleStatus(report, 'voice-descriptor')).toBe('pass');
    expect(ruleStatus(report, 'determinism')).toBe('pending');
    expect(ruleStatus(report, 'resolves')).toBe('pending');
    expect(report.failures).toEqual([]);
    // Without caller context the gate cannot be complete: determinism
    // needs a regenerate function, resolves needs the bank's cast ids.
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

describe('auditCastEngram — 7.2 completed rules', () => {
  const regenerate = (engram: CastEngram): CastEngram =>
    generateEngram({ studentId: 'student-a', npcId: engram.id, kind: engram.kind });

  it('fully passes a genuinely generated engram with caller context', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const report = auditCastEngram(engram, { regenerate, castIds: ['npc-1'] });
    expect(report.results.map((r) => r.status)).toEqual([
      'pass',
      'pass',
      'pass',
      'pass',
      'pass',
      'pass',
    ]);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.complete).toBe(true);
  });

  it('fails determinism when regeneration differs (failing fixture, rule 2)', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const tampered = { ...engram, seed: engram.seed + 1 };
    const report = auditCastEngram(tampered, { regenerate, castIds: ['npc-1'] });
    expect(ruleStatus(report, 'determinism')).toBe('fail');
    expect(report.passed).toBe(false);
  });

  it('reports determinism pending when regeneration is impossible', () => {
    const engram = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    const report = auditCastEngram(engram, { regenerate: () => null, castIds: ['npc-1'] });
    expect(ruleStatus(report, 'determinism')).toBe('pending');
    expect(report.complete).toBe(false);
  });

  it('fails resolves on an unknown anchor location (failing fixture, rule 6)', () => {
    const bad = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    bad.anchor = { location: 'The Moon', description: 'Not an Academy location' };
    const report = auditCastEngram(bad, { regenerate, castIds: ['npc-1'] });
    expect(ruleStatus(report, 'resolves')).toBe('fail');
  });

  it('fails resolves on a dangling relationship target (failing fixture, rule 6)', () => {
    const bad = generateEngram({ studentId: 'student-a', npcId: 'npc-1', kind: 'student' });
    bad.relationships = [
      {
        targetId: 'npc-ghost',
        targetName: 'Ghost',
        type: 'friendship',
        affinity: 10,
        trust: 50,
        respect: 50,
        history: [],
        lastInteraction: 0,
      },
    ];
    const report = auditCastEngram(bad, { regenerate, castIds: ['npc-1'] });
    expect(ruleStatus(report, 'resolves')).toBe('fail');
  });

  it('passes resolves when peer relationships reference bank ids', () => {
    const engram = generateEngram({
      studentId: 'student-a',
      npcId: 'npc-1',
      kind: 'student',
      peers: [{ id: 'npc-2', name: 'Peer Two' }],
    });
    const report = auditCastEngram(engram, {
      regenerate: (e) =>
        generateEngram({
          studentId: 'student-a',
          npcId: e.id,
          kind: e.kind,
          peers: [{ id: 'npc-2', name: 'Peer Two' }],
        }),
      castIds: ['npc-1', 'npc-2'],
    });
    expect(ruleStatus(report, 'resolves')).toBe('pass');
  });
});

describe('auditCastBank — brief §9.3', () => {
  it('passes a full generated bank with zero failures', () => {
    const bank = generateCastBank('student-a', ['npc-1', 'npc-2', 'npc-3'], 'student');
    const reports = auditCastBank(bank, (e) =>
      generateEngram({ studentId: 'student-a', npcId: e.id, kind: e.kind }),
    );
    expect(reports).toHaveLength(3);
    for (const report of reports) {
      expect(report.passed).toBe(true);
      expect(report.complete).toBe(true);
      expect(report.failures).toEqual([]);
    }
  });

  it('flags exactly the tampered member of a bank', () => {
    const bank = generateCastBank('student-a', ['npc-1', 'npc-2'], 'student');
    bank[1] = { ...bank[1], seed: bank[1].seed + 99 };
    const reports = auditCastBank(bank, (e) =>
      generateEngram({ studentId: 'student-a', npcId: e.id, kind: e.kind }),
    );
    expect(reports[0].passed).toBe(true);
    expect(reports[1].passed).toBe(false);
    expect(reports[1].failures.some((f) => f.rule === 'determinism')).toBe(true);
  });
});
