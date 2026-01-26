# Overview

"The Academy" is an interactive text-based RPG, designed as a full-stack application. It aims to recreate the classic terminal adventure experience of early 90s games like Zork, but with modern features. Players create characters and navigate a mysterious private school, making choices that influence their stats, reputation, and story. The game features an immersive world with 144 students and faculty, a comprehensive curriculum, and AI-powered elements for personalized gameplay.

The game runs within a simulated "Academy OS" - a Neo-CRT aesthetic operating system featuring pure black backgrounds, neon green elements, and a modern-retro fusion design inspired by Fallout Pip-Boy, early MacOS, and cyberpunk aesthetics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Single-page application using functional components and hooks.
- **Neo-CRT Academy OS Wrapper**: Custom operating system with retro-modern fusion design:
  - **Boot Sequence**: ARCHIVE OS branding with animated bear mascot, loading bar, and system initialization text
  - **Desktop Layout**: Pure black background (#000000) with neon elements
    - Left sidebar: PERSONAL, E-MAIL, MESSAGES, ASSIGNMENTS, PERKS, RESONANCE icons with neon glow
    - Center-right: Polar Bear Cub mascot widget in circular neon frame with pulse animation
    - Bottom: Taskbar with Files, Schedule, Cub, Settings icons (cyan, amber, purple, pink)
  - **CRT Effects**: Subtle scanlines overlay, vignette effect, neon glow shadows
  - **Neo-CRT Windows**: Dark themed windows with theme-colored borders and glowing title bars
  - **Day/Night CRT Shader System**: Three display modes with distinct color palettes:
    - Dawn (soft mint #88ffcc) - gentle morning colors
    - School Day (bright green #00ff00) - classic CRT green
    - Night Study (deep emerald #00cc88) - easier on eyes for evening
  - **Responsive Desktop Layout**: Viewport-aware positioning and sizing:
    - Windows center in available space (accounting for sidebar/taskbar)
    - Window sizing respects viewport bounds (Academy max 900x650 but scales down)
    - Sidebar icons responsive with smaller gaps on small screens
    - Mascot only shows on screens > 900x500, scales on medium screens
    - Multiple windows cascade with proper z-index management
  - **Resizable Windows**: All program windows can be resized by dragging the corner handle:
    - Drag bottom-right corner to resize any window
    - Internal content adapts automatically to new dimensions
    - Window position and size tracked in state
  - **Multi-Color Neon Palette**: Green (#00ff00), Cyan (#00ffff), Amber (#ffaa00), Purple (#cc66ff), Pink (#ff66aa)
  - Desktop apps: Calculator, Notepad, File Explorer, Personal, E-Mail, Messages, Assignments Portal, Perks Viewer, Resonance Dashboard, Class Schedule, Cub Companion
  - **The Academy Game**: Runs in dedicated full-screen mode (not as a windowed desktop app):
    - Full-screen layout with header bar and stats sidebar
    - Stats sidebar shows character name, class, faction, energy, reputation, and all 17 stats
    - Header bar with "Desktop" exit button, sidebar toggle, and text size controls
    - Adjustable text size (10-24px) for accessibility
    - Clean separation between game and desktop OS programs
- **Terminal-First Design**: Inside the game, authentic classic text adventure aesthetic with black background and green monospace text.
- **Tailwind CSS**: Utility-first styling with custom CSS variables for terminal theme.
- **shadcn/ui Components**: UI components adapted for the terminal aesthetic.
- **Lucide React**: Icon library used for all desktop and window icons (no emojis).
- **React Query**: Server state management and caching.

## Backend Architecture
- **Express.js**: RESTful API server for character management, game state, and data persistence.
- **TypeScript**: Type-safe server-side development.
- **Session-based Architecture**: Tracks character progress and state changes.
- **Memory Storage with Database Fallback**: In-memory storage for rapid development with PostgreSQL persistence.

## Database Design
- **PostgreSQL with Drizzle ORM**: Type-safe database interactions.
- **Core Tables**: Users, Characters, Locations, NPCs, Items, Game Sessions.

## Game State Management
- **Character Creation System**: Multi-step process for character generation, including AI-driven personalized questions.
- **Location-based Navigation**: Room-to-room movement with dynamic descriptions.
- **Reputation System**: Three-tier tracking (faculty, students, mysterious).
- **Energy/Health Management**: Character vitality and endurance.
- **Inventory and Perks**: Item collection and character progression.
- **Perk System**: Features 11 starter perks (chosen at character creation) and 60+ level-up perks (awarded every other level), including tiered perks with multiple levels.
- **17-Stat System**: Comprehensive 3-tier stat system with polar bear mascot icons:
  - Physical (5 stats): Quickness, Endurance, Agility, Speed, Strength
  - Mental (5 stats): Math-Logic, Linguistic, Presence, Fortitude, Music-Creative
  - Spiritual (7 stats): Faith, Karma, Resonance, Luck, Chi, Nagual, Ashe
- **Stat Icons**: Custom polar bear mascot images representing each stat category (shared/stats.ts, stat-icon.tsx).
- **Comprehensive Curriculum System**: Features 24 courses across 4 GED test areas, with auto-generated textbooks and lectures. Includes commands for Grades, Transcript, Schedule, GPA, Read, and Attend.
- **Natural Language Processing (NLP)**: AI-powered command interpreter allowing natural language questions instead of exact commands, using GPT-4.1-mini.
- **Console Accessibility Features**: Includes a voice input system (Web Speech API), a command palette with keyboard/controller navigation, arrow key command history, and comprehensive ARIA support.
- **Memory Optimization**: LRU cache for game content (textbooks, lectures, locations, NPCs).

# External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting.
- **OpenAI**: Integrated via Replit AI for character creation and NLP.
- **Radix UI**: Headless component primitives for accessible UI.
- **Lucide React**: Icon library.
- **React Hook Form**: Form state management.
- **Date-fns**: Date manipulation utilities.
- **Vite**: Build tool and development server.
- **ESBuild**: Fast JavaScript bundler.