/**
 * ═══════════════════════════════════════════════════════════
 *  THE ACADEMY — useContentPack
 *  Fetches the weekly content pack from the server.
 *  Falls back to deterministic generation when offline.
 *  Caches in localStorage with weekly TTL.
 * ═══════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import type { ContentPack } from '@shared/contentPack';
import { CONTENT_PACK_STORAGE_KEY, CONTENT_PACK_ENDPOINT, isPackFresh } from '@shared/contentPack';
import { generateContentPack } from '@/lib/offlineContentEngine';

export interface UseContentPackResult {
  pack: ContentPack | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isOffline: boolean;
}

function readCachedPack(): ContentPack | null {
  try {
    const raw = localStorage.getItem(CONTENT_PACK_STORAGE_KEY);
    if (!raw) return null;
    const pack: ContentPack = JSON.parse(raw);
    return isPackFresh(pack) ? pack : null;
  } catch {
    return null;
  }
}

function writeCachedPack(pack: ContentPack): void {
  try {
    localStorage.setItem(CONTENT_PACK_STORAGE_KEY, JSON.stringify(pack));
  } catch {
    // localStorage full — ignore
  }
}

/** Convert deterministic offline pack to the server pack format */
function offlinePackToPack(dayNumber: number): ContentPack {
  const offlinePack = generateContentPack(dayNumber);
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  return {
    version: offlinePack.version,
    generatedAt: now,
    expiresAt: now + weekMs,
    worldSeed: offlinePack.worldSeed,
    weeklyTheme: 'The Academy stirs with its own rhythm this week.',
    themeContext: 'Without a network connection, the Academy generates its own story. The world is no less real for being self-contained.',
    activeEvents: offlinePack.activeEvents.map(ev => ({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      npcReaction: ev.activeNpcReaction,
      playerHook: ev.activePlayerHook,
      category: ev.template.category,
      durationDays: ev.template.duration === 'weeks' ? 7 : ev.template.duration === 'days' ? 3 : 1,
      tags: ev.template.tags,
    })),
    npcMoodShifts: Object.entries(offlinePack.npcMoodOverrides).map(([id, mood]) => ({
      npcId: id,
      npcName: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      emotionState: mood,
      reason: 'responding to the week\'s events',
    })),
    gedFocusAreas: offlinePack.featuredQuizSets.map(qs => ({
      subject: qs.subject,
      topic: qs.questions[0]?.topic ?? 'General Review',
      whyNow: 'Selected for offline study rotation.',
    })),
    generatedBy: 'deterministic',
  };
}

export function useContentPack(): UseContentPackResult {
  const [pack, setPack] = useState<ContentPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchPack = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1. Try localStorage cache first
    const cached = readCachedPack();
    if (cached) {
      setPack(cached);
      setLoading(false);
      return;
    }

    // 2. Try server
    try {
      const res = await fetch(CONTENT_PACK_ENDPOINT, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const serverPack: ContentPack = await res.json();
      writeCachedPack(serverPack);
      setPack(serverPack);
      setIsOffline(false);
    } catch {
      // 3. Offline fallback — deterministic generation
      setIsOffline(true);
      const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
      const fallback = offlinePackToPack(dayNumber);
      writeCachedPack(fallback);
      setPack(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPack();
  }, [fetchPack]);

  const refresh = useCallback(async () => {
    localStorage.removeItem(CONTENT_PACK_STORAGE_KEY);
    await fetchPack();
  }, [fetchPack]);

  return { pack, loading, error, refresh, isOffline };
}
