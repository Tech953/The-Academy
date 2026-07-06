import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { checkHealth, fetchContentPack } from "@/lib/api";
import { isPackFresh, type ContentPack } from "@/lib/contentPack";

const PACK_KEY = "academy-content-pack-v1";
const SYNCED_AT_KEY = "academy-last-synced-at-v1";

interface SyncState {
  isOnline: boolean | null;
  checking: boolean;
  syncing: boolean;
  contentPack: ContentPack | null;
  lastSyncedAt: number | null;
  lastError: string | null;
  refreshConnection: () => Promise<boolean>;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncState | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [contentPack, setContentPack] = useState<ContentPack | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [rawPack, rawSynced] = await Promise.all([
          AsyncStorage.getItem(PACK_KEY),
          AsyncStorage.getItem(SYNCED_AT_KEY),
        ]);
        if (rawPack) setContentPack(JSON.parse(rawPack) as ContentPack);
        if (rawSynced) setLastSyncedAt(Number(rawSynced));
      } catch {
        // Cache load failure is non-fatal — the app stays fully offline-capable.
      }
      void refreshConnection();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshConnection = useCallback(async () => {
    setChecking(true);
    const online = await checkHealth();
    setIsOnline(online);
    setChecking(false);
    return online;
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    setLastError(null);
    try {
      const online = await checkHealth();
      setIsOnline(online);
      if (!online) {
        setLastError("No connection to the Academy servers.");
        return;
      }
      const pack = await fetchContentPack();
      const now = Date.now();
      setContentPack(pack);
      setLastSyncedAt(now);
      await AsyncStorage.multiSet([
        [PACK_KEY, JSON.stringify(pack)],
        [SYNCED_AT_KEY, String(now)],
      ]);
    } catch (err) {
      setLastError(
        err instanceof Error ? err.message : "Sync failed unexpectedly.",
      );
    } finally {
      setSyncing(false);
    }
  }, []);

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        checking,
        syncing,
        contentPack,
        lastSyncedAt,
        lastError,
        refreshConnection,
        syncNow,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncState {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within a SyncProvider");
  return ctx;
}

export { isPackFresh };
