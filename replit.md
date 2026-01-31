# Overview

"The Academy" is an interactive text-based RPG that aims to combine nostalgic gameplay with advanced interactive storytelling and educational content. Players navigate a mysterious private school, making choices that influence their character's stats, reputation, and story. The game provides personalized gameplay through AI-powered elements within a simulated "Academy OS" featuring a Neo-CRT aesthetic. The project's vision is to offer an immersive, educational, and engaging experience in a text-based RPG format, with a potential market in both gaming and educational technology.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is a React with TypeScript single-page application, wrapped in a "Neo-CRT Academy OS Wrapper." This OS features a retro-modern design with pure black backgrounds, neon elements, subtle CRT effects, and a day/night shader system. The desktop includes responsive layout, resizable multi-window management, and a multi-color neon palette. Core desktop elements include a customizable sidebar with apps like Personal Profile, E-Mail, and Assignments Portal, and a taskbar with quick access to Class Schedule, Notifications, and Settings.

The game itself runs within a resizable window, offering a terminal-first design with a black background, green monospace text, a header, and a 17-stat sidebar. Styling uses Tailwind CSS, adapted shadcn/ui components, and Lucide React. React Query manages server state.

### Neo-CRT Enhanced Features
The desktop implements a comprehensive Neo-CRT aesthetic system, including a 3.5-second synthesized boot jingle using Web Audio API with mechanical and digital sounds, and visual effects like screen bloom, cursor pulse, resonance distortion, scanline drift, and fuzzy bubble notifications.

A Dual-Mode UI System allows toggling between a Legacy Mode (terminal-first, command-driven) and a Student Mode (clickable windows). Interactive features include a command autocomplete system, window snap zones, and ambient desktop objects.

### Academy OS Core Systems
A Linux-style Virtual Filesystem manages paths and permissions, supporting commands like `ls`, `cd`, and `cat`. An App Manifest System provides a modular application registry, defining app properties and categories. A Performance Tier System auto-detects hardware capabilities and adjusts visual effects and animations accordingly, with manual override options.

### State Management Contexts
Centralized state management is handled by `GameStateContext` (for character data, emails, messages, Cub Affection), `NotificationsContext`, `I18nContext` (for internationalization), and `CrtThemeContext` (for theme management). All game state is persisted via `localStorage`.

### Desktop Apps
Key desktop applications include:
- `AcademyEmailApp`: Full email client with categories, unread counts, and reply functionality.
- `MessagesApp`: Direct messaging interface for NPC/student communication with conversation threading.
- `PersonalProfileApp`: Character profile display.
- `CubCompanion`: Interactive companion app with mood and affection tracking.
- `ResonanceDashboard`: Spiritual stats visualization.
- `PerksViewer`: Perk browser.

### Game-Desktop Integration
Game events trigger desktop app notifications:
- Talking to NPCs may trigger follow-up messages (15% chance) in the Messages app
- Attending classes may trigger instructor emails (25% chance) in the Email app
- Attending classes awards 10 XP to the character
- Email and Message replies receive automatic NPC responses after a realistic delay

### Academy Engine - Cognitive Infrastructure
A four-phase learning system with ethics enforcement:
- **Phase 1 - Core Cognition**: Manages a skill graph (40 GED-aligned skill nodes), student journals for research and reflections, a procedural homework engine, and detailed student profiles.
- **Phase 2 - Assessment Layer**: Extracts mastery signals from behavior, estimates student confidence, and procedurally generates GED-class exams.
- **Phase 3 - Governance**: Provides curriculum versioning and a teacher authority layer for curriculum changes.
- **Phase 4 - Lore/Narrative**: Offers narrative modes to wrap prompts without affecting learning logic.
- **Options**: Includes an `ethicsLockfile` to enforce ethical AI practices, a `portfolioGenerator` for GED alignment, and `versionFreeze` for reproducibility.

Desktop apps supporting the Academy Engine include `SkillGraphApp`, `ResearchNotebookApp`, and `ProgressDashboardApp`. The design emphasizes non-punitive, student-owned, transparent, ethical, and GED-aligned learning.

