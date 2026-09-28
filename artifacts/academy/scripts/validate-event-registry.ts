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
const SUPPORTED_MIGRATION_STATUSES: readonly RadiantEventCategoryExceptionMigrationStatus[] =
  ['not-planned', 'planned', 'in-progress'];

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
}

export function validateEventTemplateRegistry(
  eventTemplates: CompleteEventTemplateRegistry = EVENT_TEMPLATES,
): void {
  const issues = validateEventTemplates(
    Object.values(eventTemplates).flat(),
  );
  if (issues.length === 0) return;

  throw new Error(
    [
      `Shared event-template authoring validation found ${issues.length} issue(s):`,
      formatEventTemplateValidationIssues(issues)
        .split('\n')
        .map((issue) => `- ${issue}`)
        .join('\n'),
    ].join('\n'),
  );
}

export function validateWebEventRegistry({
  eventTemplates = EVENT_TEMPLATES,
  categoryMappings = RADIANT_EVENT_CATEGORIES,
  exceptions = RADIANT_EVENT_CATEGORY_EXCEPTIONS,
  generateEvent = generateProceduralEvent,
}: WebEventRegistryValidationOptions = {}): void {
  const categories = Object.keys(eventTemplates) as EventCategory[];
  const categorySources = new Map<EventCategory, string>();

  for (const [eventType, category] of Object.entries(categoryMappings)) {
    if (!(category in eventTemplates)) {
      throw new Error(
        `Web Radiant AI compatibility path "${WEB_COMPATIBILITY_PATH}" maps legacy event "${eventType}" to missing shared "${category}" category.`,
      );
    }
    categorySources.set(category, eventType as WorldEventType);
  }

  const acceptedExceptions: Array<{ category: EventCategory; reason: string }> =
    [];

  for (const category of categories) {
    const templates = eventTemplates[category];
    if (templates.length === 0) {
      throw new Error(`Shared ${category} event registry is empty.`);
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
      throw new Error(
        `Web Radiant AI compatibility path "${WEB_COMPATIBILITY_PATH}" has no mapping for shared "${category}" event category. Add a legacy event mapping or document an intentional exception in RADIANT_EVENT_CATEGORY_EXCEPTIONS.`,
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
        throw new Error(
          `Web Radiant AI compatibility path "${WEB_COMPATIBILITY_PATH}" has an incomplete exception record for shared "${category}" event category. Supply a non-empty reviewOwner and a supported migrationStatus.`,
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
      throw new Error(
        `Web event "${event.name}" for legacy ${sourceType} is not from the shared ${category} registry.`,
      );
    }
  }

  const summary = `✓ Web Radiant AI resolves all ${categories.length} shared categories through the compatibility path`;
  if (acceptedExceptions.length === 0) {
    console.log(summary);
    return;
  }

  const exceptionLabel =
    acceptedExceptions.length === 1 ? 'exception' : 'exceptions';
  console.log(
    `${summary}; accepted ${acceptedExceptions.length} documented web ${exceptionLabel}:`,
  );
  for (const { category, reason } of acceptedExceptions) {
    console.log(`  - ${category}: ${reason}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    validateEventTemplateRegistry();
    validateWebEventRegistry();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Event registry validation failed: ${message}`);
    process.exitCode = 1;
  }
}
