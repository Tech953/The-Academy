import type { Character } from '@shared/schema';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameStateManager } from './gameState';

const character = { id: 'character-1' } as Character;

function installFetchMock(
  savedState: Record<string, unknown>,
  saveResult: { ok: boolean } = { ok: true },
) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === `/api/game/load/${character.id}`) {
      return {
        ok: true,
        json: async () => savedState,
      };
    }
    if (url === '/api/game/save') {
      return saveResult;
    }
    throw new Error(`Unexpected request: ${url}`);
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});


describe('GameStateManager Radiant save migration', () => {
  it('persists a migrated Radiant payload once during loading', async () => {
    const legacyRadiantState = JSON.stringify({
      schemaVersion: 1,
      npcs: [],
      events: [{ type: 'exam', name: 'Legacy exam' }],
      factions: [],
      tickCounter: 2,
    });
    const fetchMock = installFetchMock({
      character,
      radiantAIState: legacyRadiantState,
    });

    const state = await new GameStateManager().initializeGame(character);

    expect(state.radiantAIState).not.toBe(legacyRadiantState);
    expect(JSON.parse(state.radiantAIState ?? '')).toMatchObject({
      schemaVersion: 2,
      events: [{ type: 'academic', name: 'Legacy exam' }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/game/save');
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({
      characterId: character.id,
      gameState: { radiantAIState: state.radiantAIState },
    });
  });

  it('does not save a current Radiant payload during a normal load', async () => {
    const currentRadiantState = JSON.stringify({
      schemaVersion: 2,
      npcs: [],
      events: [],
      factions: [],
      tickCounter: 2,
    });
    const fetchMock = installFetchMock({
      character,
      radiantAIState: currentRadiantState,
    });

    await new GameStateManager().initializeGame(character);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/game/load/${character.id}`);
  });

  it('keeps the migrated state when the immediate persistence fails', async () => {
    const legacyRadiantState = JSON.stringify({
      schemaVersion: 1,
      npcs: [],
      events: [{ type: 'exam', name: 'Legacy exam' }],
    });
    const fetchMock = installFetchMock(
      { character, radiantAIState: legacyRadiantState },
      { ok: false },
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const manager = new GameStateManager();
    const state = await manager.initializeGame(character);

    expect(state.radiantAIState).not.toBe(legacyRadiantState);
    expect(manager.getRadiantAIState()).toBe(state.radiantAIState);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});