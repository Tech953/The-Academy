# Overview

This is "The Academy", an interactive text-based RPG game that recreates the classic terminal adventure experience of early 90s games like Zork. Built as a full-stack application, it features a React frontend with a pure terminal aesthetic and an Express.js backend with PostgreSQL database storage. Players create characters and navigate through a mysterious private school setting with 144 students and faculty, making choices that affect their stats, reputation, and story progression.

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