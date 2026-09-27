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
// Sequential manual exports can take minutes; a wider gap makes their shared run ambiguous.
const MAX_EXPORT_PAIR_SKEW_MS = 15 * 60 * 1000;
const currentReviewInputRoots = [
  path.join(projectRoot, 'src'),
  path.join(projectRoot, 'public'),
  path.join(projectRoot, 'index.html'),
  path.join(projectRoot, 'vite.config.ts'),
];

export type ExportPaths = {
  pptx: string;
  pdf: string;
  source: 'directory' | 'explicit';
};

export type ReviewInputSnapshot = {
  filePath: string;
  mtimeMs: number;
};

export type ExportFreshnessSnapshot = {
  source: ExportPaths['source'];
  pptxPath: string;
  pdfPath: string;
  pptxMtimeMs: number;
  pdfMtimeMs: number;
  reviewInput: ReviewInputSnapshot;
};

export type SlideExpectation = {
  position: number;
  title: string;
};

export function exportDirectoryIssue(
  directory: string,
  pptxFiles: Array<string>,
  pdfFiles: Array<string>,
): string | undefined {
  const pptxCount = pptxFiles.length;
  const pdfCount = pdfFiles.length;
  if (pptxCount === 1 && pdfCount === 1) {
    return undefined;
  }

  const problems: Array<string> = [];
  if (pptxCount === 0) {
    problems.push('missing a PPTX (.pptx) export');
  } else if (pptxCount !== 1) {
    const filenames = pptxFiles
      .map((file) => path.basename(file))
      .sort((left, right) => left.localeCompare(right))
      .map((filename) => JSON.stringify(filename))
      .join(', ');
    problems.push(
      `found ${pptxCount} PPTX (.pptx) exports; expected exactly one; files: ${filenames}`,
    );
  }
  if (pdfCount === 0) {
    problems.push('missing a PDF (.pdf) export');
  } else if (pdfCount !== 1) {
    const filenames = pdfFiles
      .map((file) => path.basename(file))
      .sort((left, right) => left.localeCompare(right))
      .map((filename) => JSON.stringify(filename))
      .join(', ');
    problems.push(
      `found ${pdfCount} PDF (.pdf) exports; expected exactly one; files: ${filenames}`,
    );
  }

  return (
    `Export preflight failed for ${directory}: ${problems.join('; ')}. ` +
    'Expected exactly one PPTX (.pptx) and one PDF (.pdf) in this output directory.'
  );
}

function reviewInputFilesAt(filePath: string): Array<string> {
  if (!existsSync(filePath)) return [];
  const info = statSync(filePath);
  if (info.isFile()) return [filePath];
  if (!info.isDirectory()) return [];

  const files: Array<string> = [];
  for (const entry of readdirSync(filePath, { withFileTypes: true })) {
    if (entry.name === '.slide-thumbnails' || entry.name === '.gitignore') {
      continue;
    }
    const entryPath = path.join(filePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...reviewInputFilesAt(entryPath));
    } else if (
      entry.isFile() &&
      !/(?:^|\.)(?:test|spec)\.[^.]+$/i.test(entry.name)
    ) {
      files.push(entryPath);
    }
  }
  return files;
}

function latestReviewInput(): ReviewInputSnapshot {
  const files = currentReviewInputRoots
    .flatMap((root) => reviewInputFilesAt(root))
    .sort();
  if (files.length === 0) {
    throw new Error(
      'Could not identify the current slide review input under src/, public/, index.html, or vite.config.ts.',
    );
  }

  return files
    .map((filePath) => ({ filePath, mtimeMs: statSync(filePath).mtimeMs }))
    .sort(
      (left, right) =>
        right.mtimeMs - left.mtimeMs ||
        left.filePath.localeCompare(right.filePath),
    )[0]!;
}

