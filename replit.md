# Overview
"The Academy" is an interactive text-based RPG set in a private school, offering a blend of nostalgic gameplay, interactive storytelling, and educational content. It provides a personalized experience through AI within an "Academy OS" featuring a Neo-CRT aesthetic. The project aims to deliver an immersive, educational, and engaging experience, targeting both gaming and educational technology markets, with a vision to become a leading platform for gamified learning.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is a React with TypeScript single-page application, featuring a "Neo-CRT Academy OS Wrapper" for a retro-modern design. It includes responsive layouts, multi-window management, customizable UI elements, and a terminal-first game window. Styling uses Tailwind CSS, shadcn/ui components, and Lucide React. Server state is managed with React Query. A Dual-Mode UI System supports both Legacy (terminal-first) and Student (clickable windows) modes. Core OS systems include a Linux-style Virtual Filesystem and an App Manifest System. State persistence is managed via `localStorage`.

## AI Description Engine
A server-side OpenAI endpoint enhances the text adventure's descriptive language in two modes: "Location mode" for atmospheric flavor text and "Examine mode" for contextual object descriptions. Both modes utilize `gpt-4.1-mini` and cache results client-side.

## Radiant AI System
This comprehensive NPC AI system provides autonomous behavior, procedural generation, and emergent social dynamics. NPCs have stats, personality, emotions, memory, and affiliations, managed by Goals, Relationships, and Schedule Systems. A Decision Engine and Dialogue System enable context-aware conversations. World Events influence behavior, leading to Adaptive Goal Evolution, an Emergent Faction System, and Procedural NPC Generation.

## NPC AI Dialogue System
Every NPC conversation is powered by GPT-4.1-mini, utilizing rich system prompts based on NPC entities. It supports free-form conversation, thinking placeholders, player echoes, and topic suggestions to guide interaction.

## Offline Content Engine — Phase 1 & 2 (in progress)
Four-ring offline architecture implementation. Phase 1 (Seed Engine) and Phase 2 (Template Library) are complete.

### Phase 1: Seeded PRNG Engine (`client/src/lib/seededRandom.ts`)
Mulberry32 PRNG providing fully deterministic world generation. Same seed = same world, always. Key exports: `SeededRandom` class, `entitySeed()`, `temporalSeed()`, `conversationSeed()`, `hashString()`, `fillTemplate()`. `WORLD_SEED = 12345`.

### Phase 2: Template Library
- **`dialogueTemplates.ts`**: 10 personality archetypes × 8 emotion states × 6 relationship tiers = rich NPC dialogue without AI. Archetypes: scholar, rebel, leader, nurturer, perfectionist, socialite, loner, optimist, cynic, mentor.
- **`eventTemplates.ts`**: 8 event categories × 25 templates = 200 world events. RSS tag-matching for real-world headline integration. Categories: academic, social, crisis, discovery, competition, institutional, seasonal, mystery.
- **`studyTemplates.ts`**: 4 GED subjects × 14+ questions each = offline GED prep. Includes multiple choice, fill-blank, true/false, short answer, and study prompts.
- **`offlineContentEngine.ts`**: Unified orchestration layer. Key functions: `generateOfflineConversation()`, `generateNPCLine()`, `generateDailyEvents()`, `generateQuizSet()`, `generateContentPack()`, `matchEventsToHeadlines()`, `inferEmotionState()`, `scoreToRelationshipTier()`.

The NPC dialogue fallback in `GameStateContext.tsx` now uses the offline engine (archetype derived from name hash, emotion varies daily) instead of static placeholder text.

## NPC Persistent Memory System
NPC memory is tracked in `localStorage` storing conversation entries with timestamps, topics, and locations. It supports session detection, generates natural-language relationship summaries for AI prompts, provides conversation history for AI, and displays re-encounter notes. This system integrates with RadiantAI for detailed interaction logging.

## Resonance System
This system provides emergent narrative through energy transference and relational space. Actions emit energy across multiple axes, propagating through a graph of nodes (NPCs, locations, concepts). Quantum-inspired mechanics and a Geometric Manifold System influence energy propagation. A Skill System tracks Excellence, Efficacy, and Perception.

## Education OS — GED Curriculum System
The Assignments Portal functions as a comprehensive Education OS, incorporating:
- **Curriculum Data**: 4 complete GED textbooks with chapters and lessons aligned with Kaplan.
- **Curriculum Progression Bridge**: Tracks quiz scores, awards XP, and recommends lessons.
- **Schema Extensions**: Defines types for educational progress and cognitive models.
- **GameStateContext Integration**: Persists curriculum progress and applies bonuses.
- **Assignments Portal UI**: A multi-screen interface for navigation, quizzes, and language courses.

