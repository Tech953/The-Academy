# The Academy — Developer Guide

A technical reference for contributors, collaborators, and AI agents working on this codebase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Development Setup](#4-development-setup)
5. [Environment Variables](#5-environment-variables)
6. [Architecture Overview](#6-architecture-overview)
7. [Data Persistence](#7-data-persistence)
8. [API Reference](#8-api-reference)
9. [Security Model](#9-security-model)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Adding Features](#11-adding-features)
12. [Content & AI Systems](#12-content--ai-systems)
13. [Offline Architecture](#13-offline-architecture)
14. [Testing & Debugging](#14-testing--debugging)
15. [Deployment](#15-deployment)

---

## 1. Project Overview

The Academy is a text-based educational RPG set inside a private school. Players explore 120+ locations, interact with 100 AI-driven NPCs, attend GED preparation courses, and unlock a graduation ceremony upon academic mastery.

The game wraps everything in a simulated desktop OS (Academy OS) built as a React SPA, served by an Express backend. It is designed to run offline-first with a four-ring fallback content architecture.

**Repository:** `https://github.com/Tech953/The-Academy`

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui |
| State | React Context + localStorage |
| Server | Express.js + TypeScript |
| Database | PostgreSQL via Neon (Drizzle ORM) |
| AI | OpenAI `gpt-5-mini` via Replit AI Integrations |
| Build | Vite (frontend) + ESBuild (backend) |
| Icons | Lucide React |

---

## 3. Project Structure

```
/
├── client/                     # React SPA
│   └── src/
│       ├── components/
│       │   ├── desktop/
│       │   │   ├── apps/       # All 20+ desktop applications
│       │   │   └── NeoCrtDesktopShell.tsx   # OS window manager
│       │   ├── ui/             # shadcn/ui base components
│       │   └── TerminalInterface.tsx
│       ├── contexts/
│       │   ├── GameStateContext.tsx   # Global game state + persistence
│       │   └── RadiantAIContext.tsx   # NPC AI system context
│       ├── hooks/
│       │   ├── useAcademicHandlers.ts # Academic command handlers
│       │   ├── useNPCHandlers.ts      # NPC dialogue command handlers
│       │   ├── useContentPack.ts      # Weekly content pack fetcher
│       │   └── use-toast.ts
│       ├── lib/
│       │   ├── gameState.ts           # Core game state manager
│       │   ├── radiantAI.ts           # NPC AI engine (100 NPCs)
│       │   ├── npcMemoryStore.ts      # Persistent NPC memory
│       │   ├── offlineContentEngine.ts # Ring 2: template library
│       │   ├── seededRandom.ts        # Ring 1: deterministic PRNG
│       │   ├── confluenceHall.ts      # Graduation ceremony engine
│       │   ├── i18n.ts                # Internationalization (5 languages)
│       │   ├── accessibility.ts       # Accessibility profiles
│       │   └── localizedContent.ts   # Localized UI strings
│       └── pages/
│           └── Home.tsx               # Text adventure terminal + layout
├── server/
│   ├── index.ts                # Express app entry point
│   ├── routes.ts               # All API route definitions
│   ├── storage.ts              # IStorage interface + MemStorage
│   ├── db.ts                   # Drizzle + Neon DB connection
│   ├── persistentStore.ts      # File-based save persistence (no-DB mode)
│   ├── middleware/
│   │   └── security.ts         # Rate limiting, sanitization, bcrypt
│   ├── ai/                     # AI feature modules
│   ├── nlp/                    # Natural language command processor
│   ├── procedural/             # World generator (locations, NPCs, courses)
│   └── utils/                  # Academic utilities (GPA, grades)
├── shared/
│   ├── schema.ts               # Drizzle schema + Zod validation types
│   ├── stats.ts                # 17-stat system definitions
│   ├── perks.ts                # Perk catalog
│   ├── contentPack.ts          # Weekly content pack schema
│   └── curriculum.ts           # GED curriculum types
├── offline/                    # Platform installers for offline play
│   ├── install-linux.sh
│   ├── install-mac.sh
│   ├── install-windows.bat
│   └── README.md
├── README.md                   # User manual
└── DEVELOPER.md                # This file
```

---

## 4. Development Setup

```bash
# 1. Clone
git clone https://github.com/Tech953/The-Academy.git
cd The-Academy

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env   # or create manually
# See Section 5 for required variables

# 4. Start development server
npm run dev
# → http://localhost:5000 (serves both frontend and API)
```

The dev server uses Vite for HMR on the frontend and ESBuild + Node for the backend. Both share port 5000.

---

## 5. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_SECRET` | **Yes** | Secret for session signing. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DATABASE_URL` | No | PostgreSQL connection string (Neon format). If omitted, falls back to file-based persistence at `.academy_data/save.json` |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | No | OpenAI API key for AI features. Without this, the game runs on the offline content engine. |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | No | Base URL for OpenAI-compatible API. Defaults to `https://api.openai.com/v1` |
| `PORT` | No | Server port. Defaults to `5000`. |

**Never commit `.env` files.** The `.gitignore` excludes them.

---

## 6. Architecture Overview

```
Browser (React SPA)
       │
       │  HTTP / REST
       ▼
Express Server (port 5000)
       │
       ├─── Security Middleware
       │     ├── Rate limiting (200/15min general, 30/15min AI)
       │     ├── Input sanitization
       │     └── JSON body parsing
       │
       ├─── API Routes (/api/*)
       │     ├── Character management
       │     ├── Game world (locations, NPCs, items)
       │     ├── Academic system (courses, enrollments, GPA)
       │     ├── AI endpoints (NPC dialogue, descriptions)
       │     └── Content pack (weekly events)
       │
       └─── Storage Layer
             ├── DATABASE_URL set → PostgreSQL (Drizzle + Neon)
             └── No DATABASE_URL → File persistence (.academy_data/save.json)
                                   + In-memory procedural data
```

### Request Flow

1. Browser sends command (e.g., `ATTEND algebra`)
2. `Home.tsx` → `handleCommand()` dispatches to the correct handler
3. Handler calls `/api/enrollments/:id/attend` via `fetch`
4. Express route validates with Zod → calls `storage.attendCourse()`
5. Storage persists → returns updated character
6. Handler updates `gameState` → terminal displays result

---

## 7. Data Persistence

### Modes

**With `DATABASE_URL`:**
Uses Neon PostgreSQL via Drizzle ORM. Schema is defined in `shared/schema.ts`. Run migrations with:
```bash
npx drizzle-kit push
```

**Without `DATABASE_URL` (default for local play):**
Uses `server/persistentStore.ts` — a JSON file at `.academy_data/save.json`. Persists:
- Characters (name, stats, faction, inventory, perks, current location)
- Game sessions (serialized game state)
- Enrollments (course progress)
- Academic progress (GPA, standing)
- Reading progress (chapters/lectures completed)

Procedural world data (locations, NPCs, items, courses, textbooks) is regenerated from the world seed on every server start — it never changes.

### Storage Interface (`server/storage.ts`)

All storage operations go through the `IStorage` interface. To add a new persistent entity:

1. Add the table to `shared/schema.ts`
2. Add methods to `IStorage` interface in `server/storage.ts`
3. Implement in `MemStorage` (in-memory, always needed)
4. If persistence is needed, add to `persistentStore.ts`

---

## 8. API Reference

### Character Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/characters/:id` | Get a character by ID |
| `GET` | `/api/characters/user/:userId` | Get all characters for a user |
| `POST` | `/api/characters` | Create a new character |
| `PUT` | `/api/characters/:id` | Update a character |
| `DELETE` | `/api/characters/:id` | Delete a character |

### Game Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/game/save` | Save game state |
| `GET` | `/api/game/load/:characterId` | Load most recent save |

### World Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/locations` | All locations |
| `GET` | `/api/locations/:id` | Single location |
| `GET` | `/api/npcs` | All NPCs |
| `GET` | `/api/npcs/:id` | Single NPC |
| `GET` | `/api/npcs/location/:locationId` | NPCs in a location |
| `GET` | `/api/items` | All items |

### Academic Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/courses` | All courses |
| `GET` | `/api/courses/:id` | Single course |
| `GET` | `/api/courses/:id/assignments` | Assignments for a course |
| `GET` | `/api/courses/:courseId/textbook` | Course textbook |
| `GET` | `/api/courses/:courseId/lectures` | All lectures |
| `GET` | `/api/courses/:courseId/lectures/:week` | Specific week's lecture |
| `POST` | `/api/enrollments` | Enroll in a course |
| `GET` | `/api/enrollments/character/:characterId` | Student's enrollments |
| `POST` | `/api/enrollments/:id/attend` | Mark class attendance |
| `POST` | `/api/enrollments/:id/complete` | Complete a course |
| `GET` | `/api/academic-progress/:characterId` | Get academic progress |
| `POST` | `/api/academic-progress/:characterId/calculate` | Recalculate GPA |
| `GET` | `/api/reading-progress/:characterId/:textbookId` | Reading progress |
| `POST` | `/api/reading-progress/:characterId/:textbookId` | Update reading progress |

### AI Routes (rate-limited: 30/15min)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ai/describe` | Location/object AI description |
| `POST` | `/api/npc-dialogue` | NPC conversation AI response |
| `POST` | `/api/nlp/process` | Natural language command parsing |
| `POST` | `/api/character-creation/generate-questions` | Character creation questions |
| `POST` | `/api/memories/visualize` | Memory visualization AI |

### Content System

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/content-pack` | Get current weekly content pack |
| `POST` | `/api/content-pack/refresh` | Force regenerate content pack |
| `GET` | `/api/rss` | Fetch RSS headlines |

### Validation

All `POST`/`PUT` request bodies are validated with Zod schemas from `shared/schema.ts`. Invalid requests return `400` with `{ error, details }`. All string inputs are trimmed and capped at 20,000 characters by the sanitization middleware.

---

## 9. Security Model

### What Is Implemented

| Measure | Location | Details |
|---------|----------|---------|
| **Rate limiting** | `server/middleware/security.ts` | 200 req/15min general; 30/15min for AI endpoints; 10/hr for content pack refresh |
| **Input sanitization** | `server/middleware/security.ts` | All string fields trimmed and capped at 20KB |
| **Input validation** | `server/routes.ts` | Zod schemas on all write endpoints |
| **Password hashing** | `server/middleware/security.ts` | `hashPassword()` / `verifyPassword()` using bcryptjs (12 rounds) — ready for use when auth is added |
| **Error messages** | All routes | Generic error messages; no stack traces exposed to clients |

### Known Gaps / Future Work

| Gap | Priority | Notes |
|-----|----------|-------|
| **Authentication system** | High | No login/session system exists yet. All character data is accessed by ID without ownership verification. Suitable for single-player local use; not for multi-user hosting. |
| **CSRF protection** | Medium | The API is consumed only by the same-origin SPA, so CSRF risk is low currently. Add `csurf` middleware when adding user accounts. |
| **Ownership checks** | Medium | `assertOwnership()` helper is in `security.ts`, ready to use. Wire it to routes once auth/session is added. |
| **HTTPS in production** | Handled by Replit deployment | Replit's deployment infrastructure enforces HTTPS. |

### Adding Auth (Future)

When adding user authentication:
1. Add `express-session` + `connect-pg-simple` (already in `package.json`)
2. Store `SESSION_SECRET` from `.env`
3. Add `POST /api/auth/register` and `POST /api/auth/login` using `hashPassword()`/`verifyPassword()`
4. Set `req.session.userId` on login
5. Add a `requireAuth` middleware and apply to character/progress routes
6. Use `assertOwnership(character.userId, req.session.userId)` on character mutation routes

---

## 10. Frontend Architecture

### State Management

Global state flows through two React Contexts:

**`GameStateContext`** (`client/src/contexts/GameStateContext.tsx`):
- Current character (stats, inventory, faction, location)
- Messages, emails, enrolled courses
- Curriculum progress
- Persisted in `localStorage`

**`RadiantAIContext`** (`client/src/contexts/RadiantAIContext.tsx`):
- All 100 NPC entities (goals, emotions, relationships, memory)
- The AI decision engine
- Persisted in `localStorage`

### Key Singletons

These are imported directly as singletons (not via context):

| Singleton | File | Purpose |
|-----------|------|---------|
| `gameStateManager` | `client/src/lib/gameState.ts` | Core game state + world interaction |
| `radiantAI` (static) | `client/src/lib/radiantAI.ts` | NPC AI engine |
| `localizedContentManager` | `client/src/lib/localizedContent.ts` | Localized UI strings |
| `i18nManager` | `client/src/lib/i18n.ts` | Language switching |
| `glossaryManager` | `client/src/lib/glossary.ts` | Academic glossary |
| `accessibilityManager` | `client/src/lib/accessibility.ts` | Accessibility profiles |

### Component Organization

```
NeoCrtDesktopShell.tsx    ← OS window manager; registers all 20+ apps
  └── renderApp(id)        ← switch statement dispatching to app components
      ├── AssignmentsPortal.tsx
      ├── AcademyEmailApp.tsx
      ├── WorldEventsFeed.tsx
      └── ... (20+ apps in components/desktop/apps/)

Home.tsx                   ← Text adventure terminal (the GAME app)
  ├── useAcademicHandlers  ← Academic command logic (courses, grades, etc.)
  ├── useNPCHandlers       ← NPC dialogue logic
  └── handleCommand()      ← Main command dispatcher
```

### Command Routing (Home.tsx)

```
User types command
  → handleCommand(command)
    → parseCommandWithNLP(command)   ← tries NLP server; falls back to traditional
    → dispatch to handler:
        "grades"    → academic.grades()
        "talk"      → NPC resolution → npc.talk() / npc.talkTopic()
        "north"     → handleMovement("north")
        "examine"   → handleExamine(target)
        ...
```

### Adding a New Text Command

1. Add the command string to `GAME_COMMANDS` in `server/nlp/commandProcessor.ts`
2. Add an `else if (action === 'mycommand')` branch in `handleCommand()` in `Home.tsx`
3. If it's academic-related, add the handler function to `client/src/hooks/useAcademicHandlers.ts`
4. Add the command to the HELP text block in `handleCommand`

---

## 11. Adding Features

### Adding a New Desktop App

1. Create the component in `client/src/components/desktop/apps/MyApp.tsx`
2. Register it in `NeoCrtDesktopShell.tsx`:
   - Add an icon entry to `defaultIcons` array with `id`, `label`, `colorKey`, `defaultRow`, `defaultCol`
   - Add a `case 'myapp': return <MyApp {...props} />;` to the `renderApp()` switch
   - Add i18n labels to `client/src/lib/i18n.ts` for all 5 languages
3. Define the window dimensions in `renderApp()` if non-default size is needed:
   ```typescript
   case 'myapp': return <MyApp {...props} style={{ width: 800, height: 600 }} />;
   ```

### Adding a New NPC

NPCs are procedurally generated from the world seed in `server/procedural/generators.ts`. To add a unique NPC:

1. Extend the NPC generation logic in `generateNPCs()` in `server/storage.ts`
2. The NPC's `dialogue` field must include `greeting`, `topics` (key → text), and optionally `farewell`
3. The NPC will automatically receive a RadiantAI personality profile (archetype, emotions, goals, schedule) via `radiantAI.ts`

### Adding a New Location

Locations are defined in `server/storage.ts` in the `initializeLocations()` method. Each location needs:
- `id`: kebab-case unique string
- `name`: display name
- `description`: 1-3 sentence room description
- `type`: one of `classroom | hallway | dormitory | library | office | outdoor | secret | common`
- `exits`: object mapping direction → destination location ID
- `npcs`: array of NPC IDs present at initialization
- `interactables`: array of object names players can `EXAMINE`
- `requirements`: access restrictions (optional)

### Adding a GED Course

Courses are generated in `server/procedural/courseGenerator.ts`. To add a new course:
1. Add an entry to the `generateCourseCatalog()` function with `name`, `description`, `credits`, `gedArea`
2. A textbook is auto-generated by `generateTextbooks()` for each course
3. Lectures are auto-generated by `generateLectures()`

---

## 12. Content & AI Systems

### The Four-Ring Offline Architecture

```
Ring 4: RSS Headlines (NASA, ScienceDaily, phys.org)
         ↓ injected as inspiration seeds
Ring 3: GPT Content Pack (gpt-5-mini, weekly, ~$2/year)
         ↓ fallback if AI unavailable
Ring 2: Template Library (deterministic, always available)
         ↓ fallback if templates fail
Ring 1: PRNG (Mulberry32, seed=12345, infallible)
```

**Ring 1** — `client/src/lib/seededRandom.ts`
- `SeededRandom` class using Mulberry32
- World seed: `WORLD_SEED = 12345`
- Key functions: `entitySeed()`, `temporalSeed()`, `hashString()`, `fillTemplate()`

**Ring 2** — `client/src/lib/offlineContentEngine.ts`
- `generateOfflineConversation()` — NPC dialogue without AI
- `generateDailyEvents()` — daily world events without AI
- `generateQuizSet()` — GED quiz questions without AI
- Template files: `dialogueTemplates.ts`, `eventTemplates.ts`, `studyTemplates.ts`

**Ring 3** — `server/routes.ts` (`/api/content-pack`)
- Generates weekly pack using GPT-4.1-mini
- 7-day in-memory cache with `cachedContentPack`
- `scheduleWeeklyPackRefresh()` runs at startup
- Client hook: `client/src/hooks/useContentPack.ts`

**Ring 4** — `fetchRSSHeadlines()` in `server/routes.ts`
- Fetches from 3 feeds with 5-second timeout each
- Headlines anonymized before GPT injection
- Stored in `contentPack.rssHeadlines` for display

### Adding a New AI Feature

1. Create the endpoint in `server/routes.ts` under the `// AI Routes` section
2. Apply `aiLimiter` middleware:
   ```typescript
   app.post('/api/ai/mything', aiLimiter, async (req, res) => { ... });
   ```
3. Use the `openai` client (already initialized at top of routes.ts)
4. Always provide a graceful non-AI fallback
5. Document the endpoint in Section 8 above

---

## 13. Offline Architecture

### Content Pack Schema (`shared/contentPack.ts`)

```typescript
interface ContentPack {
  weekKey: string;           // "2025-W03"
  generatedAt: number;       // timestamp
  themeContext: string;       // week's narrative mood
  activeEvents: PackWorldEvent[];   // 3 events
  npcMoodShifts: PackNpcMood[];     // 4 NPC mood changes
  gedFocusAreas: PackGEDFocus[];    // 2 study focus areas
  rssHeadlines: string[];    // source headlines
}
```

### localStorage Keys

| Key | Contents |
|-----|----------|
| `academy-content-pack-v1` | Cached weekly content pack |
| `academy-npc-mem-v1` | NPC conversation memory (full playthrough) |
| `academy-wp-fmt` | Word processor documents |
| `academy-impress-v1` | Presentation files |
| `academy-desktop-positions-v10` | Desktop icon positions |
| `academy-game-state` | Core game state (character, location, inventory) |
| `academy-radiant-ai` | All 100 NPC states |

---

## 14. Testing & Debugging

### Running the Dev Server

```bash
npm run dev
# Starts Vite (frontend HMR) + Express (backend) on port 5000
```

### Checking Logs

- Backend logs appear in the Replit console or terminal
- `[DB]` prefix: database connection status
- `[PersistentStore]` prefix: file-based save status
- `[ContentPack]` prefix: weekly pack generation

### Common Debug Commands (in-game terminal)

```
STATUS          — show current character stats and location
SCORE           — show all reputation and stat totals
TIME            — check in-game time
NOTES           — list research notebook contents
PROGRESS        — full academic progress report
```

### Testing the Content Pack

```bash
# Force regenerate the weekly pack
curl -X POST http://localhost:5000/api/content-pack/refresh

# Check the current pack
curl http://localhost:5000/api/content-pack
```

### Checking Save Data

The file-based save is stored at `.academy_data/save.json`. It's human-readable JSON you can inspect directly:

```bash
cat .academy_data/save.json | python -m json.tool
```

---

## 15. Deployment

This project deploys via Replit's deployment system. The production build:

1. Runs `npm run build` (Vite builds the frontend, ESBuild bundles the server)
2. Serves from `dist/` directory
3. Uses `DATABASE_URL` from Replit's secret manager
4. Uses `SESSION_SECRET` from Replit's secret manager

To deploy from the Replit interface, click **Publish** in the top navigation.

### Production Considerations

- Set `DATABASE_URL` to a Neon PostgreSQL connection string in Replit Secrets
- Set `SESSION_SECRET` to a 32-byte hex string in Replit Secrets
- Set `AI_INTEGRATIONS_OPENAI_API_KEY` for AI features (optional but recommended)
- The content pack generates once per week costing ~$2.07/year total regardless of player count

### Database Migrations

When the schema changes, run:

```bash
npx drizzle-kit push
```

This syncs the Neon database schema with `shared/schema.ts`. Always test against a development database before pushing to production.

---

*Last updated: May 2026*
