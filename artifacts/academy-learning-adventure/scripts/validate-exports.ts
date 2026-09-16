import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(
  projectRoot,
  'src/data/slides-manifest.json',
);
const defaultOutputDirectory =
  process.env.SLIDES_EXPORT_DIR ??
  path.resolve(projectRoot, '..', '..', '.local', 'outputs');

type ExportPaths = {
  pptx: string;
  pdf: string;
};

export type SlideExpectation = {
  position: number;
  title: string;
};

function usage(): string {
  return [
    'Usage: pnpm run validate-exports -- [--dir <directory>]',
    '       pnpm run validate-exports -- --pptx <file> --pdf <file>',
    '',
    'The default directory is .local/outputs. Set SLIDES_EXPORT_DIR to override it.',
  ].join('\n');
}

function parseArgs(args: Array<string>): {
  directory?: string;
  pptx?: string;
  pdf?: string;
} {
  const effectiveArgs = args[0] === '--' ? args.slice(1) : args;
  const parsed: {
    directory?: string;
    pptx?: string;
    pdf?: string;
  } = {};

  for (let index = 0; index < effectiveArgs.length; index += 1) {
    const argument = effectiveArgs[index];
    if (argument === '--dir') {
      parsed.directory = effectiveArgs[++index];
    } else if (argument === '--pptx') {
      parsed.pptx = effectiveArgs[++index];
    } else if (argument === '--pdf') {
      parsed.pdf = effectiveArgs[++index];
    } else if (argument === '--help' || argument === '-h') {
      console.log(usage());
      process.exit(0);
    } else {
      throw new Error(`Unknown argument "${argument}".\n\n${usage()}`);
    }
  }

  if (parsed.directory && (parsed.pptx || parsed.pdf)) {
    throw new Error('Use --dir or explicit --pptx/--pdf paths, not both.');
  }
  if ((parsed.pptx && !parsed.pdf) || (!parsed.pptx && parsed.pdf)) {
    throw new Error('Both --pptx and --pdf are required when using explicit paths.');
  }

  return parsed;
}

