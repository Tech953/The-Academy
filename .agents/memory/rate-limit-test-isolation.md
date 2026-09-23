---
name: Rate-limit test isolation
description: How to keep local Express rate-limit HTTP tests independent when the limiter store is module-scoped.
---

Local HTTP tests using the shared API limiter should reset the specific local client key before exercising quota counts. The limiter middleware exposes `resetKey`, while broader store reset methods are not guaranteed on the middleware object.

**Why:** The module-scoped limiter retains counts across test cases, so direct localhost requests from an earlier case can make a later quota assertion fail due to ordering rather than behavior.

**How to apply:** Reset only the test client key before a quota-counting HTTP case, then use distinct forwarded identities for isolation assertions.