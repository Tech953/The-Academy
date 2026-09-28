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

async function createCheckerFixture(root) {
  await mkdir(path.join(root, "scripts"), { recursive: true });
  await Promise.all([
    writeFixtureFile(
      root,
      "artifacts/api-server/src/routes/routes.ts",
      'import { ContentPack, PACK_TTL_MS } from "@workspace/game-engine";\n',
    ),
    writeFixtureFile(
      root,
      "artifacts/academy-mobile/lib/api.ts",
      [
        'import { ContentPack } from "@workspace/game-engine";',
        'export type { ContentPackEvent, PackGEDFocus, PackNpcMood, PackWorldEvent } from "@workspace/game-engine";',
        "",
      ].join("\n"),
    ),
    writeFixtureFile(
      root,
      "artifacts/academy-mobile/lib/contentPackFallback.ts",
      'import { ContentPack, ContentPackEvent, PACK_ACTIVE_EVENT_LIMIT, CONTENT_PACK_STORAGE_KEY } from "@workspace/game-engine";\n',
    ),
    writeFixtureFile(
      root,
      "artifacts/api-server/src/shared/contentPack.ts",
      'export * from "@workspace/game-engine";\n',
    ),
    writeFixtureFile(
      root,
      "lib/game-engine/src/contentPack.ts",
      "// Canonical declarations belong here.\n",
    ),
  ]);
}

async function withCheckerFixture(assertFixture) {
  const fixtureRoot = await mkdtemp(
    path.join(os.tmpdir(), "content-pack-boundary-"),
  );

  try {
    await createCheckerFixture(fixtureRoot);
    await assertFixture(fixtureRoot);
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
}

test("accepts the current repository boundary", () => {
  const result = runChecker(repoRoot);
  const output = `${result.stdout}\n${result.stderr}`;

  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /Content-pack boundary validation passed\./);
});

test("rejects and reports a local ContentPack declaration", async () => {
  await withCheckerFixture(async (fixtureRoot) => {
    const declarationFile = path.join("scripts", "duplicate.ts");
    await writeFixtureFile(
      fixtureRoot,
      declarationFile,
      "interface ContentPack {\n  events: unknown[];\n}\n",
    );

    const result = runChecker(fixtureRoot);
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 1, output);
    assert.ok(
      result.stderr.includes(`${declarationFile}: local ContentPack declaration`),
      output,
    );
  });
});

test("rejects local event, mood, and GED limit constants", async () => {
  await withCheckerFixture(async (fixtureRoot) => {
    const declarationFile = path.join(
      "artifacts",
      "academy-mobile",
      "lib",
      "localPackLimits.ts",
    );
    const limitNames = [
      "PACK_ACTIVE_EVENT_LIMIT",
      "PACK_NPC_MOOD_LIMIT",
      "PACK_GED_FOCUS_LIMIT",
    ];
    await writeFixtureFile(
      fixtureRoot,
      declarationFile,
      limitNames.map((name) => `export const ${name} = 99;`).join("\n"),
    );

    const result = runChecker(fixtureRoot);
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 1, output);
    for (const name of limitNames) {
      assert.ok(
        result.stderr.includes(
          `${declarationFile}: local ${name} limit constant`,
        ),
        output,
      );
    }
  });
});

test("requires API and mobile consumers to import shared pack constants", async () => {
  await withCheckerFixture(async (fixtureRoot) => {
    await Promise.all([
      writeFixtureFile(
        fixtureRoot,
        "artifacts/api-server/src/routes/routes.ts",
        'import { ContentPack } from "@workspace/game-engine";\n',
      ),
      writeFixtureFile(
        fixtureRoot,
        "artifacts/academy-mobile/lib/contentPackFallback.ts",
        'import { ContentPack, ContentPackEvent, CONTENT_PACK_STORAGE_KEY } from "@workspace/game-engine";\n',
      ),
    ]);

    const result = runChecker(fixtureRoot);
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 1, output);
    assert.ok(
      result.stderr.includes(
        "artifacts/api-server/src/routes/routes.ts: missing PACK_TTL_MS import from @workspace/game-engine",
      ),
      output,
    );
    assert.ok(
      result.stderr.includes(
        "artifacts/academy-mobile/lib/contentPackFallback.ts: missing PACK_ACTIVE_EVENT_LIMIT import from @workspace/game-engine",
      ),
      output,
    );
  });
});