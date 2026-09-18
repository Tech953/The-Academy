import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type ReleaseCheckCommand = {
  gate: string;
  command: string;
  args: Array<string>;
};

export function releaseCheckCommands(
  exportArgs: Array<string> = [],
): Array<ReleaseCheckCommand> {
  return [
    { gate: "Typecheck", command: "pnpm", args: ["run", "typecheck"] },
    {
      gate: "Imported chart fixtures",
      command: "pnpm",
      args: ["run", "test:imported-chart"],
    },
    {
      gate: "Slide manifest",
      command: "pnpm",
      args: ["run", "validate-slides", "--", "--check"],
    },
    {
      gate: "Base path",
      command: "pnpm",
      args: ["run", "validate-base-path"],
    },
    { gate: "Bundle", command: "pnpm", args: ["run", "validate-bundle"] },
    { gate: "Routes", command: "pnpm", args: ["run", "validate-routes"] },
    {
      gate: "Exports",
      command: "pnpm",
      args: ["run", "validate-exports", "--", ...exportArgs],
    },
  ];
}

export function runReleaseCheck(
  runCommand: (command: ReleaseCheckCommand) => void = runReleaseCommand,
  exportArgs: Array<string> = process.argv.slice(2),
): void {
  for (const command of releaseCheckCommands(exportArgs)) {
    console.log(`[release] Starting gate: ${command.gate}`);
    try {
      runCommand(command);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Release gate "${command.gate}" failed: ${message}`);
    }
  }
}

function runReleaseCommand({ command, args }: ReleaseCheckCommand): void {
  const result = spawnSync(command, args, {
    cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
    stdio: "inherit",
  });

  if (result.error) {
    throw new Error(
      `Release command could not start "${command} ${args.join(" ")}": ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    throw new Error(
      `Release command exited with status ${result.status ?? 1}: "${command} ${args.join(" ")}"`,
    );
  }
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  try {
    runReleaseCheck();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Deck release check failed: ${message}`);
    process.exitCode = 1;
  }
}
