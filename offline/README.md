# The Academy — Offline Installation Guide

This folder contains installation scripts for running The Academy locally on your machine — no internet connection required after the initial setup.

## Platform Scripts

| File | Platform | How to Run |
|------|----------|------------|
| `install-linux.sh` | Ubuntu, Debian, Fedora, Arch | `bash install-linux.sh` |
| `install-mac.sh` | macOS (Intel + Apple Silicon) | `bash install-mac.sh` |
| `install-windows.bat` | Windows 10 / 11 | Double-click the file |
| `install-windows.ps1` | Windows 10 / 11 (PowerShell) | Right-click → Run with PowerShell |

---

## Requirements

- **Node.js 18 or newer** — the installers will attempt to install it for you if missing
- **npm** — included with Node.js
- **~200 MB disk space** for dependencies

---

## What the Installer Does

Each script performs the same five steps:

1. **Checks for Node.js 18+** — auto-installs if missing (Linux via apt/dnf/pacman, macOS via Homebrew, Windows via winget)
2. **Verifies npm** is available
3. **Runs `npm install`** to download all project dependencies
4. **Creates a `.env` file** with a securely generated `SESSION_SECRET` (skips if one already exists)
5. **Starts the server** at `http://localhost:5000` (macOS and Windows also open your browser automatically)

---

## After Installation

Once running, visit **http://localhost:5000** in your browser.

To stop the server, press **Ctrl+C** in the terminal window.

To start the server again later (without reinstalling), run from the project root:

```bash
npm run dev
```

---

## Optional Configuration

Open the `.env` file created in the project root to add optional services:

```env
# Required (auto-generated — do not share this)
SESSION_SECRET=your-generated-secret

# PostgreSQL database (optional — app uses in-memory storage by default)
DATABASE_URL=postgresql://user:password@host/database

# OpenAI API key (optional — enables AI dialogue and content generation)
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

**Without an OpenAI key:** The game runs fully offline using the deterministic content engine (Phases 1–2). NPC dialogue, world events, and GED study material all work without any API connection.

**With an OpenAI key:** AI-powered NPC conversations, AI description enhancement, and the weekly GPT content pack (Phase 3) are enabled.

---

## Offline Architecture

The Academy is built on a four-ring offline system that ensures the game is always playable:

| Ring | System | Requires Internet |
|------|--------|-------------------|
| Ring 1 | Seeded PRNG world generation | No |
| Ring 2 | Template library (dialogue, events, GED quizzes) | No |
| Ring 3 | Weekly GPT content pack (cached 7 days) | Only for refresh |
| Ring 4 | RSS → world event pipeline | Only for refresh |

The game degrades gracefully — if offline, Ring 3 and 4 fall back to Ring 1/2 automatically.

---

## Troubleshooting

**"Permission denied" on Linux/Mac:**
```bash
chmod +x install-linux.sh && bash install-linux.sh
# or
chmod +x install-mac.sh && bash install-mac.sh
```

**Windows says "running scripts is disabled":**
Open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then re-run `install-windows.ps1`.

**Port 5000 already in use:**
Set a custom port by adding to your `.env`:
```env
PORT=3000
```

**Node.js version too old:**
- Linux: `sudo apt-get install -y nodejs` (after adding NodeSource repo)
- macOS: `brew upgrade node`
- Windows: Download from https://nodejs.org and reinstall
