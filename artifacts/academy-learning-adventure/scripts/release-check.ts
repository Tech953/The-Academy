import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type ReleaseCheckCommand = {
  command: string;
  args: Array<string>;
};

export function releaseCheckCommands(
  exportArgs: Array<string> = [],
): Array<ReleaseCheckCommand> {
  return [
    { command: 'pnpm', args: ['run', 'typecheck'] },
    { command: 'pnpm', args: ['run', 'validate-slides', '--', '--check'] },
    { command: 'pnpm', args: ['run', 'build'] },
    { command: 'pnpm', args: ['exec', 'tsx', 'scripts/validate-base-path.ts'] },
    { command: 'pnpm', args: ['run', 'validate-bundle'] },
    { command: 'pnpm', args: ['run', 'validate-routes'] },
    { command: 'pnpm', args: ['run', 'validate-exports', '--', ...exportArgs] },
  ];
}

export function runReleaseCheck(
  runCommand: (command: ReleaseCheckCommand) => void = runReleaseCommand,
  exportArgs: Array<string> = process.argv.slice(2),
): void {
  for (const command of releaseCheckCommands(exportArgs)) {
    runCommand(command);
  }
}

function runReleaseCommand({ command, args }: ReleaseCheckCommand): void {
  const result = spawnSync(command, args, {
    cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    stdio: 'inherit',
  });

  if (result.error) {
    throw new Error(
      `Release check could not start "${command} ${args.join(' ')}": ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    runReleaseCheck();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Deck release check failed: ${message}`);
    process.exitCode = 1;
  }
}