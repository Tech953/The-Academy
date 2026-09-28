---
name: Release smoke CLI test cost
description: Why release smoke CLI integration tests add noticeable suite runtime.
---

The release-check command runs its offline GED boundary validation before smoke requests. Spawning the CLI therefore starts another test process, so repeated output-path integration fixtures add more runtime than their network stubs alone suggest.

**Why:** CLI subprocess tests are useful for verifying argument parsing, output formatting, and archived reports, but each process repeats the offline boundary work.

**How to apply:** Keep subprocess cases focused on distinct CLI behaviors. Test formatting helpers and combinations that do not depend on CLI argument parsing or report persistence in-process.