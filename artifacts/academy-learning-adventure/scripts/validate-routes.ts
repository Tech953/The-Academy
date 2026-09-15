import { readFileSync } from 'node:fs';
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
const manifestPath = path.join(
  projectRoot,
  'src',
  'data',
  'slides-manifest.json',
);

type SlideManifestEntry = {
  position: number;
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
        typeof (entry as { position?: unknown }).position !== 'number',
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

async function validateRoute(url: URL): Promise<void> {
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

async function main(): Promise<void> {
  const previewPath = readConfigValue('previewPath');
  const configuredPort = readConfigValue('localPort');
  const origin = parseOrigin(process.argv.slice(2), configuredPort);
  const positions = readManifest()
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

  const routes = positions.map((position) =>
    routeUrl(origin, previewPath, position),
  );
  await Promise.all(routes.map(validateRoute));

  const representativePositions = [
    positions[0],
    positions[Math.floor(positions.length / 2)],
    positions[positions.length - 1],
  ];
  console.log(
    `✓ ${routes.length} slide routes returned usable HTML under ${previewPath}`,
  );
  console.log(
    `  Representative routes: ${representativePositions
      .map((position) => routeUrl(origin, previewPath, position).pathname)
      .join(', ')}`,
  );
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Slide route validation failed: ${message}`);
  process.exitCode = 1;
}