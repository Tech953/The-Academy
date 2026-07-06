import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { monoFont, monoFontBold } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

export function StatBar({
  label,
  abbr,
  value,
  max = 20,
}: {
  label: string;
  abbr: string;
  value: number;
  max?: number;
}) {
  const colors = useColors();
  const pct = Math.min(100, Math.round((value / max) * 100));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {abbr} · {label}
        </Text>
        <Text style={[styles.value, { color: colors.accent }]}>{value}</Text>
      </View>
      <View style={[styles.track, { borderColor: colors.mutedForeground }]}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%`, backgroundColor: colors.primary, shadowColor: colors.primary },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    ...monoFont,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  value: {
    ...monoFontBold,
    fontSize: 12,
  },
  track: {
    height: 8,
    borderWidth: 1,
    justifyContent: "center",
  },
  fill: {
    height: "100%",
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 1,
  },
});