## Learner Reflection & Resonance System
This system captures learner reflection, scores resonance, tracks mentor commentary, and identifies temporal drift. It visualizes cognitive states (FRACTURED, INTEGRATING, INTERNALIZED, UNTOUCHED) and tracks Knowledge Ecology metrics (`stability`, `coherence`, `strain`) and a `LearnerCognitiveModel` (persistence, abstractionComfort, integrationTendency, recoveryVelocity).

## Constellation Interface — Spatial Knowledge Map
A spatial knowledge map within the Assignments Portal (`✦ CONSTELLATION`) visually represents GED lessons as star nodes. It features a procedural layout, visual encoding for mastery, resonance, and cognitive state, prerequisite lines, and interactive elements for navigation and filtering.

## Academy Engine - Cognitive Infrastructure
This four-phase learning system includes:
- **Core Cognition**: Manages a skill graph, student journals, procedural homework, and student profiles.
- **Assessment Layer**: Extracts mastery signals and generates exams.
- **Governance**: Provides curriculum versioning and teacher authority.
- **Lore/Narrative**: Offers narrative modes to ensure ethical AI practices.

## Backend Architecture
The backend uses Express.js with TypeScript, providing a RESTful API for character management, game state, and data persistence. It employs a session-based architecture with in-memory storage and PostgreSQL as a fallback.

## Database Design
PostgreSQL with Drizzle ORM is used for type-safe database interactions, storing data for Users, Characters, Locations, NPCs, Items, and Game Sessions.

## Game State Management
Features include AI-driven character creation, location-based navigation, a three-tier reputation system, energy/health management, an inventory system, and a 17-stat system. It includes a curriculum system with auto-generated textbooks, natural language processing for commands, and accessibility features like voice input. Advanced systems include an Object Interaction Resolver, Research Notebook, and a Crisis Intervention System.

## Perk System
Players select 2 perks from 11 categories (combat/social/academic/survival/mystical) on first boot, granting stat bonuses. The PerksViewer App displays available, active, locked, and starter perks, which are rarity-gated (common, uncommon, rare, legendary) and show effects.

## Academy Administrative OS — Institutional Monitor
A four-tab administrative dashboard (`AcademyAdminApp.tsx`) provides:
- **OVERVIEW**: Institutional metrics, domain stability, subject readiness, and alerts.
- **ECOLOGY**: Interactive SVG Knowledge Ecology Map.
- **EPOCHS**: Archival time-layer timeline of learning sessions.
- **TRIALS**: Synthesis Trial Registry of alignment events.

## Academic Citation Engine
A full-featured client-side citation and academic style reference tool with four tabs:
- **GENERATE**: Form-based citation builder for various source types, outputting formatted citations in APA, MLA, CMS, or ACS styles.
- **VALIDATE**: Parses reference strings, auto-detects style, and provides an ICM Compliance Score, completeness score, and improvement suggestions.
- **CONVERT**: Converts citations between supported styles.
- **GUIDE**: Provides collapsible quick-reference cards for each style.

## Document System — Block-Based Word Processor
A structured document authoring system built on the virtual filesystem. Documents are schema-versioned JSON supporting 9 block types with rich-text capabilities. The WordProcessorApp is a block-based editor with file management, toolbars, templates, and autosave.

## Scientific Calculator
A full TI-style scientific and graphing calculator with a CALC tab for expressions and functions, and a GRAPH tab for plotting functions with adjustable ranges.

## File Manager
A full VFS file manager with a toolbar for navigation, file/folder operations, upload/download, and a preview pane.

## Orientation / Tutorial System
A tutorial system (`TutorialApp.tsx`) with 13 chapters, including practical guides on the text adventure command prompt, GED assignments, and NPC interaction.

## Mentor Commentary in Assignments Portal
The `MentorCommentaryPanel` is injected into `LessonView` in `AssignmentsPortal.tsx`, displaying subject-specific mentor quotes and reading focus prompts, with specific mentors mapped to GED subjects.

## Desktop Wallpaper System
Wallpapers are stored in `localStorage` and can be null (default), a preset, or a custom image. It includes 8 built-in presets, a right-click context menu for "Set Wallpaper" with a picker and custom image upload, and integration with the Settings app.

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