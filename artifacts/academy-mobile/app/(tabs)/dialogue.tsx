import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { FlatList, Platform, Pressable, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Badge,
  Header,
  Screen,
  Term,
  FONT_REGULAR,
} from "@/components/Retro";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { npcReply, type Source } from "@/lib/api";
import type { Archetype, EmotionState } from "@/lib/dialogueTemplates";

interface Npc {
  id: string;
  name: string;
  title: string;
  archetype: Archetype;
  emotionState: EmotionState;
}

const NPCS: Npc[] = [
  {
    id: "mara-vex",
    name: "Mara Vex",
    title: "Head Archivist",
    archetype: "mentor",
    emotionState: "focused",
  },
  {
    id: "cassius-thorne",
    name: "Cassius Thorne",
    title: "Senior Prefect",
    archetype: "leader",
    emotionState: "neutral",
  },
  {
    id: "odile-renn",
    name: "Odile Renn",
    title: "Night Student",
    archetype: "rebel",
    emotionState: "anxious",
  },
  {
    id: "brother-amos",
    name: "Brother Amos",
    title: "Groundskeeper",
    archetype: "nurturer",
    emotionState: "happy",
  },
];

interface Msg {
  id: string;
  role: "player" | "npc";
  text: string;
  source?: Source;
}

export default function DialogueScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { character } = useGame();

  const [npc, setNpc] = useState<Npc>(NPCS[0]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const counter = useRef(0);
  const activeNpcId = useRef(npc.id);

  const nextId = () => `${Date.now()}-${counter.current++}`;

  const pickNpc = (n: Npc) => {
    activeNpcId.current = n.id;
    setNpc(n);
    setMessages([]);
    setInput("");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    const sentForNpc = npc.id;
    const playerMsg: Msg = { id: nextId(), role: "player", text };
    const history = messages.map((m) => ({
      isFromPlayer: m.role === "player",
      content: m.text,
    }));
    setMessages((prev) => [...prev, playerMsg]);
    setInput("");
    setThinking(true);

    try {
      const res = await npcReply(text, {
        npcId: npc.id,
        npcName: npc.name,
        npcTitle: npc.title,
        archetype: npc.archetype,
        emotionState: npc.emotionState,
        relationshipTier: "acquaintance",
        playerName: character?.name ?? "Student",
        locationName: "the Academy",
        conversationHistory: history,
      });

      // Discard the reply if the user switched NPCs while it was in flight.
      if (activeNpcId.current !== sentForNpc) return;

      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "npc", text: res.data, source: res.source },
      ]);
    } finally {
      if (activeNpcId.current === sentForNpc) setThinking(false);
    }
  };

  const data = [...messages].reverse();

  const renderItem = ({ item }: { item: Msg }) => {
    const mine = item.role === "player";
    return (
      <View
        style={{
          alignItems: mine ? "flex-end" : "flex-start",
          marginBottom: 12,
        }}
      >
        <View
          style={{
            maxWidth: "85%",
            borderWidth: 1,
            borderColor: mine ? colors.accent : colors.border,
            borderRadius: colors.radius,
            backgroundColor: mine ? colors.secondary : colors.card,
            paddingHorizontal: 12,
            paddingVertical: 9,
          }}
        >
          {!mine ? (
            <Term bold size={11} color={colors.primary} style={{ marginBottom: 3 }}>
              {npc.name.toUpperCase()}
            </Term>
          ) : null}
          <Term size={14} color={mine ? colors.accent : colors.foreground}>
            {item.text}
          </Term>
        </View>
        {item.source ? (
          <View style={{ marginTop: 4 }}>
            <Badge
              label={item.source === "online" ? "AI" : "OFFLINE"}
              color={item.source === "online" ? colors.primary : colors.amber}
            />
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Screen>
      <Header title="DIALOGUE" subtitle={`${npc.title}`} />
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          padding: 16,
          paddingBottom: 8,
        }}
      >
        {NPCS.map((n) => {
          const on = n.id === npc.id;
          return (
            <Pressable
              key={n.id}
              onPress={() => pickNpc(n)}
              style={{
                borderColor: on ? colors.primary : colors.border,
                borderWidth: 1,
                borderRadius: colors.radius,
                paddingHorizontal: 10,
                paddingVertical: 7,
                backgroundColor: on ? colors.secondary : "transparent",
              }}
            >
              <Term
                size={12}
                bold={on}
                color={on ? colors.primary : colors.mutedForeground}
              >
                {n.name}
              </Term>
            </Pressable>
          );
        })}
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <FlatList
          data={data}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingTop: 12 }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          scrollEnabled={data.length > 0}
          ListFooterComponent={
            data.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 48, gap: 10 }}>
                <Feather
                  name="message-square"
                  size={28}
                  color={colors.mutedForeground}
                />
                <Term dim style={{ textAlign: "center" }}>
                  {`Speak with ${npc.name}. Online replies use the AI engine;\noffline replies are generated on-device.`}
                </Term>
              </View>
            ) : null
          }
          ListHeaderComponent={
            thinking ? (
              <View style={{ alignItems: "flex-start", marginBottom: 12 }}>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                  }}
                >
                  <Term dim size={13}>
                    {`${npc.name} is thinking…`}
                  </Term>
                </View>
              </View>
            ) : null
          }
        />

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom:
              Platform.OS === "web" ? 96 : Math.max(insets.bottom, 8) + 56,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            backgroundColor: colors.background,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="say something..."
            placeholderTextColor={colors.mutedForeground}
            style={{
              flex: 1,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: colors.radius,
              color: colors.foreground,
              fontFamily: FONT_REGULAR,
              fontSize: 14,
              paddingHorizontal: 12,
              paddingVertical: Platform.OS === "ios" ? 12 : 8,
              backgroundColor: colors.input,
            }}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            onPress={send}
            disabled={!input.trim() || thinking}
            style={({ pressed }) => ({
              borderColor: colors.primary,
              borderWidth: 1,
              borderRadius: colors.radius,
              backgroundColor: colors.primary,
              paddingHorizontal: 16,
              justifyContent: "center",
              opacity: !input.trim() || thinking ? 0.4 : pressed ? 0.6 : 1,
            })}
          >
            <Feather name="send" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
