import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadConfigFromFile } from "vite";

import {
  validateDevelopmentConfiguration,
  validateDevelopmentHtml,
  validateGeneratedAssetReferences,
  validateInstalledPreviewHelperCompatibility,
  validateInstalledPreviewHelperOutput,
} from "./validate-base-path";

const previewPath = "/academy-learning-adventure/";
const viteConfigPath = fileURLToPath(
  new URL("../vite.config.ts", import.meta.url),
);
const nonRootPreviewPaths = [
  previewPath,
  "/custom-preview/",
  "/nested/custom/",
];

function pluginNames(plugins: unknown): string[] {
  if (Array.isArray(plugins)) {
    return plugins.flatMap(pluginNames);
  }
  if (plugins && typeof plugins === "object" && "name" in plugins) {
    return [String(plugins.name)];
  }
  return [];
}

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
    /dev banner must be enabled only by a root-path BASE_PATH check/,
  );
});

test("rejects a custom non-root BASE_PATH in the dev banner gate", () => {
  assert.throws(
    () =>
      validateDevelopmentConfiguration(
        `
          const basePath = process.env.BASE_PATH ?? '/academy-learning-adventure/';
          export default defineConfig({
            base: basePath,
            plugins: [
              ...(basePath === '/' || basePath === '/custom-preview/'
                ? [devBanner()]
                : []),
            ],
          });
        `,
        previewPath,
      ),
    /dev banner must be enabled only by a root-path BASE_PATH check/,
  );
});

