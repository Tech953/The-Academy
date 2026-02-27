# Overview

"The Academy" is an interactive text-based RPG that combines nostalgic gameplay with advanced interactive storytelling and educational content. Players navigate a mysterious private school, making choices that influence their character's stats, reputation, and story. The game provides personalized gameplay through AI-powered elements within a simulated "Academy OS" featuring a Neo-CRT aesthetic. The project aims to offer an immersive, educational, and engaging experience, targeting both gaming and educational technology markets.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is a React with TypeScript single-page application, presented within a "Neo-CRT Academy OS Wrapper." This OS features a retro-modern design with pure black backgrounds, neon elements, subtle CRT effects, and a day/night shader system. It includes responsive layout, resizable multi-window management, a customizable sidebar (Personal Profile, E-Mail, Assignments Portal), and a taskbar (Class Schedule, Notifications, Settings).

The game runs in a resizable window with a terminal-first design, black background, green monospace text, a header, and a 17-stat sidebar. Styling uses Tailwind CSS, adapted shadcn/ui components, and Lucide React. React Query manages server state. Enhanced Neo-CRT features include a boot jingle, screen bloom, cursor pulse, resonance distortion, scanline drift, and fuzzy bubble notifications. A Dual-Mode UI System allows toggling between a Legacy Mode (terminal-first) and a Student Mode (clickable windows). Core OS systems include a Linux-style Virtual Filesystem and an App Manifest System. State management is handled by `GameStateContext`, `NotificationsContext`, `I18nContext`, and `CrtThemeContext`, with persistence via `localStorage`.

### Radiant AI System
The Academy implements a comprehensive NPC AI system for autonomous behavior with procedural generation and emergent social dynamics. NPCs have detailed stats, personality (Big Five), emotions, memory, club membership, secret society affiliation, and mentorship tracking. A Goals System manages adaptive goals, while a Relationships system tracks affinity and history. A Schedule System defines daily routines, and a Decision Engine processes information to output actions. The Dialogue System enables autonomous, context-aware conversations. World Events and Event Chaining affect NPC behavior and can trigger follow-up events. The system includes Adaptive Goal Evolution, an Emergent Faction System, and Procedural NPC Generation. A Mentorship System assigns faculty mentors to students.

### Resonance System (Physics-Based Narrative Engine)
The Academy incorporates a sophisticated Resonance System for emergent narrative through energy transference, relational space, and quantum-inspired mechanics. This system operates on the principle that actions emit energy that propagates through a relational graph, affecting NPCs, locations, and concepts.

**Core Principles:**
- **Energy Transference**: Actions emit energy along multiple axes (Force, Order, Clarity, Connection, Coherence, Stillness, Harmony, Growth, Entropy, Fear, Distortion, Instability, Chaos, Decay, Faith, Karma, Chi, Nagual, Ashe)
- **Relational Space**: Energy propagates through a graph of nodes (NPCs, locations, concepts) connected by weighted edges
- **Forms of Force**: Nodes have force types (inertial, amplifying, dampening, reflective, fracturing) that transform energy

**Mathematical Foundations:**
- Vector operations for energy calculations (add, scale, dot product, magnitude)
- Complex number operations for quantum mechanics (amplitude, phase, interference)
- Geometric distance and curvature calculations for spatial effects

**Quantum-Inspired Mechanics:**
- **Superposition**: Actions can exist in multiple states with probability amplitudes
- **Observation**: States collapse when observed, producing definite outcomes
- **Phase Evolution**: Uncollapsed states evolve over time via phase rotation
- **Coherence**: Field stability affects interference patterns

**Geometric Manifold System:**
- Nodes positioned in conceptual 3D space
- Distance affects energy propagation (exponential decay)
- Curvature modifiers near sacred zones
- Sacred zones amplify specific energy types

**Skill System (Excellence, Efficacy, Perception):**
- **Excellence**: Technical mastery (0-100), improved by Clarity and Order
- **Efficacy**: Practical application (0-100), improved by Force and Growth
- **Perception**: Field awareness (0-100), improved by Coherence and Stillness

**Infrastructure Balancing:**
- Development rate (0-100): Growth and improvement
- Maintenance level (0-100): Upkeep and stability
- Capacity (0-100): Maximum load
- Synergy between development and maintenance

