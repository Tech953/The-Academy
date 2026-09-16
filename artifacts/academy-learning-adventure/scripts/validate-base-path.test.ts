import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { validateGeneratedAssetReferences } from './validate-base-path';

const previewPath = '/academy-learning-adventure/';

function withOutputDirectory(
  files: Record<string, string>,
  callback: (directory: string) => void,
): void {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'academy-base-path-'));
  try {
    for (const [relativePath, contents] of Object.entries(files)) {
      const filePath = path.join(directory, relativePath);
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(filePath, contents);
    }
    callback(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('rejects root-relative JavaScript chunk URLs with the generated file and URL', () => {
  withOutputDirectory(
    {
      'assets/main.js':
        'const load = () => import("/chunks/slide-2"); import("/assets/slide-3.js");',
    },
    (directory) => {
      assert.throws(
        () => validateGeneratedAssetReferences(previewPath, directory),
        (error: unknown) =>
          error instanceof Error &&
          error.message.includes('assets/main.js: /chunks/slide-2') &&
          error.message.includes('assets/main.js: /assets/slide-3.js'),
      );
    },
  );
});

test('does not reject route strings or prefixed dynamic imports', () => {
  withOutputDirectory(
    {
      'assets/main.js': `
        const route = "/slide2";
        const load = () => import("/academy-learning-adventure/assets/slide-2.js");
      `,
    },
    (directory) => {
      assert.doesNotThrow(
        () => validateGeneratedAssetReferences(previewPath, directory),
      );
    },
  );
});

test('rejects root-relative CSS URLs and accepts prefixed generated assets', () => {
  withOutputDirectory(
    {
      'assets/styles.css': `
        .font { src: url(/fonts/academy.woff2); }
        .hero { background: url("/academy-learning-adventure/assets/hero.svg"); }
      `,
    },
    (directory) => {
      assert.throws(
        () => validateGeneratedAssetReferences(previewPath, directory),
        /Generated chunks contain asset URLs that bypass .*assets\/styles\.css: \/fonts\/academy\.woff2/,
      );
    },
  );
});