---
name: Native handoff failure stages
description: Durable reporting rule for distinguishing release preflight outcomes from EAS build outcomes.
---

Native handoff reports should preserve a successful connectivity summary when EAS later fails, and identify the build stage with a failure stage, exit code, and readable error.

**Why:** A passing preflight proves the published app is reachable; it does not prove the native build started or completed. Operators need both facts without conflating them.

**How to apply:** Keep preflight summary status separate from top-level handoff status, retain the EAS exit code, and emit an explicit build-stage error when the EAS process exits nonzero.

Platform handoff tests should pass the real `--platform` and selected profile through the recorder and emit the matching artifact extension, so iOS identity and IPA validation are exercised rather than inferred from Android fixtures.