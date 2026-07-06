import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { monoFontBold } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

interface CrtButtonProps {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  variant?: "primary" | "accent" | "ghost";
  loading?: boolean;
  disabled?: boolean;
}

export function CrtButton({
  label,
  icon,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: CrtButtonProps) {
  const colors = useColors();
  const color = variant === "accent" ? colors.accent : colors.primary;

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: color,
          backgroundColor: variant === "ghost" ? "transparent" : colors.background,
          opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={14} color={color} /> : null}
          <Text style={[styles.label, { color }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 38,
  },
  label: {
    ...monoFontBold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
