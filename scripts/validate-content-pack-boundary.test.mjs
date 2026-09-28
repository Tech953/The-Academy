import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkerPath = path.join(
  repoRoot,
  "scripts",
  "validate-content-pack-boundary.mjs",
);

function runChecker(cwd) {
  return spawnSync(process.execPath, [checkerPath], {
    cwd,
    encoding: "utf8",
  });
}

async function writeFixtureFile(root, relativePath, contents) {
  const absolutePath = path.join(root, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, contents);
}

test("accepts the current repository boundary", () => {
  const result = runChecker(repoRoot);
  const output = `${result.stdout}\n${result.stderr}`;

  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /Content-pack boundary validation passed\./);
});

test("rejects and reports a local ContentPack declaration", async () => {
  const fixtureRoot = await mkdtemp(
    path.join(os.tmpdir(), "content-pack-boundary-"),
  );

  try {
    await Promise.all([
      writeFixtureFile(
        fixtureRoot,
        "artifacts/api-server/src/routes/routes.ts",
        'import { ContentPack, PACK_TTL_MS } from "@workspace/game-engine";\n',
      ),
      writeFixtureFile(
        fixtureRoot,
        "artifacts/academy-mobile/lib/api.ts",
        [
          'import { ContentPack } from "@workspace/game-engine";',
          'export type { ContentPackEvent, PackGEDFocus, PackNpcMood, PackWorldEvent } from "@workspace/game-engine";',
          "",
        ].join("\n"),
      ),
      writeFixtureFile(
        fixtureRoot,
        "artifacts/academy-mobile/lib/contentPackFallback.ts",
        'import { ContentPack, ContentPackEvent, PACK_ACTIVE_EVENT_LIMIT, CONTENT_PACK_STORAGE_KEY } from "@workspace/game-engine";\n',
      ),
      writeFixtureFile(
        fixtureRoot,
        "artifacts/api-server/src/shared/contentPack.ts",
        'export * from "@workspace/game-engine";\n',
      ),
      writeFixtureFile(
        fixtureRoot,
        "lib/game-engine/src/contentPack.ts",
        "// Canonical declarations belong here.\n",
      ),
      writeFixtureFile(
        fixtureRoot,
        "scripts/duplicate.ts",
        "interface ContentPack {\n  events: unknown[];\n}\n",
      ),
    ]);

    const result = runChecker(fixtureRoot);
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 1, output);
    assert.ok(
      result.stderr.includes(
        `${path.join("scripts", "duplicate.ts")}: local ContentPack declaration`,
      ),
      output,
    );
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});