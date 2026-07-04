import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Character, GameSession } from '@shared/schema';

const DATA_DIR = join(process.cwd(), '.academy_data');
const STORE_FILE = join(DATA_DIR, 'save.json');

interface PersistentData {
  characters: Record<string, Character>;
  gameSessions: Record<string, GameSession[]>;
  enrollments: Record<string, any[]>;
  academicProgress: Record<string, any>;
  readingProgress: Record<string, any>;
}

const EMPTY: PersistentData = {
  characters: {},
  gameSessions: {},
  enrollments: {},
  academicProgress: {},
  readingProgress: {},
};

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadFromDisk(): PersistentData {
  try {
    ensureDataDir();
    if (!existsSync(STORE_FILE)) return { ...EMPTY };
    const raw = readFileSync(STORE_FILE, 'utf-8');
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch (err) {
    console.error('[PersistentStore] Failed to load save file — starting fresh:', err);
    return { ...EMPTY };
  }
}

function saveToDisk(data: PersistentData): void {
  try {
    ensureDataDir();
    writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[PersistentStore] Failed to write save file:', err);
  }
}

let data = loadFromDisk();

const isDatabaseMode = !!process.env.DATABASE_URL;

if (!isDatabaseMode) {
  const count = Object.keys(data.characters).length;
  console.log(`[PersistentStore] Loaded ${count} character(s) from disk. Save file: ${STORE_FILE}`);
}

export const persistentStore = {
  isActive: !isDatabaseMode,

  getCharacter(id: string): Character | undefined {
    return data.characters[id];
  },

  getCharactersByUser(userId: string): Character[] {
    return Object.values(data.characters).filter(c => c.userId === userId);
  },

  setCharacter(id: string, character: Character): void {
    data.characters[id] = character;
    saveToDisk(data);
  },

  deleteCharacter(id: string): boolean {
    if (!data.characters[id]) return false;
    delete data.characters[id];
    saveToDisk(data);
    return true;
  },

  getAllCharacters(): Character[] {
    return Object.values(data.characters);
  },

  getLatestSession(characterId: string): GameSession | undefined {
    const sessions = data.gameSessions[characterId] || [];
    return sessions.sort((a, b) =>
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    )[0];
  },

  addSession(characterId: string, session: GameSession): void {
    if (!data.gameSessions[characterId]) {
      data.gameSessions[characterId] = [];
    }
    data.gameSessions[characterId].push(session);
    if (data.gameSessions[characterId].length > 10) {
      data.gameSessions[characterId] = data.gameSessions[characterId].slice(-10);
    }
    saveToDisk(data);
  },

  getEnrollments(characterId: string): any[] {
    return data.enrollments[characterId] || [];
  },

  setEnrollments(characterId: string, enrollments: any[]): void {
    data.enrollments[characterId] = enrollments;
    saveToDisk(data);
  },

  getAcademicProgress(characterId: string): any | undefined {
    return data.academicProgress[characterId];
  },

  setAcademicProgress(characterId: string, progress: any): void {
    data.academicProgress[characterId] = progress;
    saveToDisk(data);
  },

  getReadingProgress(characterId: string, textbookId: string): any | undefined {
    const key = `${characterId}:${textbookId}`;
    return data.readingProgress[key];
  },

  setReadingProgress(characterId: string, textbookId: string, progress: any): void {
    const key = `${characterId}:${textbookId}`;
    data.readingProgress[key] = progress;
    saveToDisk(data);
  },
};
