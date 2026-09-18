import { performance } from 'node:perf_hooks';
import { describe, expect, it, vi } from 'vitest';
import {
  ALL_EVENTS,
  EVENT_TEMPLATES,
  generateOfflineContentPack,
  type EventCategory,
  type WorldEventTemplate,
} from '@workspace/game-engine';
import * as eventTemplateModule from '../../../lib/game-engine/src/eventTemplates';

const BASE_EVENTS = [...ALL_EVENTS];
const CATEGORIES = Object.keys(EVENT_TEMPLATES) as EventCategory[];
const REGISTRY_SIZES = [BASE_EVENTS.length, BASE_EVENTS.length * 2, BASE_EVENTS.length * 4];
const ITERATIONS = 12;

interface BenchmarkResult {
  registrySize: number;
  validationMsPerBuild: number;
  contentPackMsPerBuild: number;
  validationPassesPerBuild: number;
}

function installRegistrySize(size: number): () => void {
  const originalByCategory = new Map<EventCategory, WorldEventTemplate[]>(
    CATEGORIES.map(category => [category, [...EVENT_TEMPLATES[category]]]),
  );
  const originalAllEvents = [...ALL_EVENTS];
  const scaledEvents = Array.from({ length: size }, (_, index) => {
    const source = BASE_EVENTS[index % BASE_EVENTS.length];
    return {
      ...source,
      id: `${source.id}-benchmark-${index}`,
    };
  });
  const eventsByCategory = new Map<EventCategory, WorldEventTemplate[]>(
    CATEGORIES.map(category => [category, []]),
  );

  scaledEvents.forEach(event => {
    eventsByCategory.get(event.category)!.push(event);
  });
  for (const category of CATEGORIES) {
    EVENT_TEMPLATES[category].splice(
      0,
      EVENT_TEMPLATES[category].length,
      ...eventsByCategory.get(category)!,
    );
  }
  ALL_EVENTS.splice(0, ALL_EVENTS.length, ...scaledEvents);

  return () => {
    for (const category of CATEGORIES) {
      EVENT_TEMPLATES[category].splice(
        0,
        EVENT_TEMPLATES[category].length,
        ...originalByCategory.get(category)!,
      );
    }
    ALL_EVENTS.splice(0, ALL_EVENTS.length, ...originalAllEvents);
  };
}

describe('offline content-pack benchmark', () => {
  it('records validation and generation scaling without weakening scoped validation', () => {
    const assertSpy = vi.spyOn(eventTemplateModule, 'assertValidEventTemplates');
    const results: BenchmarkResult[] = [];

    try {
      for (const registrySize of REGISTRY_SIZES) {
        const restoreRegistry = installRegistrySize(registrySize);
        try {
          const validationStart = performance.now();
          for (let iteration = 0; iteration < ITERATIONS; iteration++) {
            expect(eventTemplateModule.validateEventTemplates(ALL_EVENTS)).toEqual([]);
          }
          const validationMsPerBuild =
            (performance.now() - validationStart) / ITERATIONS;

          const generationStart = performance.now();
          const validationPasses: number[] = [];
          for (let iteration = 0; iteration < ITERATIONS; iteration++) {
            const callsBefore = assertSpy.mock.calls.length;
            const pack = generateOfflineContentPack(37, ['exam assessment study']);
            const pathScopes = assertSpy.mock.calls
              .slice(callsBefore)
              .map(([, scope]) => scope)
              .filter(
                (scope): scope is { validationPasses?: number } =>
                  typeof scope === 'object' && scope !== null,
              );

            expect(pack.activeEvents.length).toBeGreaterThan(0);
            expect(new Set(pathScopes).size).toBe(1);
            validationPasses.push(pathScopes[0]?.validationPasses ?? 0);
          }
          const contentPackMsPerBuild =
            (performance.now() - generationStart) / ITERATIONS;

          expect(validationPasses).toHaveLength(ITERATIONS);
          expect(new Set(validationPasses)).toEqual(new Set([1]));
          results.push({
            registrySize,
            validationMsPerBuild,
            contentPackMsPerBuild,
            validationPassesPerBuild: validationPasses[0],
          });
        } finally {
          restoreRegistry();
        }
      }
    } finally {
      assertSpy.mockRestore();
    }

    console.log(
      JSON.stringify(
        {
          benchmark: 'offline-content-pack',
          iterations: ITERATIONS,
          results: results.map(result => ({
            ...result,
            validationMsPerBuild: Number(result.validationMsPerBuild.toFixed(3)),
            contentPackMsPerBuild: Number(result.contentPackMsPerBuild.toFixed(3)),
          })),
        },
        null,
        2,
      ),
    );

    expect(results).toHaveLength(REGISTRY_SIZES.length);
    expect(results.every(result => result.validationPassesPerBuild === 1)).toBe(true);
  });
});