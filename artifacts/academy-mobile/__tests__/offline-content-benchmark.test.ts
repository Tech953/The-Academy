import { performance } from 'node:perf_hooks';
import { describe, expect, it, vi } from 'vitest';
import {
  ALL_EVENTS,
  EVENT_TEMPLATES,
  generateOfflineContentPack,
  type EventCategory,
  type EventTemplateValidationScope,
  type WorldEventTemplate,
} from '@workspace/game-engine';
import * as eventTemplateModule from '../../../lib/game-engine/src/eventTemplates';

const BASE_EVENTS = [...ALL_EVENTS];
const CATEGORIES = Object.keys(EVENT_TEMPLATES) as EventCategory[];
const REGISTRY_SIZE_MULTIPLIERS = [1, 2, 4] as const;
const REGISTRY_SIZES = REGISTRY_SIZE_MULTIPLIERS.map(
  multiplier => BASE_EVENTS.length * multiplier,
);
const ITERATIONS = 12;

// CI budgets are milliseconds per build at each configured registry size.
// Revisit these with REGISTRY_SIZE_MULTIPLIERS when the target registry/device changes.
const PERFORMANCE_BUDGETS_MS_PER_BUILD = {
  validation: 10,
  contentPackGeneration: 20,
} as const;

interface BenchmarkResult {
  registrySize: number;
  validationMsPerBuild: number;
  headlineRichContentPackMsPerBuild: number;
  noHeadlineContentPackMsPerBuild: number;
  headlineRichValidationPassesPerBuild: number;
  noHeadlineValidationPassesPerBuild: number;
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

function collectBudgetViolations(results: readonly BenchmarkResult[]): string[] {
  return results.flatMap(result => {
    const violations: string[] = [];
    if (result.validationMsPerBuild > PERFORMANCE_BUDGETS_MS_PER_BUILD.validation) {
      violations.push(
        `registry size ${result.registrySize}: validation measured ${result.validationMsPerBuild.toFixed(3)} ms/build (budget ${PERFORMANCE_BUDGETS_MS_PER_BUILD.validation} ms/build)`,
      );
    }
    if (
      result.headlineRichContentPackMsPerBuild >
      PERFORMANCE_BUDGETS_MS_PER_BUILD.contentPackGeneration
    ) {
      violations.push(
        `registry size ${result.registrySize}: headline-rich content-pack generation measured ${result.headlineRichContentPackMsPerBuild.toFixed(3)} ms/build (budget ${PERFORMANCE_BUDGETS_MS_PER_BUILD.contentPackGeneration} ms/build)`,
      );
    }
    if (
      result.noHeadlineContentPackMsPerBuild >
      PERFORMANCE_BUDGETS_MS_PER_BUILD.contentPackGeneration
    ) {
      violations.push(
        `registry size ${result.registrySize}: no-headline content-pack generation measured ${result.noHeadlineContentPackMsPerBuild.toFixed(3)} ms/build (budget ${PERFORMANCE_BUDGETS_MS_PER_BUILD.contentPackGeneration} ms/build)`,
      );
    }
    return violations;
  });
}

describe('offline content-pack benchmark', () => {
  it('reports registry size and measured timings for budget violations', () => {
    const validationOverBudget =
      PERFORMANCE_BUDGETS_MS_PER_BUILD.validation + 0.001;
    const contentPackOverBudget =
      PERFORMANCE_BUDGETS_MS_PER_BUILD.contentPackGeneration + 0.001;

    expect(
      collectBudgetViolations([
        {
          registrySize: 999,
          validationMsPerBuild: validationOverBudget,
          headlineRichContentPackMsPerBuild: contentPackOverBudget,
          noHeadlineContentPackMsPerBuild: contentPackOverBudget,
          headlineRichValidationPassesPerBuild: 1,
          noHeadlineValidationPassesPerBuild: 1,
        },
      ]),
    ).toEqual([
      `registry size 999: validation measured ${validationOverBudget.toFixed(3)} ms/build (budget ${PERFORMANCE_BUDGETS_MS_PER_BUILD.validation} ms/build)`,
      `registry size 999: headline-rich content-pack generation measured ${contentPackOverBudget.toFixed(3)} ms/build (budget ${PERFORMANCE_BUDGETS_MS_PER_BUILD.contentPackGeneration} ms/build)`,
      `registry size 999: no-headline content-pack generation measured ${contentPackOverBudget.toFixed(3)} ms/build (budget ${PERFORMANCE_BUDGETS_MS_PER_BUILD.contentPackGeneration} ms/build)`,
    ]);
  });

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

          const measureContentPackGeneration = (headlines: string[]) => {
            const generationStart = performance.now();
            const validationPasses: number[] = [];
            for (let iteration = 0; iteration < ITERATIONS; iteration++) {
              const callsBefore = assertSpy.mock.calls.length;
              const pack = generateOfflineContentPack(37, headlines);
              const pathScopes = assertSpy.mock.calls
                .slice(callsBefore)
                .map(([, scope]) => scope)
                .filter(
                  (scope): scope is EventTemplateValidationScope =>
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
            return {
              contentPackMsPerBuild,
              validationPassesPerBuild: validationPasses[0],
            };
          };
          const headlineRich = measureContentPackGeneration([
            'exam assessment study',
          ]);
          const noHeadline = measureContentPackGeneration([]);

          results.push({
            registrySize,
            validationMsPerBuild,
            headlineRichContentPackMsPerBuild:
              headlineRich.contentPackMsPerBuild,
            noHeadlineContentPackMsPerBuild:
              noHeadline.contentPackMsPerBuild,
            headlineRichValidationPassesPerBuild:
              headlineRich.validationPassesPerBuild,
            noHeadlineValidationPassesPerBuild:
              noHeadline.validationPassesPerBuild,
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
          budgetsMsPerBuild: PERFORMANCE_BUDGETS_MS_PER_BUILD,
          results: results.map(result => ({
            ...result,
            validationMsPerBuild: Number(result.validationMsPerBuild.toFixed(3)),
            headlineRichContentPackMsPerBuild: Number(
              result.headlineRichContentPackMsPerBuild.toFixed(3),
            ),
            noHeadlineContentPackMsPerBuild: Number(
              result.noHeadlineContentPackMsPerBuild.toFixed(3),
            ),
          })),
        },
        null,
        2,
      ),
    );

    expect(results).toHaveLength(REGISTRY_SIZES.length);
    expect(
      results.every(
        result =>
          result.headlineRichValidationPassesPerBuild === 1 &&
          result.noHeadlineValidationPassesPerBuild === 1,
      ),
    ).toBe(true);

    const budgetViolations = collectBudgetViolations(results);

    expect(
      budgetViolations,
      `Offline content-pack performance budget exceeded:\n${budgetViolations.join('\n')}`,
    ).toEqual([]);
  });
});