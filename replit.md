# Overview

This is "The Academy", an interactive text-based RPG game that recreates the classic terminal adventure experience of early 90s games like Zork. Built as a full-stack application, it features a React frontend with a pure terminal aesthetic and an Express.js backend with PostgreSQL database storage. Players create characters and navigate through a mysterious private school setting with 144 students and faculty, making choices that affect their stats, reputation, and story progression.

# Recent Changes

## Curriculum System Foundation (Latest - October 26, 2025)
Implemented comprehensive academic curriculum system with **triple theme support**:
- **Database Schema:** Added 5 new tables (courses, enrollments, assignments, graduation_pathways, academic_progress)
- **Current Theme - GED Preparation (Active):** 24 high school equivalency courses across 4 GED test areas:
  - **Mathematical Reasoning** (6 courses): Basic Math Skills → Pre-Algebra → Algebra Fundamentals → Geometry & Measurement → Data Analysis & Statistics → GED Math Test Prep
  - **Language Arts** (6 courses): Reading Comprehension → Grammar & Writing Mechanics → Essay Writing → Literature Analysis → Workplace Reading → GED Language Arts Test Prep
  - **Science** (6 courses): Life Science Basics → Physical Science → Earth & Space Science → Human Body & Health → Scientific Reasoning → GED Science Test Prep
  - **Social Studies** (6 courses): U.S. History → World History → Civics & Government → Economics → Geography → GED Social Studies Test Prep
  - **Total:** 24 courses, 168 assignments, 5 pathways (1 GED Diploma + 4 Test Area Certificates)
  - Each course includes comprehensive syllabus, learning objectives, and test preparation strategies
- **Collegiate Theme - Saved for Sequel (server/procedural/collegiatecurriculum.ts):**
  - 144 courses across 12 real-world departments: Mathematics, Natural Sciences, Computer Science, History, Literature, Philosophy, Language Studies, Psychology, Economics, Political Science, Art, Music
  - Traditional college experience with 100-400 level courses
  - 1,008 assignments and 24 pathways (12 majors + 12 minors)
  - Perfect for a university/college sequel
- **Fantasy Theme - Saved for Spin-off (server/procedural/fantasycurriculum.ts):**
  - 96 courses across 8 mystical departments: Mysticism, Combat Arts, Arcane Sciences, Diplomacy, History, Philosophy, Investigation, Leadership
  - Complete course templates with magical/fantasy content
  - 672 assignments and 16 pathways (8 majors + 8 minors)
  - Can be activated for fantasy academy spin-off
  - See `CURRICULUM_README.md` for theme switching instructions
- **Assignment Structure:** All courses include 7 assignments with proper weighting:
  - Class participation (20%), midterm exam (20%), 4 assignments (30%), final project (30%)
  - Each with point values, weights, due dates, and detailed content
- **Graduation Pathways:** Students can earn GED diploma or individual test area certificates
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