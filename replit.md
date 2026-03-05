# Overview
"The Academy" is an interactive text-based RPG set in a mysterious private school, offering a blend of nostalgic gameplay, interactive storytelling, and educational content. It features personalized gameplay through AI within a "Academy OS" with a Neo-CRT aesthetic. The project aims to provide an immersive, educational, and engaging experience, targeting both the gaming and educational technology markets, with a vision to become a leading platform for gamified learning.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is a React with TypeScript single-page application, presented within a "Neo-CRT Academy OS Wrapper." This OS features a retro-modern design with pure black backgrounds, neon elements, subtle CRT effects, and a day/night shader system. Key UI elements include responsive layout, resizable multi-window management, a customizable sidebar (Personal Profile, E-Mail, Assignments Portal), and a taskbar (Class Schedule, Notifications, Settings). The game runs in a resizable window with a terminal-first design. Styling uses Tailwind CSS, adapted shadcn/ui components, and Lucide React. React Query manages server state. A Dual-Mode UI System allows toggling between a Legacy Mode (terminal-first) and a Student Mode (clickable windows). Core OS systems include a Linux-style Virtual Filesystem and an App Manifest System. State management is handled by `GameStateContext`, `NotificationsContext`, `I18nContext`, and `CrtThemeContext`, with persistence via `localStorage`.

## Radiant AI System
The Academy incorporates a comprehensive NPC AI system for autonomous behavior, procedural generation, and emergent social dynamics. NPCs have detailed stats, personality (Big Five), emotions, memory, and affiliations. A Goals System manages adaptive objectives, while a Relationships system tracks affinity and history. A Schedule System defines daily routines, and a Decision Engine processes information to output actions. The Dialogue System enables autonomous, context-aware conversations. World Events and Event Chaining affect NPC behavior and can trigger follow-up events, including Adaptive Goal Evolution, an Emergent Faction System, and Procedural NPC Generation.

## Resonance System (Physics-Based Narrative Engine)
This system provides emergent narrative through energy transference, relational space, and quantum-inspired mechanics. Actions emit energy along multiple axes (e.g., Force, Order, Clarity, Connection) that propagates through a graph of nodes (NPCs, locations, concepts). Nodes have force types (inertial, amplifying, dampening) that transform energy. The system includes quantum-inspired mechanics like superposition, observation, and phase evolution, along with a Geometric Manifold System where nodes are positioned in conceptual 3D space, affecting energy propagation. A Skill System tracks Excellence, Efficacy, and Perception, influenced by energy types.

## NPC Social Network — ADD NPC System
Both ChatLink and Academy Email apps feature an NPC contact discovery system powered by RadiantAI. An `NPCDirectoryPanel` lists all RadiantAI NPCs with search and filter capabilities. Affinity Gates determine interaction possibilities (e.g., RIVAL = BLOCKED, FRIEND = priority connect). This system allows players to initiate conversations or send emails to NPCs, with responses and interaction quality modulated by their affinity.

## Education OS — GED Curriculum System
The Assignments Portal is a comprehensive Education OS with:
- **Curriculum Data**: 4 complete GED textbooks (RLA, Math, Social Studies, Science) aligned with Kaplan 2022–2023, featuring 25 chapters, 30+ lessons with educational content, key terms, and 100+ MCQ practice questions. Each lesson is tagged with difficulty and GED assessment codes.
- **Curriculum Progression Bridge**: Tracks quiz scores, awards XP, computes subject readiness, and applies stat bonuses. It recommends the next incomplete/unmastered lesson.
- **Schema Extensions**: `GEDLesson`, `GEDPracticeQuestion`, and `StudentCurriculumProgress` types are defined for tracking.
- **GameStateContext integration**: `curriculumProgress` is persisted, and `recordLessonQuiz` atomically applies XP, stat bonuses, and progress.
- **Assignments Portal UI**: A multi-screen Education OS for navigating subjects, chapters, and lessons, with in-portal quizzes and results.
- **Language Courses**: Procedurally generated courses for Spanish, French, German, and Chinese, with vocabulary and grammar content, offering 112+ lessons.

