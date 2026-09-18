import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CrtButton } from "@/components/CrtButton";
import { StatBar } from "@/components/StatBar";
import { StatusBadge } from "@/components/StatusBadge";
import {
  BULLETIN_LOCALE_OPTIONS,
  type SupportedLocale,
} from "@/constants/locales";
import { monoFont, monoFontBold } from "@/constants/fonts";
import { STAT_DEFS, useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

export default function StatsScreen() {
  const colors = useColors();
  const {
    isOnline,
    enrichmentStatus,
    playerName,
    day,
    week,
    xp,
    stats,
    inventory,
    visitedLocationIds,
    examinedIds,
    resetGame,
    bulletinLocale,
    bulletinLocalePreference,
    setBulletinLocalePreference,
  } =
    useGame();

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
        <StatusBadge
          isOnline={isOnline}
          enrichmentStatus={enrichmentStatus}
          locale={bulletinLocale}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { borderColor: colors.border }]}>
          <Text style={[styles.name, { color: colors.primary, textShadowColor: colors.primary }]}>
            {playerName || "Recruit"}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            WEEK {week} · DAY {day} · {xp} XP
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {visitedLocationIds.length} SECTORS EXPLORED · {examinedIds.length} OBJECTS EXAMINED
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

        <Text style={[styles.sectionTitle, { color: colors.accent }]}>BULLETIN LANGUAGE</Text>
        <View style={[styles.card, { borderColor: colors.border }]}>
          <Text style={[styles.languageHint, { color: colors.mutedForeground }]}>
            CURRENT: {BULLETIN_LOCALE_OPTIONS.find((option) => option.value === bulletinLocale)?.label ?? "English"}
          </Text>
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: bulletinLocalePreference === null }}
            onPress={() => setBulletinLocalePreference(null)}
            style={[
              styles.languageOption,
              bulletinLocalePreference === null && {
                borderColor: colors.accent,
                backgroundColor: colors.accent + "22",
              },
            ]}
          >
            <Text style={[styles.languageOptionText, { color: colors.foreground }]}>
              DEVICE DEFAULT
            </Text>
            <Text style={[styles.languageOptionDetail, { color: colors.mutedForeground }]}>
              Follow the device language
            </Text>
          </Pressable>
          {BULLETIN_LOCALE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: bulletinLocalePreference === option.value }}
              onPress={() => setBulletinLocalePreference(option.value as SupportedLocale)}
              style={[
                styles.languageOption,
                bulletinLocalePreference === option.value && {
                  borderColor: colors.accent,
                  backgroundColor: colors.accent + "22",
                },
              ]}
            >
              <Text style={[styles.languageOptionText, { color: colors.foreground }]}>
                {option.label}
              </Text>
              <Text style={[styles.languageOptionDetail, { color: colors.mutedForeground }]}>
                {option.value.toUpperCase()}
              </Text>
            </Pressable>
          ))}
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
  languageHint: {
    ...monoFont,
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  languageOption: {
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 5,
    gap: 3,
  },
  languageOptionText: {
    ...monoFontBold,
    fontSize: 12,
  },
  languageOptionDetail: {
    ...monoFont,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  itemRow: {
    paddingVertical: 10,
    gap: 3,
  },
  itemName: { ...monoFontBold, fontSize: 13 },
  itemDesc: { ...monoFont, fontSize: 11, lineHeight: 16 },
});
