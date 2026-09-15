import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { CrtButton } from "@/components/CrtButton";
import { StatusBadge } from "@/components/StatusBadge";
import { TerminalLine } from "@/components/TerminalLine";
import { monoFont, monoFontBold } from "@/constants/fonts";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { LOCATIONS, NPCS } from "@workspace/game-engine";

function EnrollmentScreen() {
  const colors = useColors();
  const { startGame } = useGame();
  const [name, setName] = useState("");

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.enrollContainer}>
        <Text style={[styles.bootTitle, { color: colors.primary, textShadowColor: colors.primary }]}>
          THE ACADEMY
        </Text>
        <Text style={[styles.bootSubtitle, { color: colors.mutedForeground }]}>
          CAMPUS NETWORK TERMINAL — ENROLLMENT
        </Text>
        <View style={[styles.enrollBox, { borderColor: colors.primary }]}>
          <Text style={[styles.enrollLabel, { color: colors.foreground }]}>
            ENTER STUDENT NAME:
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Recruit"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.primary, borderColor: colors.mutedForeground }]}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={24}
          />
        </View>
        <CrtButton label="ENROLL AT THE ACADEMY" icon="log-in" onPress={() => startGame(name)} />
      </View>
    </KeyboardAvoidingView>
  );
}

export default function AdventureScreen() {
  const colors = useColors();
  const {
    ready,
    isOnline,
    enrichmentStatus,
    hasStarted,
    currentLocationId,
    day,
    week,
    log,
    locationLoading,
    examineLoading,
    contentPack,
    travelTo,
    refreshLocationDescription,
    examine,
    advanceDay,
  } = useGame();
  const scrollRef = useRef<ScrollView>(null);

  if (!ready) return null;
  if (!hasStarted) return <EnrollmentScreen />;

  const location = LOCATIONS[currentLocationId];
  const npcsHere = location.npcIds.map((id) => NPCS[id]).filter(Boolean);
  const headlineEvent = contentPack?.activeEvents[0];

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.locationName, { color: colors.primary, textShadowColor: colors.primary }]}>
            {location.name.toUpperCase()}
          </Text>
          <StatusBadge isOnline={isOnline} enrichmentStatus={enrichmentStatus} />
        </View>
        <Text style={[styles.locationType, { color: colors.mutedForeground }]}>
          SECTOR: {location.type.toUpperCase()} · WEEK {week} · DAY {day}
        </Text>
        {contentPack ? (
          <View style={[styles.bulletin, { borderColor: colors.accent }]}>
            <Text style={[styles.bulletinLabel, { color: colors.accent }]}>
              CAMPUS BULLETIN — {contentPack.weeklyTheme.toUpperCase()}
            </Text>
            {headlineEvent ? (
              <Text style={[styles.bulletinBody, { color: colors.mutedForeground }]} numberOfLines={2}>
                {headlineEvent.title}: {headlineEvent.description}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.log}
        contentContainerStyle={styles.logContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {log.map((entry) => (
          <TerminalLine key={entry.id} entry={entry} />
        ))}
        {locationLoading ? (
          <Text style={[styles.pending, { color: colors.mutedForeground }]}>
            :: receiving campus feed...
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.actions, { borderColor: colors.border }]}>
        {npcsHere.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.accent }]}>PRESENT</Text>
            <View style={styles.chipRow}>
              {npcsHere.map((npc) => (
                <View key={npc.id} style={[styles.chip, { borderColor: colors.accent }]}>
                  <Text style={[styles.chipText, { color: colors.accent }]}>{npc.name}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>EXAMINE</Text>
          <View style={styles.buttonRow}>
            {location.interactables.map((item) => (
              <CrtButton
                key={item.id}
                label={item.label}
                icon="search"
                variant="ghost"
                loading={examineLoading === item.id}
                onPress={() => examine(item.id)}
              />
            ))}
            <CrtButton
              label="RE-SCAN"
              icon="refresh-cw"
              variant="ghost"
              loading={locationLoading}
              onPress={refreshLocationDescription}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>EXITS</Text>
          <View style={styles.buttonRow}>
            {location.exits.map((exit) => (
              <CrtButton
                key={exit.id}
                label={exit.label}
                icon="arrow-right"
                onPress={() => travelTo(exit.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TIME</Text>
          <View style={styles.buttonRow}>
            <CrtButton
              label="REST — END DAY"
              icon="moon"
              variant="accent"
              loading={locationLoading}
              onPress={advanceDay}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  enrollContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 18,
  },
  bootTitle: {
    ...monoFontBold,
    fontSize: 30,
    letterSpacing: 3,
    textAlign: "center",
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  bootSubtitle: {
    ...monoFont,
    fontSize: 12,
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 12,
  },
  enrollBox: {
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  enrollLabel: {
    ...monoFont,
    fontSize: 12,
    letterSpacing: 1,
  },
  input: {
    ...monoFont,
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationName: {
    ...monoFontBold,
    fontSize: 17,
    letterSpacing: 1,
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  locationType: {
    ...monoFont,
    fontSize: 11,
    letterSpacing: 1,
  },
  bulletin: {
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 8,
    marginTop: 8,
    gap: 3,
  },
  bulletinLabel: {
    ...monoFontBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  bulletinBody: {
    ...monoFont,
    fontSize: 11,
  },
  log: { flex: 1 },
  logContent: { padding: 16 },
  pending: {
    ...monoFont,
    fontSize: 12,
    fontStyle: "italic",
  },
  actions: {
    borderTopWidth: 1,
    padding: 16,
    gap: 12,
  },
  section: { gap: 8 },
  sectionLabel: {
    ...monoFontBold,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    ...monoFont,
    fontSize: 12,
  },
});
