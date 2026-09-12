import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { StatusBadge } from "@/components/StatusBadge";
import { monoFont, monoFontBold } from "@/constants/fonts";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { NPCS, type NpcDef } from "@workspace/game-engine";
import { shouldShowShift } from "@/lib/relationshipShift";

function NpcListItem({
  npc,
  onPress,
  tier,
}: {
  npc: NpcDef;
  onPress: () => void;
  tier: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.npcRow,
        { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={styles.npcInfo}>
        <Text style={[styles.npcName, { color: colors.primary }]}>{npc.name}</Text>
        <Text style={[styles.npcTitle, { color: colors.mutedForeground }]}>{npc.title}</Text>
      </View>
      <View style={styles.npcRight}>
        <Text style={[styles.tierText, { color: colors.accent }]}>{tier.toUpperCase()}</Text>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

export default function NpcScreen() {
  const colors = useColors();
  const {
    isOnline,
    relationships,
    relationshipShifts,
    dialogueHistory,
    sendDialogue,
    resetNpcConversation,
    dialogueLoading,
  } = useGame();
  const [activeNpcId, setActiveNpcId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [visibleShiftAt, setVisibleShiftAt] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  // Timestamps of shifts already shown (or discarded), per NPC — a shift is
  // displayed at most once, so reopening a chat never replays an old banner.
  const seenShiftsRef = useRef<Record<string, number>>({});

  const activeShift = activeNpcId ? relationshipShifts[activeNpcId] : undefined;

  // Flash the shift indicator briefly when a NEW shift lands for the open chat.
  useEffect(() => {
    if (!activeNpcId || !shouldShowShift(activeShift, seenShiftsRef.current[activeNpcId])) return;
    const shift = activeShift!;
    seenShiftsRef.current[activeNpcId] = shift.timestamp;
    setVisibleShiftAt(shift.timestamp);
    const timer = setTimeout(() => {
      setVisibleShiftAt((current) => (current === shift.timestamp ? null : current));
    }, 3000);
    return () => clearTimeout(timer);
  }, [activeNpcId, activeShift]);

  const npcList = Object.values(NPCS);
  const activeNpc = activeNpcId ? NPCS[activeNpcId] : null;
  const history = activeNpcId ? dialogueHistory[activeNpcId] ?? [] : [];

  const openNpc = (id: string) => {
    // Discard any shift from a previous visit so it can never replay.
    const existing = relationshipShifts[id];
    if (existing) seenShiftsRef.current[id] = existing.timestamp;
    setActiveNpcId(id);
    setVisibleShiftAt(null);
    if (!dialogueHistory[id] || dialogueHistory[id].length === 0) {
      resetNpcConversation(id);
    }
  };

  const handleSend = () => {
    if (!activeNpcId || !draft.trim()) return;
    sendDialogue(activeNpcId, draft.trim());
    setDraft("");
  };

  if (!activeNpc) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.primary, textShadowColor: colors.primary }]}>
            CAMPUS DIRECTORY
          </Text>
          <StatusBadge isOnline={isOnline} />
        </View>
        <ScrollView contentContainerStyle={styles.listContent}>
          {npcList.map((npc) => (
            <NpcListItem
              key={npc.id}
              npc={npc}
              tier={relationships[npc.id]?.tier ?? "stranger"}
              onPress={() => openNpc(npc.id)}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={[styles.header, { borderColor: colors.border }]}>
        <Pressable onPress={() => setActiveNpcId(null)} style={styles.backRow}>
          <Feather name="chevron-left" size={18} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.primary, textShadowColor: colors.primary }]}>
            {activeNpc.name.toUpperCase()}
          </Text>
        </Pressable>
        <StatusBadge isOnline={isOnline} />
      </View>
      <Text style={[styles.npcTitleSub, { color: colors.mutedForeground }]}>
        {activeNpc.title} · {relationships[activeNpc.id]?.tier ?? "stranger"}
      </Text>
      {activeShift && visibleShiftAt === activeShift.timestamp ? (
        <View
          style={[
            styles.shiftBanner,
            { borderColor: activeShift.delta > 0 ? colors.primary : colors.destructive },
          ]}
        >
          <Feather
            name={activeShift.delta > 0 ? "trending-up" : "trending-down"}
            size={12}
            color={activeShift.delta > 0 ? colors.primary : colors.destructive}
          />
          <Text
            style={[
              styles.shiftText,
              { color: activeShift.delta > 0 ? colors.primary : colors.destructive },
            ]}
          >
            {activeShift.delta > 0 ? "+ warmer" : "- cooler"}
            {activeShift.fromTier !== activeShift.toTier
              ? ` · now ${activeShift.toTier.toUpperCase()}`
              : ""}
          </Text>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.chatLog}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {history.map((msg, idx) => (
          <View
            key={idx}
            style={[
              styles.bubble,
              msg.role === "player"
                ? { alignSelf: "flex-end", borderColor: colors.accent }
                : { alignSelf: "flex-start", borderColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                { color: msg.role === "player" ? colors.accent : colors.primary },
              ]}
            >
              {msg.text}
            </Text>
          </View>
        ))}
        {dialogueLoading ? (
          <Text style={[styles.pending, { color: colors.mutedForeground }]}>:: awaiting response...</Text>
        ) : null}
      </ScrollView>

      <View style={[styles.composer, { borderColor: colors.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Say something..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.mutedForeground }]}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim() || dialogueLoading}
          style={({ pressed }) => [
            styles.sendButton,
            { borderColor: colors.primary, opacity: !draft.trim() || pressed ? 0.5 : 1 },
          ]}
        >
          <Feather name="send" size={16} color={colors.primary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  backRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  listContent: { padding: 16, gap: 10 },
  npcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    padding: 12,
  },
  npcInfo: { gap: 2 },
  npcName: { ...monoFontBold, fontSize: 14 },
  npcTitle: { ...monoFont, fontSize: 11 },
  npcRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  tierText: { ...monoFont, fontSize: 10, letterSpacing: 0.5 },
  npcTitleSub: {
    ...monoFont,
    fontSize: 11,
    paddingHorizontal: 16,
    paddingTop: 8,
    letterSpacing: 0.5,
  },
  shiftBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shiftText: { ...monoFont, fontSize: 10, letterSpacing: 0.5 },
  chatLog: { flex: 1 },
  chatContent: { padding: 16, gap: 10 },
  bubble: {
    borderWidth: 1,
    padding: 10,
    maxWidth: "85%",
  },
  bubbleText: {
    ...monoFont,
    fontSize: 13,
    lineHeight: 18,
  },
  pending: { ...monoFont, fontSize: 12, fontStyle: "italic" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    borderTopWidth: 1,
    padding: 12,
  },
  input: {
    flex: 1,
    ...monoFont,
    fontSize: 13,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    borderWidth: 1,
    padding: 10,
  },
});
