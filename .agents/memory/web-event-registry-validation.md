---
name: Web event registry validation
description: Durable testing rule for shared event categories and documented web compatibility exceptions.
---

The web event registry validator should require a non-empty trimmed exception reason for intentionally unsupported shared categories, while every other category must map to a legacy event source.

**Why:** A truthy-but-blank exception can silently hide an unsupported web path, while broad tests against the live catalog do not isolate the exception contract.

**How to apply:** Keep the real catalog validation as a command-level check, and use injected template, mapping, exception, and generator fixtures for focused regression tests.