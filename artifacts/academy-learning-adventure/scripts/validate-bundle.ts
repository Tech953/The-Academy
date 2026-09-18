import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsDirectory = path.join(projectRoot, 'dist', 'public', 'assets');
const builtIndexPath = path.join(projectRoot, 'dist', 'public', 'index.html');
const maxChunkBytes = Number(process.env.MAX_CHUNK_BYTES ?? 700_000);
const deferredChartAssetPattern = /(?:vendor-charts|ImportedChart)/i;

function javascriptFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...javascriptFiles(entryPath));
    else if (/\.m?js$/i.test(entry.name)) files.push(entryPath);
  }
  return files;
}

function attributeValue(tag: string, name: string): string | undefined {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
  ).exec(tag);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function initialJavaScriptReferences(document: string): string[] {
  const references: string[] = [];
  const tags = document.match(/<(?:script|link)\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const tagName = /^<([a-z]+)/i.exec(tag)?.[1]?.toLowerCase();
    if (tagName === 'script') {
      const src = attributeValue(tag, 'src');
      if (src) references.push(src);
      continue;
    }

    if (tagName !== 'link') continue;
    const rel = attributeValue(tag, 'rel')?.toLowerCase().split(/\s+/) ?? [];
    if (!rel.includes('modulepreload')) continue;
    const href = attributeValue(tag, 'href');
    if (href) references.push(href);
  }

  return references;
}

export function validateInitialEntry(document: string): void {
  const deferredReferences = initialJavaScriptReferences(document).filter((url) =>
    deferredChartAssetPattern.test(url),
  );

  if (deferredReferences.length > 0) {
    throw new Error(
      `Initial entry references deferred chart assets: ${deferredReferences.join(', ')}`,
    );
  }
}

function main(): void {
  const indexDocument = readFileSync(builtIndexPath, 'utf8');
  validateInitialEntry(indexDocument);
  console.log('✓ Initial entry keeps deferred chart assets out of HTML preloads');

  if (!statSync(assetsDirectory, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`Built assets directory is missing: ${assetsDirectory}`);
  }

  const chunks = javascriptFiles(assetsDirectory).map((filePath) => ({
    filePath,
    bytes: statSync(filePath).size,
  }));
  if (chunks.length === 0) {
    throw new Error(`No JavaScript chunks found in ${assetsDirectory}`);
  }

  const oversized = chunks.filter((chunk) => chunk.bytes > maxChunkBytes);
  if (oversized.length > 0) {
    throw new Error(
      `JavaScript chunk budget exceeded (${maxChunkBytes} bytes): ${oversized
        .map((chunk) => `${path.basename(chunk.filePath)}=${chunk.bytes}`)
        .join(', ')}`,
    );
  }

  const largest = [...chunks].sort((left, right) => right.bytes - left.bytes)[0];
  console.log(
    `✓ JavaScript chunk budget passed (${chunks.length} chunks; largest ${path.basename(
      largest.filePath,
    )}=${largest.bytes} bytes)`,
  );
}

if (process.env.NODE_TEST_CONTEXT === undefined) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Bundle validation failed: ${message}`);
    process.exitCode = 1;
  }
}