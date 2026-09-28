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