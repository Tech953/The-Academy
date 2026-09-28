---
name: Drizzle-Zod and Zod inference
description: Keep inferred types aligned with generated schemas when Drizzle-Zod uses Zod 4.
---

Drizzle-Zod 0.8.x generates schemas using Zod 4 types. The workspace can still pin the root `zod` package to 3.25.x, which also provides the `zod/v4` subpath. Inference from the root `zod` entrypoint is not type-compatible with generated Zod 4 schemas.

**Why:** The mismatch produced schema inference errors about missing Zod 3 members even though both packages appeared to share the same installed `zod` dependency. Adding casts at call sites would hide the actual type boundary.

**How to apply:** When inferring types from schemas built by Drizzle-Zod 0.8.x, import `z` from `zod/v4`. Keep the schema types intact and recheck Drizzle-Zod's exports after dependency upgrades.