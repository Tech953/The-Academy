---
name: Academy mobile artifact
description: Conventions and gotchas for the Expo mobile companion (artifacts/academy-mobile).
---

# Academy mobile (Expo companion)

Offline-first GED academic RPG companion to the web app, retro CRT terminal look.

- **Workflow name is `artifacts/academy-mobile: expo`** (service name is `expo`, from artifact.toml), NOT `: web`. Restarting `: web` fails with RUN_COMMAND_NOT_FOUND.
- Expo web bundles on first request — after restart, warm it up (`curl https://$REPLIT_EXPO_DEV_DOMAIN/`) before screenshotting or the screenshot cancels.
- Fonts: Space Mono via `@expo-google-fonts/space-mono` (`SpaceMono_400Regular` / `SpaceMono_700Bold`); exported as `FONT_REGULAR`/`FONT_BOLD` from `components/Retro.tsx`.
- Colors: single CRT palette (light===dark) in `constants/colors.ts`; `radius` is a top-level number sibling of `light`/`dark`, so a `Record<string, palette>` cast breaks typecheck — access `dark` via a narrow cast instead.

**Offline-first design (explicit user requirement):** app must be fully usable with no network. `lib/api.ts` does online→offline fallback for describe/npcReply and tags each result with `source: "online" | "offline"`. Study is fully local (`generateQuizSet`). Sync (content packs) is additive-only enrichment cached in AsyncStorage. Never make a core flow require the network.

- Backend already exists (web api-server); mobile calls it via direct fetch — DO NOT add DB/OpenAPI codegen for the mobile artifact.
