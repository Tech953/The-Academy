---
name: Radiant save migration
description: Durable rule for upgrading legacy Radiant state during game loading.
---

A loaded Radiant payload should be persisted immediately only when migration changes its serialized representation; the migrated in-memory state must remain authoritative if the best-effort write fails.

**Why:** Saving every load adds unnecessary requests, while waiting for a later periodic save leaves upgraded legacy data circulating and a failed write must not discard the usable session state.

**How to apply:** Compare the original and migrated serialized payload after migration, assign the migrated game state before saving, and let the existing save failure handling absorb request errors.