## Academy Engine - Cognitive Infrastructure
This four-phase learning system includes:
- **Core Cognition**: Manages a skill graph (40 GED-aligned skill nodes), student journals, a procedural homework engine, and student profiles.
- **Assessment Layer**: Extracts mastery signals, estimates confidence, and generates GED-class exams.
- **Governance**: Provides curriculum versioning and teacher authority.
- **Lore/Narrative**: Offers narrative modes to wrap prompts. Ethical AI practices are enforced.

## Backend Architecture
The backend uses Express.js with TypeScript, providing a RESTful API for character management, game state, and data persistence. It utilizes session-based architecture with in-memory storage and PostgreSQL as a fallback.

## Database Design
PostgreSQL with Drizzle ORM is used for type-safe database interactions, storing data for Users, Characters, Locations, NPCs, Items, and Game Sessions.

## Game State Management
Features include AI-driven character creation, location-based navigation, a three-tier reputation system, energy/health management, and an inventory system. A 17-stat system (Physical, Mental, Spiritual) is implemented. The curriculum system offers 24 courses across 4 GED areas with auto-generated textbooks. Natural language processing interprets commands. Accessibility features include voice input and a command palette. Advanced systems include an Object Interaction Resolver, Research Notebook, and a Crisis Intervention System.

## Perk System
- **Starter Perk Flow**: On first boot, players select 2 perks from 11 categories (combat/social/academic/survival/mystical), which grant stat bonuses and are stored in `character.starterPerks`.
- **PerksViewer App**: A desktop icon (`charstats`/perks) provides a redesigned viewer with four tabs: AVAILABLE (level-up perks the player can unlock), ACTIVE (all earned perks), LOCKED (perks still gated by requirements), and ALL STARTER (for reference). Perks are rarity-gated (common, uncommon, rare, legendary) and display effects with glowing numbers and StatIcon sprites.

## Academy Administrative OS — Institutional Monitor
A four-tab administrative dashboard (`client/src/components/desktop/apps/AcademyAdminApp.tsx`) powered by `client/src/lib/academyInstitution.ts`:

- **OVERVIEW tab**: Institutional metrics grid (level, resonance, GED readiness, lessons, trials, artifacts), domain stability progress bars, subject readiness report cards, and fragile domain alerts.
- **ECOLOGY tab**: Interactive SVG Knowledge Ecology Map showing the 4 GED domains as colored nodes (RLA amber, MATH blue, SCI green, SOC pink) with cross-domain memory bleed lines. Clicking a node reveals a detail panel with STABILITY/TENSION/TREND/READINESS metrics. Bleed cross-links: MATH→SCI (30%), SCI→MATH (15%), RLA→SOC (25%), SOC→RLA (15%).
- **EPOCHS tab**: Archival time-layer timeline showing learning sessions (epochs) with snapshot data (level, XP, lessons, avg score). Pending artifacts accumulate per-epoch and persist to past epochs. Artifact types: Breakthrough, Synthesis, Milestone, Struggle.
- **TRIALS tab**: Synthesis Trial Registry of 8 pre-defined alignment events organized in 4 tiers (Foundation → Dual-Domain → Multi-Domain → Capstone GED). Trials auto-unlock when domain mastery thresholds are met. Initiating a trial runs a timed alignment event and logs artifacts.

**Data model** (`academyInstitution.ts`): `ArchivalEpoch`, `EpochArtifact`, `DomainTension`, `SynthesisTrial` types with localStorage persistence. `computeDomainTensions()` calculates stability/tension per domain using `computeAllSubjectProgress`. `getInstitutionalSummary()` provides the dashboard summary. **Desktop icon**: `institution` type, green color, `Landmark` icon, column 3 row 0.

