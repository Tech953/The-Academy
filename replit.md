# The Academy

A GED-focused academic RPG with a retro CRT desktop metaphor: players pick starter traits, then study and progress through a simulated 1980s-style institutional operating system. Being ported into a pnpm multi-artifact workspace so an Android/Expo app can be built alongside the web app.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

## AI Description Engine
A server-side OpenAI endpoint enhances the text adventure's descriptive language in two modes: "Location mode" for atmospheric flavor text and "Examine mode" for contextual object descriptions. Both modes utilize `gpt-5-mini` and cache results client-side.

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/academy/` — the web frontend (React + Vite + wouter), mounted at base path `/`. UI entry is `src/App.tsx` → `RetroBootScreen` → `NeoCrtDesktopShell`.
- `artifacts/api-server/` — the Express backend (kind=api), served at `/api`. Routes in `src/routes/routes.ts` (declared with absolute `/api/...` paths); `registerRoutes(app)` is wired in `src/app.ts`.
- `lib/db/src/schema/schema.ts` — Drizzle DB schema (source of truth for the server).
- `artifacts/academy/src/shared/` — shared game modules (`schema.ts`, `perks.ts`, `stats.ts`, `curriculum.ts`, `contentPack.ts`) imported in the frontend via the `@shared/*` alias.

## Architecture decisions

- **Port, not rewrite.** Legacy app (`.migration-backup/`) was moved into the multi-artifact workspace with behavior/visual parity as the goal; strict typecheck compliance and pre-existing bugs are intentionally out of scope. Vite/esbuild transpile despite legacy strict-TS errors.
- **Frontend keeps its own fetch layer.** OpenAPI codegen was skipped for the large legacy frontend; `src/lib/queryClient.ts` uses same-origin relative `/api/...` requests with `credentials: "include"`, which route correctly through the shared proxy since the frontend is at `/` and the API at `/api`.
- **`@shared` is copied into the frontend** (`src/shared/`) rather than shared via a lib, to preserve the legacy import structure. `drizzle-orm`/`drizzle-zod` are frontend deps only because `shared/schema.ts` imports them.

## Product

A GED-focused academic RPG. Players choose starter perks/traits, then navigate a retro CRT "desktop OS" (windows, apps, taskbar) to study, take assignments, view character stats, and progress. An AI description engine enriches flavor text.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run apps via workflows (`restart_workflow "artifacts/academy: web"` / `"artifacts/api-server: API Server"`), never root-level `pnpm dev`/`build`.
- The frontend `@shared/schema` duplicates `lib/db/src/schema/schema.ts` — if the DB schema's shared types change, keep both in sync.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
