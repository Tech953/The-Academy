# Overview

This is "The Academy", an interactive text-based RPG game that recreates the classic terminal adventure experience of early 90s games like Zork. Built as a full-stack application, it features a React frontend with a pure terminal aesthetic and an Express.js backend with PostgreSQL database storage. Players create characters and navigate through a mysterious private school setting with 144 students and faculty, making choices that affect their stats, reputation, and story progression.

# Recent Changes

## Curriculum System Foundation (Latest - October 26, 2025)
Implemented comprehensive academic curriculum system with **dual theme support**:
- **Database Schema:** Added 5 new tables (courses, enrollments, assignments, graduation_pathways, academic_progress)
- **Current Theme - Realistic Academia (Active):** 144 procedurally generated courses across 12 real-world departments:
  - **STEM:** Mathematics, Natural Sciences, Computer Science
  - **Humanities:** History, Literature, Philosophy, Language Studies
  - **Social Sciences:** Psychology, Economics, Political Science
  - **Fine Arts:** Art, Music
  - 100-400 level courses with full syllabi, descriptions, and prerequisites
  - Each course includes schedule (days/times), location, professor assignment, and credit hours
- **Realistic Course Content:**
  - Mathematics: Calculus, Linear Algebra, Statistics, Discrete Math
  - Sciences: Biology, Chemistry, Physics, Environmental Science
  - Languages: English Composition, Spanish, French, Linguistics
  - Computer Science: Programming, Data Structures, Algorithms, Databases
  - And many more traditional college courses across all departments
- **Fantasy Theme - Preserved for Spin-off (server/procedural/fantasycurriculum.ts):**
  - 96 courses across 8 mystical departments: Mysticism, Combat Arts, Arcane Sciences, Diplomacy, History, Philosophy, Investigation, Leadership
  - Complete course templates with magical/fantasy content
  - Can be activated via configuration flag for alternate game builds
  - See `CURRICULUM_README.md` for theme switching instructions
- **Assignments:** 1,008 total assignments (7 per course):
  - Class participation (20%), midterm exam (20%), 4 assignments (30%), final project (30%)
  - Each with point values, weights, due dates, and content
- **Graduation Pathways:** 24 pathways (12 majors + 12 minors)
  - Each pathway includes required courses, credit requirements, GPA minimums
  - Department-specific credit distribution requirements
- **Academic Progress Tracking:** Schema for GPA calculation, transcripts, semester tracking
- **Status:** Core infrastructure complete - enrollment, attendance, grading UI remaining

## Natural Language Processing System (October 26, 2025)
Implemented comprehensive AI-powered command interpreter that allows players to use natural questions instead of memorizing exact commands:
- **Technology:** GPT-4.1-mini via Replit AI Integrations (no API key needed, billed to user credits)
- **Context-Aware:** System receives current location, NPCs present, exits, interactables, and character data for intelligent interpretation
- **Intelligent Prompting:** Explicit mappings for common query patterns (social queries → "list", observation → "look", inventory/status questions)
- **Fallback System:** Gracefully falls back to traditional command parsing if AI unavailable
- **Transparency:** Shows interpretation message when confidence is low (<70%)
- **Examples:**
  - "what do I see here?" → look command
  - "who else is around?" → list NPCs
  - "check my stuff" → inventory
  - "how am I doing?" → status
  - "I'd like to head north" → north movement
- **Test Status:** ✅ All test cases passed - natural language commands work reliably across all command types

## Terminal Scrolling Fix
Fixed critical bug where users couldn't reliably access terminal history and the page would get stuck during scrolling:
- **Issue:** Auto-scroll animation was fighting against manual user scrolling, causing race conditions and view jumping
- **Solution:** Implemented `isAutoScrollingRef` flag to prevent scroll event handlers from canceling their own animations
- **Improvements:**
  - User interaction (mousedown, touchstart, wheel) immediately cancels auto-scroll and pauses future auto-scrolling
  - Auto-scroll only resumes when user manually scrolls back near bottom (within 150px threshold)
  - Proper cleanup of animation frames and state flags prevents memory leaks
  - 50ms delay gives manual scrolling priority over auto-scroll
  - Custom green terminal-themed scrollbar with smooth touch scrolling support
- **Test Status:** ✅ Verified working - users can now scroll up to view history, auto-scroll pauses appropriately, and rapid commands work smoothly

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Single-page application using functional components and hooks
- **Terminal-First Design**: Authentic recreation of classic text adventures with pure black background and green monospace text
- **Wouter Routing**: Lightweight client-side routing solution
- **Tailwind CSS**: Utility-first styling framework with custom CSS variables for the classic terminal theme
- **shadcn/ui Components**: Pre-built UI components adapted for the terminal aesthetic
- **React Query**: Server state management and caching for API interactions

## Backend Architecture
- **Express.js**: RESTful API server handling character management, game state, and data persistence
- **TypeScript**: Type-safe server-side development with shared schemas
- **Session-based Architecture**: Game sessions track character progress and state changes
- **Memory Storage with Database Fallback**: In-memory storage for rapid development with PostgreSQL persistence

## Database Design
- **PostgreSQL with Drizzle ORM**: Type-safe database interactions with schema definitions
- **Core Tables**:
  - Users: Authentication and user management
  - Characters: Player character data including stats, inventory, and progress
  - Locations: Academy rooms and areas with descriptions, exits, and NPCs
  - NPCs: The 144 students and faculty with dialogue and interaction data
  - Items: Game objects and inventory management
  - Game Sessions: Save/load functionality and session persistence

## Game State Management
- **Character Creation System**: Multi-step process for race, class, faction, and stat allocation
- **Location-based Navigation**: Room-to-room movement with dynamic descriptions
- **Reputation System**: Three-tier reputation tracking (faculty, students, mysterious)
- **Energy/Health Management**: Character vitality and endurance mechanics
- **Inventory and Perks**: Item collection and character progression systems

## External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting for production data storage
- **Radix UI**: Headless component primitives for accessible UI building blocks
- **Lucide React**: Icon library for minimal visual elements within the terminal interface
- **React Hook Form**: Form state management for character creation and settings
- **Date-fns**: Date manipulation utilities for game timing and session management
- **Vite**: Build tool and development server with hot module replacement
- **ESBuild**: Fast JavaScript bundler for production builds