export function readSlideManifest(): Array<SlideExpectation> {
  let manifest: unknown;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read slide manifest: ${message}`);
  }

  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new Error('Slide manifest must contain at least one slide entry.');
  }

  const entries = manifest.flatMap((entry, index) => {
    if (
      !entry ||
      typeof entry !== 'object' ||
      typeof entry.title !== 'string' ||
      !entry.title.trim()
    ) {
      throw new Error(`Slide manifest entry ${index + 1} is missing a title.`);
    }
    return [
      {
        position:
          typeof entry.position === 'number' ? entry.position : index + 1,
        title: entry.title.trim(),
      },
    ];
  });

  if (entries.some((entry, index) => entry.position !== index + 1)) {
    throw new Error('Slide manifest positions must be numbered contiguously from 1.');
  }

  return entries;
}

function assertFile(filePath: string, label: string): void {
  if (!existsSync(filePath)) {
    throw new Error(`${label} is missing: ${filePath}`);
  }
  if (!statSync(filePath).isFile()) {
    throw new Error(`${label} is not a file: ${filePath}`);
  }
}

function resolveExportPaths(args: {
  directory?: string;
  pptx?: string;
  pdf?: string;
}): ExportPaths {
  if (args.pptx && args.pdf) {
    return {
      pptx: path.resolve(args.pptx),
      pdf: path.resolve(args.pdf),
    };
  }

  const directory = path.resolve(args.directory ?? defaultOutputDirectory);
  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    throw new Error(
      `Export directory is missing: ${directory}\n` +
        'Provide reviewed files with --pptx and --pdf, or export them into this directory.',
    );
  }

  const files = readdirSync(directory).map((file) => path.join(directory, file));
  const pptxFiles = files.filter((file) => file.toLowerCase().endsWith('.pptx'));
  const pdfFiles = files.filter((file) => file.toLowerCase().endsWith('.pdf'));

  if (pptxFiles.length !== 1 || pdfFiles.length !== 1) {
    throw new Error(
      `Expected exactly one PPTX and one PDF in ${directory}; found ` +
        `${pptxFiles.length} PPTX and ${pdfFiles.length} PDF files.`,
    );
  }

  return { pptx: pptxFiles[0], pdf: pdfFiles[0] };
}

function readZipListing(filePath: string): string {
  try {
    execFileSync('unzip', ['-t', filePath], {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return execFileSync('unzip', ['-Z1', filePath], {
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch {
    throw new Error(`PPTX export is not a readable ZIP archive: ${filePath}`);
  }
}

function xmlText(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expectedTitleFound(text: string, title: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedTitle = normalizeText(title);
  if (!normalizedTitle) return false;
  if (normalizedText.includes(normalizedTitle)) return true;

  const titleWords = normalizedTitle.split(' ');
  const orderedWords = new RegExp(
    titleWords
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('(?:\\s+.*?)?\\s+'),
  );
  return orderedWords.test(normalizedText);
}

export function validateSlideContent(
  slideTexts: Array<string>,
  expectations: Array<SlideExpectation>,
  format: 'PPTX' | 'PDF',
  filePath: string,
): void {
  if (slideTexts.length !== expectations.length) {
    throw new Error(
      `${format} export content has ${slideTexts.length} slides; expected ${expectations.length}: ${filePath}`,
    );
  }

  for (const [index, expectation] of expectations.entries()) {
    const text = slideTexts[index] ?? '';
    if (normalizeText(text).length < 12) {
      throw new Error(
        `${format} export slide ${expectation.position} is unexpectedly empty: ${filePath}`,
      );
    }
    if (!expectedTitleFound(text, expectation.title)) {
      throw new Error(
        `${format} export slide ${expectation.position} is missing expected title "${expectation.title}": ${filePath}`,
      );
    }
  }
}

export function extractPptxSlideTexts(
  filePath: string,
  expectations: Array<SlideExpectation>,
): Array<string> {
  return expectations.map((expectation) => {
    const entry = `ppt/slides/slide${expectation.position}.xml`;
    try {
      const xml = execFileSync('unzip', ['-p', filePath, entry], {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      return [...xml.matchAll(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/gi)]
        .map((match) => xmlText(match[1] ?? ''))
        .join(' ');
    } catch {
      throw new Error(
        `PPTX export slide ${expectation.position} text could not be read: ${filePath}`,
      );
    }
  });
}

export function extractPdfPageTexts(filePath: string): Array<string> {
  try {
    const text = execFileSync('pdftotext', ['-layout', filePath, '-'], {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return text
      .split('\f')
      .map((page) => page.trim())
      .filter((page, index, pages) => index < pages.length - 1 || page.length > 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`PDF export text could not be extracted: ${filePath} (${message})`);
  }
}

function validatePptx(filePath: string, expectations: Array<SlideExpectation>): void {
  assertFile(filePath, 'PPTX export');
  const entries = readZipListing(filePath)
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const requiredEntry of ['[Content_Types].xml', 'ppt/presentation.xml']) {
    if (!entries.includes(requiredEntry)) {
      throw new Error(
        `PPTX export is missing required entry "${requiredEntry}": ${filePath}`,
      );
    }
  }

  const slideNumbers = entries
    .flatMap((entry) => {
      const match = /^ppt\/slides\/slide(\d+)\.xml$/i.exec(entry);
      return match ? [Number(match[1])] : [];
    })
    .sort((left, right) => left - right);

  if (slideNumbers.length !== expectations.length) {
    throw new Error(
      `PPTX export has ${slideNumbers.length} slides; expected ${expectations.length}: ${filePath}`,
    );
  }

  const expectedNumbers = expectations.map((expectation) => expectation.position);
  if (slideNumbers.some((number, index) => number !== expectedNumbers[index])) {
    throw new Error(
      `PPTX export slide entries are not numbered contiguously from 1 to ${expectations.length}: ${filePath}`,
    );
  }
  validateSlideContent(
    extractPptxSlideTexts(filePath, expectations),
    expectations,
    'PPTX',
    filePath,
  );
}

function validatePdf(filePath: string, expectations: Array<SlideExpectation>): void {
  assertFile(filePath, 'PDF export');
  const header = readFileSync(filePath).subarray(0, 5).toString('latin1');
  if (header !== '%PDF-') {
    throw new Error(`PDF export has no valid PDF header: ${filePath}`);
  }

  try {
    const info = execFileSync('pdfinfo', [filePath], {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    const pages = /^Pages:\s*(\d+)\s*$/m.exec(info)?.[1];
    if (pages === undefined) {
      throw new Error('pdfinfo did not report a page count');
    }

    const actual = Number(pages);
    if (actual !== expectations.length) {
      throw new Error(`has ${actual} pages; expected ${expectations.length}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('has ') && message.includes('expected ')) {
      throw new Error(`PDF export ${message}: ${filePath}`);
    }
    throw new Error(`PDF export is not readable: ${filePath} (${message})`);
  }
  validateSlideContent(
    extractPdfPageTexts(filePath),
    expectations,
    'PDF',
    filePath,
  );
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const expectations = readSlideManifest();
  const paths = resolveExportPaths(args);

  validatePptx(paths.pptx, expectations);
  validatePdf(paths.pdf, expectations);

  console.log(
    `✓ Slide exports are valid (${expectations.length} slides/pages with expected titles):\n` +
      `  PPTX: ${paths.pptx}\n` +
      `  PDF:  ${paths.pdf}`,
  );
}

if (path.resolve(process.argv[1] ?? '') === __filename) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Slide export validation failed: ${message}`);
    process.exitCode = 1;
  }
}
