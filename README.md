# THE ACADEMY
### A Neo-CRT Educational RPG — Complete User Manual

> *"Knowledge is power, but wisdom is knowing how to use it."*
> — The Headmaster

---

## Table of Contents

1. [What Is The Academy?](#1-what-is-the-academy)
2. [Installation](#2-installation)
3. [First Boot — Creating Your Student](#3-first-boot--creating-your-student)
4. [The Academy OS Desktop](#4-the-academy-os-desktop)
5. [Desktop Applications Guide](#5-desktop-applications-guide)
6. [The Text Adventure Terminal](#6-the-text-adventure-terminal)
7. [The 17-Stat System](#7-the-17-stat-system)
8. [The Perk System](#8-the-perk-system)
9. [The NPC & Social System](#9-the-npc--social-system)
10. [The GED Curriculum](#10-the-ged-curriculum)
11. [The Resonance System](#11-the-resonance-system)
12. [The Offline Content Engine](#12-the-offline-content-engine)
13. [World Events Feed](#13-world-events-feed)
14. [Tips, Tricks & Hidden Mechanics](#14-tips-tricks--hidden-mechanics)
15. [Glossary](#15-glossary)

---

## 1. What Is The Academy?

The Academy is a text-based educational RPG set inside a mysterious private school with its own fully-featured operating system interface — the **Academy OS**, rendered in a retro Neo-CRT aesthetic. You play as a student navigating the social, academic, and mystical forces at work within the Academy's walls, all while working toward your GED.

The game blends three distinct experiences:

- **The Text Adventure** — A classic command-driven RPG with AI-powered NPCs, over 120 locations, and emergent storytelling driven by your stats, perks, and choices.
- **The Academy OS** — A simulated desktop environment with over 20 functional applications including an email client, word processor, scientific calculator, study portal, and more.
- **The Education System** — A full GED preparation curriculum across four subjects, with quizzes, a spatial knowledge map, and a mentor commentary system.

The Academy is designed to run fully offline after the first setup, with deterministic world generation ensuring the same seed always produces the same world.

---

## 2. Installation

### Quick Start (Recommended)

Navigate to the `offline/` folder and run the installer for your platform:

| Platform | Command |
|----------|---------|
| **Linux** | `bash offline/install-linux.sh` |
| **macOS** | `bash offline/install-mac.sh` |
| **Windows** | Double-click `offline/install-windows.bat` |

Each installer automatically:
- Checks for Node.js 18+ (and installs it if missing)
- Runs `npm install` to download dependencies
- Generates a secure `SESSION_SECRET` in a `.env` file
- Starts the server at `http://localhost:5000`

macOS and Windows installers open your browser automatically.

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/Tech953/The-Academy.git
cd The-Academy

# Install dependencies
npm install

# Create a .env file
echo "SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" > .env

# Start the server
npm run dev
```

Then open `http://localhost:5000` in your browser.

### Optional: AI Features

Without additional setup, the game runs in **full offline mode** using its deterministic content engine. To enable AI-powered dialogue, world events, and descriptive enhancement, add these lines to your `.env` file:

```env
AI_INTEGRATIONS_OPENAI_API_KEY=sk-your-key-here
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

See [Section 12](#12-the-offline-content-engine) for a breakdown of what changes with and without AI.

---

## 3. First Boot — Creating Your Student

When you first launch The Academy, you are greeted by the **Retro Boot Screen** — a short animated sequence as the Academy OS initializes. After the boot completes, the system walks you through student registration.

### Character Creation

Character creation is conversational and AI-driven. You are asked a series of questions about your background, goals, and personality. Your answers are used to determine your **base stat distribution** across the 17-stat system (see Section 7).

There are no "wrong" answers. The system is designed to place you naturally into the role that matches how you describe yourself.

### Perk Selection

After stats are generated, you select **2 Starter Perks** from the Perk Catalog. These are permanent passive bonuses and special abilities that shape your playstyle from the beginning. You cannot change your starter perks after selection, so choose carefully.

See [Section 8](#8-the-perk-system) for the full perk catalog and descriptions.

### The Welcome Message

Once created, you receive your first email from the Headmaster and a welcome message from the Censorium — a secretive faction watching your progress. These are the first of many messages that will arrive in your inbox as you play.

---

## 4. The Academy OS Desktop

The Academy OS is a fully simulated desktop environment with a signature **Neo-CRT aesthetic** — green-tinted phosphor glow, scan lines, and retro-modern typography. It is the hub through which all game systems are accessed.

### Desktop Layout

The desktop is a grid of application icons arranged in rows. Icons can be **dragged and repositioned** to suit your preference — the layout is saved automatically between sessions.

### Opening Applications

- **Single-click** an icon to select it
- **Double-click** to open the application
- Applications open in resizable, draggable windows
- Multiple windows can be open simultaneously
- Windows can be **snapped** to screen edges and corners

### Window Management

| Action | How |
|--------|-----|
| Move window | Drag the title bar |
| Resize window | Drag any edge or corner |
| Minimize | Click the `–` button in the title bar |
| Close | Click the `×` button |
| Snap to edge | Drag window to screen edge — a snap zone appears |
| Focus window | Click anywhere on it |

### The Taskbar

The taskbar runs along the bottom of the screen. It shows the current time and date, a list of open windows, and quick-access system controls including power, settings, and notifications.

### Desktop Customization

**Right-click** anywhere on the desktop to open the context menu, where you can change your **wallpaper**. Eight built-in presets are available (Aurora, Nebula, Dusk, Storm, Deep Forest, Crimson, Grid, and void black), or you can upload your own custom image.

### Performance Tiers

The Academy OS automatically detects your device's performance and adjusts visual effects (scan lines, glow, animations) accordingly. You can manually override this in the Settings app.

---

## 5. Desktop Applications Guide

The Academy OS ships with over 20 fully functional applications, organized into four conceptual rows on the desktop.

---

### Row 1 — Communication & Academics

#### Email `[MAIL]` — Cyan
Your Academy inbox. Receives official communications from faculty, faction representatives, and other students. New messages arrive based on game events and your reputation. Cannot be deleted — all correspondence is preserved as a record of your journey.

#### Messages `[MSG]` — Green
Real-time in-school messaging with students and faculty. NPCs you've spoken with in the text adventure may send you follow-up messages here, referencing specific things you discussed.

#### Institution Monitor `[INST]` — Green
The **Academy Administrative OS** — a four-tab administrative dashboard:
- **OVERVIEW** — Institutional health metrics, domain stability, subject readiness scores, and active alerts
- **ECOLOGY** — An interactive SVG Knowledge Ecology Map showing how subjects connect
- **EPOCHS** — An archival timeline of your learning sessions
- **TRIALS** — The Synthesis Trial Registry tracking your alignment events

#### Assignments Portal `[ASGN]` — Amber
The central hub for all educational content. Contains:
- The full GED curriculum across 4 subjects
- Individual lesson views with content and quizzes
- The **Constellation Interface** — a spatial star map of your knowledge
- Language course modules
- Mentor commentary for each subject
See [Section 10](#10-the-ged-curriculum) for a complete guide.

#### Schedule `[SCHED]` — Amber
Your class timetable. Shows which courses you are enrolled in, upcoming deadlines, and daily events. Courses in the schedule link directly to lessons in the Assignments Portal.

#### Office Suite `[OFFICE]` — Amber
A full productivity suite containing:
- **Impress** — A presentation and slideshow creator
- **Financial Tools** — Budget and expense tracking with chart generation
- **Data tools** — Spreadsheet-style data entry and analysis

---

### Row 2 — Character & Progression

#### Progress Tracker `[PROG]` — Green
A dashboard of your academic and character progress. Shows GPA, completed assignments, XP earned, and a breakdown of skill development across GED domains.

#### Perks Viewer `[PRKS]` — Purple
Displays all perks in the catalog organized by category and rarity. Shows your active perks, locked perks (with unlock requirements), and the bonuses each perk provides. Starter perks are highlighted.

#### Skill Graph `[SKGR]` — Purple
A visual network graph of all skills and their interdependencies. Shows which skills you've unlocked, which are available, and the learning pathways between them. Skills are earned through gameplay, study, and NPC interactions.

#### Resonance Dashboard `[RESON]` — Purple
Displays the **Resonance System** — an energy-based narrative layer that tracks the invisible forces your actions create. See [Section 11](#11-the-resonance-system) for a full explanation.

#### CUB Companion `[CUB]` — Pink
Your personal **Polar Bear Cub** companion. CUB provides emotional support, daily tips, and acts as a sounding board for in-game decisions. CUB's mood reflects your recent actions and can offer cryptic hints about hidden mechanics.

#### Character Stats `[STAT]` — Purple
A detailed view of all 17 stats organized into their three categories (Physical, Mental, Spiritual), with descriptions, current values, and the effect each stat has on gameplay. Clicking a stat shows how it has changed over time. See [Section 7](#7-the-17-stat-system).

---

### Row 3 — Files & Tools

#### School Files `[SFILE]` — Cyan
The Academy's shared virtual filesystem. Contains official documents, course syllabi, archived newsletters, and files you've discovered during your text adventure exploration. Supports folder navigation and file preview.

#### Personal Files `[PFILE]` — Pink
Your private filesystem. Stores documents you've created in the Word Processor, notes from the Research Notebook, and files you've saved from the text adventure. Supports upload and download to your real device.

#### Research Notebook `[NOTE]` — Cyan
A structured research tool for documenting discoveries during the text adventure. Supports multiple notebooks, tagging, and cross-referencing. Notes made here can surface as hints and memory in NPC conversations.

#### The Academy (Text Adventure) `[GAME]` — Green
The core text adventure terminal. Type commands to explore the Academy's 120+ locations, interact with 100 NPCs, manage your inventory, and uncover the school's hidden mysteries. See [Section 6](#6-the-text-adventure-terminal) for the full command reference.

#### Orientation System `[ORIEN]` — Cyan
A 13-chapter interactive tutorial covering all major game systems. Recommended for new players. Chapters cover the command prompt, the desktop OS, NPC interaction, GED assignments, and advanced mechanics.

#### Citation Engine `[CITE]` — Purple
A full academic citation and reference tool with four modes:
- **GENERATE** — Build citations in APA, MLA, CMS, or ACS format from a form
- **VALIDATE** — Paste a citation to get an ICM Compliance Score and improvement suggestions
- **CONVERT** — Convert citations between supported styles automatically
- **GUIDE** — Quick-reference cards for each citation style

---

### Row 4 — Live Systems

#### World Events Feed `[WORLD]` — Cyan
A live window into this week's Academy narrative, powered by the weekly content pack. Three tabs:
- **Events** — Active world events with expandable detail cards, NPC reactions, and player hooks
- **Mood** — NPCs whose emotional states have shifted this week, with reasons
- **Study** — Featured GED focus areas for the week, connected to the weekly theme
Also shows the real-world RSS headlines that inspired this week's events. See [Section 13](#13-world-events-feed).

---

### System Applications

These are accessed via the taskbar or context menus rather than desktop icons:

| App | Access | Description |
|-----|--------|-------------|
| **Settings** | Taskbar | Visual theme, performance tier, language (EN/ES/FR/DE/ZH), accessibility |
| **Calculator** | Taskbar | Full TI-style scientific and graphing calculator with CALC and GRAPH tabs |
| **Notifications** | Taskbar bell | System alerts, NPC messages, achievement unlocks |
| **Power** | Taskbar | Save and quit options |

---

## 6. The Text Adventure Terminal

The core of The Academy is its **text adventure** — a command-driven RPG where you type natural language instructions and the game responds. The Academy OS keeps this running in its own dedicated window (the green GAME icon).

### How to Type Commands

Commands are interpreted by a natural language processor, which means you don't have to memorize exact syntax. The system understands conversational phrasing:

```
> go to the library
> look around
> talk to the librarian
> examine the old book on the desk
> take the key
> use the key on the locked door
> check my inventory
> what's my status?
> study mathematics
> rest for a while
```

### Command Reference

| Category | Commands | Examples |
|----------|----------|---------|
| **Navigation** | `go`, `walk`, `move`, `head to`, `travel` | `go north`, `walk to the dormitory` |
| **Observation** | `look`, `examine`, `inspect`, `search`, `check` | `look around`, `examine the desk` |
| **Interaction** | `talk`, `speak`, `ask`, `greet`, `converse` | `talk to Elena`, `ask about the Censorium` |
| **Items** | `take`, `pick up`, `grab`, `drop`, `use`, `give` | `take the notebook`, `use the keycard` |
| **Inventory** | `inventory`, `inv`, `i`, `items` | `inventory`, `what am I carrying?` |
| **Status** | `status`, `stats`, `character`, `self` | `status`, `how am I doing?` |
| **Academic** | `study`, `read`, `attend`, `enroll`, `grades`, `gpa` | `study math`, `check my grades` |
| **System** | `help`, `time`, `score`, `save`, `clear` | `help`, `what time is it?` |

### Navigation

The Academy has over **120 distinct locations** spread across the school grounds. Each location has a name, description, and a list of exits. Locations contain items to find, NPCs to meet, and secrets to uncover.

Use cardinal directions (`north`, `south`, `east`, `west`) or location names to navigate:
```
> go to the east wing
> head north
> enter the library
> go back
```

### The AI Description Engine

When your device is online and an OpenAI key is configured, the game uses GPT to generate **atmospheric flavor text** for locations and objects. Each description is cached so it only generates once per location.

Offline, descriptions fall back to the rich pre-written template library.

### Energy & Health

Your character has two vital resources:

- **Energy** — Spent by exploring, studying, and social interactions. Recovers with rest.
- **Health** — Reduced by hostile encounters and certain events. Recovers slowly over time.

Monitor both via the `status` command or the Character Stats app. Running out of energy makes all actions less effective. At zero health, you are sent to the infirmary.

### Inventory

You can carry items discovered during exploration. Item interactions power many of the game's puzzles and NPC dialogues. Some items are needed for specific quests; others provide passive bonuses or can be traded.

### The Research Notebook

During exploration you can take notes that are saved to the Research Notebook app. Use the `note` command:
```
> note: The headmaster's office key is hidden behind the portrait in the east wing
```

Notes made here can surface as memory context in future NPC conversations.

### GED Graduation

Your ultimate goal in the text adventure is GED readiness and graduation. As you complete academic content, your skills become **"emerging"** and eventually **"stable/mastered."** Achieving 3+ stable skills per GED domain unlocks the `GRADUATION CEREMONY` command — a multi-chapter journey through Confluence Hall that concludes with your **Departure Vector**, a unique ending shaped by your stats and faction history.

---

## 7. The 17-Stat System

Your character is defined by 17 stats organized into three categories. Each stat starts at a value determined by character creation and grows through gameplay, study, and NPC interactions.

Stats range from **1 to 100**. Most players begin with stats between 40 and 70.

---

### Physical Stats

These govern your body, reflexes, and physical capability.

| Stat | Abbr. | Description |
|------|-------|-------------|
| **Quickness** | QCK | Reaction time and reflexes. Affects dodge chance and initiative in encounters. |
| **Endurance** | END | Stamina and resistance to fatigue. Determines how long you can exert yourself before needing rest. |
| **Agility** | AGI | Flexibility and coordination. Affects balance, climbing, and acrobatic actions. |
| **Speed** | SPD | Raw movement velocity. Determines travel time between locations and escape abilities. |
| **Strength** | STR | Raw physical power. Affects carrying capacity and physical task outcomes. |

---

### Mental Stats

These govern your intelligence, creativity, and social presence.

| Stat | Abbr. | Description |
|------|-------|-------------|
| **Math-Logic** | M-L | Analytical thinking and numerical reasoning. Directly boosts GED Math performance. |
| **Linguistic** | LNG | Verbal fluency and reading comprehension. Boosts Language Arts and NPC dialogue depth. |
| **Presence** | PRS | Charisma and social gravity. Unlocks additional dialogue options and faction opportunities. |
| **Fortitude** | FRT | Mental toughness. Resists fear, manipulation, and mental status effects. |
| **Music-Creative** | M-C | Artistic and creative thinking. Opens alternative solutions to puzzles and conversations. |

---

### Spiritual Stats

These govern unseen forces — luck, fate, and the mystical underpinnings of the Academy.

| Stat | Abbr. | Description |
|------|-------|-------------|
| **Faith** | FTH | Belief in something greater. Provides resistance to despair events and unlocks spiritual dialogue paths. |
| **Karma** | KRM | The ledger of your actions. High karma unlocks benevolent NPC reactions; low karma opens darker options. |
| **Resonance** | RES | Your attunement to the Academy's energy field. Powers the Resonance System. |
| **Luck** | LCK | Probability modifier. Affects item discovery rates, critical successes, and random events. |
| **Chi** | CHI | Life force and internal energy. Tied to health recovery rate and physical/spiritual balance. |
| **Nagual** | NAG | Spirit-world awareness. Unlocks hidden locations, ghostly NPC encounters, and dream sequences. |
| **Ashe** | ASH | Ancestral power and cultural memory. Affects faction dialogue and unlocks legacy abilities. |

---

### How Stats Change

Stats grow and shift through:

- **Completing GED lessons** — boosts the relevant mental stats
- **Exploring locations** — passive stat adjustments based on what you encounter
- **NPC interactions** — extended conversations can raise or lower social/spiritual stats
- **Rest** — recovering energy can slightly restore chi
- **Perk effects** — starter and earned perks apply permanent stat modifiers
- **World events** — the weekly content pack can trigger temporary stat effects

---

## 8. The Perk System

At first boot, you choose **2 Starter Perks** from the full Perk Catalog. These are permanent — they cannot be changed after selection. Additional perks can be earned through gameplay milestones, stat thresholds, or special events.

Perks are organized by **category** and **rarity**.

### Perk Categories

| Category | Focus |
|----------|-------|
| **Combat** | Physical confrontation, willpower, survival under pressure |
| **Social** | Dialogue, reputation, faction influence |
| **Academic** | Learning speed, memory, knowledge retention |
| **Survival** | Stealth, resource management, crisis navigation |
| **Mystical** | Spiritual attunement, luck manipulation, hidden forces |

### Rarity Tiers

| Rarity | Availability |
|--------|-------------|
| **Common** | Always available at first boot |
| **Uncommon** | Available if a prerequisite stat is met at creation |
| **Rare** | Earned during gameplay; not available at first boot |
| **Legendary** | Unlocked through specific story events only |

### Starter Perk Catalog

**Combat**
- **Iron Will** *(Common)* — +2 Endurance, resistance to mental effects
- **Berserker Fury** *(Uncommon, requires STR 60)* — +3 Strength in combat, –1 intelligence

**Academic**
- **Quick Learner** *(Common)* — +2 Math-Logic, 25% faster skill progression
- **Photographic Memory** *(Uncommon, requires M-L 70)* — Perfect recall of all conversations and clues, +1 Perception

**Social**
- **Silver Tongue** *(Common)* — +2 Presence, unlocks additional dialogue options
- **Natural Leader** *(Common)* — Boosts faction reputation gains and NPC cooperation rates

**Survival**
- **Shadow Step** *(Common)* — Passive stealth bonus in known locations
- **Resourceful** *(Common)* — Doubles the yield of item discovery and scavenging

**Mystical**
- **Lucky Streak** *(Common)* — +3 Luck, increases frequency of positive random events
- **Third Eye** *(Uncommon)* — Reveals hidden objects and NPCs in examined locations
- **Resonant Soul** *(Rare)* — +5 Resonance, unlocks the full Resonance System from the start

---

## 9. The NPC & Social System

The Academy is populated by **100 procedurally generated NPCs**, each with their own personality, emotional state, memory of past interactions, faction affiliations, and daily schedule.

### NPC Archetypes

Every NPC is drawn from one of ten personality archetypes that determine their communication style and priorities:

| Archetype | Character Traits |
|-----------|----------------|
| **Scholar** | Analytical, precise, loves facts |
| **Rebel** | Challenging, irreverent, suspicious of authority |
| **Leader** | Decisive, commanding, politically aware |
| **Nurturer** | Warm, supportive, emotionally perceptive |
| **Perfectionist** | Detail-oriented, critical, high standards |
| **Socialite** | Charismatic, gossip-driven, well-connected |
| **Loner** | Guarded, observant, reluctantly honest |
| **Optimist** | Enthusiastic, naive, relentlessly positive |
| **Cynic** | Sardonic, experienced, often correct |
| **Mentor** | Patient, philosophical, speaks in implications |

### Talking to NPCs

Use the `talk` command followed by the NPC's name or description:
```
> talk to the librarian
> talk to Elena
> ask the mentor about the Censorium
> greet the student by the window
```

Conversations are **free-form** — you can ask NPCs about anything. The AI dialogue system generates contextually appropriate responses based on the NPC's archetype, emotional state, your relationship history, and current world events.

### NPC Memory

The Academy tracks every significant conversation. NPCs remember:
- Where they first met you
- Topics you've discussed
- Promises made or broken
- Favors given or received
- Your faction reputation at the time

When you encounter an NPC you've spoken with before, they will reference previous interactions. A reunion after a long absence is acknowledged differently than a conversation earlier the same day.

### Relationship Tiers

Your standing with each NPC evolves through a six-tier scale:

| Tier | Status | Effects |
|------|--------|---------|
| 0 | **Stranger** | Basic responses, limited dialogue |
| 1 | **Acquaintance** | Slightly more open, willing to answer questions |
| 2 | **Familiar** | Shares personal details, gives hints |
| 3 | **Friend** | Reveals secrets, provides aid, defends you |
| 4 | **Confidant** | Full trust, shares faction intelligence |
| 5 | **Allied** | Active cooperation, shared resources and goals |

Negative interactions push toward **Hostile** status, which closes off dialogue paths and may trigger adversarial behavior.

### Emotions & Daily Schedules

NPCs have emotional states (happy, focused, anxious, sad, angry, excited, distracted, neutral) that shift daily based on world events, your interactions, and the weekly content pack. An NPC who is anxious will respond differently than the same NPC when calm.

NPCs follow daily schedules — they are not always in the same location. Finding an NPC at the right time and place can unlock dialogue that wouldn't otherwise be available.

### Factions

The Academy contains several competing factions with their own agendas. Your reputation with each faction influences what information and opportunities you can access:

- **The Censorium** — Values discipline and tradition; watches all students
- **The Scholars' Circle** — Academic meritocracy; rewards academic achievement
- **The Underground** — Informal student network; values loyalty and secrecy
- **The Faculty** — The official institution; your formal standing with the school

---

## 10. The GED Curriculum

The Assignments Portal contains a complete GED preparation curriculum across four subjects, built to align with Kaplan GED standards.

### The Four Subjects

| Subject | ID | Focus Areas |
|---------|-----|-------------|
| **Mathematical Reasoning** | `math` | Algebra, geometry, data analysis, number sense |
| **Reasoning Through Language Arts** | `language_arts` | Reading comprehension, extended response, grammar |
| **Science** | `science` | Life science, physical science, earth & space science |
| **Social Studies** | `social_studies` | Civics, US history, economics, geography |

### Curriculum Structure

Each subject contains:
- Multiple **chapters** with individual **lessons**
- Lesson content drawn from structured textbook-style writing
- **Quizzes** after each lesson with multiple choice, fill-in-the-blank, true/false, and short answer questions
- **XP rewards** for quiz completion that feed into your character's progression

### The Constellation Interface

Inside the Assignments Portal, the `✦ CONSTELLATION` tab shows your entire curriculum as a **star map**. Each lesson is a star node, positioned procedurally and color-coded by:

- **Color** — Subject (each subject has a unique hue)
- **Brightness** — Mastery level (brighter = more mastered)
- **Pulse** — Active resonance (the lesson is in your current cognitive focus)
- **State ring** — UNTOUCHED / INTEGRATING / INTERNALIZED / FRACTURED

**Prerequisite lines** connect stars that must be completed before others become available.

Clicking a star opens the lesson directly.

### Cognitive States

The system tracks the health of your knowledge in each lesson:

| State | Meaning |
|-------|---------|
| **UNTOUCHED** | Lesson not yet visited |
| **INTEGRATING** | Lesson started; knowledge forming |
| **INTERNALIZED** | Lesson completed and retained |
| **FRACTURED** | Previously known but showing signs of decay; needs review |

### Mentor Commentary

Each subject has an assigned mentor whose quotes and reading focus prompts appear alongside lesson content to provide context and encouragement.

### GED Readiness

As you complete lessons and score well on quizzes, your skills become **"emerging"** and eventually **"stable/mastered."** When you have **3 or more stable skills per GED domain**, the graduation pathway opens in the text adventure.

---

## 11. The Resonance System

The Resonance System is The Academy's hidden layer — an emergent narrative engine that tracks the invisible energy created by your actions and choices.

### What is Resonance?

Every action you take emits energy across multiple axes (academic, social, spiritual, physical). This energy propagates through a graph of connected nodes — NPCs, locations, and abstract concepts — subtly altering the Academy's state in ways that aren't always immediately visible.

High resonance with a concept makes it appear more frequently in NPC dialogue, world events, and dreams. Low resonance in an area can cause drift — a slow disconnection from that aspect of the Academy.

### The Skill System

Resonance tracks three dimensions of skill development:

| Dimension | Measures |
|-----------|---------|
| **Excellence** | How well you perform actions (quality) |
| **Efficacy** | How effectively you use resources (efficiency) |
| **Perception** | How clearly you see what's happening around you (awareness) |

### Viewing Your Resonance

Open the **Resonance Dashboard** from the desktop to see:
- Your current resonance levels across domains
- The propagation graph (how your energy is flowing)
- Quantum-state indicators for active resonance fields
- Historical drift patterns

### Geometric Manifold System

Advanced players who invest heavily in spiritual stats (particularly the Resonance stat) unlock the **Geometric Manifold** — a visualization of the Academy's underlying structure that reveals patterns invisible to ordinary students.

---

## 12. The Offline Content Engine

The Academy is built on a **four-ring offline architecture** that ensures the game is always playable — even without internet, and always consistent: the same seed always generates the same world.

### Ring 1 — Seeded World Generation

All world generation is deterministic. The world seed (`12345` by default) is used with a Mulberry32 pseudorandom number generator to produce:
- All 100 NPC profiles, names, and archetypes
- All 120 location descriptions and connections
- All item placements and hidden secret positions
- All faction initial states

**Same seed = same world, always, for every player.**

### Ring 2 — Template Library

A rich offline library provides content that feels AI-generated without requiring a network connection:

- **Dialogue Templates** — 10 archetypes × 8 emotion states × 6 relationship tiers = hundreds of unique response patterns
- **Event Templates** — 8 categories × 25 events = 200 possible world events
- **Study Templates** — 57 GED questions across 4 subjects (multiple choice, fill-blank, true/false, short answer)

NPC dialogue falls back to these templates seamlessly when AI is unavailable.

### Ring 3 — Weekly Content Pack

Once per week, the server generates a **content pack** using GPT-4.1-mini:
- 3 active world events (themed to the week)
- 4 NPC emotional state shifts
- 2 featured GED focus areas

The pack is cached for 7 days so it loads instantly on repeat visits. If generation fails, Ring 2 provides a fully equivalent deterministic fallback.

**Cost: approximately $2.07/year** regardless of player count.

### Ring 4 — RSS → World Pipeline

At content pack generation time, the server fetches real headlines from:
- **NASA** Breaking News
- **ScienceDaily**
- **Phys.org**

These headlines are anonymized and used as thematic inspiration seeds for GPT's event generation. The Academy narrative never references the real world directly — only themes and ideas are translated. The source headlines are stored in the pack and visible in the World Events Feed.

### Offline Fallback Chain

```
AI available? → Ring 3/4 (GPT + RSS)
AI unavailable? → Ring 2 (Templates)
Templates unavailable? → Ring 1 (Seed + PRNG)
```

The game never fails silently. Each ring degrades gracefully to the one below it.

---

## 13. World Events Feed

The **World Events Feed** app (`WORLD EVENTS` icon, Row 4) shows what is happening in the Academy this week, drawn from the weekly content pack.

### Events Tab

Each active event shows:
- **Category badge** (Academic, Social, Discovery, Mystery, Competition, Crisis, Institutional)
- **Event title and description** — what is happening in the school this week
- **NPC Reaction** — a representative quote from an NPC responding to the event (expandable)
- **Player Hook** — one sentence describing how you can engage with the event in the text adventure
- **Tags** — keywords linking the event to discoverable content

At the bottom of the Events tab, under **Real-world seeds**, you can see the actual headlines that inspired this week's events.

### Mood Tab

Shows NPCs whose emotional states have shifted this week, with reasons. Use this to plan your social interactions — an anxious NPC approached with support will respond very differently than when ignored.

### Study Tab

Shows 2 featured GED focus areas for the week, each connected to the weekly theme with a brief explanation of why that topic is relevant right now.

### Refresh

Click the refresh icon in the top-right of the World Events Feed to force a new content pack generation (useful after your 7-day window has expired).

---

## 14. Tips, Tricks & Hidden Mechanics

### For New Players

- **Start with the Orientation System** — 13 chapters cover everything, with practical examples.
- **Read your email** — The Headmaster and the Censorium both drop hints in messages.
- **Talk to NPCs more than once** — Each encounter unlocks new dialogue branches.
- **Don't neglect the World Events Feed** — Active events have player hooks that open unique content in the text adventure.

### Stat Building

- **GED study is the fastest way to raise Mental stats.** Every completed lesson provides XP and stat increases.
- **Exploring new locations raises Quickness and Agility** — your body adapts as you move through unfamiliar spaces.
- **Sustained NPC relationships raise Presence and Karma** — the system tracks consistency over time.
- **Spiritual stats are the hardest to raise** — they require deliberate choices, rare items, and specific NPC relationships.

### Hidden Mechanics

- **Nagual 50+** reveals ghost NPCs in certain locations that cannot be seen otherwise. Their dialogue contains information available nowhere else.
- **Karma tracking is cumulative** — small acts of generosity or cruelty compound over dozens of interactions before becoming visible in NPC reactions.
- **The Constellation's "FRACTURED" state** is recoverable — visiting a fractured lesson and scoring well on a review quiz restores it to INTERNALIZED.
- **CUB's hints are not random** — the companion's daily tips correlate with your lowest-performing stats and suggest related activities.
- **The Citation Engine's ICM Compliance Score** is used in certain academic faction quests as proof of scholarship.

### Performance & Accessibility

- Voice input is supported for text adventure commands — look for the microphone icon in the terminal window.
- Display language can be changed in Settings: English, Español, Français, Deutsch, 中文.
- The performance tier (affecting visual effects intensity) auto-adjusts based on your device's frame rate, or can be locked in Settings.

---

## 15. Glossary

| Term | Definition |
|------|-----------|
| **Academy OS** | The simulated desktop operating system that serves as the game's interface |
| **Ashe** | A spiritual stat representing ancestral power and cultural memory |
| **Censorium** | A secretive faction at the Academy that monitors all students |
| **Chi** | A spiritual stat governing life force and health recovery |
| **Confluence Hall** | The location where the GED graduation ceremony takes place |
| **Constellation Interface** | The spatial star-map knowledge visualization in the Assignments Portal |
| **Content Pack** | A weekly AI-generated bundle of events, NPC moods, and study focuses |
| **CUB** | Your Polar Bear Cub companion — advisor, mascot, and hint system |
| **Departure Vector** | Your unique graduation ending, shaped by stats and faction history |
| **Deterministic** | Content that is mathematically fixed — same seed always gives same output |
| **Faction** | One of four competing power groups within the Academy |
| **FRACTURED** | A cognitive state indicating a lesson's knowledge is degrading |
| **GED** | General Educational Development — the real-world credential the curriculum prepares you for |
| **INTERNALIZED** | A cognitive state indicating full mastery of a lesson |
| **Karma** | A spiritual stat and moral ledger tracking the cumulative weight of your choices |
| **Nagual** | A spiritual stat governing awareness of hidden and spirit-world elements |
| **Neo-CRT** | The game's retro-modern visual aesthetic — phosphor green, scan lines, CRT glow |
| **NPC** | Non-Player Character — one of the 100 inhabitants of the Academy |
| **PRNG** | Pseudorandom Number Generator — the seed-based engine that generates the world |
| **Resonance** | Both a spiritual stat and the name of the energy system tracking your narrative impact |
| **Ring Architecture** | The four-layer offline fallback system (PRNG → Templates → Content Pack → RSS) |
| **RSS Pipeline** | The system that fetches real-world headlines and translates them into Academy events |
| **World Seed** | The number `12345` — the master key that generates the entire Academy world |

---

*The Academy — Built on Replit. Open source at [github.com/Tech953/The-Academy](https://github.com/Tech953/The-Academy).*
