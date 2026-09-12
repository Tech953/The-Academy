import { scoreToRelationshipTier, type RelationshipTier } from "@workspace/game-engine";

/**
 * A single relationship change caused by one dialogue exchange. Kept in
 * memory only (never persisted) so it can drive a transient UI indicator.
 */
export interface RelationshipShift {
  delta: number;
  fromTier: RelationshipTier;
  toTier: RelationshipTier;
  timestamp: number;
}

/**
 * Compute the shift produced by applying a tone delta to a previous score,
 * using the same 0-100 clamping as the relationship update itself.
 * Returns null when the clamped change is a no-op (nothing to surface).
 */
export function computeRelationshipShift(
  prevScore: number,
  toneDelta: number,
  timestamp: number = Date.now(),
): RelationshipShift | null {
  const nextScore = Math.max(0, Math.min(100, prevScore + toneDelta));
  const actualDelta = nextScore - prevScore;
  if (actualDelta === 0) return null;
  return {
    delta: actualDelta,
    fromTier: scoreToRelationshipTier(prevScore),
    toTier: scoreToRelationshipTier(nextScore),
    timestamp,
  };
}

/**
 * A shift should only ever be displayed once. The UI records the timestamp
 * it has already shown per NPC; a shift is displayable only when it exists
 * and its timestamp has not been seen yet. Marking a shift seen (including
 * pre-existing shifts when a chat is opened) prevents any replay.
 */
export function shouldShowShift(
  shift: RelationshipShift | undefined,
  seenTimestamp: number | undefined,
): boolean {
  return !!shift && shift.timestamp !== seenTimestamp;
}
