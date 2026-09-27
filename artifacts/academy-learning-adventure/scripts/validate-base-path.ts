import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cartographer } from "@replit/vite-plugin-cartographer";
import { devBanner } from "@replit/vite-plugin-dev-banner";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { createServer } from "vite";
import * as ts from "typescript";

import { validateRuntimeErrorHmr } from "./runtime-error-hmr-smoke";
import { validateWorkerUrlRequests } from "./worker-url-smoke";

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

type WorkerUrlReference = {
  value: string;
  base: "document" | "module" | "absolute";
};

type WorkerUrlInspection = {
  urls: string[];
  unresolvedExpressions: string[];
};

type StaticPrimitive = string | number | boolean | null;

function unwrapWorkerExpression(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function staticPrimitiveValue(
  expression: ts.Expression,
  checker: ts.TypeChecker,
  activeSymbols = new Set<ts.Symbol>(),
): StaticPrimitive | undefined {
  const node = unwrapWorkerExpression(expression);
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) {
    const value = Number(node.text.replaceAll("_", ""));
    return Number.isFinite(value) ? value : undefined;
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isIdentifier(node)) {
    const symbol = checker.getSymbolAtLocation(node);
    const declaration = symbol?.valueDeclaration;
    if (
      !symbol ||
      activeSymbols.has(symbol) ||
      !declaration ||
      !ts.isVariableDeclaration(declaration) ||
      !ts.isVariableDeclarationList(declaration.parent) ||
      !(declaration.parent.flags & ts.NodeFlags.Const) ||
      !declaration.initializer
    ) {
      return undefined;
    }
    activeSymbols.add(symbol);
    const value = staticPrimitiveValue(
      declaration.initializer,
      checker,
      activeSymbols,
    );
    activeSymbols.delete(symbol);
    return value;
  }

  if (ts.isTemplateExpression(node)) {
    let value = node.head.text;
    for (const span of node.templateSpans) {
      const part = staticPrimitiveValue(span.expression, checker, activeSymbols);
      if (part === undefined) return undefined;
      value += String(part) + span.literal.text;
    }
    return value;
  }

  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = staticPrimitiveValue(node.left, checker, activeSymbols);
    const right = staticPrimitiveValue(node.right, checker, activeSymbols);
    if (left === undefined || right === undefined) return undefined;
    if (typeof left === "string" || typeof right === "string") {
      return String(left) + String(right);
    }
    if (typeof left === "number" && typeof right === "number") {
      return left + right;
    }
    return undefined;
  }

  if (ts.isConditionalExpression(node)) {
    const condition = staticPrimitiveValue(
      node.condition,
      checker,
      activeSymbols,
    );
    if (condition !== undefined) {
      return staticPrimitiveValue(
        condition ? node.whenTrue : node.whenFalse,
        checker,
        activeSymbols,
      );
    }
    const whenTrue = staticPrimitiveValue(
      node.whenTrue,
      checker,
      activeSymbols,
    );
    const whenFalse = staticPrimitiveValue(
      node.whenFalse,
      checker,
      activeSymbols,
    );
    return whenTrue !== undefined &&
      whenFalse !== undefined &&
      Object.is(whenTrue, whenFalse)
      ? whenTrue
      : undefined;
  }

  return undefined;
}

function isImportMetaUrl(expression: ts.Expression): boolean {
  const node = unwrapWorkerExpression(expression);
  return (
    ts.isPropertyAccessExpression(node) &&
    node.name.text === "url" &&
    ts.isMetaProperty(node.expression) &&
    node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
    node.expression.name.text === "meta"
  );
}

function isUrlConstructor(expression: ts.Expression): boolean {
  const node = unwrapWorkerExpression(expression);
  return (
    ts.isIdentifier(node) && node.text === "URL"
  ) || (
    ts.isPropertyAccessExpression(node) &&
    node.name.text === "URL" &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "globalThis"
  );
}

