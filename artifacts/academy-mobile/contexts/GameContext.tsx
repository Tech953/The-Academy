import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { Archetype } from "@/lib/dialogueTemplates";

export interface Character {
  name: string;
  archetype: Archetype;
  faction: string;
  perks: string[];
  createdAt: number;
}

export interface StudyStats {
  quizzesTaken: number;
  questionsAnswered: number;
  correctAnswers: number;
  bestStreak: number;
}

const EMPTY_STATS: StudyStats = {
  quizzesTaken: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  bestStreak: 0,
};

interface GameState {
  ready: boolean;
  character: Character | null;
  stats: StudyStats;
  currentLocation: string;
  saveCharacter: (c: Character) => Promise<void>;
  recordQuizResult: (correct: number, total: number) => Promise<void>;
  setCurrentLocation: (name: string) => void;
}

const CHAR_KEY = "academy-character-v1";
const STATS_KEY = "academy-study-stats-v1";

const GameContext = createContext<GameState | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);
  const [stats, setStats] = useState<StudyStats>(EMPTY_STATS);
  const [currentLocation, setCurrentLocation] = useState("The Reading Room");

  useEffect(() => {
    (async () => {
      try {
        const [rawChar, rawStats] = await Promise.all([
          AsyncStorage.getItem(CHAR_KEY),
          AsyncStorage.getItem(STATS_KEY),
        ]);
        if (rawChar) setCharacter(JSON.parse(rawChar) as Character);
        if (rawStats) setStats(JSON.parse(rawStats) as StudyStats);
      } catch {
        // Ignore — fresh install starts with no character and empty stats.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const saveCharacter = useCallback(async (c: Character) => {
    setCharacter(c);
    await AsyncStorage.setItem(CHAR_KEY, JSON.stringify(c));
  }, []);

  const recordQuizResult = useCallback(
    async (correct: number, total: number) => {
      setStats((prev) => {
        const next: StudyStats = {
          quizzesTaken: prev.quizzesTaken + 1,
          questionsAnswered: prev.questionsAnswered + total,
          correctAnswers: prev.correctAnswers + correct,
          bestStreak: Math.max(prev.bestStreak, correct),
        };
        void AsyncStorage.setItem(STATS_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  return (
    <GameContext.Provider
      value={{
        ready,
        character,
        stats,
        currentLocation,
        saveCharacter,
        recordQuizResult,
        setCurrentLocation,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