**Crystallization Patterns:**
- Similar high-magnitude fields form persistent patterns
- Patterns accumulate strength over time
- Weak patterns naturally dissolve

**Sacred Zones:**
- Sacred Garden: Amplifies stillness, coherence, harmony, chi
- Hidden Sanctum: Amplifies nagual, ashe, faith

**Files:**
- `client/src/lib/resonanceEngine.ts` - Core Resonance Engine with all mechanics
- `client/src/lib/resonanceRadiantBridge.ts` - Bridge between Radiant AI and Resonance
- `client/src/hooks/useResonance.ts` - React hook for resonance state
- `client/src/contexts/ResonanceContext.tsx` - React context provider

### Academy Engine - Cognitive Infrastructure
This four-phase learning system includes:
- **Phase 1 - Core Cognition**: Manages a skill graph (40 GED-aligned skill nodes), student journals, a procedural homework engine, and student profiles.
- **Phase 2 - Assessment Layer**: Extracts mastery signals, estimates confidence, and generates GED-class exams.
- **Phase 3 - Governance**: Provides curriculum versioning and teacher authority.
- **Phase 4 - Lore/Narrative**: Offers narrative modes to wrap prompts.
Ethical AI practices are enforced via an `ethicsLockfile`, and a `portfolioGenerator` aligns with GED requirements.

## Backend Architecture
The backend uses Express.js with TypeScript, providing a RESTful API for character management, game state, and data persistence. It uses session-based architecture with in-memory storage and PostgreSQL as a fallback.

## Database Design
PostgreSQL with Drizzle ORM is used for type-safe database interactions, including tables for Users, Characters, Locations, NPCs, Items, and Game Sessions.

## Game State Management
Features include a multi-step AI-driven character creation, location-based navigation, a three-tier reputation system, energy/health management, and an inventory system. A 17-stat system (Physical, Mental, Spiritual) is implemented. A curriculum system offers 24 courses across 4 GED areas, with auto-generated textbooks and NLP for natural language command interpretation. Accessibility features include voice input, a command palette, and ARIA support. A Localized Content System provides language-aware educational content. Advanced systems include an Object Interaction Resolver, Research Notebook System, Academy OS Engagement Tracking System, Dialogue Modulation System, Ambient World Change System, Confluence Hall System, GED Culmination System, and a Crisis Intervention System.

## Perk System

### Starter Perk Flow (Fallout NV Style)
On first boot (when `character.starterPerks.length === 0`), a full-screen overlay (`StarterPerkFlow.tsx`) activates:
- **Phase 1**: Player selects 2 perks from 11 starter perks across combat/social/academic/survival/mystical categories
- **Phase 2**: Summary screen shows "INITIALIZATION COMPLETE" with selected perk cards (with large glowing +X stat bonus numbers) and the character's base stat profile; clicking "ENTER THE ACADEMY" commits the choices
- Managed by `chooseStarterPerks()` in `GameStateContext`; stored in `character.starterPerks`

### PerksViewer App (`charstats`/perks desktop icon)
Redesigned viewer with 4 tabs:
- **AVAILABLE**: Level-up perks the player can unlock now (meets level + stat requirements)
- **ACTIVE**: All earned perks (starter + level-up)
- **LOCKED**: Perks still gated by level or stat requirements — clicking shows exact requirements with pass/fail indicators
- **ALL STARTER**: The full starter perk library for reference
- Rarity gating: common=Lv1, uncommon=Lv3, rare=Lv5, legendary=Lv8
- Effects displayed with large colored `+X` glowing numbers and StatIcon sprites

## GED Graduation System
The game includes a complete GED preparation and graduation system. Skill progress is tracked via game flags, with skills becoming "emerging" after 2 attendances and "stable/mastered" after 5. Players need 3+ stable skills per domain (Mathematical Reasoning, Language Arts, Science, Social Studies) to be GED ready. Upon readiness, the `GRADUATION CEREMONY` command initiates the Confluence Hall experience, a multi-node journey with optional branches, influenced by player stats and faction interactions, leading to different "Departure Vectors."

# External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting.
- **OpenAI**: Integrated via Replit AI for character creation and NLP.
- **Radix UI**: Headless component primitives.
- **Lucide React**: Icon library.
- **React Hook Form**: Form state management.
- **Date-fns**: Date manipulation utilities.
- **Vite**: Build tool and development server.
- **ESBuild**: Fast JavaScript bundler.