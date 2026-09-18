---
name: Static build identity gate
description: Durable testing seam for the mobile static build's generated-metadata guard.
---

The static build should expose its orchestration separately from its process entry point, allowing a subprocess fixture to replace Metro and downloads while still running the real generated-identity validator.

**Why:** Exported helper tests can prove validator behavior but cannot catch a future refactor that skips, reorders, or bypasses the guard in the complete build flow.

**How to apply:** Keep production defaults in the orchestration function, inject only external stages for tests, and assert the generated Android manifest is present before validation and that drift exits nonzero.