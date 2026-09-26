---
name: Slides browser visual QA
description: Chromium measurements and resource limits for presentation-size visual checks.
---

In this workspace, headless Chromium's `--window-size` controls the outer window, not the page viewport: `1920×1167` produces an inner viewport of `1920×1080`. Concurrent route sweeps can also intermittently return an empty DOM, so verify unstable failures with a single route and keep browser concurrency conservative.

**Why:** A fixed CSS fixture can look correct in a 1920×1080 screenshot while JavaScript reports a shorter `window.innerHeight`; parallel Chromium launches also produced inconsistent missing-root responses during visual validation.

**How to apply:** Set the CSS fixture to the intended presentation dimensions, measure `window.innerWidth` and `window.innerHeight` in the browser, and tune the headless outer window until those measurements match. If a route sweep reports a missing app root inconsistently, retry the route serially before attributing it to application rendering.