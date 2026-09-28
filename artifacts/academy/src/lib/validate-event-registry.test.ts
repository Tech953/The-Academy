import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  createRegistryPreflightReport,
  runRegistryValidation,
  validateWebEventRegistry,
} from '../../scripts/validate-event-registry';

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

  it('emits a versioned JSON summary from the standalone validator', () => {
    const academyDirectory = fileURLToPath(new URL('../../', import.meta.url));
    const result = spawnSync(
      'pnpm',
      ['exec', 'tsx', 'scripts/validate-event-registry.ts', '--json'],
      {
        cwd: academyDirectory,
        encoding: 'utf8',
        timeout: 30_000,
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');

    const report = JSON.parse(result.stdout.trim());
    expect(report).toMatchObject({
      schemaVersion: 1,
      status: 'ok',
      compatibilityPath: 'artifacts/academy/src/lib/radiantAI.ts',
      failure: null,
    });
    expect(Number.isInteger(report.sharedCategoryCount)).toBe(true);
    expect(Number.isInteger(report.exceptionCount)).toBe(true);
  }, 30_000);

  it('emits structured category and path details for registry failures', () => {
    const cases = [
      {
        options: {
          eventTemplates: {
            academic: template('Academic event'),
            discovery: template('Discovery event'),
          },
          categoryMappings: { exam: 'academic' },
          exceptions: {},
          generateEvent: () => ({ name: 'Academic event' }),
        },
        expectedFailure: {
          code: 'missing_category_mapping',
          category: 'discovery',
        },
      },
      {
        options: {
          eventTemplates: { academic: template('Academic event') },
          categoryMappings: { exam: 'missing' },
          exceptions: {},
        },
        expectedFailure: {
          code: 'legacy_mapping_target_missing',
          category: 'missing',
          legacyEventType: 'exam',
        },
      },
    ];

    for (const { options, expectedFailure } of cases) {
      const stdout: string[] = [];
      const stderr: string[] = [];
      const exitCode = runRegistryValidation({
        json: true,
        validateTemplates: () => {},
        validateWeb: (validationOptions) =>
          validateWebEventRegistry({
            ...validationOptions,
            ...options,
          }),
        writeStdout: (line) => stdout.push(line),
        writeStderr: (line) => stderr.push(line),
      });

      expect(exitCode).toBe(1);
      expect(stderr).toEqual([]);

      const report = JSON.parse(stdout[0]);
      expect(report).toMatchObject({
        schemaVersion: 1,
        status: 'error',
        compatibilityPath: 'artifacts/academy/src/lib/radiantAI.ts',
        failure: {
          ...expectedFailure,
          compatibilityPath: 'artifacts/academy/src/lib/radiantAI.ts',
        },
      });
    }
  });

  it('includes validated category and exception counts in the JSON report', () => {
    const summary = validateWebEventRegistry({
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
      emitHumanOutput: false,
    });

    expect(summary).toEqual({ sharedCategoryCount: 2, exceptionCount: 1 });
    expect(
      createRegistryPreflightReport({
        summary,
        sharedCategoryCount: 2,
        exceptionCount: 1,
      }),
    ).toMatchObject({
      schemaVersion: 1,
      status: 'ok',
      compatibilityPath: 'artifacts/academy/src/lib/radiantAI.ts',
      sharedCategoryCount: 2,
      exceptionCount: 1,
      failure: null,
    });
  });

  it('stops the package build before Vite when the registry prebuild fails', () => {
    const academyDirectory = fileURLToPath(new URL('../../', import.meta.url));
    const validatorPath = fileURLToPath(
      new URL('../../scripts/validate-event-registry.ts', import.meta.url),
    );
    const fixtureDirectory = mkdtempSync(
      join(tmpdir(), 'academy-registry-prebuild-'),
    );
    const fixtureScriptsDirectory = join(fixtureDirectory, 'scripts');
    const viteMarkerPath = join(fixtureDirectory, 'vite-started.marker');

    mkdirSync(fixtureScriptsDirectory);

    writeFileSync(
      join(fixtureDirectory, 'package.json'),
      JSON.stringify(
        {
          name: 'academy-registry-prebuild-fixture',
          version: '1.0.0',
          private: true,
          type: 'module',
          scripts: {
            prebuild: packageJson.scripts.prebuild,
            build: packageJson.scripts.build,
            'validate-event-registry':
              packageJson.scripts['validate-event-registry'],
          },
        },
        null,
        2,
      ),
    );
    writeFileSync(
      join(fixtureScriptsDirectory, 'validate-event-registry.ts'),
      `
import { validateWebEventRegistry } from ${JSON.stringify(pathToFileURL(validatorPath).href)};

try {
  validateWebEventRegistry({
    eventTemplates: {
      fixture_missing_category: [{ title: 'Fixture event' }],
    },
    categoryMappings: {},
    exceptions: {},
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
`,
    );
    writeFileSync(
      join(fixtureDirectory, 'vite.config.ts'),
      `
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const markerPath = fileURLToPath(new URL('./vite-started.marker', import.meta.url));

export default {
  plugins: [{
    name: 'vite-start-marker',
    configResolved() {
      writeFileSync(markerPath, 'Vite started');
    },
  }],
};
`,
    );
    writeFileSync(
      join(fixtureDirectory, 'index.html'),
      '<!doctype html><html><body><script type="module" src="/main.ts"></script></body></html>',
    );
    writeFileSync(
      join(fixtureDirectory, 'main.ts'),
      "document.body.textContent = 'fixture bundle';",
    );

    try {
      const result = spawnSync('pnpm', ['run', 'build'], {
        cwd: fixtureDirectory,
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: [
            join(academyDirectory, 'node_modules', '.bin'),
            process.env.PATH ?? '',
          ].join(delimiter),
        },
        timeout: 30_000,
      });
      const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;

      expect(result.error).toBeUndefined();
      expect(result.status).not.toBe(0);
      expect(output).toContain('fixture_missing_category');
      expect(output).toContain('artifacts/academy/src/lib/radiantAI.ts');
      expect(existsSync(viteMarkerPath)).toBe(false);
      expect(existsSync(join(fixtureDirectory, 'dist'))).toBe(false);
    } finally {
      rmSync(fixtureDirectory, { recursive: true, force: true });
    }
  }, 30_000);

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