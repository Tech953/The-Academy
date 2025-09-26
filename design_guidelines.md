# Design Guidelines: The Academy - Text-Based RPG

## Design Approach
**System-Based Approach**: Using a dark, atmospheric design system optimized for extended reading sessions and immersive gaming experiences. Drawing inspiration from terminal interfaces and modern dark-themed productivity tools like Linear and Notion.

## Core Design Elements

### Color Palette
**Dark Mode Primary** (default):
- Background: 210 25% 8% (deep navy-black)
- Surface: 210 20% 12% (elevated panels)
- Primary: 280 60% 70% (mystical purple)
- Text: 210 15% 95% (near-white)
- Accent: 180 40% 65% (subtle cyan for highlights)

### Typography
- **Primary Font**: 'JetBrains Mono' (monospace for terminal feel)
- **Secondary Font**: 'Inter' (clean sans-serif for UI elements)
- **Sizes**: Text-sm for body, text-lg for titles, text-xs for metadata

### Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 (p-2, m-4, gap-6, h-8)

### Component Library

#### Core Game Interface
- **Command Terminal**: Fixed-bottom input with glowing border effect
- **Narrative Display**: Scrollable text area with typewriter-like appearance
- **Choice Buttons**: Outline variant with subtle hover glow
- **Status Panels**: Floating cards showing character stats and progress

#### Navigation & Menus
- **Menu System**: Slide-out sidebar with hierarchical navigation
- **Modal Overlays**: Semi-transparent backdrop with centered content
- **Tab Interface**: Underlined active states for different game sections

#### Data Displays
- **Character Sheet**: Grid-based stat display with progress bars
- **Inventory**: Card-grid layout for items and abilities
- **Social Network**: Node-based visualization for relationships
- **Class Schedule**: Calendar-style grid with course information

#### Forms & Interactions
- **Character Creation**: Multi-step wizard with validation
- **Save/Load Interface**: File-browser style list with metadata
- **Settings Panel**: Toggle switches and dropdown selectors

### Visual Atmosphere
- **Terminal Aesthetic**: Monospace fonts with subtle scan-line effects
- **Glow Effects**: Subtle box-shadows on interactive elements
- **Dark Borders**: Use border-gray-700 for panel separation
- **Minimal Animation**: Subtle fade transitions only (100-200ms duration)

### Layout Structure
- **Main Game View**: Full-height layout with narrative area (60%), command input (10%), sidebar (30%)
- **Responsive**: Single-column on mobile with collapsible panels
- **Typography Hierarchy**: Clear distinction between narrative text, UI labels, and interactive elements

### Key Design Principles
1. **Immersion First**: Dark theme reduces eye strain during long sessions
2. **Readability**: High contrast ratios for extended text reading
3. **Terminal Inspiration**: Monospace elements evoke classic text adventures
4. **Minimal Distraction**: Clean interface keeps focus on narrative
5. **Atmospheric Consistency**: Purple/cyan accents maintain mysterious academy theme