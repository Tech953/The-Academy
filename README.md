# The Academy

A GED-focused academic RPG wrapped in a retro CRT desktop metaphor. Players pick starter perks and traits, then study, take assignments, and progress through a simulated 1980s-style institutional operating system — complete with windows, apps, and a taskbar rendered in phosphor green.

An AI description engine enriches the text adventure's flavor text, and a companion Android/Expo app brings the whole experience to mobile with a fully offline-first game engine.

## Features

- **Retro CRT desktop OS** — boot screen, draggable windows, taskbar, and a period-accurate terminal aesthetic (Space Mono, phosphor-green palette)
- **GED curriculum gameplay** — study and quiz across math, language arts, science, and social studies
- **Character progression** — starter perks/traits, stats, and study history
- **NPC dialogue** — tone-aware conversations with faculty and students
- **AI description engine** — server-side OpenAI endpoint enhances location and object descriptions ("Location" and "Examine" modes), with client-side caching
- **Offline-first mobile companion** — the Expo app plays fully offline via a deterministic on-device engine, and enriches responses with the live AI when online

## Project structure

This is a pnpm multi-artifact monorepo:

| Path | Description |
| --- | --- |
| `artifacts/academy/` | Web frontend (React + Vite + wouter), served at `/` |
| `artifacts/academy-mobile/` | Android/iOS companion app (Expo + expo-router), offline-first |
| `artifacts/api-server/` | Express 5 backend, served at `/api` |
| `lib/db/` | Drizzle ORM schema for PostgreSQL |
| `artifacts/academy/src/shared/` | Shared game modules (schema, perks, stats, curriculum, content packs) |

## Tech stack

- **Runtime:** Node.js 24, TypeScript 5.9, pnpm workspaces
- **Web:** React, Vite, wouter, Radix UI
- **Mobile:** Expo, expo-router, React Native
- **API:** Express 5, Zod validation, Orval OpenAPI codegen
- **Database:** PostgreSQL + Drizzle ORM
- **AI:** OpenAI (`gpt-5-mini`) for description enrichment

## Getting started

### Prerequisites

- Node.js 24+
- pnpm 10+
- A PostgreSQL database

### Setup

```bash
pnpm install
```

Required environment variables:

- `DATABASE_URL` — Postgres connection string

### Development

```bash
# API server (port 5000)
pnpm --filter @workspace/api-server run dev

# Web frontend
pnpm --filter @workspace/academy run dev

# Mobile app (Expo)
pnpm --filter @workspace/academy-mobile run dev
```

### Other commands

```bash
pnpm run typecheck                                  # typecheck all packages
pnpm run build                                      # typecheck + build everything
pnpm --filter @workspace/api-spec run codegen       # regenerate API hooks/Zod schemas from OpenAPI
pnpm --filter @workspace/db run push                # push DB schema changes (dev only)
```

### Building an Android APK

The mobile app ships with an EAS build config (`artifacts/academy-mobile/eas.json`). With an Expo account:

```bash
cd artifacts/academy-mobile
eas build -p android --profile preview
```

The `preview` profile produces an installable `.apk`; the `production` profile produces a Play Store app bundle.

## License

[MIT](./LICENSE)
