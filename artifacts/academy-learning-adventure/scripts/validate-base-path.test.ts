import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  validateDevelopmentConfiguration,
  validateDevelopmentHtml,
  validateGeneratedAssetReferences,
} from "./validate-base-path";

const previewPath = "/academy-learning-adventure/";

test("accepts the nested Vite development configuration", () => {
  assert.doesNotThrow(() =>
    validateDevelopmentConfiguration(
      `
        const basePath = process.env.BASE_PATH ?? '/academy-learning-adventure/';
        export default defineConfig({
          base: basePath,
          plugins: [
            ...(process.env.NODE_ENV !== 'production' && basePath === '/'
              ? [devBanner()]
              : []),
          ],
        });
      `,
      previewPath,
    ),
  );
});

test("rejects a Vite config that enables the dev banner for nested previews", () => {
  assert.throws(
    () =>
      validateDevelopmentConfiguration(
        `
          const basePath = process.env.BASE_PATH ?? '/academy-learning-adventure/';
          export default defineConfig({
            base: basePath,
            plugins: [devBanner()],
          });
        `,
        previewPath,
      ),
    /dev banner must remain disabled/,
  );
});

test("rejects root-only Replit helpers in development HTML", () => {
  assert.throws(
    () =>
      validateDevelopmentHtml(
        '<script id="replit-dev-banner" src="/@replit/vite-plugin-dev-banner/banner-script.js"></script>',
        previewPath,
      ),
    /root-only Replit helper URLs.*vite-plugin-dev-banner/,
  );
});

test("accepts a base-prefixed Replit helper in development HTML", () => {
  assert.doesNotThrow(() =>
    validateDevelopmentHtml(
      '<script src="/academy-learning-adventure/@replit/vite-plugin-dev-banner/banner-script.js"></script>',
      previewPath,
    ),
  );
});

function withOutputDirectory(
  files: Record<string, string>,
  callback: (directory: string) => void,
): void {
  const directory = mkdtempSync(path.join(os.tmpdir(), "academy-base-path-"));
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

test("rejects root-relative JavaScript chunk URLs with the generated file and URL", () => {
  withOutputDirectory(
    {
      "assets/main.js":
        'const load = () => import("/chunks/slide-2"); import("/assets/slide-3.js");',
    },
    (directory) => {
      assert.throws(
        () => validateGeneratedAssetReferences(previewPath, directory),
        (error: unknown) =>
          error instanceof Error &&
          error.message.includes("assets/main.js: /chunks/slide-2") &&
          error.message.includes("assets/main.js: /assets/slide-3.js"),
      );
    },
  );
});

test("does not reject route strings or prefixed dynamic imports", () => {
  withOutputDirectory(
    {
      "assets/main.js": `
        const route = "/slide2";
        const load = () => import("/academy-learning-adventure/assets/slide-2.js");
      `,
    },
    (directory) => {
      assert.doesNotThrow(() =>
        validateGeneratedAssetReferences(previewPath, directory),
      );
    },
  );
});

test("rejects root-relative Worker and SharedWorker URLs with the generated file and URL", () => {
  withOutputDirectory(
    {
      "assets/main.js": `
        const worker = new Worker("/workers/slide-worker");
        const sharedWorker = new SharedWorker("/workers/shared-study");
        const moduleWorker = new Worker(new URL("/workers/module-study", import.meta.url));
        const prefixedWorker = new Worker("/academy-learning-adventure/workers/prefixed");
      `,
    },
    (directory) => {
      assert.throws(
        () => validateGeneratedAssetReferences(previewPath, directory),
        (error: unknown) =>
          error instanceof Error &&
          error.message.includes("assets/main.js: /workers/slide-worker") &&
          error.message.includes("assets/main.js: /workers/shared-study") &&
          error.message.includes("assets/main.js: /workers/module-study") &&
          !error.message.includes("prefixed"),
      );
    },
  );
});

test("does not reject route strings or already-prefixed worker URLs", () => {
  withOutputDirectory(
    {
      "assets/main.js": `
        const route = "/study-room";
        const worker = new Worker("/academy-learning-adventure/workers/slide-worker");
        const sharedWorker = new SharedWorker("/academy-learning-adventure/workers/shared-study");
      `,
    },
    (directory) => {
      assert.doesNotThrow(() =>
        validateGeneratedAssetReferences(previewPath, directory),
      );
    },
  );
});

test("rejects root-relative CSS URLs and accepts prefixed generated assets", () => {
  withOutputDirectory(
    {
      "assets/styles.css": `
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
