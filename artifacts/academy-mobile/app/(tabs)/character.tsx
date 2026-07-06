import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";

import {
  Badge,
  Header,
  Panel,
  Prompt,
  Screen,
  Term,
  TermButton,
  FONT_REGULAR,
} from "@/components/Retro";
import { useGame, type Character } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import type { Archetype } from "@/lib/dialogueTemplates";

const ARCHETYPES: { key: Archetype; blurb: string }[] = [
  { key: "scholar", blurb: "Lives for the next hard problem." },
  { key: "rebel", blurb: "Questions every rule twice." },
  { key: "leader", blurb: "Others look to you first." },
  { key: "nurturer", blurb: "You keep the group whole." },
  { key: "perfectionist", blurb: "Good enough never is." },
  { key: "socialite", blurb: "You know everyone worth knowing." },
  { key: "loner", blurb: "You work best in the quiet." },
  { key: "optimist", blurb: "You bet on tomorrow." },
  { key: "cynic", blurb: "You expect the catch." },
  { key: "mentor", blurb: "You teach as you learn." },
];

const FACTIONS = [
  "The Archive",
  "The Vanguard",
  "The Hearth",
  "The Undercroft",
  "Unaffiliated",
];

const PERKS = [
  "Quick Study",
  "Night Owl",
  "Iron Focus",
  "Silver Tongue",
  "Curious Mind",
  "Steady Hands",
];

export default function CharacterScreen() {
  const colors = useColors();
  const { ready, character, stats, saveCharacter } = useGame();
  const [editing, setEditing] = useState(false);

  if (!ready) {
    return (
      <Screen>
        <Header title="CHARACTER" />
      </Screen>
    );
  }

  if (character && !editing) {
    const accuracy =
      stats.questionsAnswered > 0
        ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
        : 0;
    return (
      <Screen>
        <Header title="CHARACTER" subtitle="Student record" />
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
        >
          <Panel style={{ gap: 6 }}>
            <Term bold glow size={22} color={colors.primary}>
              {character.name}
            </Term>
            <Term dim size={12}>
              {`${character.archetype.toUpperCase()} · ${character.faction}`}
            </Term>
          </Panel>

          <View>
            <Prompt label="Starter traits" />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {character.perks.length === 0 ? (
                <Term dim size={12}>
                  None selected.
                </Term>
              ) : (
                character.perks.map((p) => (
                  <Badge key={p} label={p} color={colors.accent} />
                ))
              )}
            </View>
          </View>

          <View>
            <Prompt label="Study log" />
            <Panel style={{ gap: 12 }}>
              <StatRow label="Quizzes taken" value={String(stats.quizzesTaken)} />
              <StatRow
                label="Questions answered"
                value={String(stats.questionsAnswered)}
              />
              <StatRow
                label="Correct answers"
                value={String(stats.correctAnswers)}
              />
              <StatRow label="Accuracy" value={`${accuracy}%`} />
              <StatRow
                label="Best single quiz"
                value={String(stats.bestStreak)}
              />
            </Panel>
          </View>

          <TermButton
            label="Re-enroll"
            variant="ghost"
            onPress={() => setEditing(true)}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <CreationForm
      colors={colors}
      initial={character}
      onCancel={character ? () => setEditing(false) : undefined}
      onSave={async (c) => {
        await saveCharacter(c);
        setEditing(false);
      }}
    />
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Term dim size={13}>
        {label}
      </Term>
      <Term bold size={13} color={colors.foreground}>
        {value}
      </Term>
    </View>
  );
}

function CreationForm({
  colors,
  initial,
  onSave,
  onCancel,
}: {
  colors: ReturnType<typeof useColors>;
  initial: Character | null;
  onSave: (c: Character) => Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [archetype, setArchetype] = useState<Archetype | null>(
    initial?.archetype ?? null,
  );
  const [faction, setFaction] = useState<string | null>(
    initial?.faction ?? null,
  );
  const [perks, setPerks] = useState<string[]>(initial?.perks ?? []);

  const togglePerk = (p: string) => {
    setPerks((prev) =>
      prev.includes(p)
        ? prev.filter((x) => x !== p)
        : prev.length >= 3
          ? prev
          : [...prev, p],
    );
  };

  const canSave = name.trim().length > 0 && archetype && faction;

  return (
    <Screen>
      <Header title="ENROLL" subtitle="Create your student" />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Prompt label="Name" />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="enter student name..."
            placeholderTextColor={colors.mutedForeground}
            style={{
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: colors.radius,
              color: colors.foreground,
              fontFamily: FONT_REGULAR,
              fontSize: 15,
              paddingHorizontal: 12,
              paddingVertical: Platform.OS === "ios" ? 12 : 8,
              backgroundColor: colors.input,
            }}
          />
        </View>

        <View>
          <Prompt label="Archetype" />
          <View style={{ gap: 8 }}>
            {ARCHETYPES.map((a) => {
              const on = a.key === archetype;
              return (
                <Pressable
                  key={a.key}
                  onPress={() => setArchetype(a.key)}
                  style={{
                    borderColor: on ? colors.primary : colors.border,
                    borderWidth: 1,
                    borderRadius: colors.radius,
                    padding: 12,
                    backgroundColor: on ? colors.secondary : "transparent",
                  }}
                >
                  <Term
                    bold
                    size={13}
                    color={on ? colors.primary : colors.foreground}
                  >
                    {a.key.toUpperCase()}
                  </Term>
                  <Term dim size={12} style={{ marginTop: 2 }}>
                    {a.blurb}
                  </Term>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Prompt label="Faction" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {FACTIONS.map((f) => {
              const on = f === faction;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFaction(f)}
                  style={{
                    borderColor: on ? colors.primary : colors.border,
                    borderWidth: 1,
                    borderRadius: colors.radius,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: on ? colors.secondary : "transparent",
                  }}
                >
                  <Term
                    size={12}
                    bold={on}
                    color={on ? colors.primary : colors.mutedForeground}
                  >
                    {f}
                  </Term>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Prompt label="Starter traits (up to 3)" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {PERKS.map((p) => {
              const on = perks.includes(p);
              return (
                <Pressable
                  key={p}
                  onPress={() => togglePerk(p)}
                  style={{
                    borderColor: on ? colors.accent : colors.border,
                    borderWidth: 1,
                    borderRadius: colors.radius,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: on ? colors.secondary : "transparent",
                  }}
                >
                  <Term
                    size={12}
                    bold={on}
                    color={on ? colors.accent : colors.mutedForeground}
                  >
                    {p}
                  </Term>
                </Pressable>
              );
            })}
          </View>
        </View>

        <TermButton
          label={initial ? "Save changes" : "Begin"}
          disabled={!canSave}
          testID="save-character"
          onPress={() => {
            if (!canSave || !archetype || !faction) return;
            void onSave({
              name: name.trim(),
              archetype,
              faction,
              perks,
              createdAt: initial?.createdAt ?? Date.now(),
            });
          }}
        />
        {onCancel ? (
          <TermButton label="Cancel" variant="ghost" onPress={onCancel} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
