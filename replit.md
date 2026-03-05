# Overview
"The Academy" is an interactive text-based RPG set in a mysterious private school, blending nostalgic gameplay, interactive storytelling, and educational content. It offers personalized gameplay through AI within a "Academy OS" with a Neo-CRT aesthetic. The project aims to provide an immersive, educational, and engaging experience, targeting both gaming and educational technology markets, with a vision to become a leading platform for gamified learning.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is a React with TypeScript single-page application using a "Neo-CRT Academy OS Wrapper." It features a retro-modern design with a responsive layout, resizable multi-window management, customizable sidebar, and taskbar. The game runs in a resizable window with a terminal-first design. Styling uses Tailwind CSS, shadcn/ui components, and Lucide React. React Query manages server state. A Dual-Mode UI System allows toggling between Legacy (terminal-first) and Student (clickable windows) modes. Core OS systems include a Linux-style Virtual Filesystem and an App Manifest System. State management is handled by `GameStateContext`, `NotificationsContext`, `I18nContext`, and `CrtThemeContext`, with persistence via `localStorage`.

## Radiant AI System
A comprehensive NPC AI system provides autonomous behavior, procedural generation, and emergent social dynamics. NPCs have stats, personality (Big Five), emotions, memory, and affiliations, managed by a Goals System, Relationships system, and Schedule System. A Decision Engine processes information to output actions, and a Dialogue System enables autonomous, context-aware conversations. World Events and Event Chaining affect NPC behavior, leading to Adaptive Goal Evolution, an Emergent Faction System, and Procedural NPC Generation.

## Resonance System (Physics-Based Narrative Engine)
This system provides emergent narrative through energy transference, relational space, and quantum-inspired mechanics. Actions emit energy along multiple axes (e.g., Force, Order, Clarity, Connection) that propagates through a graph of nodes (NPCs, locations, concepts). Nodes have force types that transform energy. Quantum-inspired mechanics like superposition, observation, and phase evolution, along with a Geometric Manifold System, influence energy propagation. A Skill System tracks Excellence, Efficacy, and Perception, influenced by energy types.

## NPC Social Network
The `NPCDirectoryPanel` in ChatLink and Academy Email apps lists all RadiantAI NPCs with search and filter capabilities. Affinity Gates determine interaction possibilities. This allows players to initiate conversations or send emails, with interaction quality modulated by NPC affinity.

## Education OS — GED Curriculum System
The Assignments Portal is a comprehensive Education OS with:
- **Curriculum Data**: 4 complete GED textbooks (RLA, Math, Social Studies, Science) aligned with Kaplan 2022–2023, featuring 25 chapters, 30+ lessons, and 100+ MCQ practice questions. Each lesson is tagged with difficulty and GED assessment codes.
- **Curriculum Progression Bridge**: Tracks quiz scores, awards XP, computes subject readiness, and applies stat bonuses, recommending the next lesson.
- **Schema Extensions**: `GEDLesson`, `GEDPracticeQuestion`, and `StudentCurriculumProgress` types are defined.
- **GameStateContext integration**: `curriculumProgress` is persisted, and `recordLessonQuiz` atomically applies XP, stat bonuses, and progress.
- **Assignments Portal UI**: A multi-screen Education OS for navigating curriculum and taking in-portal quizzes.
- **Language Courses**: Procedurally generated courses for Spanish, French, German, and Chinese, offering 112+ lessons.

## Academy Engine - Cognitive Infrastructure
This four-phase learning system includes:
- **Core Cognition**: Manages a skill graph (40 GED-aligned skill nodes), student journals, a procedural homework engine, and student profiles.
- **Assessment Layer**: Extracts mastery signals, estimates confidence, and generates GED-class exams.
- **Governance**: Provides curriculum versioning and teacher authority.
- **Lore/Narrative**: Offers narrative modes to wrap prompts, enforcing ethical AI practices.

## Backend Architecture
The backend uses Express.js with TypeScript, providing a RESTful API for character management, game state, and data persistence. It utilizes a session-based architecture with in-memory storage and PostgreSQL as a fallback.

## Database Design
PostgreSQL with Drizzle ORM is used for type-safe database interactions, storing data for Users, Characters, Locations, NPCs, Items, and Game Sessions.

## Game State Management
Features include AI-driven character creation, location-based navigation, a three-tier reputation system, energy/health management, and an inventory system. A 17-stat system (Physical, Mental, Spiritual) is implemented. The curriculum system offers 24 courses across 4 GED areas with auto-generated textbooks. Natural language processing interprets commands, and accessibility features include voice input and a command palette. Advanced systems include an Object Interaction Resolver, Research Notebook, and a Crisis Intervention System.

## Perk System
On first boot, players select 2 perks from 11 categories (combat/social/academic/survival/mystical), granting stat bonuses. The PerksViewer App displays available, active, locked, and starter perks, which are rarity-gated (common, uncommon, rare, legendary) and show effects with StatIcon sprites.

