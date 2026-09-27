/// <reference types="node" />
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { access } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  decodeYamlValue,
  encodeSlideDocumentText,
} from '../src/.sdm/core/serialization';
import * as ts from 'typescript';
import {
  validateSlidesManifest,
  type SlideManifestIssue,
  type SlideManifestEntry as SlideEntry,
} from '../src/.sdm/core/slidesManifest';
import {
  isRepairableSdmFile,
  repairSlideDocument,
  repairSlidesManifest,
  type RepairResult,
} from './sdmRepair';
import {
  findOrphanSdmFiles,
  formatSdmValidationIssue,
  validateSdmEntries,
  type SdmValidationIssue,
  type SdmValidationIo,
} from './sdmValidation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const slidesDir = path.join(projectRoot, 'src/pages/slides');
const slidesManifestPath = path.join(
  projectRoot,
  'src/data/slides-manifest.json',
);

export type ValidationIssue = {
  message: string;
};

type ValidationMode = 'fix' | 'check';

export type SourceTitleEntry = {
  position: number;
  filepath: string;
  title: string;
  kind?: string;
};

type PendingRepair = {
  relativePath: string;
  absolutePath: string;
  original: string;
  content: string;
  changes: Array<string>;
};

let slides: SlideEntry[] = [];

export function validationMode(args: Array<string>): ValidationMode {
  const effective = args[0] === '--' ? args.slice(1) : args;
  if (
    effective.length === 0 ||
    (effective.length === 1 && effective[0] === '--fix')
  ) {
    return 'fix';
  }
  if (effective.length === 1 && effective[0] === '--check') {
    return 'check';
  }

  throw new Error(`Unknown arguments: ${args.join(' ')}`);
}

function pendingRepair(
  relativePath: string,
  absolutePath: string,
  original: string,
  repaired: RepairResult,
  serialize: (value: unknown) => string,
): PendingRepair | undefined {
  if (repaired.changes.length === 0) {
    return undefined;
  }

  return {
    relativePath,
    absolutePath,
    original,
    content: serialize(repaired.value),
    changes: repaired.changes,
  };
}

function applyRepairs(repairs: Array<PendingRepair>): void {
  const staged = repairs.map((repair, index) => ({
    ...repair,
    temporaryPath: `${repair.absolutePath}.validate-slides-${process.pid}-${index}.tmp`,
  }));
  let applied = 0;
  try {
    for (const repair of staged) {
      writeFileSync(repair.temporaryPath, repair.content);
    }
    for (const repair of staged) {
      renameSync(repair.temporaryPath, repair.absolutePath);
      applied += 1;
    }
  } catch (error) {
    for (let index = 0; index < applied; index += 1) {
      const repair = staged[index];
      if (repair !== undefined) {
        writeFileSync(repair.absolutePath, repair.original);
      }
    }
    for (const repair of staged) {
      if (existsSync(repair.temporaryPath)) {
        unlinkSync(repair.temporaryPath);
      }
    }
    throw error;
  }

  for (const repair of repairs) {
    console.log(`Fixed ${repair.relativePath}:`);
    for (const change of repair.changes) {
      console.log(`- ${change}`);
    }
  }
}

function relativeToProject(filePath: string): string {
  return path.relative(projectRoot, filePath).replaceAll(path.sep, '/');
}

