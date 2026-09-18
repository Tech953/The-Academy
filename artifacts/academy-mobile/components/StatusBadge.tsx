import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { monoFontBold } from "@/constants/fonts";
import {
  getMobileCopy,
  type MobileCopyKey,
  type SupportedLocale,
} from "@/constants/locales";
import { useColors } from "@/hooks/useColors";
import type { EnrichmentStatus } from "@/lib/enrichmentStatus";

export function StatusBadge({
  isOnline,
  enrichmentStatus,
  locale,
}: {
  isOnline: boolean;
  enrichmentStatus?: EnrichmentStatus;
  locale?: SupportedLocale;
}) {
  const colors = useColors();
  const status = enrichmentStatus ?? (isOnline ? "live" : "offline");
  const statusCopyKey: Record<EnrichmentStatus, MobileCopyKey> = {
    checking: "statusCheckingApi",
    live: "statusLiveAi",
    offline: "statusLocalMode",
    fallback: "statusLocalFallback",
    rate_limited: "statusRetryLater",
  };
  const statusLabel = getMobileCopy(statusCopyKey[status], locale);
  const color =
    status === "live"
      ? colors.primary
      : status === "checking"
        ? colors.mutedForeground
        : colors.accent;
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${getMobileCopy("contentMode", locale)}: ${statusLabel}`}
      style={[styles.container, { borderColor: color }]}
    >
      <View style={[styles.dot, { backgroundColor: color, shadowColor: color }]} />
      <Text style={[styles.label, { color }]}>{statusLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    ...monoFontBold,
    fontSize: 11,
    letterSpacing: 1,
  },
});
