import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CrtButton } from "@/components/CrtButton";
import { StatBar } from "@/components/StatBar";
import { StatusBadge } from "@/components/StatusBadge";
import { monoFont, monoFontBold } from "@/constants/fonts";
import { STAT_DEFS, useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

export default function StatsScreen() {
  const colors = useColors();
  const { isOnline, playerName, day, xp, stats, inventory, visitedLocationIds, resetGame } = useGame();

  const confirmReset = () => {
    Alert.alert(
      "Withdraw from the Academy?",
      "This clears your progress, inventory, and relationships.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Withdraw", style: "destructive", onPress: resetGame },
      ],
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.primary, textShadowColor: colors.primary }]}>
          STUDENT FILE
        </Text>
        <StatusBadge isOnline={isOnline} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { borderColor: colors.border }]}>
          <Text style={[styles.name, { color: colors.primary, textShadowColor: colors.primary }]}>
            {playerName || "Recruit"}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            DAY {day} · {xp} XP · {visitedLocationIds.length} SECTORS EXPLORED
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.accent }]}>CORE STATS</Text>
        <View style={[styles.card, { borderColor: colors.border }]}>
          {STAT_DEFS.map((def) => (
            <StatBar key={def.key} label={def.label} abbr={def.abbr} value={stats[def.key]} />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.accent }]}>INVENTORY</Text>
        <View style={[styles.card, { borderColor: colors.border }]}>
          {inventory.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="package" size={20} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No items collected yet.
              </Text>
            </View>
          ) : (
            inventory.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  idx < inventory.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.mutedForeground },
                ]}
              >
                <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
              </View>
            ))
          )}
        </View>

        <CrtButton label="WITHDRAW & RESTART" icon="log-out" variant="accent" onPress={confirmReset} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    ...monoFontBold,
    fontSize: 16,
    letterSpacing: 1,
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  content: { padding: 16, gap: 16 },
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  name: {
    ...monoFontBold,
    fontSize: 20,
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  meta: {
    ...monoFont,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    ...monoFontBold,
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  emptyText: {
    ...monoFont,
    fontSize: 12,
  },
  itemRow: {
    paddingVertical: 10,
    gap: 3,
  },
  itemName: { ...monoFontBold, fontSize: 13 },
  itemDesc: { ...monoFont, fontSize: 11, lineHeight: 16 },
});