## Academy Administrative OS — Institutional Monitor
A four-tab administrative dashboard (`AcademyAdminApp.tsx`) provides:
- **OVERVIEW**: Institutional metrics, domain stability, subject readiness, and fragile domain alerts.
- **ECOLOGY**: Interactive SVG Knowledge Ecology Map showing 4 GED domains with cross-domain memory bleed lines and detailed metrics.
- **EPOCHS**: Archival time-layer timeline showing learning sessions with snapshot data and accumulating artifacts (Breakthrough, Synthesis, Milestone, Struggle).
- **TRIALS**: Synthesis Trial Registry of 8 pre-defined alignment events in 4 tiers, unlocking when domain mastery thresholds are met.

## Document System — Block-Based Word Processor
A structured document authoring system built on the virtual filesystem:
- **AcademyDoc format**: Schema-versioned JSON stored as `.acd` files in `/home/student/documents/`, with title, subject, tags, author, version, and a `blocks` array.
- **9 block types**: Paragraph, headings, code, quote, math, annotation, divider.
- **Rich-text support**: For paragraph and heading blocks.
- **WordProcessorApp**: Block-based editor with a left sidebar for file management, a file toolbar (SAVE, NEW, UNDO/REDO), a rich text formatting toolbar, and 4 document templates (Five-Paragraph Essay, Lab Report, Math Worksheet, Study Notes). Features debounced autosave and Ctrl+S save.

## Scientific Calculator
A full TI-style scientific + graphing calculator (420×560 window) with:
- **CALC tab**: Expression display, arithmetic, scientific functions, constants, parentheses, ANS, percent, DEG/RAD mode, 2nd-shift for inverse trig functions.
- **Memory**: M+, M-, MR, MC buttons.
- **History panel**: Shows last 30 calculations.
- **GRAPH tab**: Function input, PLOT button, adjustable x/y range, SVG graph with grid lines, axes, and continuous curve rendering with discontinuity handling.

## File Manager
A full VFS file manager (550×420 window) with:
- **Toolbar**: Up, Home, Refresh, path breadcrumb, UPLOAD (imports OS files to VFS), FILE (new file), DIR (new folder/mkdir), Eye (preview toggle), Sort dropdown, Hidden-files toggle, PASTE.
- **Preview pane**: Right-side panel showing selected file metadata and content preview.
- **File upload/download**: Import local files to VFS and download VFS files.
- **Folder creation, Copy/Paste, Rename, Delete-to-trash**: Standard file operations for writable files.

## Desktop Geometric Grid Layout
Icons are arranged in a clean 3-column, 6-row geometric grid (`DESKTOP_POSITIONS_KEY = v4`):
- **Row 0**: Academy Email · ChatLink · Institution
- **Row 1**: Assignments · Schedule · Word Processor
- **Row 2**: Progress · Perks Viewer · Skill Graph
- **Row 3**: Resonance · Cub Link (col 2 intentionally empty)
- **Row 4**: School Files · Personal Files · Notebook
- **Row 5**: The Academy · Orientation/Tutorial · Char Stats
Settings and Recycle Bin are accessible via the taskbar quick-launch strip rather than the desktop grid.

## Orientation / Tutorial System
`TutorialApp.tsx` has 13 chapters (expanded from 10):
- **Welcome** (INIT) · **Command Terminal** (CMD) · **Atrium Rite** (LIVE) · **Resonance** (CORE) · **The Cycle** (SYS) · **Assignments & GED** (STUDY) · **Three Pillars** (CORE) · **Disciplines** (DATA) · **Your Constellation** (MAP) · **NPC Interface** (SOCIAL) · **Living Academy** (WORLD) · **Hidden Systems** (DEPTH) · **Begin** (EXEC)
Three new practical chapters teach players how to operate the text adventure command prompt (navigation/action/interaction commands), complete GED assignments step-by-step, and engage with NPCs via terminal, ChatLink, and Academy Email.

## Mentor Commentary in Assignments Portal
`MentorCommentaryPanel` is injected at the top of `LessonView` in `AssignmentsPortal.tsx`. It shows a subject-specific mentor quote and a reading focus prompt. The panel is expanded by default (first visit) and collapses persistently via a localStorage key per `lesson.gedCode`. Subject-to-mentor mapping: Math → Prof. Chen · Language Arts → Ms. Rivera · Social Studies → Dr. Okafor · Science → Instructor Vasquez · Other → Archivist Ilyra.

## Desktop Wallpaper System
Wallpapers are stored in `localStorage` and can be `null` (default), `preset:<id>`, or `image:<dataUrl>`.
- **8 built-in presets**: VOID, AURORA, NEBULA, DUSK, STORM, DEEP FOREST, CRIMSON, GRID.
- **Right-click context menu**: "Set Wallpaper" opens a picker panel with presets and custom image upload.
- **Custom image upload**: Supports any image format, stored as base64 `data:` URL, displayed with a 72% dark overlay.
- **Settings app integration**: WALLPAPER section in `SettingsApp.tsx` with preset grid and upload options.
- **Cross-component sync**: Wallpaper changes are synced in real time across components.

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