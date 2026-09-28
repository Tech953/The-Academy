---
name: pnpm CLI argument separator
description: How pnpm forwards the separator used before package-script flags.
---

When invoking a package script as `pnpm run script -- --flag`, this workspace forwards the bare `--` into the script's argument vector.

**Why:** The Android lane command documented this standard-looking pattern, but its parser initially treated the forwarded separator as an unknown option and exited before reading `--apk`.

**How to apply:** CLI parsers for pnpm scripts should ignore a standalone `--` before processing forwarded options, and tests should include the documented invocation shape.