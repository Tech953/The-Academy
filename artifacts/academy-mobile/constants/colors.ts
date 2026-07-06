/**
 * Semantic design tokens for The Academy (Mobile).
 *
 * The Academy's brand identity is a retro 1980s CRT terminal: phosphor green on
 * pure black, with amber and yellow accents. This palette mirrors the web
 * artifact's index.css (HSL converted to hex) so both artifacts share one look.
 *
 * The palette is intentionally scheme-independent — the CRT aesthetic is always
 * "dark" — so only a `light` key is defined and useColors() always returns it.
 */

const crt = {
  // Legacy aliases (kept for backward compatibility)
  text: "#00FF00",
  tint: "#00FF00",

  // Core surfaces
  background: "#000000",
  foreground: "#00FF00",

  // Cards / elevated surfaces
  card: "#0a0f0a",
  cardForeground: "#00FF00",

  // Primary action color (phosphor green)
  primary: "#00FF00",
  primaryForeground: "#000000",

  // Secondary / less-emphasis interactive surfaces
  secondary: "#04140a",
  secondaryForeground: "#00FF00",

  // Muted / subdued elements
  muted: "#0d120d",
  mutedForeground: "#7d9b7d",

  // Accent highlights (amber warmth of a phosphor tube)
  accent: "#FFFF00",
  accentForeground: "#000000",

  // Amber — secondary accent for warnings / offline mode
  amber: "#ffaa00",

  // Destructive actions
  destructive: "#FF0000",
  destructiveForeground: "#000000",

  // Borders and input outlines (dim green trace)
  border: "#0f3d1a",
  input: "#0a2612",
};

const colors = {
  light: crt,
  dark: crt,
  // Sharp terminal corners
  radius: 4,
};

export default colors;
