---
name: PNPM temporary package fixtures
description: Preserve pnpm executable shim resolution when testing package lifecycle scripts in temporary directories.
---

For lifecycle tests that run a synthetic package outside the workspace, do not symlink the workspace package's entire `node_modules` directory into the fixture. PNPM-generated `.bin` shims compute their store paths relative to the shim location, so resolving them through a temporary symlink can point at a nonexistent `/node_modules/.pnpm` path.

**Why:** A fixture can fail before exercising its intended script, making the test report a package-manager path issue rather than the lifecycle behavior under test.

**How to apply:** Keep the fixture's package files and outputs in a unique temporary directory, and add the real workspace package's `.bin` directory to the child process `PATH`. Resolve imported source modules from their real workspace paths.