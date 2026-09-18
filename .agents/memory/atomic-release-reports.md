---
name: Atomic release reports
description: Durable persistence rule for mobile release report archives.
---

Release report archives must be written to a temporary file, read back and parsed as complete JSON, then atomically renamed into place. Failure handling must preserve the original release error.

**Why:** A process interruption or filesystem failure during a direct write can leave downstream tooling with truncated JSON or replace a valid prior archive.

**How to apply:** Keep temporary-file cleanup best effort, never replace the destination before validation succeeds, and report archival failures separately while retaining the original check or build failure.