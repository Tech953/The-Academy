import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type ReleaseCheckCommand = {
  gate: string;
  command: string;
  args: Array<string>;
};

export function releaseCommandFailureMessage(
  command: ReleaseCheckCommand,
  status: number | null,
  stdout: string,
  stderr: string,
): string {
  const baseMessage =
    `Release command exited with status ${status ?? 1}: ` +
    `"${command.command} ${command.args.join(" ")}"`;
  if (command.gate !== "Imported chart fixtures") return baseMessage;

  const outputLines = `${stderr}\n${stdout}`
    .split(/\r?\n/)
    .map((line) => line.trim());
  const diagnosticIndex = outputLines.findIndex((line) =>
    line.includes("Unsupported chart type"),
  );
  const chartDiagnostic =
    diagnosticIndex >= 0
      ? outputLines.slice(diagnosticIndex, diagnosticIndex + 4).join("\n")
      : undefined;
  return chartDiagnostic
    ? `${baseMessage}\n${chartDiagnostic}`
    : baseMessage;
}

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

function runReleaseCommand({
  gate,
  command,
  args,
}: ReleaseCheckCommand): void {
  const check = { gate, command, args };
  const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result =
    gate === "Imported chart fixtures"
      ? spawnSync(command, args, {
          cwd,
          encoding: "utf8",
          maxBuffer: 8 * 1024 * 1024,
          stdio: ["inherit", "pipe", "pipe"],
        })
      : spawnSync(command, args, {
          cwd,
          stdio: "inherit",
        });
  const stdout = typeof result.stdout === 'string' ? result.stdout : '';
  const stderr = typeof result.stderr === 'string' ? result.stderr : '';
  if (gate === "Imported chart fixtures") {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  }

  if (result.error) {
    throw new Error(
      `Release command could not start "${command} ${args.join(" ")}": ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    throw new Error(
      releaseCommandFailureMessage(
        check,
        result.status,
        stdout,
        stderr,
      ),
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
