---
name: Trailer media loading
description: Why the gameplay trailer needs a real captured poster while its long video decodes.
---

Keep the trailer's video element backed by a representative still frame from the captured footage. A fresh preview can take its first screenshot before a long MP4 has decoded, making valid playback look like a black screen.

**Why:** The 15-minute capture had a valid same-origin URL and played after a few seconds, but the first preview snapshot was black before video decoding completed.

**How to apply:** When replacing trailer footage, regenerate the poster from an actual captured frame and verify both the initial preview and playback after decoding.