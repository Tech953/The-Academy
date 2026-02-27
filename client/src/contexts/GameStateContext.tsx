import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
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
  isFromPlayer?: boolean;
  conversationId?: string;
}

export interface Conversation {
  id: string;
  participantName: string;
  participantTitle?: string;
  messages: DirectMessage[];
  lastActivity: Date;
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
  conversations: Conversation[];
  cubAffection: number;
  unreadEmailCount: number;
  unreadMessageCount: number;
  enrolledCourses: string[];
  isEnrolled: boolean;
  isGameActive: boolean;
  updateCharacter: (updates: Partial<GameCharacter>) => void;
  addExperience: (amount: number) => void;
  setCubAffection: (value: number | ((prev: number) => number)) => void;
  addEmail: (email: Omit<Email, 'id' | 'timestamp' | 'read'>) => void;
  markEmailRead: (id: string) => void;
  addMessage: (message: Omit<DirectMessage, 'id' | 'timestamp' | 'read'>) => void;
  markMessageRead: (id: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  getConversation: (participantName: string) => Conversation | undefined;
  unlockPerk: (perkId: string) => void;
  setResonanceState: (state: 'stable' | 'unstable' | 'critical') => void;
  addEnrolledCourse: (courseId: string) => void;
  setIsGameActive: (active: boolean) => void;
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

function loadGameState(): { character: GameCharacter; emails: Email[]; messages: DirectMessage[]; cubAffection: number; enrolledCourses: string[] } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        character: { ...getDefaultCharacter(), ...parsed.character },
        emails: (parsed.emails || getDefaultEmails()).map((e: Email) => ({ ...e, timestamp: new Date(e.timestamp) })),
        messages: (parsed.messages || getDefaultMessages()).map((m: DirectMessage) => ({ ...m, timestamp: new Date(m.timestamp) })),
        cubAffection: parsed.cubAffection ?? 50,
        enrolledCourses: parsed.enrolledCourses ?? [],
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
    enrolledCourses: [],
  };
}

