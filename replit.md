# Overview

"The Academy" is an interactive text-based RPG designed to recreate the classic terminal adventure experience with modern features. Players navigate a mysterious private school, making choices that influence their character's stats, reputation, and story within an immersive world of 144 students and faculty. The game aims to provide personalized gameplay through AI-powered elements, all presented within a simulated "Academy OS" featuring a Neo-CRT aesthetic. The project combines nostalgic gameplay with advanced interactive storytelling and educational content.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is a React with TypeScript single-page application, encapsulated within a custom "Neo-CRT Academy OS Wrapper". This OS features a retro-modern design inspired by Fallout Pip-Boy and early MacOS, with pure black backgrounds, neon elements, subtle CRT effects (scanlines, vignette), and a day/night shader system with three distinct color palettes (Dawn, School Day, Night Study). The desktop layout is responsive, includes resizable and multi-window management, and uses a multi-color neon palette. Core desktop apps include Personal, E-Mail, Messages, Assignments Portal, Perks Viewer, Resonance Dashboard, Class Schedule, and a Cub Companion. The game itself runs in a resizable window with an optional fullscreen mode, offering a terminal-first design with a black background and green monospace text, a header bar, a stats sidebar (displaying 17 stats), and adjustable text size. Styling is handled with Tailwind CSS, adapted shadcn/ui components, and Lucide React for icons. React Query manages server state.

## Backend Architecture
The backend uses Express.js with TypeScript to provide a RESTful API for character management, game state, and data persistence. It employs a session-based architecture and utilizes in-memory storage with PostgreSQL as a fallback for persistence.

## Database Design
PostgreSQL is used with Drizzle ORM for type-safe database interactions. Core tables include Users, Characters, Locations, NPCs, Items, and Game Sessions.

## Game State Management
The game features a multi-step character creation system with AI-driven personalized questions, location-based navigation, a three-tier reputation system, energy/health management, and an inventory system with 11 starter perks and 60+ level-up perks. A comprehensive 17-stat system is implemented, categorized into Physical, Mental, and Spiritual, each with custom polar bear mascot icons.
A comprehensive curriculum system includes 24 courses across 4 GED test areas, with auto-generated textbooks and lectures, and commands for grades, transcripts, and schedules. Natural Language Processing (NLP) powered by GPT-4.1-mini allows for natural language command interpretation. Console accessibility features include voice input, a command palette, arrow key command history, and ARIA support. Memory optimization is achieved via an LRU cache for game content.
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