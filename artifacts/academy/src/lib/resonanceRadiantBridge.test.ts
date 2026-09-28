import { describe, expect, it } from 'vitest';

import { createWorldEvent } from './radiantAI';
import {
  ResonanceEngine,
  createNode,
} from './resonanceEngine';
import {
  WORLD_EVENT_ENERGY,
  worldEventToResonance,
} from './resonanceRadiantBridge';

function expectEnergyVectorCloseTo(
  actual: Record<string, number>,
  expected: Record<string, number>,
): void {
  expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort());
  for (const [dimension, value] of Object.entries(expected)) {
    expect(actual[dimension]).toBeCloseTo(value, 12);
  }
}

describe('worldEventToResonance', () => {
  it.each([
    { category: 'academic' as const },
    { category: 'social' as const },
    { category: 'crisis' as const },
  ])('propagates $category event energy to its location node', ({ category }) => {
    const engine = new ResonanceEngine();
    const source = createNode('world_event', 'concept', 'World event');
    source.skills.excellence = 70;
    engine.addNode(source);
    engine.addEdge('world_event', 'main_hall', {
      trust: 100,
      fear: 0,
      emotional: 100,
      physical: 1,
    });

    const event = createWorldEvent(
      category,
      `${category} event`,
      'A canonical event used to verify resonance propagation.',
      60_000,
      ['Main Hall'],
      [],
      false,
    );
    worldEventToResonance(event, engine);

    const location = engine.getNode('main_hall');
    expect(location).toBeDefined();
    expect(location?.type).toBe('location');

    const canonicalEnergy = WORLD_EVENT_ENERGY[category];
    // Source skill (1.2) × inertial force (0.8) × remaining inertia (0.5).
    const transferScale = 0.48;
    const expectedReceivedEnergy = Object.fromEntries(
      Object.entries(canonicalEnergy).map(([dimension, value]) => [
        dimension,
        value * transferScale,
      ]),
    );
    const expectedFieldValues = Object.fromEntries(
      Object.entries(expectedReceivedEnergy).map(([dimension, value]) => [
        dimension,
        value * 0.3,
      ]),
    );
    const expectedImpact = Math.sqrt(
      Object.values(expectedReceivedEnergy).reduce(
        (sum, value) => sum + value * value,
        0,
      ),
    );

    expectEnergyVectorCloseTo(location!.field.values, expectedFieldValues);
    expect(location?.memory).toHaveLength(1);
    expect(location?.memory[0].sourceId).toBe('world_event');
    expectEnergyVectorCloseTo(
      location!.memory[0].energyReceived,
      expectedReceivedEnergy,
    );
    expect(location?.memory[0].impact).toBeCloseTo(expectedImpact);
    expect(location?.memory[0].impact).toBeGreaterThan(0);
  });
});