---
name: Mobile Vitest boundary
description: Why mobile unit tests should avoid importing the full Expo context provider.
---

Mobile Vitest tests run in a Node environment and should import pure context support logic from `.ts` modules rather than the native-heavy provider `.tsx` module.

**Why:** Importing the provider pulls Expo/React Native dependencies into the Node transformer, which can fail on Flow syntax before any test runs.

**How to apply:** Keep selectors and other state-independent context logic in small `.ts` modules, then import those modules from both the provider and unit tests.