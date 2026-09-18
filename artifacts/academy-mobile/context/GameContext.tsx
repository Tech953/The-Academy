import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Linking } from "react-native";

import type {
  ContentPack,
  EmotionState,
  RelationshipTier,
} from "@workspace/game-engine";
import { LOCATIONS, NPCS, STARTING_LOCATION, type LocationId } from "@workspace/game-engine";
import {
  fetchContentPack,
  hasApiConfig,
} from "@/lib/api";
import {
  resolveLocationDescription,
  resolveExamineDescription,
  resolveNpcReply,
  type ContentSource,
} from "@/lib/gameFallbacks";
import {
  getEnrichmentStatusForSource,
  getInitialEnrichmentStatus,
  type EnrichmentStatus,
} from "@/lib/enrichmentStatus";
import {
  fallbackAfterRefreshFailure,
  createContentPackWriteQueueWithResult,
  getContentPackStorageStatus,
  readCachedContentPack,
  retainVisibleContentPack,
  resolveContentPackRefresh,
  type ContentPackStorageStatus,
} from "@/lib/contentPackFallback";
import {
  analyzeDialogueTone,
  dayToWeek,
  focusSubjectKey,
  generateNPCLine,
  generateOfflineContentPack,
  generateOfflineConversation,
  generateQuizSet,
  hasSupportedFocusSubjects,
  scoreToRelationshipTier,
  type GEDSubjectKey,
  type StudyQuestion,
} from "@workspace/game-engine";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { computeRelationshipShift, type RelationshipShift } from "@/lib/relationshipShift";
import { selectWeeklyTheme } from "@/lib/themeSelection";
import {
  ANDROID_LANE_ENABLED,
  applyAndroidLaneStorageCommand,
  getAndroidLaneCommand,
} from "@/lib/androidLane";
import {
  BULLETIN_LOCALE_STORAGE_KEY,
  getDeviceLocale,
  parseStoredBulletinLocale,
  type SupportedLocale,
} from "@/constants/locales";

export type { RelationshipShift };
export { selectWeeklyTheme };

const STORAGE_KEY = "academy-mobile-state-v1";

/**
 * Never let an unrecognized server label disappear from Study silently. The
 * shared content-pack validator normally catches this earlier; this guard also
 * protects state restored by older clients or direct test fixtures.
 */
export function resolveStudyContentPack(
  pack: ContentPack | null,
  day: number,
): ContentPack | null {
  if (!pack || hasSupportedFocusSubjects(pack.gedFocusAreas)) return pack;
  return generateOfflineContentPack(day);
}

export type StatKey =
  | "quickness"
  | "strength"
  | "mathLogic"
  | "presence"
  | "luck"
  | "resonance";

export const STAT_DEFS: { key: StatKey; label: string; abbr: string }[] = [
  { key: "quickness", label: "Quickness", abbr: "QCK" },
  { key: "strength", label: "Strength", abbr: "STR" },
  { key: "mathLogic", label: "Math/Logic", abbr: "MTH" },
  { key: "presence", label: "Presence", abbr: "PRS" },
  { key: "luck", label: "Luck", abbr: "LCK" },
  { key: "resonance", label: "Resonance", abbr: "RES" },
];

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
}

export interface LogEntry {
  id: string;
  type: "system" | "location" | "action" | "npc" | "error" | "quiz";
  text: string;
  timestamp: number;
}

export interface DialogueMessage {
  role: "player" | "npc";
  text: string;
  timestamp: number;
}

export interface RelationshipState {
  score: number;
  tier: RelationshipTier;
  emotion: EmotionState;
}

export interface StudyProgress {
  answered: number;
  correct: number;
}

interface PersistedState {
  playerName: string;
  hasStarted: boolean;
  currentLocationId: LocationId;
  visitedLocationIds: LocationId[];
  examinedIds: string[];
  inventory: InventoryItem[];
  stats: Record<StatKey, number>;
  xp: number;
  day: number;
  relationships: Record<string, RelationshipState>;
  dialogueHistory: Record<string, DialogueMessage[]>;
  studyProgress: Record<GEDSubjectKey, StudyProgress>;
  log: LogEntry[];
}

const DEFAULT_STATS: Record<StatKey, number> = {
  quickness: 10,
  strength: 10,
  mathLogic: 10,
  presence: 10,
  luck: 10,
  resonance: 10,
};

