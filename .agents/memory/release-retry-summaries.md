---
name: Release retry summaries
description: Durable rules for reporting retries and recovery in Academy mobile release checks.
---

Stable release profile summaries should record separate health and AI attempt counts. A profile is `recovered` only when it ultimately passes after more than one attempt; a persistent failure keeps its final error and counts but is not recovered.

**Why:** Operators need to distinguish an immediate pass from a transient outage without mistaking an exhausted retry sequence for recovery.

**How to apply:** When changing mobile release retries or report schemas, preserve both counters through standalone smoke reports and native handoff summaries, and keep legacy report fields compatible where possible.

Timeout behavior can be tested against a real delayed local HTTP server by injecting a short request timeout; production keeps the normal 15-second default.