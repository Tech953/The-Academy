import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { FullCharacterStats, DEFAULT_STATS } from '@shared/stats';
import { StarterPerk, LevelUpPerk, STARTER_PERKS } from '@shared/perks';

export interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: Date;
  read: boolean;
  category: 'academic' | 'faction' | 'personal' | 'system';
}

export interface DirectMessage {
  id: string;
  from: string;
  fromTitle?: string;
  content: string;
  timestamp: Date;
  read: boolean;
  avatar?: string;
}

export interface GameCharacter {
  name: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  stats: FullCharacterStats;
  starterPerks: string[];
  unlockedPerks: string[];
  faction?: string;
  resonanceState: 'stable' | 'unstable' | 'critical';
  energy: number;
  maxEnergy: number;
  currentLocation: string;
}

interface GameStateContextType {
  character: GameCharacter;
  emails: Email[];
  messages: DirectMessage[];
  cubAffection: number;
  unreadEmailCount: number;
  unreadMessageCount: number;
  updateCharacter: (updates: Partial<GameCharacter>) => void;
  addExperience: (amount: number) => void;
  setCubAffection: (value: number | ((prev: number) => number)) => void;
  addEmail: (email: Omit<Email, 'id' | 'timestamp' | 'read'>) => void;
  markEmailRead: (id: string) => void;
  addMessage: (message: Omit<DirectMessage, 'id' | 'timestamp' | 'read'>) => void;
  markMessageRead: (id: string) => void;
  unlockPerk: (perkId: string) => void;
  setResonanceState: (state: 'stable' | 'unstable' | 'critical') => void;
}

const STORAGE_KEY = 'academy-game-state';

function getDefaultCharacter(): GameCharacter {
  return {
    name: 'New Student',
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    stats: { ...DEFAULT_STATS },
    starterPerks: [],
    unlockedPerks: [],
    resonanceState: 'stable',
    energy: 100,
    maxEnergy: 100,
    currentLocation: 'dormitory',
  };
}

function getDefaultEmails(): Email[] {
  return [
    {
      id: 'email-welcome',
      from: 'Academy Administration',
      subject: 'Welcome to The Academy',
      body: 'Dear Student,\n\nWelcome to The Academy. Your journey of discovery begins now. Please report to the Main Hall for orientation.\n\nRemember: Knowledge is power, but wisdom is knowing how to use it.\n\nBest regards,\nThe Headmaster',
      timestamp: new Date(),
      read: false,
      category: 'system',
    },
    {
      id: 'email-schedule',
      from: 'Academic Affairs',
      subject: 'Your Class Schedule',
      body: 'Your class schedule has been finalized for this semester. Please check the Schedule app for details.\n\nClasses begin at 8:00 AM sharp. Tardiness affects your academic reputation.',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
      category: 'academic',
    },
    {
      id: 'email-faction',
      from: 'Censorium Representative',
      subject: 'An Invitation',
      body: 'We have been watching your progress with interest. The Censorium values those who seek truth through discipline.\n\nShould you wish to learn more about our philosophy, visit the Censorium Hall in the East Wing.\n\n- The Censorium',
      timestamp: new Date(Date.now() - 7200000),
      read: false,
      category: 'faction',
    },
  ];
}

function getDefaultMessages(): DirectMessage[] {
  return [
    {
      id: 'msg-cub',
      from: 'Cub',
      fromTitle: 'Your Companion',
      content: 'Hello! I\'m so excited to be your study companion. Let me know if you need any help!',
      timestamp: new Date(),
      read: false,
    },
    {
      id: 'msg-mentor',
      from: 'Professor Chen',
      fromTitle: 'Mathematics Faculty',
      content: 'Welcome to The Academy. I look forward to helping you develop your mathematical reasoning skills. My office hours are posted on the schedule.',
      timestamp: new Date(Date.now() - 1800000),
      read: false,
    },
    {
      id: 'msg-student',
      from: 'Alex Rivera',
      fromTitle: 'Fellow Student',
      content: 'Hey! Saw you at orientation. If you need any tips about navigating this place, let me know. The library is a good place to start.',
      timestamp: new Date(Date.now() - 5400000),
      read: false,
    },
  ];
}