test("enables the dev banner only for root-path development", async () => {
  const previousEnvironment = new Map(
    ["BASE_PATH", "NODE_ENV", "REPL_ID", "PORT"].map((key) => [
      key,
      process.env[key],
    ]),
  );
  const cases = [
    { label: "root path", basePath: "/", bannerAllowed: true },
    {
      label: "configured nested default",
      basePath: undefined,
      bannerAllowed: false,
    },
    {
      label: "custom preview path",
      basePath: "/custom-preview/",
      bannerAllowed: false,
    },
    {
      label: "deeper custom preview path",
      basePath: "/nested/custom/",
      bannerAllowed: false,
    },
  ];

  try {
    process.env.NODE_ENV = "development";
    process.env.REPL_ID = "base-path-fixture";
    process.env.PORT = "21366";
    assert.doesNotThrow(() =>
      validateDevelopmentConfiguration(
        readFileSync(viteConfigPath, "utf8"),
        previewPath,
      ),
    );

    for (const scenario of cases) {
      if (scenario.basePath === undefined) {
        delete process.env.BASE_PATH;
      } else {
        process.env.BASE_PATH = scenario.basePath;
      }

      const loaded = await loadConfigFromFile(
        { command: "serve", mode: "development" },
        viteConfigPath,
      );
      assert.ok(loaded, `Vite config should load for ${scenario.label}`);
      const names = pluginNames(loaded.config.plugins);
      assert.equal(
        names.includes("@replit/vite-plugin-dev-banner"),
        scenario.bannerAllowed,
        `dev banner eligibility should match ${scenario.label}`,
      );
    }
  } finally {
    for (const [key, value] of previousEnvironment) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test("rejects root-only Replit helper injection for every non-root preview path", () => {
  const rootOnlyHelper =
    '<script id="replit-dev-banner" src="/@replit/vite-plugin-dev-banner/banner-script.js"></script>';
  const prefixedHelper = (basePath: string) =>
    `<script src="${basePath}@replit/vite-plugin-dev-banner/banner-script.js"></script>`;

  for (const basePath of nonRootPreviewPaths) {
    assert.throws(
      () => validateDevelopmentHtml(rootOnlyHelper, basePath),
      /root-only Replit helper URLs.*vite-plugin-dev-banner/,
      `root-only helper should be rejected for ${basePath}`,
    );
    assert.doesNotThrow(
      () => validateDevelopmentHtml(prefixedHelper(basePath), basePath),
      `base-prefixed helper should be accepted for ${basePath}`,
    );
  }

  assert.doesNotThrow(() => validateDevelopmentHtml(rootOnlyHelper, "/"));
});

test("rejects inline root-only module URLs and reports each URL with the preview path", () => {
  const inlineHelpers = `
    <script type="module">
      import("/@replit/vite-plugin-dev-banner/banner-script.js");
      const overlayUrl = '/@replit/vite-plugin-runtime-error-modal/overlay.js';
    </script>
  `;
  const offendingUrls = [
    "/@replit/vite-plugin-dev-banner/banner-script.js",
    "/@replit/vite-plugin-runtime-error-modal/overlay.js",
  ];

  for (const basePath of nonRootPreviewPaths) {
    assert.throws(
      () => validateDevelopmentHtml(inlineHelpers, basePath),
      (error: unknown) =>
        error instanceof Error &&
        error.message.includes(basePath) &&
        offendingUrls.every((url) => error.message.includes(url)),
      `inline root-only helper URLs should identify ${basePath}`,
    );
  }
});

test("rejects root-only Vite client URLs in transformed development HTML", () => {
  assert.throws(
    () =>
      validateDevelopmentHtml(
        '<script type="module">import("/@vite/client");</script>',
        previewPath,
      ),
    (error: unknown) =>
      error instanceof Error &&
      error.message.includes("Vite helper URLs") &&
      error.message.includes("/@vite/client") &&
      error.message.includes(previewPath),
  );
});

test("accepts base-prefixed inline module URLs for every non-root preview path", () => {
  for (const basePath of nonRootPreviewPaths) {
    const inlineHelpers = `
      <script type="module">
        import("${basePath}@replit/vite-plugin-dev-banner/banner-script.js");
        const overlayUrl = '${basePath}@replit/vite-plugin-runtime-error-modal/overlay.js';
      </script>
    `;
    assert.doesNotThrow(
      () => validateDevelopmentHtml(inlineHelpers, basePath),
      `base-prefixed inline helpers should be accepted for ${basePath}`,
    );
  }
});

test("checks installed Replit helper output under nested preview paths", async () => {
  for (const basePath of nonRootPreviewPaths) {
    await validateInstalledPreviewHelperCompatibility(basePath);
  }
});

test("reports the installed helper and preview path for root-relative output", () => {
  assert.throws(
    () =>
      validateInstalledPreviewHelperOutput(
        '<script type="module">import("/@vite/client");</script>',
        "@replit/vite-plugin-runtime-error-modal",
        previewPath,
      ),
    (error: unknown) =>
      error instanceof Error &&
      error.message.includes("@replit/vite-plugin-runtime-error-modal") &&
      error.message.includes("/@vite/client") &&
      error.message.includes(previewPath),
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

test("rejects root-relative URLs in browser-consumed metadata", () => {
  withOutputDirectory(
    {
      ".vite/manifest.json": `
        {
          "entry": "/academy-learning-adventure/assets/index.js",
          "lazy": "/metadata/slide-2"
        }
      `,
      "assets/debug.json": '{"debugRoute":"/debug-only"}',
      "assets/source.map": '{"sources":["/debug-only"]}',
    },
    (directory) => {
      assert.throws(
        () => validateGeneratedAssetReferences(previewPath, directory),
        /Generated metadata files contain URLs that bypass .*\.vite\/manifest\.json: \/metadata\/slide-2/,
      );
    },
  );
});

test("accepts prefixed browser metadata and ignores debug-only metadata", () => {
  withOutputDirectory(
    {
      "assets/asset-manifest.json": `
        {
          "entry": "/academy-learning-adventure/assets/index.js",
          "metadata": "/academy-learning-adventure/assets/slide-2.json"
        }
      `,
      "assets/debug.json": '{"debugRoute":"/debug-only"}',
      "assets/source.map": '{"sources":["/debug-only"]}',
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
