import { Platform } from "react-native";

/**
 * Matches the web app's `--font-mono: Menlo, monospace;` token
 * (artifacts/academy/src/index.css). Menlo is Apple's system monospace
 * font, so iOS gets an exact match; Android/web fall back to their own
 * native monospace stacks rather than an unrelated Google Font, which
 * keeps the terminal typeface consistent with the desktop app instead of
 * introducing a new brand font.
 */
export const monoFontFamily = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "ui-monospace, Menlo, Consolas, monospace",
}) as string;

export const monoFont = {
  fontFamily: monoFontFamily,
  fontWeight: "400" as const,
};

export const monoFontBold = {
  fontFamily: monoFontFamily,
  fontWeight: "700" as const,
};
