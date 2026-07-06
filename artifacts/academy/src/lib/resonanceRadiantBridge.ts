// Bridge between Radiant AI System and Resonance Engine
// This module connects NPC behaviors to resonance field effects

import { radiantAI, NPCEntity, WorldEvent } from './radiantAI';
import { 
  resonanceEngine, 
  createNode,
  EnergyVector,
  Position3D,
  ACTION_EMISSIONS
} from './resonanceEngine';

// Location to position mapping for geometric space
const LOCATION_POSITIONS: Record<string, Position3D> = {
  'main_hall': [0, 0, 0],
  'library': [10, 0, 5],
  'gymnasium': [-10, 0, 5],
  'dormitory': [0, 0, 15],
  'cafeteria': [5, 0, 10],
  'headmaster_office': [0, 5, 0],
  'science_lab': [15, 0, 0],
  'art_studio': [-15, 0, 0],
  'meditation_garden': [0, 0, -10],
  'underground': [0, -10, 0],
  'classroom_a': [8, 0, 3],
  'classroom_b': [-8, 0, 3],
  'courtyard': [0, 0, 5]
};

export function getLocationPosition(location: string): Position3D {
  const key = location.toLowerCase().replace(/\s+/g, '_');
  return LOCATION_POSITIONS[key] || [0, 0, 0];
}

export function syncNPCToResonance(npc: NPCEntity): void {
  let node = resonanceEngine.getNode(npc.id);
  
  if (!node) {
    const position = getLocationPosition(npc.currentLocation);
    node = createNode(npc.id, 'npc', npc.name, position);
    
    // Set NPC skills based on stats
    node.skills = {
      excellence: Math.min(100, npc.stats.intelligence * 10 + npc.stats.discipline * 10),
      efficacy: Math.min(100, npc.stats.athleticism * 10 + npc.stats.charisma * 10),
      perception: Math.min(100, npc.stats.creativity * 10 + npc.personality.openness * 10)
    };
    
    // Set force type based on role and personality
    const role = npc.role.toLowerCase();
    if (role.includes('headmaster') || role.includes('professor') || role.includes('teacher')) {
      node.forceType = 'amplifying';
    } else if (npc.personality.neuroticism > 7) {
      node.forceType = 'fracturing';
    } else if (npc.personality.conscientiousness > 7) {
      node.forceType = 'inertial';
    } else if (npc.personality.agreeableness > 7) {
      node.forceType = 'dampening';
    } else {
      node.forceType = 'inertial';
    }
    
    // Set inertia based on discipline and neuroticism
    node.inertia = Math.min(0.9, Math.max(0.1, 
      (npc.stats.discipline * 0.05 + (10 - npc.personality.neuroticism) * 0.05)
    ));
    
    resonanceEngine.addNode(node);
  } else {
    // Update position based on current location
    const position = getLocationPosition(npc.currentLocation);
    node.position = position;
    resonanceEngine.addNode(node);
  }
}

export function syncAllNPCsToResonance(): void {
  const allNpcs = radiantAI.getAllNPCs();
  for (const npc of allNpcs) {
    syncNPCToResonance(npc);
  }
}

export function npcActionToResonance(
  npcId: string,
  action: string,
  targetNpcId?: string
): void {
  const actionLower = action.toLowerCase();
  
  // Map NPC activities to resonance actions
  let resonanceAction = 'observe';
  
  if (actionLower.includes('teach') || actionLower.includes('lecture')) {
    resonanceAction = 'teach';
  } else if (actionLower.includes('study') || actionLower.includes('read')) {
    resonanceAction = 'study';
  } else if (actionLower.includes('meditat')) {
    resonanceAction = 'meditate';
  } else if (actionLower.includes('help') || actionLower.includes('assist')) {
    resonanceAction = 'help';
  } else if (actionLower.includes('create') || actionLower.includes('art') || actionLower.includes('paint')) {
    resonanceAction = 'create';
  } else if (actionLower.includes('pray') || actionLower.includes('worship')) {
    resonanceAction = 'pray';
  } else if (actionLower.includes('talk') || actionLower.includes('chat') || actionLower.includes('convers')) {
    resonanceAction = 'speak';
  } else if (actionLower.includes('question') || actionLower.includes('ask')) {
    resonanceAction = 'question';
  } else if (actionLower.includes('train') || actionLower.includes('exercise')) {
    resonanceAction = 'challenge';
  } else if (actionLower.includes('ritual')) {
    resonanceAction = 'ritual';
  }
  
  resonanceEngine.emitAction(npcId, resonanceAction, targetNpcId);
}

