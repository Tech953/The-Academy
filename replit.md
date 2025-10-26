# Overview

This is "The Academy", an interactive text-based RPG game that recreates the classic terminal adventure experience of early 90s games like Zork. Built as a full-stack application, it features a React frontend with a pure terminal aesthetic and an Express.js backend with PostgreSQL database storage. Players create characters and navigate through a mysterious private school setting with 144 students and faculty, making choices that affect their stats, reputation, and story progression.

# Recent Changes

## AI-Powered Character Creation System (Latest - October 26, 2025)
Implemented intelligent character creation that uses player-generated summaries to create personalized experiences:

### Enhanced Creation Flow
- **Player-Written Summary:** Players describe their character in their own words (background, personality, motivations)
- **AI-Generated Questions:** System analyzes the summary and generates 4-6 contextual questions about physical characteristics
- **Personalized Questions:** Questions adapt to the character's background (e.g., scholar vs warrior gets different questions)
- **Flexible Answers:** Players can select from suggested answers or write their own custom responses
- **Character Data Storage:** Summary and physical traits stored in database and used throughout gameplay

### How It Works
1. Player enters character name
2. **NEW: Write character summary** - Free-form description (minimum 20 characters)
3. **NEW: AI generates questions** - GPT-4.1-mini creates contextual physical trait questions
4. **NEW: Answer questions** - Build, appearance, style, features, mannerisms
5. Select race, class, specialization, faction (existing flow)
6. Review complete character with summary and traits
7. Begin adventure

### Example Flow
```
> Tell us about your character:
"A determined student from a small town who excels in math..."

> Generating personalized questions...
> What is most striking about your academic appearance?
1. Thick-rimmed glasses
2. Always carries multiple textbooks
3. Ink-stained fingers from note-taking
...
```

### Technical Implementation
- OpenAI integration via Replit AI Integrations (no API key needed, billed to credits)
- AI service generates 4-6 questions based on character summary
- Questions categorized: appearance, build, features, mannerisms, style
- Fallback to generic questions if AI unavailable
- Character schema updated with characterSummary and physicalTraits fields
- Data persisted and available throughout gameplay

## Comprehensive Textbook & Lecture System (October 26, 2025)
Added full educational content generation with detailed textbooks and lecture notes:

### Content Generation
- **24 Comprehensive Textbooks:** Each course has a 12-chapter textbook with table of contents, authors, glossary (20+ terms per book)
- **288 Weekly Lectures:** 12 lectures per course covering learning objectives, content, key terms, examples, and homework
- **Rich Chapter Content:** Each chapter includes 3-5 sections with explanations, key points, examples, practice problems, and review questions
- **Connected Learning:** Chapters link to related assignments, lectures reference specific chapters for study
- **Reading Progress Tracking:** System tracks which chapters and lectures each student has viewed

### New Terminal Commands
- **READ [textbook]** - View textbook table of contents with all 12 chapters, authors, key terms
- **CHAPTER "[course]" <number>** - Read specific chapter with all sections, examples, and practice problems
- **LECTURE "[course]" <week>** - View weekly lecture notes with objectives, content, and homework
- **Examples:**
  - `READ "Basic Math Skills"` - Shows full textbook TOC
  - `CHAPTER "Basic Math Skills" 3` - Reads Chapter 3
  - `LECTURE "Algebra Fundamentals" 5` - Views Week 5 lecture

### Natural Language Support
NLP processor updated to recognize:
- "read math textbook" → READ command
- "show chapter 3 of algebra" → CHAPTER command  
- "view week 5 lecture for science" → LECTURE command

## Complete Curriculum System (October 26, 2025)
Implemented fully functional academic curriculum system with **triple theme support**:

### Core Features
- **Database Schema:** 5 tables (courses, enrollments, assignments, graduation_pathways, academic_progress)
- **Textbook Items:** Auto-generated textbook items in inventory for easy access to course materials
- **Security:** Enrollment ownership validation, course-assignment matching prevents grade manipulation
- **Natural Language Support:** Academic commands work with NLP (e.g., "show my grades", "what's my GPA?")

### GED Preparation Theme (Active)
24 high school equivalency courses across 4 GED test areas:
- **Mathematical Reasoning** (6 courses): Basic Math Skills → Pre-Algebra → Algebra Fundamentals → Geometry & Measurement → Data Analysis & Statistics → GED Math Test Prep
- **Language Arts** (6 courses): Reading Comprehension → Grammar & Writing Mechanics → Essay Writing → Literature Analysis → Workplace Reading → GED Language Arts Test Prep
- **Science** (6 courses): Life Science Basics → Physical Science → Earth & Space Science → Human Body & Health → Scientific Reasoning → GED Science Test Prep
- **Social Studies** (6 courses): U.S. History → World History → Civics & Government → Economics → Geography → GED Social Studies Test Prep

### Terminal Commands (All Working)
- **GRADES** - View current course grades with completion percentages
- **TRANSCRIPT** - View completed courses with final grades and credits
- **SCHEDULE** - View class schedule with times/locations for enrolled courses
- **GPA** - View cumulative GPA, academic standing (honors/good/probation/warning), and total credits
- **READ [textbook]** - Read course textbooks with full syllabus and description
- **ATTEND [course]** - Attend class sessions (costs 10 energy, tracks attendance)

### Academic Systems
- **Auto-Grading:** Multiple choice questions graded automatically, essays simulated with word count/structure analysis
- **GPA Calculation:** Letter grade conversion, GPA points (4.0 scale × 100), cumulative/semester tracking
- **Academic Standing:** Honors (3.5+), Good (2.0-3.5), Probation (1.5-2.0), Warning (<1.5)
- **Attendance Tracking:** Records class attendance, affects participation grades
- **Graduation Pathways:** 5 pathways - GED Diploma + 4 individual test area certificates
- **Game Integration:** Attending class costs energy, grades affect character progression

### Saved Themes for Future Releases
- **Collegiate Theme** (server/procedural/collegiatecurriculum.ts): 144 courses, 12 departments, perfect for university sequel
- **Fantasy Theme** (server/procedural/fantasycurriculum.ts): 96 courses, 8 mystical departments, for fantasy spin-off
- See `CURRICULUM_README.md` for theme switching instructions

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