/**
 * ═══════════════════════════════════════════════════════════
 *  THE ACADEMY — OFFLINE FALLBACK LAYER
 *
 *  Pure functions that wrap each online API call with its
 *  corresponding offline fallback. GameContext delegates here
 *  so the fallback wiring is testable without a React runtime.
 *
 *  Every function returns { text, source } so callers know
 *  whether content came from a live AI call or the bundled engine.
 * ═══════════════════════════════════════════════════════════
 */

import {
  fetchLocationDescription,
  fetchExamineDescription,
  fetchNpcDialogue,
  type DescribeLocationParams,
  type DescribeExamineParams,
  type NpcDialogueParams,
} from './api';

export type { ContentSource } from './enrichmentStatus';
import type { ContentSource } from './enrichmentStatus';

// ─────────────────────────────────────────────────────────────────
// Location description
// ─────────────────────────────────────────────────────────────────

export interface LocationDescriptionResult {
  text: string;
  source: ContentSource;
}

/**
 * Try to fetch an AI-generated location description.
 * Falls back to the bundled description when the network is
 * unavailable, the backend is unconfigured, or the request times out.
 */
export async function resolveLocationDescription(
  params: DescribeLocationParams,
  offlineFallback: string,
): Promise<LocationDescriptionResult> {
  try {
    const text = await fetchLocationDescription(params);
    return { text, source: 'online' };
  } catch {
    return { text: offlineFallback, source: 'offline' };
  }
}

// ─────────────────────────────────────────────────────────────────
// Examine description
// ─────────────────────────────────────────────────────────────────

export interface ExamineDescriptionResult {
  text: string;
  source: ContentSource;
}

/**
 * Try to fetch an AI-generated examine description.
 * Falls back to the bundled interactable description on any failure.
 */
export async function resolveExamineDescription(
  params: DescribeExamineParams,
  offlineFallback: string,
): Promise<ExamineDescriptionResult> {
  try {
    const text = await fetchExamineDescription(params);
    return { text, source: 'online' };
  } catch {
    return { text: offlineFallback, source: 'offline' };
  }
}

// ─────────────────────────────────────────────────────────────────
// NPC dialogue reply
// ─────────────────────────────────────────────────────────────────

export interface NpcReplyResult {
  text: string;
  source: ContentSource;
}

/**
 * Try to fetch an AI-generated NPC reply.
 * Falls back to a deterministically-generated offline line on any failure.
 * The fallback is a thunk so the (cheap) offline generation only runs
 * when the online path has already failed.
 */
export async function resolveNpcReply(
  params: NpcDialogueParams,
  offlineFallback: () => string,
): Promise<NpcReplyResult> {
  try {
    const text = await fetchNpcDialogue(params);
    return { text, source: 'online' };
  } catch {
    return { text: offlineFallback(), source: 'offline' };
  }
}
