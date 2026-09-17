import { fileURLToPath } from 'node:url';
import {
  EVENT_TEMPLATES,
  type EventCategory,
} from '@workspace/game-engine';
import {
  RADIANT_EVENT_CATEGORIES,
  RADIANT_EVENT_CATEGORY_EXCEPTIONS,
  generateProceduralEvent,
  type WorldEventType,
} from '../src/lib/radiantAI';

const WEB_COMPATIBILITY_PATH = 'artifacts/academy/src/lib/radiantAI.ts';

export function validateWebEventRegistry(): void {
  const categories = Object.keys(EVENT_TEMPLATES) as EventCategory[];
  const categorySources = new Map<EventCategory, WorldEventType>();

  for (const [eventType, category] of Object.entries(RADIANT_EVENT_CATEGORIES)) {
    if (!(category in EVENT_TEMPLATES)) {
      throw new Error(
        `Web Radiant AI compatibility path "${WEB_COMPATIBILITY_PATH}" maps legacy event "${eventType}" to missing shared "${category}" category.`,
      );
    }
    categorySources.set(category, eventType as WorldEventType);
  }

  for (const category of categories) {
    const templates = EVENT_TEMPLATES[category];
    if (templates.length === 0) {
      throw new Error(`Shared ${category} event registry is empty.`);
    }

    const sourceType = categorySources.get(category);
    const exception = RADIANT_EVENT_CATEGORY_EXCEPTIONS[category];
    if (!sourceType && !exception) {
      throw new Error(
        `Web Radiant AI compatibility path "${WEB_COMPATIBILITY_PATH}" has no mapping for shared "${category}" event category. Add a legacy event mapping or document an intentional exception in RADIANT_EVENT_CATEGORY_EXCEPTIONS.`,
      );
    }

    if (!sourceType) {
      continue;
    }

    const event = generateProceduralEvent(sourceType, 60_000);
    if (!templates.some((template) => template.title === event.name)) {
      throw new Error(
        `Web event "${event.name}" for legacy ${sourceType} is not from the shared ${category} registry.`,
      );
    }
  }

  console.log(
    `✓ Web Radiant AI resolves all ${categories.length} shared categories through the compatibility path`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    validateWebEventRegistry();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Event registry validation failed: ${message}`);
    process.exitCode = 1;
  }
}
