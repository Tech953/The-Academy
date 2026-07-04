import { useState, useEffect, useCallback } from 'react';
import { 
  resonanceEngine, 
  ResonanceWorld,
  ResonanceNode,
  Position3D,
  EnergyVector,
  createNode,
  NodeType
} from '@/lib/resonanceEngine';

export function useResonance() {
  const [world, setWorld] = useState<ResonanceWorld>(resonanceEngine.getWorld());
  
  useEffect(() => {
    const unsubscribe = resonanceEngine.subscribe(setWorld);
    return unsubscribe;
  }, []);
  
  const addNode = useCallback((
    id: string,
    type: NodeType,
    name: string,
    position?: Position3D
  ) => {
    const node = createNode(id, type, name, position);
    resonanceEngine.addNode(node);
  }, []);
  
  const emitAction = useCallback((
    sourceId: string,
    actionType: string,
    targetId?: string,
    customEnergy?: EnergyVector
  ) => {
    resonanceEngine.emitAction(sourceId, actionType, targetId, customEnergy);
  }, []);
  
  const tick = useCallback((deltaTime: number = 1) => {
    resonanceEngine.tick(deltaTime);
  }, []);
  
  const getNode = useCallback((id: string): ResonanceNode | undefined => {
    return resonanceEngine.getNode(id);
  }, []);
  
  const addPendingOutcome = useCallback((
    nodeId: string,
    stateId: string,
    possibilities: Record<string, number>
  ) => {
    resonanceEngine.addPendingOutcome(nodeId, stateId, possibilities);
  }, []);
  
  const observe = useCallback((nodeId: string, stateId: string): string | null => {
    return resonanceEngine.observe(nodeId, stateId);
  }, []);
  
  const getProbabilities = useCallback((
    nodeId: string,
    stateId: string
  ): Record<string, number> | null => {
    return resonanceEngine.getProbabilities(nodeId, stateId);
  }, []);
  
  const invest = useCallback((
    nodeId: string,
    type: 'development' | 'maintenance',
    amount: number
  ) => {
    resonanceEngine.invest(nodeId, type, amount);
  }, []);
  
  const divineIntervention = useCallback((
    nodeId: string,
    energyType: string,
    magnitude: number
  ) => {
    resonanceEngine.divineIntervention(nodeId, energyType as any, magnitude);
  }, []);
  
  const serialize = useCallback(() => {
    return resonanceEngine.serialize();
  }, []);
  
  const deserialize = useCallback((data: string) => {
    resonanceEngine.deserialize(data);
  }, []);
  
  return {
    world,
    nodes: world.nodes,
    edges: world.edges,
    worldTime: world.worldTime,
    tickCount: world.tickCount,
    sacredZones: world.sacredZones,
    crystallizedPatterns: world.crystallizedPatterns,
    addNode,
    emitAction,
    tick,
    getNode,
    addPendingOutcome,
    observe,
    getProbabilities,
    invest,
    divineIntervention,
    serialize,
    deserialize
  };
}