function resolveWorkerUrlExpression(
  expression: ts.Expression,
  checker: ts.TypeChecker,
  activeSymbols = new Set<ts.Symbol>(),
): WorkerUrlReference | undefined {
  const node = unwrapWorkerExpression(expression);

  if (ts.isIdentifier(node)) {
    const symbol = checker.getSymbolAtLocation(node);
    const declaration = symbol?.valueDeclaration;
    if (
      !symbol ||
      activeSymbols.has(symbol) ||
      !declaration ||
      !ts.isVariableDeclaration(declaration) ||
      !ts.isVariableDeclarationList(declaration.parent) ||
      !(declaration.parent.flags & ts.NodeFlags.Const) ||
      !declaration.initializer
    ) {
      return undefined;
    }
    activeSymbols.add(symbol);
    const value = resolveWorkerUrlExpression(
      declaration.initializer,
      checker,
      activeSymbols,
    );
    activeSymbols.delete(symbol);
    return value;
  }

  if (ts.isNewExpression(node) && isUrlConstructor(node.expression)) {
    const [urlArgument, baseArgument] = node.arguments ?? [];
    if (!urlArgument) return undefined;
    const urlValue = staticPrimitiveValue(
      urlArgument,
      checker,
      activeSymbols,
    );
    if (urlValue === undefined) return undefined;
    const value = String(urlValue);

    if (baseArgument && isImportMetaUrl(baseArgument)) {
      return { value, base: "module" };
    }
    if (baseArgument) {
      const baseValue = staticPrimitiveValue(
        baseArgument,
        checker,
        activeSymbols,
      );
      if (baseValue === undefined) return undefined;
      try {
        return {
          value: new URL(value, String(baseValue)).href,
          base: "absolute",
        };
      } catch {
        return undefined;
      }
    }
    try {
      return { value: new URL(value).href, base: "absolute" };
    } catch {
      return undefined;
    }
  }

  const value = staticPrimitiveValue(node, checker, activeSymbols);
  return value === undefined
    ? undefined
    : { value: String(value), base: "document" };
}

function workerExpressionDescription(
  expression: ts.Expression,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
): string {
  const node = unwrapWorkerExpression(expression);
  if (ts.isIdentifier(node)) {
    const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;
    if (
      declaration &&
      ts.isVariableDeclaration(declaration) &&
      ts.isVariableDeclarationList(declaration.parent) &&
      declaration.initializer
    ) {
      return `${node.text} = ${declaration.initializer.getText(sourceFile)}`;
    }
  }
  return node.getText(sourceFile);
}

function workerConstructorName(
  expression: ts.Expression,
  checker: ts.TypeChecker,
  activeSymbols = new Set<ts.Symbol>(),
): "Worker" | "SharedWorker" | undefined {
  const node = unwrapWorkerExpression(expression);
  const name = ts.isPropertyAccessExpression(node)
    ? node.name.text
    : ts.isIdentifier(node)
      ? node.text
      : undefined;
  if (name === "Worker" || name === "SharedWorker") return name;

  if (ts.isIdentifier(node)) {
    const symbol = checker.getSymbolAtLocation(node);
    const declaration = symbol?.valueDeclaration;
    if (
      symbol &&
      !activeSymbols.has(symbol) &&
      declaration &&
      ts.isVariableDeclaration(declaration) &&
      ts.isVariableDeclarationList(declaration.parent) &&
      declaration.parent.flags & ts.NodeFlags.Const &&
      declaration.initializer
    ) {
      activeSymbols.add(symbol);
      const constructorName = workerConstructorName(
        declaration.initializer,
        checker,
        activeSymbols,
      );
      activeSymbols.delete(symbol);
      return constructorName;
    }
  }

  return undefined;
}