const DEFAULT_STUDY_PROGRESS: Record<GEDSubjectKey, StudyProgress> = {
  math: { answered: 0, correct: 0 },
  language_arts: { answered: 0, correct: 0 },
  science: { answered: 0, correct: 0 },
  social_studies: { answered: 0, correct: 0 },
};

function defaultState(): PersistedState {
  return {
    playerName: "",
    hasStarted: false,
    currentLocationId: STARTING_LOCATION,
    visitedLocationIds: [STARTING_LOCATION],
    examinedIds: [],
    inventory: [
      {
        id: "student_handbook",
        name: "Student Handbook",
        description:
          "Dog-eared and coffee-stained. Somewhere in here are the actual rules of the Academy.",
      },
    ],
    stats: { ...DEFAULT_STATS },
    xp: 0,
    day: 1,
    relationships: {},
    dialogueHistory: {},
    studyProgress: { ...DEFAULT_STUDY_PROGRESS },
    log: [
      {
        id: "boot",
        type: "system",
        text: "TERMINAL LINKED. Welcome to The Academy campus network.",
        timestamp: Date.now(),
      },
    ],
  };
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function getRelationship(
  relationships: Record<string, RelationshipState>,
  npcId: string,
): RelationshipState {
  return relationships[npcId] ?? { score: 0, tier: "stranger", emotion: "neutral" };
}

interface GameContextValue {
  ready: boolean;
  isOnline: boolean;
  playerName: string;
  hasStarted: boolean;
  currentLocationId: LocationId;
  visitedLocationIds: LocationId[];
  examinedIds: string[];
  inventory: InventoryItem[];
  stats: Record<StatKey, number>;
  xp: number;
  day: number;
  week: number;
  relationships: Record<string, RelationshipState>;
  relationshipShifts: Record<string, RelationshipShift>;
  dialogueHistory: Record<string, DialogueMessage[]>;
  studyProgress: Record<GEDSubjectKey, StudyProgress>;
  log: LogEntry[];
  locationLoading: boolean;
  examineLoading: string | null;
  dialogueLoading: boolean;
  contentPack: ContentPack | null;
  contentPackLoading: boolean;
  refreshContentPack: () => Promise<void>;
  bulletinEventsRepaired: boolean;
  contentPackStorageStatus: ContentPackStorageStatus;
  bulletinLocale: SupportedLocale;
  bulletinLocalePreference: SupportedLocale | null;
  setBulletinLocalePreference: (locale: SupportedLocale | null) => void;
  enrichmentStatus: EnrichmentStatus;
  weeklyTheme: string;
  startGame: (name: string) => void;
  advanceDay: () => Promise<void>;
  travelTo: (locationId: LocationId) => Promise<void>;
  refreshLocationDescription: () => Promise<void>;
  examine: (interactableId: string) => Promise<void>;
  sendDialogue: (npcId: string, message: string) => Promise<void>;
  resetNpcConversation: (npcId: string) => void;
  answerQuestion: (question: StudyQuestion, choice: string) => boolean;
  getQuizSet: (subject: GEDSubjectKey) => StudyQuestion[];
  resetGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const networkOnline = useNetworkStatus();
  // The device can report a live connection while the app still has no
  // backend to talk to (e.g. an EAS-built APK with no EXPO_PUBLIC_DOMAIN
  // baked in). Only claim "online" when both are true, so the UI badge and
  // the offline-fallback logic agree on what's actually reachable.
  const apiConfigured = hasApiConfig();
  const isOnline = networkOnline && apiConfigured;
  const [state, setState] = useState<PersistedState>(defaultState);
  const [ready, setReady] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [examineLoading, setExamineLoading] = useState<string | null>(null);
  const [dialogueLoading, setDialogueLoading] = useState(false);
  // Transient, in-memory only: the last relationship change per NPC, so the
  // chat UI can flash a "warmer / cooler" indicator after a reply.
  const [relationshipShifts, setRelationshipShifts] = useState<Record<string, RelationshipShift>>({});
  const [contentPack, setContentPack] = useState<ContentPack | null>(null);
  const [contentPackLoading, setContentPackLoading] = useState(false);
  const [contentPackStorageStatus, setContentPackStorageStatus] =
    useState<ContentPackStorageStatus>("unknown");
  const [bulletinLocalePreference, setBulletinLocalePreferenceState] =
    useState<SupportedLocale | null>(null);
  const bulletinEventsRepaired = contentPack?.eventsRepaired === true;
  const contentPackRequestRef = useRef(0);
  const writeContentPack = useRef(
    createContentPackWriteQueueWithResult(AsyncStorage),
  ).current;
  const [enrichmentStatus, setEnrichmentStatus] = useState<EnrichmentStatus>(() =>
    getInitialEnrichmentStatus(networkOnline, apiConfigured),
  );
  const hasEnrichedLocation = useRef<Set<LocationId>>(new Set());
  const weeklyTheme = useMemo(
    () => selectWeeklyTheme(contentPack, state.day),
    [contentPack, state.day],
  );
  const bulletinLocale = bulletinLocalePreference ?? getDeviceLocale();

  useEffect(() => {
    setEnrichmentStatus(
      getInitialEnrichmentStatus(networkOnline, apiConfigured),
    );
  }, [apiConfigured, networkOnline]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PersistedState;
          setState({ ...defaultState(), ...parsed });
        }
      } catch {
        // Corrupt or missing storage — fall back to a fresh game.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ANDROID_LANE_ENABLED) return;

    let active = true;
    const handleUrl = async (url: string) => {
      if (!active) return;
      const command = getAndroidLaneCommand(url);
      if (command === "seed") {
        setState((previous) =>
          previous.hasStarted ? previous : { ...previous, hasStarted: true },
        );
        return;
      }
      if (command !== "corrupt" && command !== "expired") return;
      await applyAndroidLaneStorageCommand(
        AsyncStorage,
        command,
        state.day,
      );
    };

    void Linking.getInitialURL()
      .then((url) => {
        if (url) void handleUrl(url);
      })
      .catch(() => {});
    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleUrl(url);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [state.day]);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(BULLETIN_LOCALE_STORAGE_KEY)
      .then((raw) => {
        if (active) {
          setBulletinLocalePreferenceState(parseStoredBulletinLocale(raw));
        }
      })
      .catch(() => {
        // Missing or corrupt preference — use the device locale.
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const appendLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    setState((prev) => ({
      ...prev,
      log: [...prev.log, { ...entry, id: nextId("log"), timestamp: Date.now() }].slice(-200),
    }));
  }, []);

  const recordEnrichmentSource = useCallback((source: ContentSource) => {
    setEnrichmentStatus(getEnrichmentStatusForSource(source));
  }, []);

  const recordOfflineContent = useCallback(() => {
    setEnrichmentStatus(isOnline ? "fallback" : "offline");
  }, [isOnline]);

  const setBulletinLocalePreference = useCallback(
    (locale: SupportedLocale | null) => {
      setBulletinLocalePreferenceState(locale);
      const write = locale
        ? AsyncStorage.setItem(BULLETIN_LOCALE_STORAGE_KEY, locale)
        : AsyncStorage.removeItem(BULLETIN_LOCALE_STORAGE_KEY);
      write.catch(() => {});
    },
    [],
  );

  const startGame = useCallback((name: string) => {
    const trimmed = name.trim() || "Recruit";
    setState((prev) => ({
      ...prev,
      playerName: trimmed,
      hasStarted: true,
      log: [
        ...prev.log,
        {
          id: nextId("log"),
          type: "system",
          text: `Enrollment confirmed. Welcome to the Academy, ${trimmed}.`,
          timestamp: Date.now(),
        },
      ],
    }));
  }, []);

  const runLocationEnrichment = useCallback(
    async (locationId: LocationId) => {
      const location = LOCATIONS[locationId];
      const npcNames = location.npcIds.map((id) => NPCS[id]?.name).filter(Boolean) as string[];
      setLocationLoading(true);
      try {
        const result = isOnline
          ? await resolveLocationDescription(
              {
                locationName: location.name,
                locationDescription: location.description,
                npcsPresent: npcNames,
                interactables: location.interactables.map((i) => i.label),
              },
              location.description,
            )
          : { text: location.description, source: "offline" as const };
        if (isOnline) {
          recordEnrichmentSource(result.source);
        } else {
          recordOfflineContent();
        }
        appendLog({ type: "location", text: result.text });
      } finally {
        setLocationLoading(false);
      }
    },
    [appendLog, isOnline, recordEnrichmentSource, recordOfflineContent],
  );

  const travelTo = useCallback(
    async (locationId: LocationId) => {
      const location = LOCATIONS[locationId];
      setState((prev) => ({
        ...prev,
        currentLocationId: locationId,
        visitedLocationIds: prev.visitedLocationIds.includes(locationId)
          ? prev.visitedLocationIds
          : [...prev.visitedLocationIds, locationId],
      }));
      appendLog({ type: "action", text: `You head to ${location.name}.` });
      await runLocationEnrichment(locationId);
    },
    [appendLog, runLocationEnrichment],
  );

  const refreshLocationDescription = useCallback(async () => {
    await runLocationEnrichment(state.currentLocationId);
  }, [runLocationEnrichment, state.currentLocationId]);

  const advanceDay = useCallback(async () => {
    const targetLocation = state.currentLocationId;
    setState((prev) => {
      const nextDay = prev.day + 1;
      const crossedWeek = dayToWeek(nextDay) > dayToWeek(prev.day);
      return {
        ...prev,
        day: nextDay,
        log: [
          ...prev.log,
          {
            id: nextId("log"),
            type: "system" as const,
            text: crossedWeek
              ? `You rest. A new week begins — Week ${dayToWeek(nextDay)}, Day ${nextDay}. The campus bulletin refreshes.`
              : `You rest. Day ${nextDay} at the Academy begins.`,
            timestamp: Date.now(),
          },
        ].slice(-200) as LogEntry[],
      };
    });
    // Let the current location re-narrate for the new day so the world feels
    // like it advanced, and allow every location to re-enrich on next visit.
    hasEnrichedLocation.current.clear();
    hasEnrichedLocation.current.add(targetLocation);
    await runLocationEnrichment(targetLocation);
  }, [runLocationEnrichment, state.currentLocationId]);

  useEffect(() => {
    if (!ready || !state.hasStarted) return;
    if (hasEnrichedLocation.current.has(state.currentLocationId)) return;
    hasEnrichedLocation.current.add(state.currentLocationId);
    runLocationEnrichment(state.currentLocationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, state.hasStarted]);

  const refreshContentPack = useCallback(async () => {
    if (!state.hasStarted) return;

    const requestId = ++contentPackRequestRef.current;
    const isCurrentRequest = () =>
      contentPackRequestRef.current === requestId;
    setContentPackLoading(true);
    setEnrichmentStatus(isOnline ? "checking" : "offline");

    let cachedPack: ContentPack | null = null;
    try {
      cachedPack = await readCachedContentPack(AsyncStorage);
      if (!isCurrentRequest()) return;
      setContentPack((visiblePack) =>
        resolveStudyContentPack(
          retainVisibleContentPack(visiblePack, cachedPack),
          state.day,
        ),
      );

      const refreshResult = isOnline
        ? await resolveContentPackRefresh(fetchContentPack, cachedPack, state.day)
        : {
            pack: fallbackAfterRefreshFailure(cachedPack, state.day),
            source: "offline" as const,
          };
      if (!isCurrentRequest()) return;
      const studyPack = resolveStudyContentPack(refreshResult.pack, state.day);
      if (studyPack !== refreshResult.pack || refreshResult.source === "offline") {
        recordOfflineContent();
      } else if (refreshResult.source === "online") {
        recordEnrichmentSource("online");
      } else if (refreshResult.source === "rate_limited") {
        recordEnrichmentSource("rate_limited");
      } else {
        recordOfflineContent();
      }
      setContentPack(studyPack);
      const writeResult = await writeContentPack(
        studyPack!,
        isCurrentRequest,
      );
      if (!isCurrentRequest()) return;
      setContentPackStorageStatus(getContentPackStorageStatus(writeResult));
    } catch {
      if (!isCurrentRequest()) return;
      recordOfflineContent();
      setContentPack(
        resolveStudyContentPack(
          fallbackAfterRefreshFailure(cachedPack, state.day),
          state.day,
        ),
      );
    } finally {
      if (isCurrentRequest()) setContentPackLoading(false);
    }
  }, [
    isOnline,
    recordEnrichmentSource,
    recordOfflineContent,
    state.day,
    state.hasStarted,
    writeContentPack,
  ]);

  useEffect(() => {
    if (!ready || !state.hasStarted) return;
    void refreshContentPack();
    return () => {
      contentPackRequestRef.current += 1;
    };
  }, [ready, refreshContentPack, state.hasStarted]);

  const examine = useCallback(
    async (interactableId: string) => {
      const location = LOCATIONS[state.currentLocationId];
      const target = location.interactables.find((i) => i.id === interactableId);
      if (!target) return;
      const examinedKey = `${location.id}:${interactableId}`;
      setExamineLoading(interactableId);
      try {
        const result = isOnline
          ? await resolveExamineDescription(
              {
                target: target.label,
                locationName: location.name,
                locationDescription: location.description,
              },
              target.description,
            )
          : { text: target.description, source: "offline" as const };
        if (isOnline) {
          recordEnrichmentSource(result.source);
        } else {
          recordOfflineContent();
        }
        appendLog({ type: "action", text: `You examine the ${target.label}. ${result.text}` });
      } finally {
        setExamineLoading(null);
        setState((prev) => {
          if (prev.examinedIds.includes(examinedKey)) return prev;
          const gained = 2;
          return {
            ...prev,
            examinedIds: [...prev.examinedIds, examinedKey],
            xp: prev.xp + gained,
          };
        });
      }
    },
    [
      appendLog,
      isOnline,
      recordEnrichmentSource,
      recordOfflineContent,
      state.currentLocationId,
    ],
  );

  const sendDialogue = useCallback(
    async (npcId: string, message: string) => {
      const npc = NPCS[npcId];
      if (!npc || !message.trim()) return;
      const location = LOCATIONS[npc.locationId];
      const relationship = getRelationship(state.relationships, npcId);
      const history = state.dialogueHistory[npcId] ?? [];
      // Read the player's tone so the relationship can rise AND fall, and so
      // the NPC's mood shifts to match how they were spoken to.
      const tone = analyzeDialogueTone(message);
      const reactedEmotion = tone.emotion === "neutral" ? relationship.emotion : tone.emotion;

      const applyRelationship = (prev: PersistedState): Record<string, RelationshipState> => {
        const prevScore = getRelationship(prev.relationships, npcId).score;
        const nextScore = Math.max(0, Math.min(100, prevScore + tone.delta));
        return {
          ...prev.relationships,
          [npcId]: {
            score: nextScore,
            tier: scoreToRelationshipTier(nextScore),
            emotion: reactedEmotion,
          },
        };
      };

      const playerMsg: DialogueMessage = { role: "player", text: message.trim(), timestamp: Date.now() };
      setState((prev) => ({
        ...prev,
        dialogueHistory: {
          ...prev.dialogueHistory,
          [npcId]: [...(prev.dialogueHistory[npcId] ?? []), playerMsg],
        },
      }));

      setDialogueLoading(true);
      try {
        const replyResult = isOnline
          ? await resolveNpcReply(
              {
                npcName: npc.name,
                npcTitle: npc.title,
                npcRole: npc.title,
                npcFaction: npc.faction,
                npcBackstory: npc.backstory,
                playerMessage: message.trim(),
                playerName: state.playerName || "Recruit",
                locationName: location.name,
                conversationHistory: history.map((m) => ({
                  isFromPlayer: m.role === "player",
                  content: m.text,
                })),
              },
              () =>
                generateNPCLine({
                  npcId,
                  npcName: npc.name,
                  archetype: npc.archetype,
                  emotionState: reactedEmotion,
                  lineType: "response",
                  playerName: state.playerName || "you",
                  weeklyTheme,
                  dayOffset: state.day - 1,
                }),
            )
          : {
              text: generateNPCLine({
                npcId,
                npcName: npc.name,
                archetype: npc.archetype,
                emotionState: reactedEmotion,
                lineType: "response",
                playerName: state.playerName || "you",
                weeklyTheme,
                dayOffset: state.day - 1,
              }),
              source: "offline" as const,
            };
        if (isOnline) {
          recordEnrichmentSource(replyResult.source);
        } else {
          recordOfflineContent();
        }
        const replyText = replyResult.text;
        const reply: DialogueMessage = { role: "npc", text: replyText, timestamp: Date.now() };
        setState((prev) => ({
          ...prev,
          dialogueHistory: {
            ...prev.dialogueHistory,
            [npcId]: [...(prev.dialogueHistory[npcId] ?? []), reply],
          },
          relationships: applyRelationship(prev),
        }));
        // Record the shift from the pre-send snapshot so the UI can surface it.
        const shift = computeRelationshipShift(relationship.score, tone.delta);
        if (shift) {
          setRelationshipShifts((prevShifts) => ({ ...prevShifts, [npcId]: shift }));
        }
      } finally {
        setDialogueLoading(false);
      }
    },
    [
      isOnline,
      recordEnrichmentSource,
      recordOfflineContent,
      state.relationships,
      state.dialogueHistory,
      state.playerName,
      state.day,
      weeklyTheme,
    ],
  );

  const resetNpcConversation = useCallback((npcId: string) => {
    setState((prev) => {
      const npc = NPCS[npcId];
      const relationship = getRelationship(prev.relationships, npcId);
      const opening = generateOfflineConversation({
        npcId,
        npcName: npc.name,
        archetype: npc.archetype,
        emotionState: relationship.emotion,
        relationshipTier: relationship.tier,
        playerName: prev.playerName || "stranger",
        location: LOCATIONS[npc.locationId].name,
        faction: npc.faction ?? "unaffiliated",
        weeklyTheme,
        dayOffset: prev.day - 1,
      });
      return {
        ...prev,
        dialogueHistory: {
          ...prev.dialogueHistory,
          [npcId]: [
            { role: "npc", text: opening.lines[0].text, timestamp: Date.now() },
          ],
        },
      };
    });
  }, [weeklyTheme]);

  const getQuizSet = useCallback(
    (subject: GEDSubjectKey): StudyQuestion[] => {
      const seed = `mobile-${subject}-day${state.day}-${state.studyProgress[subject].answered}`;
      const focusTopics = (contentPack ?? generateOfflineContentPack(state.day)).gedFocusAreas
        .filter(focus => focusSubjectKey(focus.subject) === subject)
        .map(focus => focus.topic);
      return generateQuizSet(subject, seed, 5, focusTopics).questions;
    },
    [contentPack?.gedFocusAreas, state.day, state.studyProgress],
  );

  const answerQuestion = useCallback((question: StudyQuestion, choice: string): boolean => {
    const isCorrect = choice.trim().toLowerCase() === question.answer.trim().toLowerCase();
    setState((prev) => {
      const prevProgress = prev.studyProgress[question.subject];
      const statBoost: Record<GEDSubjectKey, StatKey> = {
        math: "mathLogic",
        language_arts: "presence",
        science: "mathLogic",
        social_studies: "presence",
      };
      const boostedStat = statBoost[question.subject];
      return {
        ...prev,
        xp: prev.xp + (isCorrect ? 10 : 2),
        stats: isCorrect
          ? { ...prev.stats, [boostedStat]: prev.stats[boostedStat] + 1 }
          : prev.stats,
        studyProgress: {
          ...prev.studyProgress,
          [question.subject]: {
            answered: prevProgress.answered + 1,
            correct: prevProgress.correct + (isCorrect ? 1 : 0),
          },
        },
        log: [
          ...prev.log,
          {
            id: nextId("log"),
            type: "quiz" as const,
            text: isCorrect
              ? `Correct! ${question.explanation}`
              : `Not quite. ${question.explanation}`,
            timestamp: Date.now(),
          },
        ].slice(-200) as LogEntry[],
      };
    });
    return isCorrect;
  }, []);

  const resetGame = useCallback(() => {
    hasEnrichedLocation.current.clear();
    setState(defaultState());
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      ready,
      isOnline,
      playerName: state.playerName,
      hasStarted: state.hasStarted,
      currentLocationId: state.currentLocationId,
      visitedLocationIds: state.visitedLocationIds,
      examinedIds: state.examinedIds,
      inventory: state.inventory,
      stats: state.stats,
      xp: state.xp,
      day: state.day,
      week: dayToWeek(state.day),
      relationships: state.relationships,
      relationshipShifts,
      dialogueHistory: state.dialogueHistory,
      studyProgress: state.studyProgress,
      log: state.log,
      locationLoading,
      examineLoading,
      dialogueLoading,
      contentPack,
      contentPackLoading,
      refreshContentPack,
      bulletinEventsRepaired,
      contentPackStorageStatus,
      bulletinLocale,
      bulletinLocalePreference,
      setBulletinLocalePreference,
      enrichmentStatus,
      weeklyTheme,
      startGame,
      advanceDay,
      travelTo,
      refreshLocationDescription,
      examine,
      sendDialogue,
      resetNpcConversation,
      answerQuestion,
      getQuizSet,
      resetGame,
    }),
    [
      ready,
      isOnline,
      state,
      relationshipShifts,
      locationLoading,
      examineLoading,
      dialogueLoading,
      contentPack,
      contentPackLoading,
      refreshContentPack,
      bulletinEventsRepaired,
      contentPackStorageStatus,
      bulletinLocale,
      bulletinLocalePreference,
      setBulletinLocalePreference,
      enrichmentStatus,
      weeklyTheme,
      startGame,
      advanceDay,
      travelTo,
      refreshLocationDescription,
      examine,
      sendDialogue,
      resetNpcConversation,
      answerQuestion,
      getQuizSet,
      resetGame,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
