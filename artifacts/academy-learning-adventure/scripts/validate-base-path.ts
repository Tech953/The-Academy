import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const artifactConfigPath = path.join(
  projectRoot,
  '.replit-artifact',
  'artifact.toml',
);
const buildOutputDirectory = path.join(projectRoot, 'dist', 'public');
const builtIndexPath = path.join(buildOutputDirectory, 'index.html');

type AssetKind = 'script' | 'stylesheet' | 'favicon';

type LocalReference = {
  attribute: 'href' | 'src';
  value: string;
};

type AssetReference = {
  kind: AssetKind;
  url: string;
};

function readPreviewPath(): string {
  const config = readFileSync(artifactConfigPath, 'utf8');
  const match = /^previewPath\s*=\s*"([^"]+)"/m.exec(config);
  const previewPath = match?.[1];

  if (!previewPath) {
    throw new Error(`Could not read "previewPath" from ${artifactConfigPath}`);
  }

  return `/${previewPath.replace(/^\/+|\/+$/g, '')}/`;
}

function attributeValue(tag: string, name: string): string | undefined {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
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
      (attribute === 'href' || attribute === 'src') &&
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

    if (tagName === 'script') {
      const url = attributeValue(tag, 'src');
      if (url) {
        references.push({ kind: 'script', url });
      }
      continue;
    }

    if (tagName !== 'link') {
      continue;
    }

    const rel = attributeValue(tag, 'rel')?.toLowerCase().split(/\s+/) ?? [];
    const url = attributeValue(tag, 'href');
    if (!url) {
      continue;
    }

    if (rel.includes('stylesheet')) {
      references.push({ kind: 'stylesheet', url });
    }
    if (rel.includes('icon')) {
      references.push({ kind: 'favicon', url });
    }
  }

  return references;
}

function referencePath(value: string): string {
  return value.split(/[?#]/, 1)[0] ?? '';
}

function fileForReference(value: string, previewPath: string): string {
  const withoutQuery = referencePath(value);
  const relativePath = withoutQuery.startsWith(previewPath)
    ? withoutQuery.slice(previewPath.length)
    : withoutQuery.replace(/^\/+/, '');
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
  if (
    relativeFilePath.startsWith('..') ||
    path.isAbsolute(relativeFilePath)
  ) {
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
    } else if (/\.(?:css|html?|js|mjs)$/i.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
}

function validateGeneratedAssetReferences(previewPath: string): void {
  const assetPathPattern = /(["'`])((?:\/)(?:assets|images|fonts|icons|favicon)[^"'`\s)]*)\1/g;
  const escapes: string[] = [];

  for (const filePath of generatedAssetFiles(buildOutputDirectory)) {
    const document = readFileSync(filePath, 'utf8');
    for (const match of document.matchAll(assetPathPattern)) {
      const value = match[2];
      if (!value.startsWith(previewPath)) {
        escapes.push(`${path.relative(buildOutputDirectory, filePath)}: ${value}`);
      }
    }
  }

  if (escapes.length > 0) {
    throw new Error(
      `Generated chunks contain asset URLs that bypass ${previewPath}: ${escapes.join(', ')}`,
    );
  }
}

function validate(): void {
  const previewPath = readPreviewPath();
  if (!existsSync(builtIndexPath) || !statSync(builtIndexPath).isFile()) {
    throw new Error(
      `Built index is missing at ${builtIndexPath}; run the production build first.`,
    );
  }

  const document = readFileSync(builtIndexPath, 'utf8');
  const references = localReferences(document);
  if (references.length === 0) {
    throw new Error(
      'Built index does not contain any local href or src references.',
    );
  }

  const assetReferencesInDocument = assetReferences(document);
  for (const kind of ['script', 'stylesheet', 'favicon'] as const) {
    if (!assetReferencesInDocument.some((reference) => reference.kind === kind)) {
      throw new Error(`Built document has no ${kind} URL.`);
    }
  }

  const rootRelativeReferences = references.filter((reference) =>
    reference.value.startsWith('/'),
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
      .join(', ');
    throw new Error(`Built asset URLs bypass the artifact base path: ${details}`);
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

try {
  validate();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Academy base-path validation failed: ${message}`);
  process.exitCode = 1;
}