import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useResonance } from '@/hooks/useResonance';
import { 
  resonanceEngine, 
  initializeAcademyResonanceWorld,
  createNode,
  Position3D
} from '@/lib/resonanceEngine';

interface ResonanceContextType {
  world: ReturnType<typeof useResonance>['world'];
  nodes: ReturnType<typeof useResonance>['nodes'];
  edges: ReturnType<typeof useResonance>['edges'];
  worldTime: number;
  tickCount: number;
  sacredZones: ReturnType<typeof useResonance>['sacredZones'];
  crystallizedPatterns: ReturnType<typeof useResonance>['crystallizedPatterns'];
  emitAction: ReturnType<typeof useResonance>['emitAction'];
  observe: ReturnType<typeof useResonance>['observe'];
  getProbabilities: ReturnType<typeof useResonance>['getProbabilities'];
  addPendingOutcome: ReturnType<typeof useResonance>['addPendingOutcome'];
  invest: ReturnType<typeof useResonance>['invest'];
  divineIntervention: ReturnType<typeof useResonance>['divineIntervention'];
}

const ResonanceContext = createContext<ResonanceContextType | null>(null);

const STORAGE_KEY = 'academy_resonance_state';

interface ResonanceProviderProps {
  children: ReactNode;
  tickInterval?: number;
}

export function ResonanceProvider({ children, tickInterval = 5000 }: ResonanceProviderProps) {
  const resonance = useResonance();
  const initialized = useRef(false);
  
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        resonance.deserialize(saved);
      } catch (e) {
        console.error('Failed to load resonance state, initializing fresh:', e);
        initializeAcademyResonanceWorld();
      }
    } else {
      initializeAcademyResonanceWorld();
    }
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      resonance.tick(1);
      
      try {
        localStorage.setItem(STORAGE_KEY, resonance.serialize());
      } catch (e) {
        console.error('Failed to save resonance state:', e);
      }
    }, tickInterval);
    
    return () => clearInterval(interval);
  }, [tickInterval, resonance]);
  
  const contextValue: ResonanceContextType = {
    world: resonance.world,
    nodes: resonance.nodes,
    edges: resonance.edges,
    worldTime: resonance.worldTime,
    tickCount: resonance.tickCount,
    sacredZones: resonance.sacredZones,
    crystallizedPatterns: resonance.crystallizedPatterns,
    emitAction: resonance.emitAction,
    observe: resonance.observe,
    getProbabilities: resonance.getProbabilities,
    addPendingOutcome: resonance.addPendingOutcome,
    invest: resonance.invest,
    divineIntervention: resonance.divineIntervention
  };
  
  return (
    <ResonanceContext.Provider value={contextValue}>
      {children}
    </ResonanceContext.Provider>
  );
}

export function useResonanceContext() {
  const context = useContext(ResonanceContext);
  if (!context) {
    throw new Error('useResonanceContext must be used within a ResonanceProvider');
  }
  return context;
}

export function registerNPCWithResonance(
  npcId: string,
  npcName: string,
  position?: Position3D
) {
  const existingNode = resonanceEngine.getNode(npcId);
  if (!existingNode) {
    const node = createNode(npcId, 'npc', npcName, position || [0, 0, 0]);
    resonanceEngine.addNode(node);
  }
}

export function registerPlayerWithResonance(
  playerId: string,
  playerName: string,
  position?: Position3D
) {
  const existingNode = resonanceEngine.getNode(playerId);
  if (!existingNode) {
    const node = createNode(playerId, 'player', playerName, position || [0, 0, 0]);
    node.forceType = 'amplifying';
    resonanceEngine.addNode(node);
  }
}

export function updateNodePosition(nodeId: string, position: Position3D) {
  const node = resonanceEngine.getNode(nodeId);
  if (node) {
    node.position = position;
    resonanceEngine.addNode(node);
  }
}