## Backend Architecture
The backend uses Express.js with TypeScript, providing a RESTful API for character management, game state, and data persistence. It uses session-based architecture with in-memory storage and PostgreSQL as a fallback.

## Database Design
PostgreSQL with Drizzle ORM is used for type-safe database interactions, including tables for Users, Characters, Locations, NPCs, Items, and Game Sessions.

## Game State Management
Features include a multi-step character creation system with AI-driven questions, location-based navigation, a three-tier reputation system, energy/health management, and an inventory system. A 17-stat system (Physical, Mental, Spiritual) is implemented. A curriculum system offers 24 courses across 4 GED areas, with auto-generated textbooks and NLP for natural language command interpretation. Accessibility features include voice input, a command palette, and ARIA support.

### Terminal Commands for Accessibility & i18n
- `ACCESSIBILITY`: Manages accessibility profiles and settings (e.g., `fontSize`, `highContrast`).
- `LANG`: Switches interface language (en, es, fr, de, zh), updating glossary and textbook UI strings.
- `GLOSSARY`: Looks up educational terms.

A Localized Content System provides language-aware educational content for UI strings, subject names, and chapter headers, while core educational content remains in English. Advanced systems include an Object Interaction Resolver, Research Notebook System, Academy OS Engagement Tracking System, Dialogue Modulation System, Ambient World Change System, Confluence Hall System, GED Culmination System, and a Crisis Intervention System for trauma-informed support.

# External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting.
- **OpenAI**: Integrated via Replit AI for character creation and NLP.
- **Radix UI**: Headless component primitives.
- **Lucide React**: Icon library.
- **React Hook Form**: Form state management.
- **Date-fns**: Date manipulation utilities.
- **Vite**: Build tool and development server.
- **ESBuild**: Fast JavaScript bundler.

# Recent Playtesting & Verification (January 2026)

## Verified Systems
All core systems have been playtested and verified functional:

1. **Character Creation**: Multi-step AI-driven character creation with physical appearance questions, race/class/faction selection working correctly
2. **Game Terminal**: Command interpretation, NLP processing, and game navigation all functional (verified through character creation flow; automated testing of in-game commands has accessibility limitations)
3. **Desktop Apps**: All verified working - Skill Graph, Assignments Portal, Resonance Dashboard, Perks Viewer, Research Notebook, Progress Dashboard
4. **Educational Content**: 
   - 40 GED-aligned skill nodes across 5 domains (Math, Language, Science, Social, Reasoning)
   - 24 courses with procedurally generated textbooks, chapters, and lectures
   - Assignments with quizzes, essays, and lab reports
5. **Game-Desktop Integration**: NPC messages and class emails trigger correctly

## GED Graduation System (January 2026)
The Academy now includes a complete GED preparation and graduation system:

### Skill Progress Tracking
- Skills tracked via game flags (`stable_skills`, `emerging_skills`)
- Attending classes increments attendance count for each course
- After 2 attendances: skill becomes "emerging"
- After 5 attendances: skill becomes "stable/mastered"
- Skills are prefixed by domain: MATH_, LANG_, SCI_, SOC_

### GED Readiness Requirements
- Need 3+ stable skills per domain (Mathematical Reasoning, Language Arts, Science, Social Studies)
- Check progress with GRADUATION command
- When ready, type GRADUATION CEREMONY to trigger graduation

### Terminal Commands Added
- ENROLL - View available GED courses
- ENROLL [course] - Enroll in a specific course
- COURSES - Browse course catalog
- ASSIGNMENTS - View pending assignments
- TEXTBOOK [course] - Read course textbook
- GRADUATION / GED - Check GED progress
- GRADUATION CEREMONY - Trigger graduation when ready

## Bug Fixes Applied
- Fixed null-safety issues in character energy calculations (routes.ts)
- Fixed schedule display null-safety for undefined days/time
- Added missing enrollment command handlers
- All LSP errors resolved

## AI Systems Status
- **OpenAI Integration**: Working for character creation questions and NLP command processing
- **Procedural Content**: Textbooks, homework, and exams generate with deterministic seeding
- **Mastery Tracking**: Adaptive difficulty with struggle history and representation shifting
- **Fallback Behavior**: All AI-powered features have robust fallbacks for offline operation