function loadGameState(): { character: GameCharacter; emails: Email[]; messages: DirectMessage[]; cubAffection: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        character: { ...getDefaultCharacter(), ...parsed.character },
        emails: (parsed.emails || getDefaultEmails()).map((e: Email) => ({ ...e, timestamp: new Date(e.timestamp) })),
        messages: (parsed.messages || getDefaultMessages()).map((m: DirectMessage) => ({ ...m, timestamp: new Date(m.timestamp) })),
        cubAffection: parsed.cubAffection ?? 50,
      };
    }
  } catch (e) {
    console.warn('Failed to load game state:', e);
  }
  return {
    character: getDefaultCharacter(),
    emails: getDefaultEmails(),
    messages: getDefaultMessages(),
    cubAffection: 50,
  };
}

function saveGameState(state: { character: GameCharacter; emails: Email[]; messages: DirectMessage[]; cubAffection: number }): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save game state:', e);
  }
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => loadGameState());

  useEffect(() => {
    saveGameState(state);
  }, [state]);

  const updateCharacter = useCallback((updates: Partial<GameCharacter>) => {
    setState(prev => ({
      ...prev,
      character: { ...prev.character, ...updates },
    }));
  }, []);

  const addExperience = useCallback((amount: number) => {
    setState(prev => {
      let newExp = prev.character.experience + amount;
      let newLevel = prev.character.level;
      let expToNext = prev.character.experienceToNextLevel;
      
      while (newExp >= expToNext) {
        newExp -= expToNext;
        newLevel++;
        expToNext = Math.floor(expToNext * 1.5);
      }
      
      return {
        ...prev,
        character: {
          ...prev.character,
          experience: newExp,
          level: newLevel,
          experienceToNextLevel: expToNext,
        },
      };
    });
  }, []);

  const setCubAffection = useCallback((value: number | ((prev: number) => number)) => {
    setState(prev => ({
      ...prev,
      cubAffection: typeof value === 'function' ? value(prev.cubAffection) : value,
    }));
  }, []);

  const addEmail = useCallback((email: Omit<Email, 'id' | 'timestamp' | 'read'>) => {
    const newEmail: Email = {
      ...email,
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    setState(prev => ({
      ...prev,
      emails: [newEmail, ...prev.emails],
    }));
  }, []);

  const markEmailRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      emails: prev.emails.map(e => e.id === id ? { ...e, read: true } : e),
    }));
  }, []);

  const addMessage = useCallback((message: Omit<DirectMessage, 'id' | 'timestamp' | 'read'>) => {
    const newMessage: DirectMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    setState(prev => ({
      ...prev,
      messages: [newMessage, ...prev.messages],
    }));
  }, []);

  const markMessageRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => m.id === id ? { ...m, read: true } : m),
    }));
  }, []);

  const unlockPerk = useCallback((perkId: string) => {
    setState(prev => ({
      ...prev,
      character: {
        ...prev.character,
        unlockedPerks: prev.character.unlockedPerks.includes(perkId) 
          ? prev.character.unlockedPerks 
          : [...prev.character.unlockedPerks, perkId],
      },
    }));
  }, []);

  const setResonanceState = useCallback((resonanceState: 'stable' | 'unstable' | 'critical') => {
    setState(prev => ({
      ...prev,
      character: { ...prev.character, resonanceState },
    }));
  }, []);

  const unreadEmailCount = state.emails.filter(e => !e.read).length;
  const unreadMessageCount = state.messages.filter(m => !m.read).length;

  const value: GameStateContextType = {
    character: state.character,
    emails: state.emails,
    messages: state.messages,
    cubAffection: state.cubAffection,
    unreadEmailCount,
    unreadMessageCount,
    updateCharacter,
    addExperience,
    setCubAffection,
    addEmail,
    markEmailRead,
    addMessage,
    markMessageRead,
    unlockPerk,
    setResonanceState,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState(): GameStateContextType {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}

export { GameStateContext };
