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

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function installRoundTripFetchMock(initialSavedState: Record<string, unknown>) {
  let persistedState = cloneJson(initialSavedState);
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === `/api/game/load/${character.id}`) {
      return {
        ok: true,
        json: async () => cloneJson(persistedState),
      };
    }
    if (url === '/api/game/save') {
      const requestBody = JSON.parse(String(init?.body)) as {
        gameState: Record<string, unknown>;
      };
      persistedState = cloneJson(requestBody.gameState);
      return { ok: true };
    }
    throw new Error(`Unexpected request: ${url}`);
  });

  vi.stubGlobal('fetch', fetchMock);
  return {
    fetchMock,
    getPersistedState: () => cloneJson(persistedState),
  };
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

  it('reloads the persisted canonical Radiant payload without saving it again', async () => {
    const legacyRadiantState = JSON.stringify({
      schemaVersion: 1,
      npcs: [],
      events: [{ type: 'exam', name: 'Legacy exam' }],
      factions: [],
      tickCounter: 2,
    });
    const { fetchMock, getPersistedState } = installRoundTripFetchMock({
      character,
      radiantAIState: legacyRadiantState,
    });

    const migratedState = await new GameStateManager().initializeGame(
      character,
    );
    const persistedGameState = getPersistedState();
    const persistedRadiantAIState = String(persistedGameState.radiantAIState);
    const persistedPayload = JSON.parse(persistedRadiantAIState);
    const saveRequests = () =>
      fetchMock.mock.calls.filter(
        ([input]) => String(input) === '/api/game/save',
      );
    const [migrationSaveRequest] = saveRequests();
    const migrationSaveBody = JSON.parse(
      String(migrationSaveRequest?.[1]?.body),
    );

    expect(migratedState.radiantAIState).toBe(persistedRadiantAIState);
    expect(migrationSaveBody.characterId).toBe(character.id);
    expect(migrationSaveBody.gameState.radiantAIState).toBe(
      persistedRadiantAIState,
    );
    expect(persistedPayload).toMatchObject({
      schemaVersion: 2,
      events: [{ type: 'academic', name: 'Legacy exam' }],
    });
    expect(saveRequests()).toHaveLength(1);

    const reloadedState = await new GameStateManager().initializeGame(
      character,
    );
    const reloadedPayload = JSON.parse(reloadedState.radiantAIState ?? '');

    expect(reloadedState.radiantAIState).toBe(persistedRadiantAIState);
    expect(reloadedPayload).toMatchObject({
      schemaVersion: 2,
      events: [{ type: 'academic', name: 'Legacy exam' }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      fetchMock.mock.calls.map(([input]) => String(input)),
    ).toEqual([
      `/api/game/load/${character.id}`,
      '/api/game/save',
      `/api/game/load/${character.id}`,
    ]);
    expect(saveRequests()).toHaveLength(1);
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

describe('GameStateManager GED subject labels', () => {
  it.each([
    ['Mathematics', 'GED Mathematical Reasoning Study Guide'],
    ['English', 'GED Reasoning Through Language Arts Study Guide'],
    ['World History', 'GED Social Studies Study Guide'],
  ])('keeps the existing textbook display for %s', (input, expectedTitle) => {
    expect(new GameStateManager().getTextbookIndex(input)).toContain(expectedTitle);
  });
});