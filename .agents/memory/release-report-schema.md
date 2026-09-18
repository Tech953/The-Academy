---
name: Release report schema
description: Durable compatibility rule for archived mobile release reports.
---

Archived mobile release reports use one explicit schema version owned by the shared report writer. Consumers should reject missing or unknown versions instead of guessing the current shape.

**Why:** Release reports are consumed after the command exits, so silently interpreting a future field addition or rename as the old contract can produce incorrect release decisions.

**How to apply:** Increment the version intentionally for any field addition, rename, removal, or incompatible shape change, then update the contract tests and BUILD.md together.