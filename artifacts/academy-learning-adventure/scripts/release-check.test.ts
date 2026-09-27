import assert from "node:assert/strict";
import test from "node:test";

import {
  releaseCommandFailureMessage,
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
  const metadataDiagnostic =
    'Unclassified browser-loaded metadata output(s): assets/plugin-browser-map.json (referenced by assets/main.js as "/academy-learning-adventure/assets/plugin-browser-map.json"). Add each supported Vite/plugin output and its producer to browserMetadataOutputAllowlist.';

  assert.throws(
    () =>
      runReleaseCheck((command) => {
        seen.push(command);
        if (command.args.includes("validate-base-path")) {
          throw new Error(metadataDiagnostic);
        }
      }),
    (error: unknown) =>
      error instanceof Error &&
      error.message.includes('Release gate "Base path" failed:') &&
      error.message.includes(metadataDiagnostic),
  );

  assert.equal(seen.at(-1)?.args[1], "validate-base-path");
  assert.equal(
    seen.some((command) => command.args.includes("validate-exports")),
    false,
  );
});

test("preserves unclassified browser metadata details in base-path failures", () => {
  const basePathGate = releaseCheckCommands().find(
    ({ gate }) => gate === "Base path",
  );
  assert.ok(basePathGate);

  const diagnostic =
    "Academy base-path validation failed: Unclassified browser-loaded metadata output(s): assets/new-index.json.";
  const message = releaseCommandFailureMessage(
    basePathGate,
    1,
    "",
    diagnostic,
  );
  assert.match(message, /Unclassified browser-loaded metadata output/);
  assert.match(message, /assets\/new-index\.json/);
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

test("includes the named unsupported chart in the handoff failure", () => {
  const importedChartGate = releaseCheckCommands().find(
    ({ gate }) => gate === "Imported chart fixtures",
  );
  assert.ok(importedChartGate);

  const detail = releaseCommandFailureMessage(
    importedChartGate,
    1,
    "",
    [
      "Test failed while rendering an imported chart.",
      'Error: Unsupported chart type "treemap" in chart "Learner progress by subject".',
      "Supported chart types are bar, column, line, area, pie, doughnut, scatter, radar, bubble.",
      "Convert it to a supported type or remove it before release.",
    ].join("\n"),
  );
  assert.match(
    detail,
    /Unsupported chart type "treemap" in chart "Learner progress by subject"/,
  );
  assert.match(detail, /Convert it to a supported type or remove it before release/);

  const originalLog = console.log;
  console.log = () => {};
  try {
    assert.throws(
      () =>
        runReleaseCheck((command) => {
          if (command.gate === "Imported chart fixtures") {
            throw new Error(detail);
          }
        }),
      /Release gate "Imported chart fixtures" failed:[\s\S]*Unsupported chart type "treemap" in chart "Learner progress by subject"/,
    );
  } finally {
    console.log = originalLog;
  }
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
