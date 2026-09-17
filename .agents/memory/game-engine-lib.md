---
name: Game engine shared lib
description: @workspace/game-engine — canonical home for all offline content engine code, shared between the web and mobile artifacts.
---

# @workspace/game-engine

Located at `lib/game-engine/`. Exports from a single barrel `src/index.ts`.

## What's in it
- `seededRandom.ts` — Mulberry32 PRNG + SeededRandom class + fillTemplate
- `dialogueTemplates.ts` — 10 archetypes × 8 emotions × 6 relationship tiers
- `eventTemplates.ts` — 200 procedural world event templates
- `studyTemplates.ts` — GED question templates for all 4 subjects
- `contentPack.ts` — ContentPack / PackWorldEvent / PackNpcMood / PackGEDFocus types, shared runtime validation, pack limits, and cache/API constants. `ContentPackEvent` is a type alias for `PackWorldEvent`.
- `offlineContentEngine.ts` — generateNPCLine, generateOfflineConversation, generateDailyEvents, generateQuizSet, generateContentPack, generateOfflineContentPack, analyzeDialogueTone, inferEmotionState, scoreToRelationshipTier, dayToWeek
- `gameWorld.ts` — LOCATIONS, NPCS, STARTING_LOCATION (campus layout)

## Consumers
- `artifacts/academy-mobile`: `context/GameContext.tsx`, `app/(tabs)/*.tsx`, `__tests__/offline.test.ts`
- `artifacts/academy`: `src/contexts/GameStateContext.tsx`, `src/hooks/useContentPack.ts`, `src/components/desktop/apps/WorldEventsFeed.tsx`

## Files that stayed in their artifacts (not shared)
- Mobile: `lib/api.ts` (fetch functions + ContentPack type for API — structurally compatible with shared type), `lib/gameFallbacks.ts` (wraps api.ts calls with offline fallback thunks)
- Web: `src/shared/contentPack.ts` was deleted (both consumers now use `@workspace/game-engine`)

**Why:** Adding a new engine file (curriculum, template, etc.) only needs to happen in one place — the shared lib — and both artifacts pick it up immediately.

**How to apply:** Any new offline-first content (new templates, NPC types, study content) goes in `lib/game-engine/src/`, exported from `src/index.ts`.

## Content-pack boundary

The API and mobile cache must use the game-engine runtime contract before returning, caching, or consuming a content pack. Artifact-specific code may repair bulletin events, but malformed metadata must resolve to a deterministic pack rather than being partially trusted.

**Why:** TypeScript interfaces disappear at runtime, and separate server/mobile checks previously allowed different malformed pack shapes through the API and cache.

**How to apply:** Extend the shared validator and its boundary tests when adding or changing pack fields; keep deterministic packs valid under the same contract.
