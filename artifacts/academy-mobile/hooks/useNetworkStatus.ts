import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

/**
 * Tracks whether the device currently has a usable internet connection.
 * Defaults to `true` (online) until the first NetInfo event arrives, then
 * reflects live connectivity changes so the game can switch between the
 * live AI backend and the offline content engine seamlessly.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
    return () => unsubscribe();
  }, []);

  return isOnline;
}