## Document System — Block-Based Word Processor
The Academy includes a structured document authoring system built on top of the virtual filesystem:
- **AcademyDoc format** (`client/src/lib/academyDocuments.ts`): Schema-versioned JSON stored as `.acd` files in `/home/student/documents/`. Documents have title, subject, tags, author, version, and a `blocks` array.
- **9 block types**: `paragraph`, `heading1`, `heading2`, `heading3`, `code` (with language tag), `quote`, `math`, `annotation` (with citation), `divider`.
- **Rich-text support**: Paragraph and heading blocks use `contentEditable` divs supporting Bold/Italic/Underline/Strikethrough/alignment/font-size/text-color via the formatting toolbar.
- **WordProcessorApp** (`client/src/components/desktop/apps/WordProcessorApp.tsx`): Block-based editor with:
  - Left sidebar showing all `.acd` files with search, "+NEW DOCUMENT" button.
  - File toolbar: SAVE, NEW, UNDO/REDO (40-state history), block type shortcuts, COPY TEXT.
  - **Rich text formatting toolbar**: B/I/U/S buttons, 4 font-size presets, 6 CRT text-color dots, alignment (left/center/right), remove-formatting, TEMPLATE dropdown.
  - **4 document templates**: Five-Paragraph Essay, Lab Report, Math Worksheet, Study Notes — auto-fill title/subject/tags/blocks on selection.
  - 2.2-second debounced autosave + Ctrl+S for immediate save.
  - Status bar: block count, word count, SAVED/UNSAVED/SAVING indicator.
- **Desktop icon**: `wordproc` type, amber color, `FilePen` icon, at column 3 row 1.
- **VFS integration**: Documents persist in the virtual filesystem; `academyDocs.seedDefaults()` creates a "Getting Started" guide on first run.

## Scientific Calculator
- **Calculator** (`client/src/components/desktop/apps/Calculator.tsx`): Full TI-style scientific + graphing calculator (420×560 window).
  - **CALC tab**: Expression display (expression + result rows), arithmetic, scientific functions (sin/cos/tan/asin/acos/atan/sinh/cosh/tanh, log/ln, abs, √, ∛, x²), constants (π, e), parentheses, ANS, percent; DEG/RAD mode toggle; 2nd-shift for inverse trig functions.
  - **Memory**: M+, M-, MR, MC buttons; memory value shown in header.
  - **History panel**: HIST toggle — shows last 30 calculations; click any entry to recall it; CLEAR button.
  - **GRAPH tab**: Function input (f(x) expression), PLOT button, adjustable x/y range, SVG graph with grid lines, axes, and continuous curve rendering with discontinuity handling.
  - Safe expression evaluator using sanitized Function() with all math built-ins mapped.
- **Desktop icon**: `calculator` type, green color, at column 3 row 3.

## File Manager
- **FileManagerApp** (`client/src/components/desktop/apps/FileManagerApp.tsx`): Full VFS file manager (550×420 window).
  - Toolbar: Up, Home, Refresh, path breadcrumb, FILE (new file), DIR (new folder/mkdir), Eye (preview toggle), Sort dropdown (name/size/type), Hidden-files toggle, PASTE (when clipboard active).
  - **Preview pane**: Right-side 200px panel showing selected file metadata (type, permissions, size, modified date) + content preview; `.acd` files show parsed title and block text preview.
  - **Folder creation**: DIR button → amber input row → Enter to create via `virtualFS.mkdir()`.
  - **Copy/Paste**: Copy icon on selected file → navigate to destination → PASTE button.
  - Rename (edit icon) and Delete-to-trash (trash icon) for writable files.
  - Column headers with sort: directories always sorted first.
- **Desktop icon**: `files` type, cyan color, at column 3 row 2.

## GED Graduation System
The game features a complete GED preparation and graduation system. Skill progress is tracked via game flags, becoming "emerging" after 2 attendances and "stable/mastered" after 5. Players need 3+ stable skills per domain to be GED ready. Upon readiness, the `GRADUATION CEREMONY` command initiates the Confluence Hall experience, a multi-node journey leading to different "Departure Vectors" influenced by player stats and faction interactions.

# External Dependencies
- **Neon Database**: Serverless PostgreSQL hosting.
- **OpenAI**: Integrated via Replit AI for character creation and NLP.
- **Radix UI**: Headless component primitives.
- **Lucide React**: Icon library.
- **React Hook Form**: Form state management.
- **Date-fns**: Date manipulation utilities.
- **Vite**: Build tool and development server.
- **ESBuild**: Fast JavaScript bundler.