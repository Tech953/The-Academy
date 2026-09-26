import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsDirectory = path.join(projectRoot, 'dist', 'public', 'assets');
const builtIndexPath = path.join(projectRoot, 'dist', 'public', 'index.html');
const maxChunkBytes = Number(process.env.MAX_CHUNK_BYTES ?? 700_000);
const maxInitialPayloadBytes = Number(
  process.env.MAX_INITIAL_PAYLOAD_BYTES ?? 700_000,
);
const deferredChartAssetPattern = /(?:vendor-charts|ImportedChart)/i;
const bundleOrigin = 'https://academy-bundle.invalid';

type InitialJavaScriptReference = {
  kind: 'entry' | 'preload';
  url: string;
};

export interface InitialJavaScriptAssetMeasurement {
  kind: InitialJavaScriptReference['kind'];
  url: string;
  bytes: number;
}

export interface InitialPayloadMeasurement {
  entryBytes: number;
  preloadBytes: number;
  totalBytes: number;
  assets: Array<InitialJavaScriptAssetMeasurement>;
}

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

function initialJavaScriptReferences(
  document: string,
): Array<InitialJavaScriptReference> {
  const references: Array<InitialJavaScriptReference> = [];
  const tags = document.match(/<(?:script|link)\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const tagName = /^<([a-z]+)/i.exec(tag)?.[1]?.toLowerCase();
    if (tagName === 'script') {
      const src = attributeValue(tag, 'src');
      if (src) references.push({ kind: 'entry', url: src });
      continue;
    }

    if (tagName !== 'link') continue;
    const rel = attributeValue(tag, 'rel')?.toLowerCase().split(/\s+/) ?? [];
    if (!rel.includes('modulepreload')) continue;
    const href = attributeValue(tag, 'href');
    if (href) references.push({ kind: 'preload', url: href });
  }

  return references;
}

export function validateInitialEntry(document: string): void {
  const deferredReferences = initialJavaScriptReferences(document).filter(
    ({ url }) => deferredChartAssetPattern.test(url),
  );

  if (deferredReferences.length > 0) {
    throw new Error(
      `Initial entry references deferred chart assets: ${deferredReferences
        .map(({ url }) => url)
        .join(', ')}`,
    );
  }
}

export function measureInitialJavaScriptPayload(
  document: string,
  byteSizeForReference: (reference: string) => number,
): InitialPayloadMeasurement {
  validateInitialEntry(document);
  const references = initialJavaScriptReferences(document);
  if (!references.some(({ kind }) => kind === 'entry')) {
    throw new Error('No initial JavaScript entry scripts found in built HTML');
  }

  const seenReferences = new Set<string>();
  const assets: Array<InitialJavaScriptAssetMeasurement> = [];
  for (const reference of references) {
    if (seenReferences.has(reference.url)) continue;
    seenReferences.add(reference.url);

    const bytes = byteSizeForReference(reference.url);
    if (!Number.isSafeInteger(bytes) || bytes < 0) {
      throw new Error(
        `Invalid byte size for initial JavaScript asset ${reference.url}: ${bytes}`,
      );
    }
    assets.push({ ...reference, bytes });
  }

  const entryBytes = assets
    .filter(({ kind }) => kind === 'entry')
    .reduce((total, asset) => total + asset.bytes, 0);
  const preloadBytes = assets
    .filter(({ kind }) => kind === 'preload')
    .reduce((total, asset) => total + asset.bytes, 0);

  return {
    entryBytes,
    preloadBytes,
    totalBytes: entryBytes + preloadBytes,
    assets,
  };
}

export function validateInitialPayloadBudget(
  measurement: InitialPayloadMeasurement,
  maxBytes = maxInitialPayloadBytes,
): void {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error(
      `MAX_INITIAL_PAYLOAD_BYTES must be a positive integer; received ${maxBytes}`,
    );
  }
  if (measurement.totalBytes <= maxBytes) return;

  const assetDetails = measurement.assets
    .map(({ kind, url, bytes }) => `${kind} ${url}=${bytes} bytes`)
    .join(', ');
  throw new Error(
    `Initial JavaScript payload budget exceeded (${maxBytes} bytes): ` +
      `entry=${measurement.entryBytes} bytes; ` +
      `approved preloads=${measurement.preloadBytes} bytes; ` +
      `total=${measurement.totalBytes} bytes. ` +
      `Defer non-critical imports or reduce modulepreloads; raise ` +
      `MAX_INITIAL_PAYLOAD_BYTES only after reviewing the added first-load cost. ` +
      `Assets: ${assetDetails}`,
  );
}

export function initialAssetRelativePath(reference: string): string {
  let url: URL;
  try {
    url = new URL(reference, `${bundleOrigin}/`);
  } catch {
    throw new Error(`Invalid initial JavaScript asset URL: ${reference}`);
  }
  if (url.origin !== bundleOrigin) {
    throw new Error(
      `Cannot measure external initial JavaScript asset offline: ${reference}`,
    );
  }

  const assetMarker = '/assets/';
  const assetMarkerIndex = url.pathname.lastIndexOf(assetMarker);
  if (assetMarkerIndex < 0) {
    throw new Error(
      `Initial JavaScript reference is outside the built assets directory: ${reference}`,
    );
  }

  let relativePath: string;
  try {
    relativePath = decodeURIComponent(
      url.pathname.slice(assetMarkerIndex + assetMarker.length),
    );
  } catch {
    throw new Error(`Invalid initial JavaScript asset path: ${reference}`);
  }
  if (
    !relativePath ||
    relativePath
      .split('/')
      .some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error(`Invalid initial JavaScript asset path: ${reference}`);
  }
  return relativePath;
}

function initialAssetByteSize(reference: string): number {
  const relativePath = initialAssetRelativePath(reference);
  const resolvedAssetsDirectory = path.resolve(assetsDirectory);
  const filePath = path.resolve(resolvedAssetsDirectory, relativePath);
  if (!filePath.startsWith(`${resolvedAssetsDirectory}${path.sep}`)) {
    throw new Error(
      `Initial JavaScript asset escapes the build directory: ${reference}`,
    );
  }

  const stats = statSync(filePath, { throwIfNoEntry: false });
  if (!stats?.isFile()) {
    throw new Error(
      `Initial JavaScript asset is missing from the build: ${reference}`,
    );
  }
  return stats.size;
}

function main(): void {
  const indexDocument = readFileSync(builtIndexPath, 'utf8');
  validateInitialEntry(indexDocument);
  console.log('✓ Initial entry keeps deferred chart assets out of HTML preloads');

  if (!statSync(assetsDirectory, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`Built assets directory is missing: ${assetsDirectory}`);
  }

  const initialPayload = measureInitialJavaScriptPayload(
    indexDocument,
    initialAssetByteSize,
  );
  validateInitialPayloadBudget(initialPayload);
  console.log(
    `✓ Initial JavaScript payload budget passed (entry=${initialPayload.entryBytes} bytes; ` +
      `approved preloads=${initialPayload.preloadBytes} bytes; ` +
      `total=${initialPayload.totalBytes}/${maxInitialPayloadBytes} bytes)`,
  );

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