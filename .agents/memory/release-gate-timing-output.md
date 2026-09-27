---
name: Release gate timing output
description: Keep per-gate duration reporting robust through captured release logs.
---

Measure each release gate with a monotonic clock. Print plain-text completion timings and append a plain-text timing line to a failed gate's wrapped error, after preserving its original diagnostic.

**Why:** Release output may be captured or archived rather than watched live, and some callers may retain only the thrown error. Timings must survive those paths without hiding the failure details.

**How to apply:** Keep injected-clock tests and readable text when changing fail-fast release orchestration. Do not replace actionable failure output with only a timing summary.