import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";

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
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { describe, type Source } from "@/lib/api";

interface Loc {
  name: string;
  base: string;
  interactables: string[];
}

const LOCATIONS: Loc[] = [
  {
    name: "The Reading Room",
    base: "Rows of green-shaded lamps light long oak tables worn smooth by generations of students.",
    interactables: ["reference shelf", "card catalog", "study lamp"],
  },
  {
    name: "The Chalk Hall",
    base: "A cavernous lecture hall, its slate boards still crowded with half-finished equations.",
    interactables: ["chalkboard", "lectern", "attendance ledger"],
  },
  {
    name: "The Observatory",
    base: "A cramped dome at the top of the east tower, a brass telescope aimed at a fixed patch of sky.",
    interactables: ["telescope", "star charts", "logbook"],
  },
  {
    name: "The Commons",
    base: "A low-ceilinged room of mismatched armchairs where students trade rumors and cigarettes.",
    interactables: ["notice board", "coffee urn", "chess set"],
  },
  {
    name: "The Records Vault",
    base: "A cold basement of steel cabinets, every drawer labeled in a hand no one recognizes.",
    interactables: ["filing cabinet", "sealed box", "index cards"],
  },
];

export default function TerminalScreen() {
  const colors = useColors();
  const { character, currentLocation, setCurrentLocation } = useGame();

  const active =
    LOCATIONS.find((l) => l.name === currentLocation) ?? LOCATIONS[0];

  const [loading, setLoading] = useState(false);
  const [flavor, setFlavor] = useState<string | null>(null);
  const [flavorSource, setFlavorSource] = useState<Source | null>(null);

  const [target, setTarget] = useState("");
  const [examineLoading, setExamineLoading] = useState(false);
  const [examine, setExamine] = useState<string | null>(null);
  const [examineSource, setExamineSource] = useState<Source | null>(null);

  const selectLocation = (loc: Loc) => {
    setCurrentLocation(loc.name);
    setFlavor(null);
    setFlavorSource(null);
    setExamine(null);
    setExamineSource(null);
    setTarget("");
  };

  const scan = async () => {
    setLoading(true);
    try {
      const res = await describe("location", {
        locationName: active.name,
        locationDescription: active.base,
        interactables: active.interactables,
        characterClass: character?.archetype,
        characterFaction: character?.faction,
      });
      setFlavor(res.data);
      setFlavorSource(res.source);
    } finally {
      setLoading(false);
    }
  };

  const runExamine = async () => {
    if (!target.trim()) return;
    setExamineLoading(true);
    try {
      const res = await describe("examine", {
        locationName: active.name,
        locationDescription: active.base,
        target: target.trim(),
        characterClass: character?.archetype,
        characterFaction: character?.faction,
      });
      setExamine(res.data);
      setExamineSource(res.source);
    } finally {
      setExamineLoading(false);
    }
  };

  const srcBadge = (s: Source | null) =>
    s ? (
      <Badge
        label={s === "online" ? "AI ENRICHED" : "OFFLINE ENGINE"}
        color={s === "online" ? colors.primary : colors.amber}
      />
    ) : null;

  return (
    <Screen>
      <Header title="ACADEMY//OS" subtitle="Text adventure terminal" />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Prompt label="Location" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {LOCATIONS.map((loc) => {
              const on = loc.name === active.name;
              return (
                <Pressable
                  key={loc.name}
                  onPress={() => selectLocation(loc)}
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
                    color={on ? colors.primary : colors.mutedForeground}
                    bold={on}
                  >
                    {loc.name}
                  </Term>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Panel>
          <Term bold glow size={16} color={colors.accent}>
            {active.name}
          </Term>
          <Term style={{ marginTop: 8 }}>{active.base}</Term>
          {flavor ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                }}
              />
              <Term color={colors.foreground} style={{ fontStyle: "italic" }}>
                {flavor}
              </Term>
              {srcBadge(flavorSource)}
            </View>
          ) : null}
          <View style={{ marginTop: 14 }}>
            <TermButton
              label={flavor ? "Re-scan location" : "Scan location"}
              onPress={scan}
              loading={loading}
              testID="scan-location"
            />
          </View>
        </Panel>

        <View>
          <Prompt label="Examine" />
          <Panel>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {active.interactables.map((obj) => (
                <Pressable key={obj} onPress={() => setTarget(obj)}>
                  <Term size={12} color={colors.mutedForeground}>
                    {`[${obj}]`}
                  </Term>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={target}
              onChangeText={setTarget}
              placeholder="type an object to examine..."
              placeholderTextColor={colors.mutedForeground}
              style={{
                marginTop: 10,
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
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={runExamine}
            />
            <View style={{ marginTop: 10 }}>
              <TermButton
                label="Examine"
                onPress={runExamine}
                variant="accent"
                disabled={!target.trim()}
                loading={examineLoading}
                testID="examine"
              />
            </View>
            {examine ? (
              <View style={{ marginTop: 12, gap: 8 }}>
                <Term style={{ fontStyle: "italic" }}>{examine}</Term>
                {srcBadge(examineSource)}
              </View>
            ) : null}
          </Panel>
        </View>

        {!character ? (
          <Panel style={{ borderColor: colors.amber }}>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Feather name="alert-triangle" size={16} color={colors.amber} />
              <Term color={colors.amber} size={12}>
                No student record found. Enroll in the CHARACTER tab.
              </Term>
            </View>
          </Panel>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