export function worldEventToResonance(event: WorldEvent): void {
  // Generate energy based on event type
  let energy: EnergyVector = {};
  
  switch (event.type) {
    case 'exam':
      energy = { force: 0.5, clarity: 0.6, order: 0.4, instability: 0.3 };
      break;
    case 'competition':
      energy = { force: 0.7, chaos: 0.3, growth: 0.4 };
      break;
    case 'accident':
      energy = { chaos: 0.8, fear: 0.6, entropy: 0.5 };
      break;
    case 'announcement':
      energy = { clarity: 0.5, order: 0.4 };
      break;
    case 'social':
      energy = { connection: 0.6, harmony: 0.4, growth: 0.3 };
      break;
    case 'crisis':
      energy = { chaos: 0.9, fear: 0.7, instability: 0.8, entropy: 0.6 };
      break;
  }
  
  // Propagate to affected NPCs
  for (const npcId of event.affectedNPCs) {
    const node = resonanceEngine.getNode(npcId);
    if (node) {
      resonanceEngine.emitAction('world_event', 'observe', npcId, energy);
    }
  }
  
  // Propagate to affected locations (auto-create if needed)
  for (const location of event.affectedLocations) {
    const locationId = location.toLowerCase().replace(/\s+/g, '_');
    ensureLocationNode(locationId, location);
    resonanceEngine.emitAction('world_event', 'observe', locationId, energy);
  }
}

function ensureLocationNode(locationId: string, locationName: string): void {
  const existing = resonanceEngine.getNode(locationId);
  if (!existing) {
    const position = getLocationPosition(locationId);
    const node = createNode(locationId, 'location', locationName, position);
    node.forceType = 'inertial';
    resonanceEngine.addNode(node);
  }
}

export function npcRelationshipToResonanceEdge(
  npcId: string,
  targetId: string,
  relationship: { affinity: number; trust: number; respect: number }
): void {
  resonanceEngine.addEdge(npcId, targetId, {
    trust: relationship.trust,
    alignment: relationship.respect,
    emotional: relationship.affinity,
    history: (relationship.affinity + relationship.trust) / 2,
    fear: Math.max(0, -relationship.trust),
    physical: 1
  });
}

export function syncNPCRelationshipsToResonance(): void {
  const allNpcs = radiantAI.getAllNPCs();
  
  for (const npc of allNpcs) {
    for (const rel of npc.relationships) {
      npcRelationshipToResonanceEdge(npc.id, rel.targetId, {
        affinity: rel.affinity,
        trust: rel.trust,
        respect: rel.respect
      });
    }
  }
}

export function createQuantumDecision(
  npcId: string,
  decisionId: string,
  options: Record<string, number>
): void {
  resonanceEngine.addPendingOutcome(npcId, decisionId, options);
}

export function resolveQuantumDecision(
  npcId: string,
  decisionId: string
): string | null {
  return resonanceEngine.observe(npcId, decisionId);
}

export function initializeBridge(): void {
  // Sync all NPCs to resonance
  syncAllNPCsToResonance();
  
  // Sync relationships
  syncNPCRelationshipsToResonance();
  
  // Subscribe to Radiant AI events
  radiantAI.subscribe((npcs) => {
    for (const [id, npc] of Array.from(npcs.entries())) {
      syncNPCToResonance(npc);
    }
  });
  
  console.log('Resonance-Radiant AI Bridge initialized');
}

export function getResonanceFieldStrength(npcId: string): number {
  const node = resonanceEngine.getNode(npcId);
  if (!node) return 0;
  
  return Object.values(node.field.values).reduce(
    (sum, val) => sum + Math.abs(val), 
    0
  );
}

export function getResonanceHarmonyScore(npcId: string): number {
  const node = resonanceEngine.getNode(npcId);
  if (!node) return 0;
  
  const harmonious = (node.field.values.harmony || 0) +
    (node.field.values.connection || 0) +
    (node.field.values.coherence || 0) +
    (node.field.values.stillness || 0);
  
  const disruptive = (node.field.values.chaos || 0) +
    (node.field.values.entropy || 0) +
    (node.field.values.fear || 0) +
    (node.field.values.distortion || 0);
  
  return harmonious - disruptive;
}
