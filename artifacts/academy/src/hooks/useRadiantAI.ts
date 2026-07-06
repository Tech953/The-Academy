import { useState, useEffect, useCallback } from 'react';
import { 
  radiantAI, 
  NPCEntity, 
  NPCRelationship,
  WorldEvent,
  createWorldEvent,
  buildDialogueContext,
  getEmotionalState,
  ACADEMY_NPCS
} from '@/lib/radiantAI';
import type { NPC as GameNPC } from '@shared/schema';

export function useRadiantAI() {
  const [npcs, setNpcs] = useState<Map<string, NPCEntity>>(new Map());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      radiantAI.initialize(ACADEMY_NPCS);
      setInitialized(true);
    }

    const unsubscribe = radiantAI.subscribe((updatedNpcs) => {
      setNpcs(new Map(updatedNpcs));
    });

    return () => { unsubscribe(); };
  }, [initialized]);

  const getNPC = useCallback((id: string) => {
    return radiantAI.getNPC(id);
  }, []);

  const getNPCsAtLocation = useCallback((location: string) => {
    return radiantAI.getNPCsAtLocation(location);
  }, []);

  const getAllNPCs = useCallback(() => {
    return radiantAI.getAllNPCs();
  }, []);

  const processInteraction = useCallback((
    npcId: string, 
    interactionType: string, 
    outcome: 'positive' | 'negative' | 'neutral'
  ) => {
    radiantAI.processPlayerInteraction(npcId, interactionType, outcome);
  }, []);

  const tick = useCallback((gameHour: number, playerLocation: string | null) => {
    radiantAI.tick(gameHour, playerLocation);
  }, []);

  const addEvent = useCallback((event: WorldEvent) => {
    radiantAI.addWorldEvent(event);
  }, []);

  const getDialogueContext = useCallback((npcId: string, playerName: string, recentActions: string[]) => {
    const npc = radiantAI.getNPC(npcId);
    if (!npc) return null;
    return buildDialogueContext(npc, playerName, recentActions);
  }, []);

  const getRelationshipWithPlayer = useCallback((npcId: string): NPCRelationship | null => {
    const npc = radiantAI.getNPC(npcId);
    if (!npc) return null;
    return npc.relationships.find(r => r.targetId === 'player') || null;
  }, []);

  const getNPCMood = useCallback((npcId: string): string => {
    const npc = radiantAI.getNPC(npcId);
    if (!npc) return 'neutral';
    return getEmotionalState(npc.emotions);
  }, []);

  const bridgeGameNPC = useCallback((gameNPC: GameNPC): NPCEntity | null => {
    const radiantNPC = radiantAI.getNPC(gameNPC.id);
    if (radiantNPC) return radiantNPC;

    const personality = gameNPC.personality as any;
    const schedule = gameNPC.schedule as any;

    const npcEntity: NPCEntity = {
      id: gameNPC.id,
      name: gameNPC.name,
      role: gameNPC.title || 'Student',
      faction: gameNPC.faction || undefined,
      stats: {
        intelligence: 50,
        charisma: 50,
        athleticism: 50,
        creativity: 50,
        discipline: 50
      },
      personality: {
        openness: personality?.openness || 5,
        conscientiousness: personality?.conscientiousness || 5,
        extraversion: personality?.extraversion || 5,
        agreeableness: personality?.agreeableness || 5,
        neuroticism: personality?.neuroticism || 5
      },
      emotions: {
        happiness: 5,
        stress: 3,
        confidence: 5,
        trust: 5,
        curiosity: 5
      },
      memories: [],
      goals: [],
      relationships: [],
      schedule: schedule?.entries || [],
      scheduleOverrides: [],
      currentLocation: gameNPC.currentLocation || 'Unknown',
      currentActivity: 'Idle',
      lastUpdate: Date.now()
    };

    return npcEntity;
  }, []);

  const saveState = useCallback(() => {
    return radiantAI.serialize();
  }, []);

  const loadState = useCallback((data: string) => {
    radiantAI.deserialize(data);
  }, []);

  return {
    npcs,
    initialized,
    getNPC,
    getNPCsAtLocation,
    getAllNPCs,
    processInteraction,
    tick,
    addEvent,
    getDialogueContext,
    getRelationshipWithPlayer,
    getNPCMood,
    bridgeGameNPC,
    saveState,
    loadState,
    createWorldEvent
  };
}

export type UseRadiantAI = ReturnType<typeof useRadiantAI>;
