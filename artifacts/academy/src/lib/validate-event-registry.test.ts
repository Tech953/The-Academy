import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { validateWebEventRegistry } from '../../scripts/validate-event-registry';

const template = (title: string) => [{ title }];
const packageJson = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../package.json', import.meta.url)),
    'utf8',
  ),
) as { scripts: Record<string, string> };

describe('validateWebEventRegistry', () => {
  it('runs registry validation before the Academy web bundle', () => {
    expect(packageJson.scripts.prebuild).toBe(
      'pnpm run validate-event-registry',
    );
    expect(packageJson.scripts.build).toContain('vite build');
  });

  it('allows an intentionally unsupported category with a typed exception record', () => {
    expect(() =>
      validateWebEventRegistry({
        eventTemplates: {
          academic: template('Academic event'),
          social: template('Social event'),
        },
        categoryMappings: { exam: 'academic' },
        exceptions: {
          social: {
            reason: 'The web build intentionally omits social events.',
            reviewOwner: 'Academy web team',
            migrationStatus: 'not-planned',
          },
        },
        generateEvent: () => ({ name: 'Academic event' }),
      }),
    ).not.toThrow();
  });

  it('continues accepting legacy string exceptions during migration', () => {
    expect(() =>
      validateWebEventRegistry({
        eventTemplates: {
          academic: template('Academic event'),
          social: template('Social event'),
        },
        categoryMappings: { exam: 'academic' },
        exceptions: {
          social: 'The web build intentionally omits social events.',
        },
        generateEvent: () => ({ name: 'Academic event' }),
      }),
    ).not.toThrow();
  });

  it('renders accepted exception categories and reasons without event content', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exceptionReason =
      'The web build intentionally omits social events.';

    try {
      validateWebEventRegistry({
        eventTemplates: {
          academic: template('Private academic event title'),
          social: template('Private social event title'),
        },
        categoryMappings: { exam: 'academic' },
        exceptions: {
          social: {
            reason: exceptionReason,
            reviewOwner: 'Academy web team',
            migrationStatus: 'planned',
          },
        },
        generateEvent: () => ({ name: 'Private academic event title' }),
      });

      const output = log.mock.calls
        .map(([message]) => String(message))
        .join('\n');
      expect(output).toContain('accepted 1 documented web exception');
      expect(output).toContain(`social: ${exceptionReason}`);
      expect(output).not.toContain('Private academic event title');
      expect(output).not.toContain('Private social event title');
    } finally {
      log.mockRestore();
    }
  });

  it('keeps successful output concise when there are no exceptions', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      validateWebEventRegistry({
        eventTemplates: { academic: template('Academic event') },
        categoryMappings: { exam: 'academic' },
        exceptions: {},
        generateEvent: () => ({ name: 'Academic event' }),
      });

      expect(log.mock.calls).toEqual([
        [
          '✓ Web Radiant AI resolves all 1 shared categories through the compatibility path',
        ],
      ]);
    } finally {
      log.mockRestore();
    }
  });

  it('rejects a blank exception reason with the category and compatibility path', () => {
    expect(() =>
      validateWebEventRegistry({
        eventTemplates: {
          mystery: template('Mystery event'),
        },
        categoryMappings: {},
        exceptions: { mystery: '   ' },
      }),
    ).toThrow(
      'Web Radiant AI compatibility path "artifacts/academy/src/lib/radiantAI.ts" has no mapping for shared "mystery" event category.',
    );
  });

  it('rejects a typed exception record with a blank review owner', () => {
    expect(() =>
      validateWebEventRegistry({
        eventTemplates: { mystery: template('Mystery event') },
        categoryMappings: {},
        exceptions: {
          mystery: {
            reason: 'This category is intentionally omitted.',
            reviewOwner: '   ',
            migrationStatus: 'not-planned',
          },
        },
      }),
    ).toThrow(
      'Web Radiant AI compatibility path "artifacts/academy/src/lib/radiantAI.ts" has an incomplete exception record for shared "mystery" event category. Supply a non-empty reviewOwner and a supported migrationStatus.',
    );
  });

  it('rejects a blank reason in a typed exception record', () => {
    expect(() =>
      validateWebEventRegistry({
        eventTemplates: { mystery: template('Mystery event') },
        categoryMappings: {},
        exceptions: {
          mystery: {
            reason: '  ',
            reviewOwner: 'Academy web team',
            migrationStatus: 'not-planned',
          },
        },
      }),
    ).toThrow(
      'Web Radiant AI compatibility path "artifacts/academy/src/lib/radiantAI.ts" has no mapping for shared "mystery" event category.',
    );
  });

  it('still requires a legacy mapping for every non-exempt shared category', () => {
    expect(() =>
      validateWebEventRegistry({
        eventTemplates: {
          academic: template('Academic event'),
          discovery: template('Discovery event'),
        },
        categoryMappings: { exam: 'academic' },
        exceptions: {},
        generateEvent: () => ({ name: 'Academic event' }),
      }),
    ).toThrow(
      'Web Radiant AI compatibility path "artifacts/academy/src/lib/radiantAI.ts" has no mapping for shared "discovery" event category.',
    );
  });
});