# Overview

"The Academy" is an interactive text-based RPG, designed as a full-stack application. It aims to recreate the classic terminal adventure experience of early 90s games like Zork, but with modern features. Players create characters and navigate a mysterious private school, making choices that influence their stats, reputation, and story. The game features an immersive world with 144 students and faculty, a comprehensive curriculum, and AI-powered elements for personalized gameplay.

The game runs within a simulated Y2K-era student laptop operating system (inspired by the game "Oneshot"), featuring a Windows 98/2000 style desktop environment with draggable/resizable windows, functional desktop applications, and a retro boot sequence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Single-page application using functional components and hooks.
- **Y2K Desktop OS Wrapper**: Simulated Windows 98/2000 desktop environment with:
  - Retro boot sequence with ARCHIVE OS branding and bear mascot
  - DesktopShell with teal gradient wallpaper, desktop icons, Start menu
  - Window component with dragging, resizing, minimize/maximize/close
  - Taskbar with window buttons and real-time clock
  - Desktop apps: Calculator, Notepad, File Explorer
  - The Academy game runs as a windowed application
- **Terminal-First Design**: Inside the game window, authentic classic text adventure aesthetic with black background and green monospace text.
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