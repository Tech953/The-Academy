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

## Testing gotcha
- Playwright may report perk/button clicks as "intercepted" (overlay actionability check) and
  fall back to DOM click — this is a test-runner artifact, NOT a real app bug. Real browser
  clicks pass through `pointer-events:none` overlays. Verify with a precise re-test before
  assuming a state-management bug.
