---
name: React 19 useRef initialization
description: Initialize timer and other nullable refs compatibly with React 19 type definitions.
---

React 19 type definitions require an initial value for `useRef`, including timer refs. For an initially empty mutable ref, use a nullable type and initialize it with `null`, then guard it before cleanup or access.

**Why:** Academy uses React 19 types, where the older zero-argument `useRef<T>()` form causes a missing-argument type error.

**How to apply:** Use `useRef<T | null>(null)` for refs initialized later, and handle the null state in effects and cleanup functions.