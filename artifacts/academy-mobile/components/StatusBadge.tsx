import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { monoFontBold } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

export function StatusBadge({ isOnline }: { isOnline: boolean }) {
  const colors = useColors();
  const color = isOnline ? colors.primary : colors.accent;
  return (
    <View style={[styles.container, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color, shadowColor: color }]} />
      <Text style={[styles.label, { color }]}>{isOnline ? "ONLINE" : "OFFLINE"}</Text>
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
