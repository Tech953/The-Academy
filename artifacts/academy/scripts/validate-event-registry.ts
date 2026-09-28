import { fileURLToPath } from 'node:url';
import {
  EVENT_TEMPLATES,
  formatEventTemplateValidationIssues,
  validateEventTemplates,
  type EventCategory,
  type WorldEventTemplate,
} from '@workspace/game-engine';
import {
  RADIANT_EVENT_CATEGORIES,
  RADIANT_EVENT_CATEGORY_EXCEPTIONS,
  generateProceduralEvent,
  type RadiantEventCategoryExceptionInput,
  type RadiantEventCategoryExceptionMigrationStatus,
  type WorldEventType,
} from '../src/lib/radiantAI';

const WEB_COMPATIBILITY_PATH = 'artifacts/academy/src/lib/radiantAI.ts';
const REPORT_SCHEMA_VERSION = 1 as const;
const SUPPORTED_MIGRATION_STATUSES: readonly RadiantEventCategoryExceptionMigrationStatus[] =
  ['not-planned', 'planned', 'in-progress'];

export type EventRegistryFailureCode =
  | 'invalid_event_templates'
  | 'legacy_mapping_target_missing'
  | 'empty_shared_category'
  | 'missing_category_mapping'
  | 'incomplete_exception_record'
  | 'generated_event_mismatch'
  | 'unexpected_error';

export class EventRegistryValidationError extends Error {
  readonly code: EventRegistryFailureCode;
  readonly category: string | null;
  readonly compatibilityPath: string;
  readonly legacyEventType?: string;

  constructor(
    message: string,
    details: {
      code: EventRegistryFailureCode;
      category: string | null;
      legacyEventType?: string;
    },
  ) {
    super(message);
    this.name = 'EventRegistryValidationError';
    this.code = details.code;
    this.category = details.category;
    this.compatibilityPath = WEB_COMPATIBILITY_PATH;
    this.legacyEventType = details.legacyEventType;
  }
}

type EventTemplateRegistry = Record<
  string,
  ReadonlyArray<{ title: string }>
>;
type CompleteEventTemplateRegistry = Record<
  string,
  ReadonlyArray<WorldEventTemplate>
>;
type EventCategoryMapping = Record<string, string>;
type EventCategoryExceptions = Partial<
  Record<string, RadiantEventCategoryExceptionInput>
>;

export interface WebEventRegistryValidationOptions {
  eventTemplates?: EventTemplateRegistry;
  categoryMappings?: EventCategoryMapping;
  exceptions?: EventCategoryExceptions;
  generateEvent?: (eventType: string, seed: number) => { name: string };
  emitHumanOutput?: boolean;
}

export interface WebEventRegistryValidationSummary {
  sharedCategoryCount: number;
  exceptionCount: number;
}

export interface RegistryPreflightReport {
  schemaVersion: typeof REPORT_SCHEMA_VERSION;
  status: 'ok' | 'error';
  compatibilityPath: string;
  sharedCategoryCount: number;
  exceptionCount: number;
  failure: null | {
    code: EventRegistryFailureCode;
    category: string | null;
    compatibilityPath: string;
    message: string;
    legacyEventType?: string;
  };
}

export function validateEventTemplateRegistry(
  eventTemplates: CompleteEventTemplateRegistry = EVENT_TEMPLATES,
): void {
  const issues = validateEventTemplates(
    Object.values(eventTemplates).flat(),
  );
  if (issues.length === 0) return;

  throw new EventRegistryValidationError(
    [
      `Shared event-template authoring validation found ${issues.length} issue(s):`,
      formatEventTemplateValidationIssues(issues)
        .split('\n')
        .map((issue) => `- ${issue}`)
        .join('\n'),
    ].join('\n'),
    { code: 'invalid_event_templates', category: null },
  );
}

