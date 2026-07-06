import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { monoFont, monoFontBold } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";
import type { LogEntry } from "@/context/GameContext";

const PREFIX: Record<LogEntry["type"], string> = {
  system: ">>",
  location: "::",
  action: "->",
  npc: "??",
  error: "!!",
  quiz: "##",
};

export function TerminalLine({ entry }: { entry: LogEntry }) {
  const colors = useColors();
  const color =
    entry.type === "error"
      ? colors.destructive
      : entry.type === "system"
        ? colors.accent
        : entry.type === "quiz"
          ? colors.accent
          : colors.foreground;

  return (
    <View style={styles.row}>
      <Text style={[styles.prefix, { color }]}>{PREFIX[entry.type]}</Text>
      <Text style={[styles.text, { color, textShadowColor: color }]}>{entry.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: 10,
    gap: 8,
  },
  prefix: {
    ...monoFontBold,
    fontSize: 13,
  },
  text: {
    flex: 1,
    ...monoFont,
    fontSize: 13,
    lineHeight: 19,
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 0 },
  },
});