function inspectGeneratedWorkerUrls(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  filePath: string,
  outputDirectory: string,
  previewPath: string,
): WorkerUrlInspection {
  const urls = new Set<string>();
  const unresolvedExpressions = new Set<string>();
  const previewOrigin = "https://academy-preview.invalid";
  const documentUrl = new URL(previewPath, previewOrigin);
  const relativeFile = path
    .relative(outputDirectory, filePath)
    .split(path.sep)
    .join("/");
  const moduleUrl = new URL(relativeFile, documentUrl);

  const visit = (node: ts.Node): void => {
    if (ts.isNewExpression(node) || ts.isCallExpression(node)) {
      const workerName = workerConstructorName(node.expression, checker);
      if (workerName) {
        const argument = node.arguments?.[0];
        const resolution = argument
          ? resolveWorkerUrlExpression(argument, checker)
          : undefined;
        if (!argument || !resolution) {
          const expression = argument
            ? workerExpressionDescription(argument, checker, sourceFile)
            : "(missing URL argument)";
          unresolvedExpressions.add(
            `${workerName} URL expression "${expression}" cannot be proven safe`,
          );
        } else {
          try {
            const base =
              resolution.base === "document"
                ? documentUrl
                : resolution.base === "module"
                  ? moduleUrl
                  : undefined;
            const resolvedUrl = base
              ? new URL(resolution.value, base)
              : new URL(resolution.value);
            if (
              (resolvedUrl.protocol === "http:" ||
                resolvedUrl.protocol === "https:") &&
              resolvedUrl.origin === previewOrigin
            ) {
              urls.add(
                `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`,
              );
            }
          } catch {
            unresolvedExpressions.add(
              `${workerName} URL "${resolution.value}" could not be resolved`,
            );
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return {
    urls: [...urls],
    unresolvedExpressions: [...unresolvedExpressions],
  };
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
  const files = generatedAssetFiles(outputDirectory);
  const javascriptFiles = files.filter((filePath) =>
    /\.(?:js|mjs)$/i.test(filePath),
  );
  const workerProgram =
    javascriptFiles.length > 0
      ? ts.createProgram(javascriptFiles, {
          allowJs: true,
          checkJs: false,
          noResolve: true,
          noLib: true,
          target: ts.ScriptTarget.Latest,
          module: ts.ModuleKind.ESNext,
          moduleDetection: ts.ModuleDetectionKind.Force,
        })
      : undefined;
  const workerChecker = workerProgram?.getTypeChecker();
  const assetEscapes: string[] = [];
  const metadataEscapes: string[] = [];
  const workerEscapes: string[] = [];

  for (const filePath of files) {
    const document = readFileSync(filePath, "utf8");
    const relativeFile = path
      .relative(outputDirectory, filePath)
      .split(path.sep)
      .join("/");
    if (/\.(?:js|mjs)$/i.test(filePath)) {
      const sourceFile = workerProgram?.getSourceFile(filePath);
      if (!sourceFile || !workerChecker) {
        workerEscapes.push(
          `${relativeFile}: generated JavaScript could not be parsed for Worker URL inspection`,
        );
      } else if (sourceFile.parseDiagnostics.length > 0) {
        const parseError = ts.flattenDiagnosticMessageText(
          sourceFile.parseDiagnostics[0]!.messageText,
          " ",
        );
        workerEscapes.push(
          `${relativeFile}: generated JavaScript could not be parsed for Worker URL inspection: ${parseError}`,
        );
      } else {
        const workerInspection = inspectGeneratedWorkerUrls(
          sourceFile,
          workerChecker,
          filePath,
          outputDirectory,
          previewPath,
        );
        for (const value of workerInspection.urls) {
          if (!value.startsWith(previewPath)) {
            workerEscapes.push(`${relativeFile}: ${value}`);
          }
        }
        for (const expression of workerInspection.unresolvedExpressions) {
          workerEscapes.push(`${relativeFile}: ${expression}`);
        }
      }
    }

    const isBrowserMetadata = /\.(?:json|webmanifest)$/i.test(
      path.extname(filePath),
    );
    for (const value of generatedAssetUrls(document, path.extname(filePath))) {
      if (!value.startsWith(previewPath)) {
        const escape = `${relativeFile}: ${value}`;
        (isBrowserMetadata ? metadataEscapes : assetEscapes).push(escape);
      }
    }
  }

  if (workerEscapes.length > 0) {
    throw new Error(
      `Generated Worker and SharedWorker URLs bypass ${previewPath} or cannot be proven safe: ${workerEscapes.join(", ")}`,
    );
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
  await validateWorkerUrlRequests(previewPath);
  if (readFileSync(builtIndexPath, "utf8") !== document) {
    throw new Error(
      "A nested-preview browser smoke changed the production index.html.",
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
