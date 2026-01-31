# Overview

"The Academy" is an interactive text-based RPG designed to recreate the classic terminal adventure experience with modern features. Players navigate a mysterious private school, making choices that influence their character's stats, reputation, and story within an immersive world of 144 students and faculty. The game aims to provide personalized gameplay through AI-powered elements, all presented within a simulated "Academy OS" featuring a Neo-CRT aesthetic. The project combines nostalgic gameplay with advanced interactive storytelling and educational content.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is a React with TypeScript single-page application, encapsulated within a custom "Neo-CRT Academy OS Wrapper". This OS features a retro-modern design inspired by Fallout Pip-Boy and early MacOS, with pure black backgrounds, neon elements, subtle CRT effects (scanlines, vignette), and a day/night shader system with three distinct color palettes (Dawn, School Day, Night Study). The desktop layout is responsive, includes resizable and multi-window management, and uses a multi-color neon palette.

### Desktop Icons (Sidebar)
- Personal Profile
- Academy E-Mail
- Messages / Chatlink
- Assignments Portal
- Perks Viewer
- Resonance Dashboard
- School Files (academic materials, textbooks, lecture notes)
- Personal Files (journal entries, private notes, keepsakes)

### Taskbar Elements
- Class Schedule (quick access)
- Cub Companion Link
- Polaroid Memories (milestone snapshots)
- Settings / Accessibility
- Notifications (with badge counter)
- Clock (real-time display)

The game itself runs in a resizable window with an optional fullscreen mode, offering a terminal-first design with a black background and green monospace text, a header bar, a stats sidebar (displaying 17 stats), and adjustable text size. Styling is handled with Tailwind CSS, adapted shadcn/ui components, and Lucide React for icons. React Query manages server state.

### Neo-CRT Enhanced Features
The desktop implements a comprehensive Neo-CRT aesthetic system:

**Boot Sequence Audio** (`client/src/lib/bootJingle.ts`):
"Awakening Sequence v0.93" - A 3.5-second synthesized boot jingle using Web Audio API, inspired by the Nostromo's "Mother" computer and classic rotating storage from the Alien series:
- Mother Reactor Hum (0:00-2.8s): Deep mechanical drone with layered sawtooth, sine, and triangle waves at 45/90/135Hz
- Rotating Data Scroll (0:10-2.5s): Classic magnetic drum/disk storage sound with rhythmic churning, head clicks at 24Hz, and periodic seek sounds - the signature "data loading" noise from old rotating computers
- Relay Clicks (0:15-2.0s): Randomized mechanical switching sounds with high-pass filtered noise bursts
- Tape Drive Spinup (0:25-1.05s): Pitch-rising sawtooth simulating magnetic media initialization with mechanical whir
- Data Bleeps (0:50-2.1s): Deliberate square wave transmission tones (1000-1600Hz) in recognizable patterns
- Mother Voice Processing (1:20-1.8s): FM-modulated triangle wave simulating vocal synthesis
- CRT Static (1:80-2.05s): Bandpass-filtered noise burst
- Distress Beacon (2:00-3.2s): Descending sine wave pulses (880→660Hz) in triplet pattern
- System Chime (2:50-2.8s): E4→F#4→E5 stinger with soft distortion
- Cub Chirp (2:90-3.05s): Digital beep-bip confirmation

**Visual Effects** (`client/src/index.css`):
- Screen bloom animation when windows open
- Cursor pulse animation for terminal interaction
- Resonance distortion effects (unstable/critical states)
- Scanline drift and ambient glow effects
- Fuzzy bubble notification styling with neon glow
- Paper terminal aesthetic for assignment files

**Dual-Mode UI System**:
- Legacy Mode: Terminal-first, command-driven interface
- Student Mode: Clickable windows with modern navigation
- Toggle available in taskbar and Settings app
- Persisted via localStorage (`academy-ui-mode`)

**Interactive Features**:
- Command autocomplete system (`client/src/components/desktop/CommandAutocomplete.tsx`)
- Window snap zones for left/right/full organization (`client/src/components/desktop/WindowSnapZones.tsx`)
- Fuzzy bubble notifications (`client/src/components/desktop/FuzzyBubbleNotification.tsx`)
- Ambient desktop objects that change with character progress (`client/src/components/desktop/AmbientObjects.tsx`)

**Neon Color Palette**:
- Green (primary), Cyan (messages), Amber (assignments), Purple (perks/resonance), Pink (personal), Red (warnings/alerts), Gold (achievements)

### Academy OS Core Systems

