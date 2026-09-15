import {
  EVENT_TEMPLATES,
  type EventCategory,
} from '@workspace/game-engine';
import {
  generateProceduralEvent,
  type WorldEventType,
} from '../src/lib/radiantAI';

const categoryFixtures: Array<{
  type: WorldEventType;
  category: EventCategory;
}> = [
  { type: 'competition', category: 'competition' },
  { type: 'institutional', category: 'institutional' },
  { type: 'seasonal', category: 'seasonal' },
];

function main(): void {
  for (const fixture of categoryFixtures) {
    const event = generateProceduralEvent(fixture.type, 60_000);
    const templates = EVENT_TEMPLATES[fixture.category];
    if (!templates.some((template) => template.title === event.name)) {
      throw new Error(
        `Web event "${event.name}" for ${fixture.type} is not from the shared ${fixture.category} registry.`,
      );
    }
  }

  const categories = Object.keys(EVENT_TEMPLATES) as EventCategory[];
  for (const category of categories) {
    if (EVENT_TEMPLATES[category].length === 0) {
      throw new Error(`Shared ${category} event registry is empty.`);
    }
  }

  console.log(
    `✓ Web Radiant AI resolves ${categoryFixtures.length} compatibility categories from the shared ${categories.length}-category registry`,
  );
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Event registry validation failed: ${message}`);
  process.exitCode = 1;
}