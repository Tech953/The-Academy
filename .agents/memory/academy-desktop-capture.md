---
name: Academy desktop capture
description: Runtime behavior required before automating gameplay in the desktop terminal
---

Finish the character setup and submit `START` before sending gameplay commands. Until that gate is cleared, commands such as `LOOK` and `STATUS` only repeat the start prompt instead of running in the game.

**Why:** The first automated capture entered valid-looking commands before the game session began, leaving the desktop footage stuck at the onboarding prompt.

**How to apply:** After character creation, submit `START`, confirm that the live game shows its initial location and exits, then begin the command sequence and screen recording.