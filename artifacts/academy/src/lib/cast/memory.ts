/**
 * Differential memory — Phase 7.4 (brief §6).
 *
 * Unification, read-side: the npcMemoryStore conversation log is the
 * SINGLE log per (student, NPC) pair. The radiant engine reads that
 * same log through `toRadiantMemories`, instead of keeping a separate
 * in-memory memory list per entity. The chat layer (7.3) already
 * writes this log; this module is the radiant side of the same store.
 *
 * Honesty rules for the mapping (brief §6, Aurora audit discipline):
 * - Memory observes and represents; it never claims causal privilege.
 *   The log records what was said, not why anyone acted.
 * - The mapping never infers feeling or salience: mapped entries carry
 *   neutral emotionalImpact (0), minimal importance (1), and zero
 *   decay, so the record itself is never decayed away by the radiant
 *   engine and no sentiment is fabricated from words alone.
 * - Relationship state is per-student and observational: session
 *   counts, exchange counts, topics, locations, first/last contact —
 *   all read from that student's log. No affinity is inferred here.
 *
 * Scope boundary: radiant-side writes (observations, events) remain
 * entity-local. This phase unifies the READ path and proves
 * per-student divergence; an observation write path is future work,
 * not smuggled in by relabeling observations as chat utterances.
 *
 * Companion change in npcMemoryStore (7.4, the one existing-file
 * touch): getOrCreateNPCLog documented that it bumps sessionCount on
 * a new session, but never saved the bump — so the count never
 * persisted past 1 and multi-session divergence was unobservable.
 * It now saves after bumping. Relationship state itself is read
 * through the store's existing getRelationshipReport.
 */
import { type NPCMemoryLog } from '../npcMemoryStore';
import type { MemoryEntry } from '../radiantAI';

/** Conversation log → radiant MemoryEntry view. Pure. */
export function toRadiantMemories(log: NPCMemoryLog): MemoryEntry[] {
  // Ids are projection-local (derived per read from log position), not
  // persistent identities: the conversation log itself is the record.
  return log.entries.map((entry, index) => ({
    id: `mem-${entry.timestamp}-${entry.isFromPlayer ? 'player' : 'npc'}-${index}`,
    timestamp: entry.timestamp,
    type: 'interaction',
    subject: entry.topic ?? log.npcName,
    description: entry.content,
    emotionalImpact: 0,
    importance: 1,
    decay: 0,
  }));
}