export function validateWebEventRegistry({
  eventTemplates = EVENT_TEMPLATES,
  categoryMappings = RADIANT_EVENT_CATEGORIES,
  exceptions = RADIANT_EVENT_CATEGORY_EXCEPTIONS,
  generateEvent = generateProceduralEvent,
  emitHumanOutput = true,
}: WebEventRegistryValidationOptions = {}): WebEventRegistryValidationSummary {
  const categories = Object.keys(eventTemplates) as EventCategory[];
  const categorySources = new Map<EventCategory, string>();

  for (const [eventType, category] of Object.entries(categoryMappings)) {
    if (!(category in eventTemplates)) {
      throw new EventRegistryValidationError(
        `Web Radiant AI compatibility path "${WEB_COMPATIBILITY_PATH}" maps legacy event "${eventType}" to missing shared "${category}" category.`,
        {
          code: 'legacy_mapping_target_missing',
          category,
          legacyEventType: eventType,
        },
      );
    }
    categorySources.set(category, eventType as WorldEventType);
  }

  const acceptedExceptions: Array<{ category: EventCategory; reason: string }> =
    [];

  for (const category of categories) {
    const templates = eventTemplates[category];
    if (templates.length === 0) {
      throw new EventRegistryValidationError(
        `Shared ${category} event registry is empty.`,
        { code: 'empty_shared_category', category },
      );
    }

    const sourceType = categorySources.get(category);
    const exception = exceptions[category];
    const exceptionRecord =
      typeof exception === 'object' && exception !== null
        ? exception
        : undefined;
    const exceptionReason =
      typeof exception === 'string'
        ? exception.trim()
        : typeof exceptionRecord?.reason === 'string'
          ? exceptionRecord.reason.trim()
          : '';
    if (!sourceType && exceptionReason.length === 0) {
      throw new EventRegistryValidationError(
        `Web Radiant AI compatibility path "${WEB_COMPATIBILITY_PATH}" has no mapping for shared "${category}" event category. Add a legacy event mapping or document an intentional exception in RADIANT_EVENT_CATEGORY_EXCEPTIONS.`,
        { code: 'missing_category_mapping', category },
      );
    }

    if (!sourceType) {
      if (
        exceptionRecord &&
        (typeof exceptionRecord.reviewOwner !== 'string' ||
          exceptionRecord.reviewOwner.trim().length === 0 ||
          !SUPPORTED_MIGRATION_STATUSES.includes(
            exceptionRecord.migrationStatus,
          ))
      ) {
        throw new EventRegistryValidationError(
          `Web Radiant AI compatibility path "${WEB_COMPATIBILITY_PATH}" has an incomplete exception record for shared "${category}" event category. Supply a non-empty reviewOwner and a supported migrationStatus.`,
          { code: 'incomplete_exception_record', category },
        );
      }
      acceptedExceptions.push({
        category,
        reason: exceptionReason.replace(/\s+/g, ' '),
      });
      continue;
    }

    const event = generateEvent(sourceType, 60_000);
    if (!templates.some((template) => template.title === event.name)) {
      throw new EventRegistryValidationError(
        `Web event "${event.name}" for legacy ${sourceType} is not from the shared ${category} registry.`,
        {
          code: 'generated_event_mismatch',
          category,
          legacyEventType: sourceType,
        },
      );
    }
  }

  const summary: WebEventRegistryValidationSummary = {
    sharedCategoryCount: categories.length,
    exceptionCount: acceptedExceptions.length,
  };
  const summaryText = `✓ Web Radiant AI resolves all ${categories.length} shared categories through the compatibility path`;
  if (acceptedExceptions.length === 0) {
    if (emitHumanOutput) console.log(summaryText);
    return summary;
  }

  const exceptionLabel =
    acceptedExceptions.length === 1 ? 'exception' : 'exceptions';
  if (emitHumanOutput) {
    console.log(
      `${summaryText}; accepted ${acceptedExceptions.length} documented web ${exceptionLabel}:`,
    );
    for (const { category, reason } of acceptedExceptions) {
      console.log(`  - ${category}: ${reason}`);
    }
  }
  return summary;
}

export function createRegistryPreflightReport(
  options: {
    summary?: WebEventRegistryValidationSummary;
    error?: unknown;
    sharedCategoryCount?: number;
    exceptionCount?: number;
  } = {},
): RegistryPreflightReport {
  const {
    summary,
    error,
    sharedCategoryCount = Object.keys(EVENT_TEMPLATES).length,
    exceptionCount = Object.keys(RADIANT_EVENT_CATEGORY_EXCEPTIONS).filter(
      (category) => category in EVENT_TEMPLATES,
    ).length,
  } = options;
  const hasError = Object.prototype.hasOwnProperty.call(options, 'error');
  const failure =
    !hasError
      ? null
      : (() => {
          const message =
            error instanceof Error ? error.message : String(error);
          if (error instanceof EventRegistryValidationError) {
            return {
              code: error.code,
              category: error.category,
              compatibilityPath: error.compatibilityPath,
              message,
              ...(error.legacyEventType
                ? { legacyEventType: error.legacyEventType }
                : {}),
            };
          }

          return {
            code: 'unexpected_error' as const,
            category: null,
            compatibilityPath: WEB_COMPATIBILITY_PATH,
            message,
          };
        })();

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    status: failure ? 'error' : 'ok',
    compatibilityPath: WEB_COMPATIBILITY_PATH,
    sharedCategoryCount: summary?.sharedCategoryCount ?? sharedCategoryCount,
    exceptionCount: summary?.exceptionCount ?? exceptionCount,
    failure,
  };
}

export function runRegistryValidation({
  json = process.argv.includes('--json'),
  validateTemplates = validateEventTemplateRegistry,
  validateWeb = validateWebEventRegistry,
  writeStdout = console.log,
  writeStderr = console.error,
}: {
  json?: boolean;
  validateTemplates?: () => void;
  validateWeb?: (
    options?: WebEventRegistryValidationOptions,
  ) => WebEventRegistryValidationSummary;
  writeStdout?: (line: string) => void;
  writeStderr?: (line: string) => void;
} = {}): number {
  try {
    validateTemplates();
    const summary = validateWeb({ emitHumanOutput: !json });
    if (json) {
      writeStdout(JSON.stringify(createRegistryPreflightReport({ summary })));
    }
    return 0;
  } catch (error) {
    if (json) {
      writeStdout(JSON.stringify(createRegistryPreflightReport({ error })));
    } else {
      const message = error instanceof Error ? error.message : String(error);
      writeStderr(`Event registry validation failed: ${message}`);
    }
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = runRegistryValidation();
}
