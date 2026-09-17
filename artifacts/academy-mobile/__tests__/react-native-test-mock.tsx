import React, { type ReactNode } from "react";

type HostProps = {
  children?: ReactNode;
  style?: unknown;
  [key: string]: unknown;
};

function hostComponent(name: string) {
  return function HostComponent({ children, ...props }: HostProps) {
    return React.createElement(name, props, children);
  };
}

export const View = hostComponent("View");
export const Text = hostComponent("Text");
export const ScrollView = hostComponent("ScrollView");

export function Pressable({
  children,
  style,
  ...props
}: HostProps & {
  onPress?: () => void;
  disabled?: boolean;
}) {
  const resolvedStyle =
    typeof style === "function"
      ? (style as (state: { pressed: boolean }) => unknown)({ pressed: false })
      : style;
  return React.createElement(
    "Pressable",
    { ...props, style: resolvedStyle },
    children,
  );
}

export const Platform = {
  OS: "test",
  select<T>(options: { ios?: T; android?: T; default?: T }) {
    return options.default;
  },
};

export function useColorScheme() {
  return "dark" as const;
}

export const StyleSheet = {
  create<T extends Record<string, unknown>>(styles: T): T {
    return styles;
  },
  flatten(style: unknown): Record<string, unknown> | undefined {
    if (!Array.isArray(style)) return style as Record<string, unknown> | undefined;
    return style.reduce<Record<string, unknown>>(
      (merged, item) => ({ ...merged, ...(StyleSheet.flatten(item) ?? {}) }),
      {},
    );
  },
};