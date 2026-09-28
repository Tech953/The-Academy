---
name: Native handoff timeout fixtures
description: A test-harness constraint for exercising real fetch aborts through native handoff.
---

When a native-handoff test uses synchronous child spawning, keep its delayed local HTTP server inside the child fixture or preloader. The parent test event loop is blocked by `spawnSync` and cannot serve the child's fetch requests.

**Why:** Otherwise a timeout can be caused by the test harness being unable to answer, rather than by the configured `AbortController` deadline.

**How to apply:** For future native health or AI timeout tests, forward release URLs to a child-owned local server and pass the actual request signal through to `fetch`.