function saveGameState(state: { character: GameCharacter; emails: Email[]; messages: DirectMessage[]; cubAffection: number; enrolledCourses: string[] }): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save game state:', e);
  }
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => loadGameState());
  const [isGameActive, setIsGameActive] = useState(false);

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

  const addEnrolledCourse = useCallback((courseId: string) => {
    setState(prev => ({
      ...prev,
      enrolledCourses: prev.enrolledCourses.includes(courseId)
        ? prev.enrolledCourses
        : [...prev.enrolledCourses, courseId],
    }));
  }, []);

  const addEmail = useCallback((email: Omit<Email, 'id' | 'timestamp' | 'read'>) => {
    const newEmail: Email = {
      ...email,
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    setState(prev => {
      if (prev.enrolledCourses.length === 0) return prev;
      return {
        ...prev,
        emails: [newEmail, ...prev.emails],
      };
    });
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
    setState(prev => {
      if (prev.enrolledCourses.length === 0) return prev;
      return {
        ...prev,
        messages: [newMessage, ...prev.messages],
      };
    });
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

  const getFallbackNpcResponse = (participantName: string): string => {
    const responses: Record<string, string[]> = {
      'Cub': [
        "That's a great question! I'll look into it for you.",
        "I'm here to help! Let me know what else you need.",
        "Interesting! I'll keep that in mind.",
        "Thanks for sharing! I'm always learning.",
        "You're doing great! Keep up the good work.",
      ],
      'Professor Chen': [
        "An insightful question. I recommend reviewing Chapter 3 of your mathematics textbook.",
        "Excellent curiosity! Mathematical thinking requires practice and patience.",
        "Please see me during office hours to discuss this further.",
        "I appreciate your dedication to learning. Keep asking questions.",
        "Remember, understanding the fundamentals is key to mastery.",
      ],
      'Alex Rivera': [
        "Yeah, I totally get that! This place takes some getting used to.",
        "Haha, nice! Let me know if you want to study together sometime.",
        "For real though, the cafeteria food is actually not bad on Thursdays.",
        "Oh cool! I'm heading to the library later if you want to come.",
        "That's what I thought too at first! You'll figure it out.",
      ],
    };
    const defaultResponses = [
      "Thank you for your message. I'll get back to you soon.",
      "Interesting point! Let me think about that.",
      "I appreciate you reaching out.",
      "That's good to know. Talk soon!",
    ];
    const pool = responses[participantName] || defaultResponses;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const getAiNpcResponse = async (
    participantName: string,
    participantTitle: string | undefined,
    playerMessage: string,
    conversationHistory: DirectMessage[]
  ): Promise<string> => {
    try {
      const response = await fetch('/api/npc-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcName: participantName,
          npcTitle: participantTitle,
          playerMessage,
          conversationHistory: conversationHistory.slice(-10).map(m => ({
            content: m.content,
            isFromPlayer: m.isFromPlayer
          }))
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        return data.fallback || getFallbackNpcResponse(participantName);
      }
      
      const data = await response.json();
      return data.response || getFallbackNpcResponse(participantName);
    } catch (error) {
      console.warn('AI NPC dialogue failed, using fallback:', error);
      return getFallbackNpcResponse(participantName);
    }
  };

  const sendMessage = useCallback((conversationId: string, content: string) => {
    if (!content.trim()) return;
    
    const existingMsg = state.messages.find(m => m.from === conversationId || m.id.includes(conversationId.toLowerCase()));
    const participantName = conversationId;
    const participantTitle = existingMsg?.fromTitle;
    
    const playerMessage: DirectMessage = {
      id: `msg-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from: state.character.name,
      fromTitle: 'You',
      content: content.trim(),
      timestamp: new Date(),
      read: true,
      isFromPlayer: true,
      conversationId: participantName,
    };

    setState(prev => ({
      ...prev,
      messages: [playerMessage, ...prev.messages],
    }));

    const relatedMessages = state.messages.filter(
      m => m.from === participantName || m.conversationId === participantName
    );
    
    setTimeout(async () => {
      const aiResponse = await getAiNpcResponse(participantName, participantTitle, content, relatedMessages);
      const npcResponse: DirectMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        from: participantName,
        fromTitle: participantTitle,
        content: aiResponse,
        timestamp: new Date(),
        read: false,
        conversationId: participantName,
      };
      setState(prev => ({
        ...prev,
        messages: [npcResponse, ...prev.messages],
      }));
    }, 1000 + Math.random() * 1500);
  }, [state.messages, state.character.name]);

  const getConversation = useCallback((participantName: string): Conversation | undefined => {
    const relatedMessages = state.messages.filter(
      m => m.from === participantName || m.conversationId === participantName
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    if (relatedMessages.length === 0) return undefined;
    
    const firstMsg = relatedMessages.find(m => m.from === participantName);
    return {
      id: participantName,
      participantName,
      participantTitle: firstMsg?.fromTitle,
      messages: relatedMessages,
      lastActivity: relatedMessages[relatedMessages.length - 1]?.timestamp || new Date(),
    };
  }, [state.messages]);

  const conversations: Conversation[] = useMemo(() => {
    const participantNames = new Set<string>();
    state.messages.forEach(m => {
      if (!m.isFromPlayer) {
        participantNames.add(m.from);
      }
    });
    return Array.from(participantNames).map(name => getConversation(name)!).filter(Boolean);
  }, [state.messages, getConversation]);

  const unreadEmailCount = state.emails.filter(e => !e.read).length;
  const unreadMessageCount = state.messages.filter(m => !m.read && !m.isFromPlayer).length;

  const isEnrolled = state.enrolledCourses.length > 0;

  const value: GameStateContextType = {
    character: state.character,
    emails: state.emails,
    messages: state.messages,
    conversations,
    cubAffection: state.cubAffection,
    unreadEmailCount: isEnrolled ? unreadEmailCount : 0,
    unreadMessageCount: isEnrolled ? unreadMessageCount : 0,
    enrolledCourses: state.enrolledCourses,
    isEnrolled,
    isGameActive,
    updateCharacter,
    addExperience,
    setCubAffection,
    addEmail,
    markEmailRead,
    addMessage,
    markMessageRead,
    sendMessage,
    getConversation,
    unlockPerk,
    setResonanceState,
    addEnrolledCourse,
    setIsGameActive,
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
