---
name: Porting a legacy single-app into the pnpm multi-artifact workspace
description: Non-obvious decisions/gotchas when porting a large legacy React+Express app into artifacts/* with parity as the goal
---

# Porting legacy app → multi-artifact workspace

Goal of a port is behavior + visual PARITY, not a rewrite. Strict-TS compliance,
pre-existing bugs, and refactors are explicitly out of scope (see the port task rubric).
Vite/esbuild transpile fine despite dozens of legacy strict-TS errors — do not chase them.

**Why:** users treat a port as "don't break my live product"; regressions are noticed, TS purity is not.

## Key decisions that worked
- **Skip OpenAPI codegen for a large legacy frontend.** Keep its existing custom fetch
  layer (relative `/api/...` + `credentials:"include"`). Rewriting every page to generated
  hooks is too risky. Codegen is only worth it for small/new surfaces.
- **Copy legacy `shared/` into the frontend** (`src/shared/`) and add a `@shared/*` alias in
  BOTH `vite.config.ts` resolve.alias and `tsconfig.json` paths. Preserves legacy import
  structure. Downside: it duplicates `lib/db`'s schema — keep them in sync by hand.
- If `shared/schema.ts` imports drizzle, the FRONTEND needs `drizzle-orm`/`drizzle-zod` as deps.
- Frontend must NOT import `@workspace/db` — that pulls in DB-connection code into the browser.

## Vite gotchas after `fullstack_copy_frontend.sh`
- Swap `@tailwindcss/vite` → postcss `tailwindcss()` + `autoprefixer()` if the legacy app is Tailwind v3.
- Set `server.fs.strict:false` so files outside root (aliased dirs) resolve.
- Keep the Replit `PORT`/`BASE_PATH` env guards the scaffold adds.

## Routing sanity
- Frontend at base `/`, API at `/api` behind the shared proxy → same-origin relative
  `/api/...` requests route correctly with no Vite proxy config.

## Expo: eas.json vs "never run EAS CLI"
The expo skill forbids running any `eas` CLI command (build/submit/update/init) and says
Android publishing isn't supported via Replit's flow. That does NOT mean skip creating a
static `eas.json` file when a task asks for "EAS Build config for Android APK" — writing
the config (build profiles with `android.buildType: "apk"`) is fine; only invoking the CLI
against it is forbidden. Treat "configure the file" and "run the tool" as separate asks.

**Why:** task specs can ask for infra config to be staged for the user to run later, distinct
from the skill's blanket ban on the agent itself invoking `eas build`.

## Code review focus areas for a companion mobile port
When a mobile companion app must visually match a web sibling, a reviewer will check these
even if not explicitly asked:
- **Colors/fonts must trace to the exact source CSS vars**, not "close enough" or invented
  values (e.g. a decorative `.neon-amber` utility class is NOT the same as the semantic
  `--accent` var — grep the actual `.dark`/`:root` block, don't eyeball the rendered UI).
- **Every fetched-but-unused API resource is a red flag.** If a shared endpoint (e.g. a
  content-pack/announcements feed) is fetched, it must be wired into state and surfaced in
  the UI, with an offline-deterministic fallback generator — not left as dead code.
- **Config-dependent API base URLs must not hard-throw.** A `getApiBaseUrl()` that throws
  when an env var (like `EXPO_PUBLIC_DOMAIN`) is unset is risky for a built APK installed
  outside the dev workspace. Return `null`/undefined instead, expose a `hasApiConfig()`
  check, and fold it into the online/offline decision so the UI's "online" badge and the
  actual fetch capability never disagree.

## Testing gotcha
- Playwright may report perk/button clicks as "intercepted" (overlay actionability check) and
  fall back to DOM click — this is a test-runner artifact, NOT a real app bug. Real browser
  clicks pass through `pointer-events:none` overlays. Verify with a precise re-test before
  assuming a state-management bug.
