import assert from "node:assert/strict";
import test from "node:test";

import {
  releaseCheckCommands,
  runReleaseCheck,
  type ReleaseCheckCommand,
} from "./release-check";

test("runs export validation last and forwards explicit export paths", () => {
  const commands = releaseCheckCommands([
    "--pptx",
    "/reviewed/academy.pptx",
    "--pdf",
    "/reviewed/academy.pdf",
  ]);

  assert.deepEqual(commands.at(-1), {
    gate: "Exports",
    command: "pnpm",
    args: [
      "run",
      "validate-exports",
      "--",
      "--pptx",
      "/reviewed/academy.pptx",
      "--pdf",
      "/reviewed/academy.pdf",
    ],
  });
  assert.deepEqual(
    commands.slice(0, -1).map(({ command, args }) => [command, args]),
    [
      ["pnpm", ["run", "typecheck"]],
      ["pnpm", ["run", "test:imported-chart"]],
      ["pnpm", ["run", "validate-slides", "--", "--check"]],
      ["pnpm", ["run", "validate-base-path"]],
      ["pnpm", ["run", "validate-bundle"]],
      ["pnpm", ["run", "validate-routes"]],
    ],
  );
});

test("stops the handoff when a prerequisite command fails", () => {
  const seen: Array<ReleaseCheckCommand> = [];

  assert.throws(
    () =>
      runReleaseCheck((command) => {
        seen.push(command);
        if (command.args.includes("validate-base-path")) {
          throw new Error("simulated base-path validation failure");
        }
      }),
    /Release gate "Base path" failed: simulated base-path validation failure/,
  );

  assert.equal(seen.at(-1)?.args[1], "validate-base-path");
  assert.equal(
    seen.some((command) => command.args.includes("validate-exports")),
    false,
  );
});

test("stops the handoff when imported chart fixtures fail", () => {
  const seen: Array<ReleaseCheckCommand> = [];

  assert.throws(
    () =>
      runReleaseCheck((command) => {
        seen.push(command);
        if (command.args.includes("test:imported-chart")) {
          throw new Error("simulated imported chart fixture failure");
        }
      }),
    /Release gate "Imported chart fixtures" failed: simulated imported chart fixture failure/,
  );

  assert.equal(seen.at(-1)?.args[1], "test:imported-chart");
  assert.equal(
    seen.some((command) => command.args.includes("validate-slides")),
    false,
  );
});

test("labels every release gate before executing it", () => {
  const messages: Array<string> = [];
  const originalLog = console.log;
  console.log = (message?: unknown) => {
    messages.push(String(message));
  };

  try {
    runReleaseCheck(() => {});
  } finally {
    console.log = originalLog;
  }

  assert.deepEqual(messages, [
    "[release] Starting gate: Typecheck",
    "[release] Starting gate: Imported chart fixtures",
    "[release] Starting gate: Slide manifest",
    "[release] Starting gate: Base path",
    "[release] Starting gate: Bundle",
    "[release] Starting gate: Routes",
    "[release] Starting gate: Exports",
  ]);
});
