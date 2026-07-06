/**
 * Semantic design tokens for The Academy (Mobile).
 *
 * These are a DIRECT hex conversion of the sibling web artifact's `.dark`
 * CSS custom properties (artifacts/academy/src/index.css) — the Neo-CRT
 * desktop OS is dark-CRT-only (no light mode), so both palettes below are
 * intentionally identical and must stay in lockstep with that file:
 *
 *   --background: 0 0% 0%        -> #000000
 *   --foreground: 120 100% 50%   -> #00ff00
 *   --primary: 120 100% 50%      -> #00ff00
 *   --primary-foreground: 0 0% 0%-> #000000
 *   --secondary: 0 0% 0%         -> #000000
 *   --muted: 0 0% 0%             -> #000000
 *   --muted-foreground: 0 0% 70% -> #b3b3b3
 *   --accent: 60 100% 50%        -> #ffff00
 *   --accent-foreground: 0 0% 0% -> #000000
 *   --destructive: 0 100% 50%    -> #ff0000
 *   --border: 120 100% 50%       -> #00ff00
 *   --input: 0 0% 0%             -> #000000
 */

const crtPalette = {
  text: "#00ff00",
  tint: "#00ff00",

  background: "#000000",
  foreground: "#00ff00",

  card: "#000000",
  cardForeground: "#00ff00",

  primary: "#00ff00",
  primaryForeground: "#000000",

  secondary: "#000000",
  secondaryForeground: "#00ff00",

  muted: "#000000",
  mutedForeground: "#b3b3b3",

  accent: "#ffff00",
  accentForeground: "#000000",

  destructive: "#ff0000",
  destructiveForeground: "#000000",

  border: "#00ff00",
  input: "#000000",
};

const colors = {
  light: crtPalette,
  dark: crtPalette,

  // Sharp terminal-window corners rather than soft mobile rounding.
  radius: 4,
};

export default colors;
