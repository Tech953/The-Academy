import assert from 'node:assert/strict';
import test from 'node:test';

import {
  releaseCheckCommands,
  runReleaseCheck,
  type ReleaseCheckCommand,
} from './release-check';

test('runs export validation last and forwards explicit export paths', () => {
  const commands = releaseCheckCommands([
    '--pptx',
    '/reviewed/academy.pptx',
    '--pdf',
    '/reviewed/academy.pdf',
  ]);

  assert.deepEqual(commands.at(-1), {
    command: 'pnpm',
    args: [
      'run',
      'validate-exports',
      '--',
      '--pptx',
      '/reviewed/academy.pptx',
      '--pdf',
      '/reviewed/academy.pdf',
    ],
  });
  assert.deepEqual(
    commands.slice(0, -1).map(({ command, args }) => [command, args]),
    [
      ['pnpm', ['run', 'typecheck']],
      ['pnpm', ['run', 'validate-slides', '--', '--check']],
      ['pnpm', ['run', 'build']],
      ['pnpm', ['exec', 'tsx', 'scripts/validate-base-path.ts']],
      ['pnpm', ['run', 'validate-bundle']],
      ['pnpm', ['run', 'validate-routes']],
    ],
  );
});

test('stops the handoff when a prerequisite command fails', () => {
  const seen: Array<ReleaseCheckCommand> = [];

  assert.throws(
    () =>
      runReleaseCheck((command) => {
        seen.push(command);
        if (command.args.includes('build')) {
          throw new Error('simulated build failure');
        }
      }),
    /simulated build failure/,
  );

  assert.equal(seen.at(-1)?.args[1], 'build');
  assert.equal(
    seen.some((command) => command.args.includes('validate-exports')),
    false,
  );
});