export function exportPairFreshnessIssue(
  snapshot: ExportFreshnessSnapshot,
): string | undefined {
  if (snapshot.source === 'explicit') return undefined;

  const issues: Array<string> = [];
  const pairSkewMs = Math.abs(snapshot.pptxMtimeMs - snapshot.pdfMtimeMs);
  if (pairSkewMs > MAX_EXPORT_PAIR_SKEW_MS) {
    const pairSkewMinutes = Math.ceil(pairSkewMs / 60_000);
    issues.push(
      `their modification times are ${pairSkewMinutes} minutes apart (maximum ${MAX_EXPORT_PAIR_SKEW_MS / 60_000} minutes), so they may come from different review runs`,
    );
  }

  const staleExports: Array<string> = [];
  if (snapshot.pptxMtimeMs < snapshot.reviewInput.mtimeMs) {
    staleExports.push(`PPTX "${snapshot.pptxPath}"`);
  }
  if (snapshot.pdfMtimeMs < snapshot.reviewInput.mtimeMs) {
    staleExports.push(`PDF "${snapshot.pdfPath}"`);
  }
  if (staleExports.length > 0) {
    issues.push(
      `${staleExports.join(' and ')} ${staleExports.length === 1 ? 'is' : 'are'} older than current review input "${snapshot.reviewInput.filePath}"`,
    );
  }

  if (issues.length === 0) return undefined;
  return (
    `Export freshness preflight failed for PPTX "${snapshot.pptxPath}" and PDF "${snapshot.pdfPath}": ${issues.join('; ')}. ` +
    'Regenerate both exports from the current slide sources in the same review run, then rerun the handoff.'
  );
}

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

export function resolveExportPaths(args: {
  directory?: string;
  pptx?: string;
  pdf?: string;
}): ExportPaths {
  if (args.pptx && args.pdf) {
    return {
      pptx: path.resolve(args.pptx),
      pdf: path.resolve(args.pdf),
      source: 'explicit',
    };
  }

  const directory = path.resolve(args.directory ?? defaultOutputDirectory);
  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    throw new Error(
      `Export preflight failed for ${directory}: output directory is missing. ` +
        'Expected exactly one PPTX (.pptx) and one PDF (.pdf) in this output directory.\n' +
        'Provide reviewed files with --pptx and --pdf, or export them into this directory.',
    );
  }

  const files = readdirSync(directory).map((file) => path.join(directory, file));
  const pptxFiles = files.filter((file) => file.toLowerCase().endsWith('.pptx'));
  const pdfFiles = files.filter((file) => file.toLowerCase().endsWith('.pdf'));

  const issue = exportDirectoryIssue(
    directory,
    pptxFiles,
    pdfFiles,
  );
  if (issue !== undefined) {
    throw new Error(issue);
  }

  return {
    pptx: pptxFiles[0],
    pdf: pdfFiles[0],
    source: 'directory',
  };
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

const MAX_TEXT_EXCERPT_LENGTH = 160;
const TEXT_EXCERPT_PREFIX_LENGTH = 64;
const TEXT_EXCERPT_SUFFIX_LENGTH =
  MAX_TEXT_EXCERPT_LENGTH - TEXT_EXCERPT_PREFIX_LENGTH - 3;

function textExcerpt(value: string): string {
  const sanitized = value
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (sanitized.length <= MAX_TEXT_EXCERPT_LENGTH) {
    return sanitized;
  }

  return `${sanitized.slice(0, TEXT_EXCERPT_PREFIX_LENGTH).trimEnd()}...${sanitized
    .slice(-TEXT_EXCERPT_SUFFIX_LENGTH)
    .trimStart()}`;
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
        `${format} export slide ${expectation.position} is missing expected title ${JSON.stringify(expectation.title)}; extracted text excerpt: ${JSON.stringify(textExcerpt(text))}: ${filePath}`,
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

  if (paths.source === 'directory') {
    assertFile(paths.pptx, 'PPTX export');
    assertFile(paths.pdf, 'PDF export');
    const freshnessIssue = exportPairFreshnessIssue({
      source: paths.source,
      pptxPath: paths.pptx,
      pdfPath: paths.pdf,
      pptxMtimeMs: statSync(paths.pptx).mtimeMs,
      pdfMtimeMs: statSync(paths.pdf).mtimeMs,
      reviewInput: latestReviewInput(),
    });
    if (freshnessIssue) {
      throw new Error(freshnessIssue);
    }
  }

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
