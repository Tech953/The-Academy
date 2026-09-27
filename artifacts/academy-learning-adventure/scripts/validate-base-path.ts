import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cartographer } from "@replit/vite-plugin-cartographer";
import { devBanner } from "@replit/vite-plugin-dev-banner";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { createServer } from "vite";

import { validateRuntimeErrorHmr } from "./runtime-error-hmr-smoke";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const artifactConfigPath = path.join(
  projectRoot,
  ".replit-artifact",
  "artifact.toml",
);
const viteConfigPath = path.join(projectRoot, "vite.config.ts");
const buildOutputDirectory = path.join(projectRoot, "dist", "public");
const builtIndexPath = path.join(buildOutputDirectory, "index.html");
const browserMetadataBasenames = new Set([
  "manifest.json",
  "asset-manifest.json",
  "metadata.json",
]);

type AssetKind = "script" | "stylesheet" | "favicon";

type LocalReference = {
  attribute: "href" | "src";
  value: string;
};

type AssetReference = {
  kind: AssetKind;
  url: string;
};

function readPreviewPath(): string {
  const config = readFileSync(artifactConfigPath, "utf8");
  const match = /^previewPath\s*=\s*"([^"]+)"/m.exec(config);
  const previewPath = match?.[1];

  if (!previewPath) {
    throw new Error(`Could not read "previewPath" from ${artifactConfigPath}`);
  }

  return `/${previewPath.replace(/^\/+|\/+$/g, "")}/`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function validateDevelopmentConfiguration(
  viteConfig: string,
  previewPath: string,
): void {
  const escapedPreviewPath = escapeRegExp(previewPath);
  if (
    !new RegExp(
      `process\\.env\\.BASE_PATH\\s*\\?\\?\\s*['"]${escapedPreviewPath}['"]`,
    ).test(viteConfig)
  ) {
    throw new Error(
      `Vite development configuration must default BASE_PATH to ${previewPath}.`,
    );
  }
  if (!/\bbase\s*:\s*basePath\b/.test(viteConfig)) {
    throw new Error(
      "Vite development configuration must use the shared basePath value.",
    );
  }
  const devBannerCalls = [...viteConfig.matchAll(/\bdevBanner\s*\(/g)];
  const rootOnlyDevBannerBranch =
    /\bbasePath\s*===\s*(['"])\/\1\s*\?\s*\[[^\]]*\bdevBanner\s*\(/;
  if (devBannerCalls.length !== 1 || !rootOnlyDevBannerBranch.test(viteConfig)) {
    throw new Error(
      "The Replit dev banner must be enabled only by a root-path BASE_PATH check.",
    );
  }
}

function previewHelperFamily(value: string): string | undefined {
  if (/^\/@replit(?:\/|[?#]|$)/.test(value)) {
    return "Replit";
  }
  if (/^\/@vite(?:\/|[?#]|$)/.test(value)) {
    return "Vite";
  }
  if (/^\/@react-refresh(?:\/|[?#]|$)/.test(value)) {
    return "React refresh";
  }
  if (/^\/@[^/?#]+(?:\/|[?#]|$)/.test(value)) {
    return "development-server";
  }
  return undefined;
}

function previewHelperUrls(document: string): string[] {
  const urls = new Set<string>();
  const addUrl = (value: string | undefined) => {
    if (value && previewHelperFamily(value)) {
      urls.add(value);
    }
  };

  for (const match of document.matchAll(
    /\b(?:src|href)\s*=\s*["'](\/[^"']+)["']/gi,
  )) {
    addUrl(match[1]);
  }

  const quotedHelperUrl = /(["'`])(\/@[^"'`\s]*)\1/g;
  for (const match of document.matchAll(
    /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi,
  )) {
    for (const urlMatch of (match[1] ?? "").matchAll(quotedHelperUrl)) {
      addUrl(urlMatch[2]);
    }
  }

  return [...urls];
}

export function validateInstalledPreviewHelperOutput(
  document: string,
  helperName: string,
  previewPath: string,
): void {
  const offendingHelpers = previewHelperUrls(document).filter(
    (value) => !value.startsWith(previewPath),
  );

  if (offendingHelpers.length > 0) {
    const details = offendingHelpers
      .map((value) => `${previewHelperFamily(value)} ${value}`)
      .join(", ");
    throw new Error(
      `${helperName} emitted root-relative preview helper URL(s) that bypass ${previewPath}: ${details}`,
    );
  }
}

export function validateDevelopmentHtml(
  document: string,
  previewPath: string,
): void {
  const offendingHelpers = previewHelperUrls(document).filter(
    (value) => !value.startsWith(previewPath),
  );

  if (offendingHelpers.length > 0) {
    const families = [
      ...new Set(offendingHelpers.map(previewHelperFamily).filter(Boolean)),
    ];
    const details = offendingHelpers
      .map((value) => `${previewHelperFamily(value)} ${value}`)
      .join(", ");
    const helperLabel =
      families.length === 1 && families[0] === "Replit"
        ? "Replit helper URLs"
        : `${families.join(" and ")} helper URLs`;
    throw new Error(
      `Development HTML injects root-only ${helperLabel} that bypass ${previewPath}: ${details}`,
    );
  }
}

export async function validateInstalledPreviewHelperCompatibility(
  previewPath: string,
): Promise<void> {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  const helpers = [
    {
      name: "@replit/vite-plugin-runtime-error-modal",
      previewPath,
      createPlugin: () => runtimeErrorOverlay(),
      outputMarker: "runtime-error-plugin:error",
    },
    {
      name: "@replit/vite-plugin-cartographer",
      previewPath,
      createPlugin: () =>
        cartographer({ root: path.resolve(projectRoot, "..") }),
      outputMarker: "replit-init-tailwind",
    },
    {
      name: "@replit/vite-plugin-dev-banner",
      previewPath: "/",
      createPlugin: () => devBanner(),
      outputMarker: 'id="replit-dev-banner"',
    },
  ];
  const fixtureHtml =
    "<!doctype html><html><head></head><body></body></html>";

  try {
    for (const helper of helpers) {
      let server: Awaited<ReturnType<typeof createServer>> | undefined;
      try {
        server = await createServer({
          configFile: false,
          root: projectRoot,
          base: helper.previewPath,
          mode: "development",
          logLevel: "silent",
          plugins: [helper.createPlugin()],
          server: { middlewareMode: true, hmr: false },
        });
        const document = await server.transformIndexHtml(
          helper.previewPath,
          fixtureHtml,
        );

        if (!document.includes(helper.outputMarker)) {
          throw new Error(
            `${helper.name} did not inject its expected development helper output under ${helper.previewPath}`,
          );
        }
        validateInstalledPreviewHelperOutput(
          document,
          helper.name,
          helper.previewPath,
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes(helper.name) &&
          error.message.includes(helper.previewPath)
        ) {
          throw error;
        }
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Could not verify installed helper ${helper.name} under ${helper.previewPath}: ${reason}`,
          { cause: error },
        );
      } finally {
        await server?.close();
      }
    }
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function attributeValue(tag: string, name: string): string | undefined {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  ).exec(tag);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function isExternalReference(value: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value);
}

function localReferences(document: string): LocalReference[] {
  const references: LocalReference[] = [];
  const pattern = /\b(href|src)\s*=\s*["']([^"']+)["']/gi;

  for (const match of document.matchAll(pattern)) {
    const attribute = match[1]?.toLowerCase();
    const value = match[2];
    if (
      (attribute === "href" || attribute === "src") &&
      value &&
      !isExternalReference(value)
    ) {
      references.push({ attribute, value });
    }
  }

  return references;
}

function assetReferences(document: string): AssetReference[] {
  const references: AssetReference[] = [];
  const tags = document.match(/<(?:script|link)\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const tagName = /^<([a-z]+)/i.exec(tag)?.[1]?.toLowerCase();

    if (tagName === "script") {
      const url = attributeValue(tag, "src");
      if (url) {
        references.push({ kind: "script", url });
      }
      continue;
    }

    if (tagName !== "link") {
      continue;
    }

    const rel = attributeValue(tag, "rel")?.toLowerCase().split(/\s+/) ?? [];
    const url = attributeValue(tag, "href");
    if (!url) {
      continue;
    }

    if (rel.includes("stylesheet")) {
      references.push({ kind: "stylesheet", url });
    }
    if (rel.includes("icon")) {
      references.push({ kind: "favicon", url });
    }
  }

  return references;
}

function referencePath(value: string): string {
  return value.split(/[?#]/, 1)[0] ?? "";
}

function fileForReference(value: string, previewPath: string): string {
  const withoutQuery = referencePath(value);
  const relativePath = withoutQuery.startsWith(previewPath)
    ? withoutQuery.slice(previewPath.length)
    : withoutQuery.replace(/^\/+/, "");
  let decodedPath: string;

  try {
    decodedPath = decodeURIComponent(relativePath);
  } catch {
    throw new Error(
      `Built asset reference is not valid URL encoding: "${value}"`,
    );
  }

  const filePath = path.resolve(buildOutputDirectory, decodedPath);
  const relativeFilePath = path.relative(buildOutputDirectory, filePath);
  if (relativeFilePath.startsWith("..") || path.isAbsolute(relativeFilePath)) {
    throw new Error(
      `Built asset reference escapes the output directory: "${value}"`,
    );
  }

  return filePath;
}

function generatedAssetFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...generatedAssetFiles(entryPath));
    } else if (
      /\.(?:css|js|mjs)$/i.test(entry.name) ||
      browserMetadataBasenames.has(entry.name.toLowerCase()) ||
      /\.webmanifest$/i.test(entry.name)
    ) {
      files.push(entryPath);
    }
  }
  return files;
}

function isAssetLikeUrl(value: string): boolean {
  const withoutQuery = value.split(/[?#]/, 1)[0] ?? value;
  return (
    /^\/(?:assets|images|fonts|icons|favicon)(?:\/|$)/i.test(withoutQuery) ||
    /\.(?:avif|css|gif|ico|jpe?g|js|mjs|png|svg|ttf|wasm|webp|woff2?)(?:$|[?#])/i.test(
      withoutQuery,
    )
  );
}

function generatedAssetUrls(document: string, extension: string): string[] {
  const urls = new Set<string>();
  const isBrowserMetadata = /\.(?:json|webmanifest)$/i.test(extension);
  const quotedUrlPattern = /(["'`])(\/[^"'`\s)]*)\1/g;
  for (const match of document.matchAll(quotedUrlPattern)) {
    const value = match[2];
    if (value && (isBrowserMetadata || isAssetLikeUrl(value))) {
      urls.add(value);
    }
  }

  const dynamicImportPattern = /\bimport\(\s*(["'`])(\/[^"'`\s)]*)\1\s*\)/g;
  for (const match of document.matchAll(dynamicImportPattern)) {
    const value = match[2];
    if (value) {
      urls.add(value);
    }
  }

  const workerPattern =
    /\b(?:new\s+)?(?:SharedWorker|Worker)\s*\(\s*(?:(["'`])(\/[^"'`\s)]*)\1|new\s+URL\(\s*(["'`])(\/[^"'`\s)]*)\3)/g;
  for (const match of document.matchAll(workerPattern)) {
    const value = match[2] ?? match[4];
    if (value) {
      urls.add(value);
    }
  }

  if (extension.toLowerCase() === ".css") {
    const cssUrlPattern =
      /url\(\s*(?:(["'])(\/[^"')\s]+)\1|(\/[^"')\s]+))\s*\)/gi;
    for (const match of document.matchAll(cssUrlPattern)) {
      const value = match[2] ?? match[3];
      if (value) {
        urls.add(value);
      }
    }
  }

  return [...urls];
}

export function validateGeneratedAssetReferences(
  previewPath: string,
  outputDirectory = buildOutputDirectory,
): void {
  const assetEscapes: string[] = [];
  const metadataEscapes: string[] = [];

  for (const filePath of generatedAssetFiles(outputDirectory)) {
    const document = readFileSync(filePath, "utf8");
    const isBrowserMetadata = /\.(?:json|webmanifest)$/i.test(
      path.extname(filePath),
    );
    for (const value of generatedAssetUrls(document, path.extname(filePath))) {
      if (!value.startsWith(previewPath)) {
        const escape = `${path.relative(outputDirectory, filePath)}: ${value}`;
        (isBrowserMetadata ? metadataEscapes : assetEscapes).push(escape);
      }
    }
  }

  if (metadataEscapes.length > 0) {
    throw new Error(
      `Generated metadata files contain URLs that bypass ${previewPath}: ${metadataEscapes.join(", ")}`,
    );
  }
  if (assetEscapes.length > 0) {
    throw new Error(
      `Generated chunks contain asset URLs that bypass ${previewPath}: ${assetEscapes.join(", ")}`,
    );
  }
}

async function validate(): Promise<void> {
  const previewPath = readPreviewPath();
  validateDevelopmentConfiguration(
    readFileSync(viteConfigPath, "utf8"),
    previewPath,
  );
  await validateInstalledPreviewHelperCompatibility(previewPath);
  console.log(
    `✓ Installed Replit preview helpers are compatible with ${previewPath}`,
  );

  const developmentHtmlPath = process.env.DEV_HTML_PATH;
  if (developmentHtmlPath) {
    validateDevelopmentHtml(
      readFileSync(path.resolve(developmentHtmlPath), "utf8"),
      previewPath,
    );
  }

  if (!existsSync(builtIndexPath) || !statSync(builtIndexPath).isFile()) {
    throw new Error(
      `Built index is missing at ${builtIndexPath}; run the production build first.`,
    );
  }

  const document = readFileSync(builtIndexPath, "utf8");
  if (
    document.includes("/@vite/client") ||
    document.includes("runtime-error-plugin:error")
  ) {
    throw new Error(
      "The production index includes development-only runtime-error overlay output.",
    );
  }
  await validateRuntimeErrorHmr(previewPath);
  if (readFileSync(builtIndexPath, "utf8") !== document) {
    throw new Error(
      "The development runtime-error HMR smoke changed the production index.html.",
    );
  }
  console.log(
    `✓ Runtime errors report through the nested HMR path under ${previewPath}`,
  );

  const references = localReferences(document);
  if (references.length === 0) {
    throw new Error(
      "Built index does not contain any local href or src references.",
    );
  }

  const assetReferencesInDocument = assetReferences(document);
  for (const kind of ["script", "stylesheet", "favicon"] as const) {
    if (
      !assetReferencesInDocument.some((reference) => reference.kind === kind)
    ) {
      throw new Error(`Built document has no ${kind} URL.`);
    }
  }

  const rootRelativeReferences = references.filter((reference) =>
    reference.value.startsWith("/"),
  );
  const invalidReferences = rootRelativeReferences.filter(
    (reference) => !reference.value.startsWith(previewPath),
  );
  if (invalidReferences.length > 0) {
    const details = invalidReferences
      .map(
        (reference) =>
          `${reference.attribute}="${reference.value}" (expected prefix ${previewPath})`,
      )
      .join(", ");
    throw new Error(
      `Built asset URLs bypass the artifact base path: ${details}`,
    );
  }

  for (const reference of references) {
    const filePath = fileForReference(reference.value, previewPath);
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      throw new Error(
        `Built ${reference.attribute} reference does not exist in dist/public: "${reference.value}"`,
      );
    }
  }

  validateGeneratedAssetReferences(previewPath);

  console.log(
    `✓ Built asset references stay under ${previewPath} (${references.length} local references checked)`,
  );
}

if (path.resolve(process.argv[1] ?? "") === __filename) {
  void validate().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Academy base-path validation failed: ${message}`);
    process.exitCode = 1;
  });
}
