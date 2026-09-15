import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { monoFontBold } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";
import type { EnrichmentStatus } from "@/lib/enrichmentStatus";

export function StatusBadge({
  isOnline,
  enrichmentStatus,
}: {
  isOnline: boolean;
  enrichmentStatus?: EnrichmentStatus;
}) {
  const colors = useColors();
  const status = enrichmentStatus ?? (isOnline ? "live" : "offline");
  const statusCopy = {
    checking: "CHECKING API",
    live: "LIVE AI",
    offline: "LOCAL MODE",
    fallback: "LOCAL FALLBACK",
  } satisfies Record<EnrichmentStatus, string>;
  const color =
    status === "live"
      ? colors.primary
      : status === "checking"
        ? colors.mutedForeground
        : colors.accent;
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Content mode: ${statusCopy[status]}`}
      style={[styles.container, { borderColor: color }]}
    >
      <View style={[styles.dot, { backgroundColor: color, shadowColor: color }]} />
      <Text style={[styles.label, { color }]}>{statusCopy[status]}</Text>
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
