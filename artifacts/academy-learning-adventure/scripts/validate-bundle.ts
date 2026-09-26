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

export interface EmittedJavaScriptModule {
  relativePath: string;
  source: string;
}

type JavaScriptImportReference = {
  kind: 'static' | 'dynamic';
  specifier: string;
};

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

function emittedJavaScriptImports(source: string): Array<JavaScriptImportReference> {
  const imports: Array<JavaScriptImportReference> = [];
  const dynamicImportPattern =
    /\bimport\s*\(\s*["']([^"']+\.m?js(?:[?#][^"']*)?)["']/gi;
  const staticImportPattern =
    /\b(?:from\s*|import\s*)["']([^"']+\.m?js(?:[?#][^"']*)?)["']/gi;

  for (const match of source.matchAll(dynamicImportPattern)) {
    if (match[1]) imports.push({ kind: 'dynamic', specifier: match[1] });
  }
  for (const match of source.matchAll(staticImportPattern)) {
    if (match[1]) imports.push({ kind: 'static', specifier: match[1] });
  }
  return imports;
}

function emittedImportTarget(
  importerPath: string,
  specifier: string,
): string | undefined {
  let target: URL;
  try {
    const importerUrl = new URL(
      `/assets/${importerPath}`,
      `${bundleOrigin}/`,
    );
    target = new URL(specifier, importerUrl);
  } catch {
    throw new Error(
      `Invalid JavaScript import in ${importerPath}: ${specifier}`,
    );
  }
  if (target.origin !== bundleOrigin) return undefined;
  return initialAssetRelativePath(target.href);
}

function reachableJavaScriptModules(
  startPaths: Array<string>,
  modulesByPath: Map<string, EmittedJavaScriptModule>,
): {
  paths: Set<string>;
  dynamicTargets: Set<string>;
} {
  const paths = new Set<string>();
  const dynamicTargets = new Set<string>();
  const pending = [...startPaths];

  while (pending.length > 0) {
    const importerPath = pending.pop();
    if (!importerPath || paths.has(importerPath)) continue;

    const importer = modulesByPath.get(importerPath);
    if (!importer) {
      throw new Error(
        `Initial JavaScript entry is missing from the build: ${importerPath}`,
      );
    }
    paths.add(importerPath);

    for (const { kind, specifier } of emittedJavaScriptImports(importer.source)) {
      const targetPath = emittedImportTarget(importerPath, specifier);
      if (!targetPath) continue;

      if (!modulesByPath.has(targetPath)) {
        throw new Error(
          `Broken ${kind} import in ${importerPath}: ${specifier} resolves to missing emitted asset ${targetPath}`,
        );
      }
      if (kind === 'dynamic') dynamicTargets.add(targetPath);
      if (!paths.has(targetPath)) pending.push(targetPath);
    }
  }

  return { paths, dynamicTargets };
}

export function validateDeferredChartReachability(
  indexDocument: string,
  emittedModules: Array<EmittedJavaScriptModule>,
): void {
  validateInitialEntry(indexDocument);

  const modulesByPath = new Map<string, EmittedJavaScriptModule>();
  for (const module of emittedModules) {
    const relativePath = path.posix.normalize(
      module.relativePath.replaceAll('\\', '/'),
    );
    if (
      path.posix.isAbsolute(relativePath) ||
      relativePath === '..' ||
      relativePath.startsWith('../')
    ) {
      throw new Error(
        `Invalid emitted JavaScript module path: ${module.relativePath}`,
      );
    }
    if (modulesByPath.has(relativePath)) {
      throw new Error(`Duplicate emitted JavaScript module: ${relativePath}`);
    }
    modulesByPath.set(relativePath, { ...module, relativePath });
  }

  const importedChartModules = [...modulesByPath.keys()].filter((modulePath) =>
    /(?:^|\/)ImportedChart(?:-[^/]+)?\.m?js$/i.test(modulePath),
  );
  if (importedChartModules.length !== 1) {
    throw new Error(
      `Expected one emitted ImportedChart module, found ${importedChartModules.length}`,
    );
  }

  const chartVendorModules = [...modulesByPath.keys()].filter((modulePath) =>
    /(?:^|\/)vendor-charts(?:-[^/]+)?\.m?js$/i.test(modulePath),
  );
  if (chartVendorModules.length !== 1) {
    throw new Error(
      `Expected one emitted vendor-charts module, found ${chartVendorModules.length}`,
    );
  }

  const entryPaths = initialJavaScriptReferences(indexDocument)
    .filter(({ kind }) => kind === 'entry')
    .map(({ url }) => initialAssetRelativePath(url));
  if (entryPaths.length === 0) {
    throw new Error('No initial JavaScript entry scripts found in built HTML');
  }

  const importedChartPath = importedChartModules[0];
  const chartVendorPath = chartVendorModules[0];
  if (!importedChartPath || !chartVendorPath) {
    throw new Error('Imported chart production chunks could not be identified');
  }

  const entryGraph = reachableJavaScriptModules(entryPaths, modulesByPath);
  if (!entryGraph.dynamicTargets.has(importedChartPath)) {
    throw new Error(
      `ImportedChart module ${importedChartPath} is emitted but not reachable through a dynamic import from the initial entry`,
    );
  }

  const chartGraph = reachableJavaScriptModules(
    [importedChartPath],
    modulesByPath,
  );
  if (!chartGraph.paths.has(chartVendorPath)) {
    throw new Error(
      `vendor-charts module ${chartVendorPath} is emitted but not reachable from ImportedChart module ${importedChartPath}`,
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

  validateDeferredChartReachability(
    indexDocument,
    chunks.map(({ filePath }) => ({
      relativePath: path
        .relative(assetsDirectory, filePath)
        .split(path.sep)
        .join('/'),
      source: readFileSync(filePath, 'utf8'),
    })),
  );
  console.log(
    '✓ ImportedChart and vendor-charts remain emitted and reachable through deferred imports',
  );

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