function formatIssuePath(issuePath: string): string {
  if (issuePath === '') {
    return 'manifest';
  }

  return issuePath
    .slice(1)
    .split('/')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
    .join('.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issuePathSegments(issuePath: string): Array<string> {
  return issuePath
    .slice(1)
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'));
}

function manifestFieldMessage(
  issue: SlideManifestIssue,
  input: unknown,
): string {
  const segments = issuePathSegments(issue.path);
  const entryIndex = Number(segments[0]);
  const field = segments[1];
  const entry =
    Array.isArray(input) && Number.isInteger(entryIndex)
      ? input[entryIndex]
      : undefined;
  const value = isRecord(entry) && field !== undefined ? entry[field] : undefined;
  if (issue.message === 'Unexpected property' && field !== undefined) {
    return `unknown property "${field}"; remove it from the manifest entry`;
  }
  if (field === 'position') {
    return value === undefined
      ? 'missing "position"; preserve the current position order, append unpositioned entries after the highest existing position in array order, then normalize to contiguous 1..N (or run validate-slides without --check to repair)'
      : 'invalid "position"; replace it with a unique integer of at least 1, preserve the current position order, then normalize to contiguous 1..N';
  }
  const requiredFieldGuidance: Record<string, string> = {
    id: 'add a stable non-blank string slide id',
    filepath: 'add the non-blank path to the slide source file',
    title: 'add a non-blank user-facing slide title',
    description: 'add a non-blank description of the slide',
  };
  if (field !== undefined && Object.hasOwn(requiredFieldGuidance, field)) {
    return `${value === undefined ? 'missing' : 'invalid'} "${field}"; ${requiredFieldGuidance[field]}`;
  }

  return issue.message;
}

export function mappedManifestIssues(
  issues: Array<SlideManifestIssue>,
  input: unknown,
): Array<SlideManifestIssue> {
  const seen = new Set<string>();
  return issues.flatMap((issue) => {
    if (seen.has(issue.path)) {
      return [];
    }
    seen.add(issue.path);

    return [{ path: issue.path, message: manifestFieldMessage(issue, input) }];
  });
}

export function sdmRollupMessages(
  issues: Array<SdmValidationIssue>,
): Array<string> {
  const groups = new Map<
    string,
    { code: string; elementIds: Array<string>; filepaths: Set<string> }
  >();
  for (const issue of issues) {
    if (issue.elementIds.length === 0) {
      continue;
    }
    const key = JSON.stringify([issue.code, issue.elementIds, issue.message]);
    const group = groups.get(key) ?? {
      code: issue.code,
      elementIds: issue.elementIds,
      filepaths: new Set<string>(),
    };
    group.filepaths.add(issue.filepath);
    groups.set(key, group);
  }

  return [...groups.values()].flatMap(({ code, elementIds, filepaths }) =>
    filepaths.size > 1
      ? [
          `[${code}] (${elementIds.join(', ')}): same failure in ${filepaths.size} slides — fix every copy in one batched edit, then rerun`,
        ]
      : [],
  );
}

function getSlideFilenames(): string[] {
  if (!existsSync(slidesDir)) {
    return [];
  }

  return readdirSync(slidesDir).filter((name) => name.endsWith('.tsx'));
}

function validateDuplicatePositions(issues: ValidationIssue[]) {
  const positions = new Map<number, string[]>();
  for (const slide of slides) {
    const list = positions.get(slide.position) ?? [];
    list.push(slide.title);
    positions.set(slide.position, list);
  }

  for (const [position, titles] of positions) {
    if (titles.length > 1) {
      issues.push({
        message: `Duplicate position ${position} found for slides: ${titles.join(', ')}`,
      });
    }
  }
}

function validateDuplicateIds(issues: ValidationIssue[]) {
  const ids = new Map<string, string[]>();
  for (const slide of slides) {
    const list = ids.get(slide.id) ?? [];
    list.push(slide.title);
    ids.set(slide.id, list);
  }

  for (const [id, titles] of ids) {
    if (titles.length > 1) {
      issues.push({
        message: `Duplicate ID ${id} found for slides: ${titles.join(', ')}`,
      });
    }
  }
}

function validateContiguousPositions(issues: ValidationIssue[]) {
  const sorted = [...slides].sort((a, b) => a.position - b.position);
  for (let index = 0; index < sorted.length; index += 1) {
    const expected = index + 1;
    const actual = sorted[index].position;
    if (actual !== expected) {
      issues.push({
        message: `Position gap: expected ${expected}, found ${actual}`,
      });
    }
  }
}

function jsxSlides(): SlideEntry[] {
  return slides.filter((slide) => slide.kind !== 'sdm');
}

function validateFilepaths(issues: ValidationIssue[]) {
  const knownSlideFiles = new Set(getSlideFilenames());

  for (const slide of jsxSlides()) {
    const filename = path.basename(slide.filepath);
    const expectedFilepath = `src/pages/slides/${filename}`;

    if (!filename.endsWith('.tsx')) {
      issues.push({
        message: `Invalid filepath extension for slide "${slide.title}": ${slide.filepath} (must end with .tsx)`,
      });
      continue;
    }

    if (slide.filepath !== expectedFilepath) {
      issues.push({
        message:
          `Invalid filepath for slide "${slide.title}": ${slide.filepath}. ` +
          `Expected ${expectedFilepath} so it resolves in slideLoader.ts.`,
      });
      continue;
    }

    if (!knownSlideFiles.has(filename)) {
      issues.push({
        message: `File not found: ${slide.filepath} (referenced by slide "${slide.title}")`,
      });
    }
  }
}

function validateOrphanedSlideFiles(issues: ValidationIssue[]) {
  const manifestSet = new Set(
    jsxSlides().map((slide) =>
      path.normalize(path.resolve(projectRoot, slide.filepath)),
    ),
  );

  const files = getSlideFilenames().map((name) => path.join(slidesDir, name));

  for (const file of files) {
    if (!manifestSet.has(path.normalize(file))) {
      issues.push({
        message: `Orphaned slide file: ${relativeToProject(file)} (not referenced in manifest)`,
      });
    }
  }
}

function decodeJsxText(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

type SourceTitleExtraction =
  | { kind: 'resolved'; title: string }
  | { kind: 'missing' }
  | { kind: 'unsupported'; expression: string };

function collectConstInitializers(
  sourceFile: ts.SourceFile,
): Map<string, ts.Expression | undefined> {
  const initializers = new Map<string, ts.Expression | undefined>();
  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      ts.isVariableDeclarationList(node.parent) &&
      (node.parent.flags & ts.NodeFlags.Const) !== 0
    ) {
      const name = node.name.text;
      if (initializers.has(name)) {
        initializers.set(name, undefined);
      } else {
        initializers.set(name, node.initializer);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return initializers;
}

function resolveStaticString(
  expression: ts.Expression,
  initializers: ReadonlyMap<string, ts.Expression | undefined>,
  resolving = new Set<string>(),
): string | undefined {
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

  if (
    ts.isStringLiteral(current) ||
    ts.isNoSubstitutionTemplateLiteral(current)
  ) {
    return current.text;
  }

  if (ts.isIdentifier(current)) {
    const initializer = initializers.get(current.text);
    if (!initializer || resolving.has(current.text)) {
      return undefined;
    }
    const nextResolving = new Set(resolving);
    nextResolving.add(current.text);
    return resolveStaticString(initializer, initializers, nextResolving);
  }

  if (
    ts.isBinaryExpression(current) &&
    current.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = resolveStaticString(current.left, initializers, resolving);
    const right = resolveStaticString(current.right, initializers, resolving);
    return left === undefined || right === undefined
      ? undefined
      : `${left}${right}`;
  }

  if (ts.isTemplateExpression(current)) {
    let result = current.head.text;
    for (const span of current.templateSpans) {
      const value = resolveStaticString(
        span.expression,
        initializers,
        resolving,
      );
      if (value === undefined) {
        return undefined;
      }
      result += `${value}${span.literal.text}`;
    }
    return result;
  }

  if (ts.isConditionalExpression(current)) {
    if (current.condition.kind === ts.SyntaxKind.TrueKeyword) {
      return resolveStaticString(current.whenTrue, initializers, resolving);
    }
    if (current.condition.kind === ts.SyntaxKind.FalseKeyword) {
      return resolveStaticString(current.whenFalse, initializers, resolving);
    }
  }

  return undefined;
}

function expressionForDiagnostic(
  expression: ts.Node,
  sourceFile: ts.SourceFile,
): string {
  const value = expression.getText(sourceFile).replace(/\s+/g, ' ').trim();
  return value.length > 120 ? `${value.slice(0, 117)}...` : value || '<empty>';
}

function resolveJsxChildrenTitle(
  children: ts.NodeArray<ts.JsxChild>,
  initializers: ReadonlyMap<string, ts.Expression | undefined>,
  sourceFile: ts.SourceFile,
): SourceTitleExtraction {
  const parts: Array<string> = [];
  for (const child of children) {
    if (ts.isJsxText(child)) {
      parts.push(decodeJsxText(child.text));
    } else if (ts.isJsxExpression(child)) {
      if (child.expression === undefined) {
        continue;
      }
      const value = resolveStaticString(child.expression, initializers);
      if (value === undefined) {
        return {
          kind: 'unsupported',
          expression: expressionForDiagnostic(child.expression, sourceFile),
        };
      }
      parts.push(value);
    } else if (ts.isJsxElement(child) || ts.isJsxFragment(child)) {
      const nested = resolveJsxChildrenTitle(
        child.children,
        initializers,
        sourceFile,
      );
      if (nested.kind === 'unsupported') {
        return nested;
      }
      if (nested.kind === 'resolved') {
        parts.push(nested.title);
      }
    }
  }

  const title = parts.join(' ').replace(/\s+/g, ' ').trim();
  return title ? { kind: 'resolved', title } : { kind: 'missing' };
}

function sourceTitleExtraction(source: string): SourceTitleExtraction {
  const sourceFile = ts.createSourceFile(
    'slide.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const initializers = collectConstInitializers(sourceFile);
  const slideFrameAttributes: Array<ts.JsxAttributes> = [];
  const headings: Array<ts.JsxElement> = [];

  const visit = (node: ts.Node) => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      ts.isIdentifier(node.tagName) &&
      node.tagName.text === 'SlideFrame'
    ) {
      slideFrameAttributes.push(node.attributes);
    }
    if (
      ts.isJsxElement(node) &&
      ts.isIdentifier(node.openingElement.tagName) &&
      node.openingElement.tagName.text === 'h1'
    ) {
      headings.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  if (slideFrameAttributes.length > 1) {
    return {
      kind: 'unsupported',
      expression: 'multiple <SlideFrame> elements in one source file',
    };
  }

  const frameAttributes = slideFrameAttributes[0];
  if (frameAttributes !== undefined) {
    const titleAttribute = frameAttributes.properties.find(
      (property): property is ts.JsxAttribute =>
        ts.isJsxAttribute(property) &&
        property.name.getText(sourceFile) === 'title',
    );
    if (titleAttribute !== undefined) {
      const initializer = titleAttribute.initializer;
      if (initializer === undefined) {
        return {
          kind: 'unsupported',
          expression: 'title attribute without a value',
        };
      }
      if (ts.isStringLiteral(initializer)) {
        const title = decodeJsxText(initializer.text).trim();
        return title ? { kind: 'resolved', title } : { kind: 'missing' };
      }
      if (ts.isJsxExpression(initializer) && initializer.expression) {
        const title = resolveStaticString(initializer.expression, initializers);
        if (title !== undefined) {
          const trimmedTitle = title.trim();
          return trimmedTitle
            ? { kind: 'resolved', title: trimmedTitle }
            : { kind: 'missing' };
        }
        return {
          kind: 'unsupported',
          expression: expressionForDiagnostic(
            initializer.expression,
            sourceFile,
          ),
        };
      }
      return {
        kind: 'unsupported',
        expression: expressionForDiagnostic(initializer, sourceFile),
      };
    }

    const spreadAttribute = frameAttributes.properties.find(
      ts.isJsxSpreadAttribute,
    );
    if (spreadAttribute !== undefined) {
      return {
        kind: 'unsupported',
        expression: expressionForDiagnostic(spreadAttribute, sourceFile),
      };
    }
  }

  if (headings[0] !== undefined) {
    return resolveJsxChildrenTitle(
      headings[0].children,
      initializers,
      sourceFile,
    );
  }
  return { kind: 'missing' };
}

export function extractSourceTitle(source: string): string | undefined {
  const extraction = sourceTitleExtraction(source);
  return extraction.kind === 'resolved' ? extraction.title : undefined;
}

export function findSourceTitleIssues(
  entries: Array<SourceTitleEntry>,
  readSource: (filepath: string) => string | undefined,
): Array<ValidationIssue> {
  return entries
    .filter((entry) => entry.kind !== 'sdm')
    .flatMap((entry) => {
      const source = readSource(entry.filepath);
      if (source === undefined) {
        return [
          {
            message: `Slide ${entry.position} source title could not be read in ${entry.filepath}: expected "${entry.title}", found "<unreadable source>"`,
          },
        ];
      }

      const extraction = sourceTitleExtraction(source);
      if (extraction.kind === 'unsupported') {
        return [
          {
            message:
              `Slide ${entry.position} source title expression could not be resolved in ${entry.filepath}: ` +
              `expected "${entry.title}", found dynamic expression ${JSON.stringify(extraction.expression)}. ` +
              'Use a string literal or a local const initialized with a static string.',
          },
        ];
      }

      const currentTitle =
        extraction.kind === 'resolved' ? extraction.title : undefined;
      const displayTitle = currentTitle ?? '<missing>';

      if (currentTitle === entry.title) {
        return [];
      }

      return [
        {
          message: `Slide ${entry.position} source title drift in ${entry.filepath}: expected "${entry.title}", found "${displayTitle}"`,
        },
      ];
    });
}

function validateSourceTitles(issues: ValidationIssue[]) {
  issues.push(
    ...findSourceTitleIssues(jsxSlides(), (filepath) => {
      try {
        return readFileSync(path.join(projectRoot, filepath), 'utf8');
      } catch {
        return undefined;
      }
    }),
  );
}

function validateSdmSlides(
  issues: ValidationIssue[],
  warnings: Array<string>,
  rollups: Array<string>,
) {
  const io: SdmValidationIo = {
    readFile: (relativePath) => {
      try {
        return readFileSync(path.join(projectRoot, relativePath), 'utf8');
      } catch {
        return null;
      }
    },
    listFiles: (relativeDir) => {
      try {
        return readdirSync(path.join(projectRoot, relativeDir), {
          recursive: true,
          withFileTypes: true,
        })
          .filter((entry) => entry.isFile())
          .map((entry) =>
            relativeToProject(path.join(entry.parentPath, entry.name)).slice(
              `${relativeDir}/`.length,
            ),
          );
      } catch {
        return [];
      }
    },
  };
  const sdmEntries = slides.filter((slide) => slide.kind === 'sdm');
  const report = validateSdmEntries(sdmEntries, io);
  const messages = [...report.errors, ...findOrphanSdmFiles(slides, io)];
  for (const message of messages) {
    issues.push({ message: formatSdmValidationIssue(message) });
  }
  rollups.push(...sdmRollupMessages(messages));
  warnings.push(...report.warnings.map(formatSdmValidationIssue));
}

function printWarnings(warnings: Array<string>) {
  if (warnings.length === 0) {
    return;
  }
  console.warn(`Slide manifest warnings (${warnings.length} warning(s)):\n`);
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

function pendingSdmRepairs(): Array<PendingRepair> {
  const repairs: Array<PendingRepair> = [];
  for (const slide of slides.filter((entry) => entry.kind === 'sdm')) {
    if (!isRepairableSdmFile(slide.id, slide.filepath)) {
      continue;
    }
    const absolutePath = path.join(projectRoot, slide.filepath);
    let original: string;
    try {
      original = readFileSync(absolutePath, 'utf8');
    } catch {
      continue;
    }
    const decoded = decodeYamlValue(original);
    if (!decoded.ok) {
      continue;
    }
    const repair = pendingRepair(
      slide.filepath,
      absolutePath,
      original,
      repairSlideDocument(decoded.value),
      encodeSlideDocumentText,
    );
    if (repair !== undefined) {
      repairs.push(repair);
    }
  }

  return repairs;
}

async function main() {
  const issues: ValidationIssue[] = [];
  const mode = validationMode(process.argv.slice(2));

  try {
    await access(slidesManifestPath);
  } catch {
    console.error(
      'Slide manifest validation failed (1 issue):\n' +
        '- Missing required manifest file: src/data/slides-manifest.json',
    );
    process.exitCode = 1;
    return;
  }

  let rawManifest: unknown;
  let rawManifestSource: string;
  try {
    rawManifestSource = readFileSync(slidesManifestPath, 'utf8');
    rawManifest = JSON.parse(rawManifestSource) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      'Slide manifest validation failed (1 issue):\n' +
        `- Failed to parse src/data/slides-manifest.json: ${message}`,
    );
    process.exitCode = 1;
    return;
  }

  const repairs: Array<PendingRepair> = [];
  if (mode === 'fix') {
    const repairedManifest = repairSlidesManifest(rawManifest);
    rawManifest = repairedManifest.value;
    const manifestRepair = pendingRepair(
      'src/data/slides-manifest.json',
      slidesManifestPath,
      rawManifestSource,
      repairedManifest,
      (value) => `${JSON.stringify(value, null, 2)}\n`,
    );
    if (manifestRepair !== undefined) {
      repairs.push(manifestRepair);
    }
  }
  const parsedManifest = validateSlidesManifest(rawManifest);
  if (!parsedManifest.ok) {
    const manifestIssues = mappedManifestIssues(
      parsedManifest.issues,
      rawManifest,
    );
    console.error(
      `Slide manifest validation failed (${manifestIssues.length} issue(s)):\n`,
    );
    for (const issue of manifestIssues) {
      const issuePath = formatIssuePath(issue.path);
      console.error(`- Invalid manifest at ${issuePath}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  slides = parsedManifest.entries;
  if (mode === 'fix') {
    repairs.push(...pendingSdmRepairs());
    applyRepairs(repairs);
  }

  validateDuplicatePositions(issues);
  validateDuplicateIds(issues);
  validateContiguousPositions(issues);
  validateFilepaths(issues);
  validateOrphanedSlideFiles(issues);
  validateSourceTitles(issues);
  const warnings: Array<string> = [];
  const rollups: Array<string> = [];
  validateSdmSlides(issues, warnings, rollups);

  if (issues.length > 0) {
    console.error(
      `Slide manifest validation failed (${issues.length} issue(s)):\n`,
    );
    for (const issue of issues) {
      console.error(`- ${issue.message}`);
    }
    for (const rollup of rollups) {
      console.error(`- ${rollup}`);
    }
    printWarnings(warnings);
    process.exitCode = 1;
    return;
  }

  printWarnings(warnings);
  console.log(`✓ Slide manifest is valid (${slides.length} slides)`);
}

const executedPath = process.argv[1];
if (
  executedPath !== undefined &&
  path.resolve(executedPath) === fileURLToPath(import.meta.url)
) {
  await main();
}
