import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const artifactConfigPath = path.join(
  projectRoot,
  '.replit-artifact',
  'artifact.toml',
);
const manifestPath = path.join(
  projectRoot,
  'src',
  'data',
  'slides-manifest.json',
);

type SlideManifestEntry = {
  position: number;
  title: string;
};

function readConfigValue(name: string): string {
  const config = readFileSync(artifactConfigPath, 'utf8');
  const match = new RegExp(
    `^${name}\\s*=\\s*(?:"([^"]+)"|([0-9]+))`,
    'm',
  ).exec(config);
  const value = match?.[1] ?? match?.[2];
  if (!value) {
    throw new Error(`Could not read "${name}" from ${artifactConfigPath}`);
  }
  return value;
}

function readManifest(): SlideManifestEntry[] {
  let manifest: unknown;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read slide manifest: ${message}`);
  }

  if (
    !Array.isArray(manifest) ||
    manifest.length === 0 ||
    manifest.some(
      (entry) =>
        typeof entry !== 'object' ||
        entry === null ||
        typeof (entry as { position?: unknown }).position !== 'number' ||
        typeof (entry as { title?: unknown }).title !== 'string' ||
        !(entry as { title: string }).title.trim(),
    )
  ) {
    throw new Error(
      'Slide manifest must contain at least one entry with a numeric position.',
    );
  }

  return manifest as SlideManifestEntry[];
}

function parseOrigin(args: string[], defaultPort: string): string {
  const effectiveArgs = args[0] === '--' ? args.slice(1) : args;
  let origin = process.env.SLIDES_PREVIEW_ORIGIN;

  for (let index = 0; index < effectiveArgs.length; index += 1) {
    const argument = effectiveArgs[index];
    if (argument === '--origin') {
      origin = effectiveArgs[++index];
    } else if (argument === '--help' || argument === '-h') {
      console.log(
        [
          'Usage: pnpm run validate-routes -- [--origin <origin>]',
          '',
          `The default origin is http://127.0.0.1:${defaultPort}.`,
          'The artifact previewPath and slide positions are read from project files.',
        ].join('\n'),
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument "${argument}".`);
    }
  }

  const resolvedOrigin = origin ?? `http://127.0.0.1:${defaultPort}`;
  try {
    const parsed = new URL(resolvedOrigin);
    if (!parsed.protocol.startsWith('http')) {
      throw new Error('origin must use http or https');
    }
    return parsed.origin;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid preview origin "${resolvedOrigin}": ${message}`);
  }
}

function routeUrl(origin: string, previewPath: string, position: number): URL {
  const normalizedPath = `/${previewPath.replace(/^\/+|\/+$/g, '')}/`;
  return new URL(`${normalizedPath}slide${position}`, `${origin}/`);
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function visibleBodyText(document: string): string {
  const body = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(document)?.[1] ?? '';
  return body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => {
      const decoded = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&apos;': "'",
      } as const;
      return decoded[entity as keyof typeof decoded] ?? entity;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

export function browserRenderFailure(
  document: string,
  expectedTitle: string,
): string | undefined {
  if (!/<div[^>]+id=["']root["']/.test(document)) {
    return 'did not return the application root';
  }

  const bodyText = visibleBodyText(document);
  if (/<vite-error-overlay\b/i.test(document) || /runtime error/i.test(bodyText)) {
    return 'showed a runtime error overlay';
  }
  if (/slide unavailable/i.test(bodyText)) {
    return 'showed the slide-unavailable fallback';
  }
  if (bodyText.length < 24) {
    return 'rendered unexpectedly little visible content';
  }
  if (!normalizeText(bodyText).includes(normalizeText(expectedTitle))) {
    return `did not render expected title "${expectedTitle}"`;
  }

  return undefined;
}

async function validateHtmlRoute(url: URL): Promise<void> {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') ?? '';
  const document = await response.text();

  if (!response.ok) {
    throw new Error(`${url.pathname} returned HTTP ${response.status}`);
  }
  if (!contentType.includes('text/html')) {
    throw new Error(
      `${url.pathname} returned "${contentType}", expected an HTML document`,
    );
  }
  if (!/<div[^>]+id=["']root["']/.test(document)) {
    throw new Error(`${url.pathname} did not return the application root`);
  }
  if (!document.includes('type="module"')) {
    throw new Error(`${url.pathname} did not return a module entrypoint`);
  }
}

async function validateBrowserRoute(
  url: URL,
  entry: SlideManifestEntry,
  browserPath: string,
): Promise<void> {
  let document: string;
  try {
    const result = await execFileAsync(
      browserPath,
      [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--dump-dom',
        '--virtual-time-budget=3000',
        url.toString(),
      ],
      {
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        timeout: 20_000,
      },
    );
    document = result.stdout;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${url.pathname} browser check could not complete: ${message}`);
  }

  const failure = browserRenderFailure(document, entry.title);
  if (failure) {
    throw new Error(`${url.pathname} browser render check ${failure}`);
  }
}

async function validateBrowserRoutes(
  routes: Array<{ url: URL; entry: SlideManifestEntry }>,
  browserPath: string,
): Promise<void> {
  let nextIndex = 0;
  const worker = async (): Promise<void> => {
    while (nextIndex < routes.length) {
      const index = nextIndex;
      nextIndex += 1;
      const route = routes[index];
      if (route) {
        await validateBrowserRoute(route.url, route.entry, browserPath);
      }
    }
  };

  const workerCount = Math.min(4, routes.length);
  await Promise.all(
    Array.from({ length: workerCount }, () => worker()),
  );
}

async function main(): Promise<void> {
  const previewPath = readConfigValue('previewPath');
  const configuredPort = readConfigValue('localPort');
  const origin = parseOrigin(process.argv.slice(2), configuredPort);
  const manifest = readManifest();
  const positions = manifest
    .map((entry) => entry.position)
    .sort((left, right) => left - right);

  const duplicatePositions = positions.filter(
    (position, index) => positions[index - 1] === position,
  );
  if (duplicatePositions.length > 0) {
    throw new Error(
      `Slide manifest contains duplicate positions: ${duplicatePositions.join(', ')}`,
    );
  }

  const routes = positions.map((position) => {
    const entry = manifest.find((candidate) => candidate.position === position);
    if (!entry) {
      throw new Error(`Could not find manifest entry for slide ${position}.`);
    }
    return { entry, url: routeUrl(origin, previewPath, position) };
  });
  await Promise.all(routes.map(({ url }) => validateHtmlRoute(url)));

  const browserPath = process.env.ACADEMY_BROWSER_PATH ?? 'chromium';
  await validateBrowserRoutes(routes, browserPath);

  const representativePositions = [
    positions[0],
    positions[Math.floor(positions.length / 2)],
    positions[positions.length - 1],
  ];
  console.log(
    `✓ ${routes.length} slide routes returned usable HTML and rendered content under ${previewPath}`,
  );
  console.log(
    `  Browser sweep: ${browserPath} checked all ${routes.length} routes`,
  );
  console.log(
    `  Representative routes: ${representativePositions
      .map((position) => routeUrl(origin, previewPath, position).pathname)
      .join(', ')}`,
  );
}

if (path.resolve(process.argv[1] ?? '') === __filename) {
  try {
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Slide route validation failed: ${message}`);
    process.exitCode = 1;
  }
}