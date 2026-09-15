import { existsSync, readFileSync, statSync } from 'node:fs';
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

type LocalReference = {
  attribute: 'href' | 'src';
  value: string;
};

function readPreviewPath(): string {
  const config = readFileSync(artifactConfigPath, 'utf8');
  const match = /^previewPath\s*=\s*"([^"]+)"/m.exec(config);
  if (!match?.[1]) {
    throw new Error(`Could not read "previewPath" from ${artifactConfigPath}`);
  }

  return `/${match[1].replace(/^\/+|\/+$/g, '')}/`;
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
    throw new Error(`Built asset reference is not valid URL encoding: "${value}"`);
  }

  const filePath = path.resolve(buildOutputDirectory, decodedPath);
  const relativeFilePath = path.relative(buildOutputDirectory, filePath);
  if (
    relativeFilePath.startsWith('..') ||
    path.isAbsolute(relativeFilePath)
  ) {
    throw new Error(`Built asset reference escapes the output directory: "${value}"`);
  }

  return filePath;
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
    throw new Error('Built index does not contain any local href or src references.');
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