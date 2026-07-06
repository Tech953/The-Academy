import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export const FONT_REGULAR = "SpaceMono_400Regular";
export const FONT_BOLD = "SpaceMono_700Bold";

/** Screen background — pure CRT black. */
export function Screen({ children, style, ...rest }: ViewProps) {
  const colors = useColors();
  return (
    <View
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

/** Monospace text with an optional phosphor glow. */
export function Term({
  children,
  glow,
  color,
  size = 14,
  bold,
  dim,
  style,
  ...rest
}: TextProps & {
  glow?: boolean;
  color?: string;
  size?: number;
  bold?: boolean;
  dim?: boolean;
}) {
  const colors = useColors();
  const resolved = color ?? (dim ? colors.mutedForeground : colors.foreground);
  return (
    <Text
      style={[
        {
          color: resolved,
          fontFamily: bold ? FONT_BOLD : FONT_REGULAR,
          fontSize: size,
          lineHeight: Math.round(size * 1.45),
        },
        glow
          ? {
              textShadowColor: resolved,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 8,
            }
          : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

/** Bordered terminal panel. */
export function Panel({ children, style, ...rest }: ViewProps) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: colors.radius,
          padding: 14,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

/** Blinking-cursor-style section label: `> LABEL`. */
export function Prompt({ label, color }: { label: string; color?: string }) {
  const colors = useColors();
  return (
    <Term
      bold
      glow
      size={12}
      color={color ?? colors.accent}
      style={styles.prompt}
    >
      {`> ${label.toUpperCase()}`}
    </Term>
  );
}

/** Terminal button with press feedback + haptics. */
export function TermButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  testID,
  small,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger" | "accent";
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  small?: boolean;
}) {
  const colors = useColors();
  const tint =
    variant === "danger"
      ? colors.destructive
      : variant === "accent"
        ? colors.accent
        : colors.primary;
  const filled = variant === "primary";
  const bg = filled ? tint : "transparent";
  const fg = filled ? colors.primaryForeground : tint;

  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={() => {
        if (Platform.OS !== "web") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      style={({ pressed }) => [
        {
          borderColor: tint,
          borderWidth: 1,
          borderRadius: colors.radius,
          backgroundColor: bg,
          paddingVertical: small ? 8 : 12,
          paddingHorizontal: small ? 12 : 16,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Term bold size={small ? 12 : 13} color={fg}>
          {label.toUpperCase()}
        </Term>
      )}
    </Pressable>
  );
}

/** Small status pill (e.g. ONLINE / OFFLINE / source tag). */
export function Badge({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        borderColor: color,
        borderWidth: 1,
        borderRadius: colors.radius,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: "flex-start",
      }}
    >
      <Term bold size={10} color={color}>
        {label.toUpperCase()}
      </Term>
    </View>
  );
}

/** Custom retro header with web/native safe-area handling. */
export function Header({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  return (
    <View
      style={{
        paddingTop: topPad + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        backgroundColor: colors.background,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1 }}>
        <Term bold glow size={20} color={colors.primary}>
          {title}
        </Term>
        {subtitle ? (
          <Term dim size={11} style={{ marginTop: 2 }}>
            {subtitle}
          </Term>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: {
    letterSpacing: 1,
    marginBottom: 8,
  },
});
