# Overview
"The Academy" is an interactive text-based RPG set in a mysterious private school. It blends nostalgic gameplay, interactive storytelling, and educational content, offering a personalized experience through AI within a "Academy OS" with a Neo-CRT aesthetic. The project aims to provide an immersive, educational, and engaging experience, targeting both gaming and educational technology markets, with a vision to become a leading platform for gamified learning.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is a React with TypeScript single-page application utilizing a "Neo-CRT Academy OS Wrapper" for a retro-modern design. It features responsive layouts, multi-window management, customizable sidebar and taskbar, and a terminal-first game window. Styling is handled by Tailwind CSS, shadcn/ui components, and Lucide React. Server state is managed with React Query. A Dual-Mode UI System allows switching between Legacy (terminal-first) and Student (clickable windows) modes. Core OS systems include a Linux-style Virtual Filesystem and an App Manifest System. State persistence is managed via `localStorage`.

## AI Description Engine — Education-Aware Narrative
The text adventure's descriptive language is enhanced by a server-side OpenAI endpoint (`POST /api/ai/describe`). It operates in two modes:
- **Location mode** (`LOOK` command): After the base location description renders, a 2–4 sentence AI-generated paragraph adds atmospheric, sensory, and educationally-inflected flavor text — connecting the room's physical details to themes of knowledge, study, and intellectual curiosity. Uses `gpt-4.1-mini` with a Neo-Gothic academic system prompt.
- **Examine mode** (`EXAMINE` command): Replaces the previous hardcoded switch statement with AI-generated 2–3 sentence contextual descriptions for any interactable object. A `[ examining... ]` placeholder appears while the AI generates, then is replaced by the result.
Both modes cache results client-side (per location + target) so repeat visits and examines don't re-call the API. A `'narrative'` terminal line type (rendered italic in soft purple) visually distinguishes AI flavor text from system output and base descriptions.

## Radiant AI System
This comprehensive NPC AI system provides autonomous behavior, procedural generation, and emergent social dynamics. NPCs have stats, personality, emotions, memory, and affiliations, managed by Goals, Relationships, and Schedule Systems. A Decision Engine processes information to output actions, and a Dialogue System enables autonomous, context-aware conversations. World Events and Event Chaining influence NPC behavior, leading to Adaptive Goal Evolution, an Emergent Faction System, and Procedural NPC Generation.

## Resonance System (Physics-Based Narrative Engine)
This system provides emergent narrative through energy transference, relational space, and quantum-inspired mechanics. Actions emit energy along multiple axes that propagates through a graph of nodes (NPCs, locations, concepts). Nodes transform energy based on their force types. Quantum-inspired mechanics (superposition, observation, phase evolution) and a Geometric Manifold System influence energy propagation. A Skill System tracks Excellence, Efficacy, and Perception, influenced by energy types.

## NPC Social Network
The `NPCDirectoryPanel` in ChatLink and Academy Email apps allows players to view, search, and filter RadiantAI NPCs. Affinity Gates determine interaction possibilities, modulating interaction quality based on NPC affinity.

## Education OS — GED Curriculum System
The Assignments Portal functions as a comprehensive Education OS. It includes:
- **Curriculum Data**: 4 complete GED textbooks (RLA, Math, Social Studies, Science) aligned with Kaplan 2022–2023, featuring 25 chapters, 30+ lessons, and 100+ MCQ practice questions.
- **Curriculum Progression Bridge**: Tracks quiz scores, awards XP, computes subject readiness, applies stat bonuses, and recommends lessons.
- **Schema Extensions**: Defines types for `GEDLesson`, `GEDPracticeQuestion`, `StudentCurriculumProgress`, `LessonEcology`, `LearnerCognitiveModel`, and `CognitiveState`.
- **GameStateContext Integration**: `curriculumProgress` is persisted, and `recordLessonQuiz` atomically applies various bonuses and ecology updates.
- **Assignments Portal UI**: A multi-screen interface for curriculum navigation and in-portal quizzes, with tabs for GED PREP, LANGUAGES, and CONSTELLATION.
- **Language Courses**: Procedurally generated courses for multiple languages.

## Learner Reflection & Resonance System
This system integrates reflection capture, resonance scoring to amplify mastery, commentary tracking for mentor insights, temporal drift indicators for lesson freshness, and cognitive state visualization (FRACTURED, INTEGRATING, INTERNALIZED, UNTOUCHED). It also includes a Knowledge Ecology tracking `stability`, `coherence`, and `strain`, and a `LearnerCognitiveModel` for tracking `persistence`, `abstractionComfort`, `integrationTendency`, and `recoveryVelocity`.