**Virtual Filesystem** (`client/src/lib/virtualFilesystem.ts`):
Linux-style virtual filesystem with paths and permissions:
- `/home/student/` - User home directory with documents, messages, downloads
- `/system/` - Read-only system files, policies, NPC profiles
- `/apps/` - Executable applications
- `/logs/` - System logs
- Commands: ls, cd, pwd, cat, mkdir, rm, touch

**App Manifest System** (`client/src/lib/appManifest.ts`):
Modular application registry with formal manifests:
- Each app defines: id, command, permissions, uiMode (cli/window/both)
- Low-spec compatibility flags
- Window configuration (size, resizable)
- Categories: system, productivity, communication, education, utility

**Performance Tier System** (`client/src/lib/performanceTier.ts`):
Auto-detecting hardware capability tiers with fallback:
- Low: CLI-only, no animations, no effects
- Mid: Windows + icons, limited animations
- High: Full CRT effects, glow, particles, audio
- Auto-adjustment based on FPS monitoring
- Manual override via settings

**File Manager App** (`client/src/components/desktop/apps/FileManagerApp.tsx`):
Visual file browser for the virtual filesystem with navigation, permissions display, and hidden file toggle.

## Backend Architecture
The backend uses Express.js with TypeScript to provide a RESTful API for character management, game state, and data persistence. It employs a session-based architecture and utilizes in-memory storage with PostgreSQL as a fallback for persistence.

## Database Design
PostgreSQL is used with Drizzle ORM for type-safe database interactions. Core tables include Users, Characters, Locations, NPCs, Items, and Game Sessions.

## Game State Management
The game features a multi-step character creation system with AI-driven personalized questions, location-based navigation, a three-tier reputation system, energy/health management, and an inventory system with 11 starter perks and 60+ level-up perks. A comprehensive 17-stat system is implemented, categorized into Physical, Mental, and Spiritual, each with custom polar bear mascot icons.
A comprehensive curriculum system includes 24 courses across 4 GED test areas, with auto-generated textbooks and lectures, and commands for grades, transcripts, and schedules. Natural Language Processing (NLP) powered by GPT-4.1-mini allows for natural language command interpretation. Console accessibility features include voice input, a command palette, arrow key command history, and ARIA support. Memory optimization is achieved via an LRU cache for game content.

### Terminal Commands for Accessibility & i18n
- **ACCESSIBILITY [LIST|<profile>|SET <setting> <value>]**: Manage accessibility profiles (default, lowVision, screenReader, neurodivergent, dyslexia, protanopia, deuteranopia). Settings include fontSize, highContrast, reducedMotion, dyslexiaFont.
- **LANG [LIST|<code>]**: Switch interface language (en, es, fr, de, zh). Automatically updates glossary language and textbook UI strings.
- **GLOSSARY [<term>|SEARCH <query>|<subject>]**: Look up educational terms. Subjects: math, science, language, social. Returns definitions, examples, and related terms.

### Localized Content System
The LocalizedContentManager (`client/src/lib/localizedContent.ts`) provides language-aware educational content:
- Textbook navigation UI strings localized in 5 languages
- Subject names translated per language
- Chapter headers and practice question labels localized
- Core educational content remains in English (international academic standard) with localized UI/navigation
Advanced systems include an Object Interaction Resolver for emergent gameplay with bias profiles, authority rules, and outcome profiles; a Research Notebook System for in-game note-taking, resource linking, and AI-powered study recommendations; and an Academy OS Engagement Tracking System for analytics and adaptive learning recommendations based on activity and progress.
A Dialogue Modulation System ensures NPCs react differently based on player stats and faction biases, detecting stat conflicts and adapting tone. An Ambient World Change System provides environmental signals (visual, audio, access, spatial) reflecting faction reputation shifts. The Confluence Hall System describes a shared corridor where faction ambiences clash and stat conflicts create interference patterns. A GED Culmination System defines five unique "Departure Vectors" for graduation based on build coherence rather than just stat maximization. Finally, a Crisis Intervention System, personified by Watchwarden Elias Hale, provides trauma-informed, language-driven safety interventions with escalation detection, severity levels, and grounding exercises, connecting to real-world crisis resources.

# External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting.
- **OpenAI**: Integrated via Replit AI for character creation and NLP.
- **Radix UI**: Headless component primitives.
- **Lucide React**: Icon library.
- **React Hook Form**: Form state management.
- **Date-fns**: Date manipulation utilities.
- **Vite**: Build tool and development server.
- **ESBuild**: Fast JavaScript bundler.