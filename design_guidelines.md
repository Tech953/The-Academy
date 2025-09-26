# Design Guidelines: The Academy - Classic Text Adventure

## Design Approach
**Terminal-First Approach**: Authentic recreation of early 90s text adventure games like Zork, with a pure terminal aesthetic that prioritizes text and commands over visual elements.

## Core Design Elements

### Color Palette
**Classic Terminal** (only palette):
- Background: 0 0% 0% (pure black)
- Text: 120 100% 50% (bright green - classic terminal)
- Input: 60 100% 50% (bright yellow for command input)
- System: 0 0% 70% (gray for system messages)
- Error: 0 100% 50% (bright red for errors)

### Typography
- **Only Font**: 'Courier New' or system monospace
- **Only Size**: Single size (16px equivalent) for everything
- **No variations**: No bold, italic, or size changes except for headers

### Layout System
**Minimal Spacing**: Only basic padding and line breaks, no complex layouts

### Interface Elements

#### Core Game Interface
- **Terminal Window**: Full-screen black background with green text
- **Text Output**: Scrolling text only, no cards or panels
- **Command Input**: Simple text input with ">" prompt
- **Status Line**: Single line at top showing basic stats

#### No Modern UI Elements
- **No Cards**: Plain text only
- **No Buttons**: Text-based menu options with numbers
- **No Sidebars**: Everything in single column
- **No Progress Bars**: Text-based status (e.g., "Health: 75/100")

### Visual Atmosphere
- **Pure Terminal**: Exactly like old DOS/Unix terminals
- **No Graphics**: Zero visual elements beyond text
- **No Colors**: Only green text on black background
- **No Animations**: Instant text display
- **No Borders**: No visual separators except line breaks

### Layout Structure
- **Single Column**: Everything flows vertically
- **Status Line**: Character name, location, basic stats on one line
- **Game Text**: Scrolling narrative and system messages
- **Command Prompt**: "> " at bottom for user input

### Key Design Principles
1. **Authenticity**: Exact replica of 1990s text adventures
2. **Simplicity**: No visual complexity whatsoever
3. **Text-Only**: Everything communicated through text
4. **Terminal Feel**: Green text on black background only
5. **Command-Driven**: All interaction through typed commands