## Constellation Interface — Spatial Knowledge Map
A spatial knowledge map within the Assignments Portal (`✦ CONSTELLATION`) visually represents GED lessons as star nodes. It features a procedural layout with domain anchors, visual encoding for mastery, resonance, and cognitive state, and prerequisite lines. The interface is interactive with domain filter buttons, tooltips on hover, and direct navigation to lessons on click.

## Academy Engine - Cognitive Infrastructure
This four-phase learning system includes:
- **Core Cognition**: Manages a skill graph (40 GED-aligned skill nodes), student journals, a procedural homework engine, and student profiles.
- **Assessment Layer**: Extracts mastery signals, estimates confidence, and generates GED-class exams.
- **Governance**: Provides curriculum versioning and teacher authority.
- **Lore/Narrative**: Offers narrative modes to wrap prompts, ensuring ethical AI practices.

## Backend Architecture
The backend uses Express.js with TypeScript, providing a RESTful API for character management, game state, and data persistence. It utilizes a session-based architecture with in-memory storage and PostgreSQL as a fallback.

## Database Design
PostgreSQL with Drizzle ORM is used for type-safe database interactions, storing data for Users, Characters, Locations, NPCs, Items, and Game Sessions.

## Game State Management
Features include AI-driven character creation, location-based navigation, a three-tier reputation system, energy/health management, an inventory system, and a 17-stat system (Physical, Mental, Spiritual). The curriculum system offers 24 courses across 4 GED areas with auto-generated textbooks. Natural language processing interprets commands, and accessibility features include voice input and a command palette. Advanced systems include an Object Interaction Resolver, Research Notebook, and a Crisis Intervention System.

## Perk System
Players select 2 perks from 11 categories (combat/social/academic/survival/mystical) on first boot, granting stat bonuses. The PerksViewer App displays available, active, locked, and starter perks, which are rarity-gated (common, uncommon, rare, legendary) and show effects.

## Academy Administrative OS — Institutional Monitor
A four-tab administrative dashboard (`AcademyAdminApp.tsx`) provides:
- **OVERVIEW**: Institutional metrics, domain stability, subject readiness, and alerts.
- **ECOLOGY**: Interactive SVG Knowledge Ecology Map showing GED domains with cross-domain memory bleed lines and detailed metrics.
- **EPOCHS**: Archival time-layer timeline showing learning sessions and accumulating artifacts.
- **TRIALS**: Synthesis Trial Registry of pre-defined alignment events, unlocking based on domain mastery.

## Document System — Block-Based Word Processor
A structured document authoring system built on the virtual filesystem. Documents are schema-versioned JSON stored as `.acd` files, supporting 9 block types (Paragraph, headings, code, quote, math, annotation, divider) with rich-text capabilities. The WordProcessorApp is a block-based editor with file management, toolbars, 4 document templates, debounced autosave, and Ctrl+S save.

## Scientific Calculator
A full TI-style scientific + graphing calculator with a CALC tab for expressions, scientific functions, and memory, and a GRAPH tab for function input, plotting, and adjustable ranges with SVG rendering.

## File Manager
A full VFS file manager with a toolbar for navigation, file/folder creation, upload/download, copy/paste, rename, delete, and a preview pane for metadata and content.

## Desktop Geometric Grid Layout
Icons are arranged in a 3-column, 6-row geometric grid for common applications. Settings and Recycle Bin are accessed via the taskbar.

## Orientation / Tutorial System
`TutorialApp.tsx` contains 13 chapters, including practical guides on the text adventure command prompt, completing GED assignments, and engaging with NPCs.

## Mentor Commentary in Assignments Portal
The `MentorCommentaryPanel` is injected at the top of `LessonView` in `AssignmentsPortal.tsx`, displaying subject-specific mentor quotes and reading focus prompts. It expands by default and collapses persistently, with specific mentors mapped to GED subjects.

## Desktop Wallpaper System
Wallpapers are stored in `localStorage` and can be null (default), a preset, or a custom image. It includes 8 built-in presets, a right-click context menu for "Set Wallpaper" with a picker and custom image upload, and integration with the Settings app. Changes are synced across components.

## GED Graduation System
The game features a complete GED preparation and graduation system. Skill progress is tracked via game flags, becoming "emerging" or "stable/mastered." Players need 3+ stable skills per domain to be GED ready. Upon readiness, the `GRADUATION CEREMONY` command initiates the Confluence Hall experience, a multi-node journey leading to different "Departure Vectors" influenced by player stats and faction interactions.

# External Dependencies
- **Neon Database**: Serverless PostgreSQL hosting.
- **OpenAI**: Integrated via Replit AI for character creation and NLP.
- **Radix UI**: Headless component primitives.
- **Lucide React**: Icon library.
- **React Hook Form**: Form state management.
- **Date-fns**: Date manipulation utilities.
- **Vite**: Build tool and development server.
- **ESBuild**: Fast JavaScript bundler.