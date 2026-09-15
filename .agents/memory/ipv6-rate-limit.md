---
name: IPv6 rate-limit identity
description: The API rate limiter groups IPv6 clients by subnet rather than treating every address as a separate identity.
---

The API's IPv6 rate-limit behavior intentionally groups addresses within the same subnet; regression tests for client isolation must use distinct IPv6 networks, not adjacent addresses in one /64.

**Why:** The rate-limit library normalizes IPv6 keys to reduce quota evasion from address rotation, so adjacent IPv6 fixtures can correctly share a quota.

**How to apply:** When testing forwarded-client isolation, use distinct IPv6 prefixes and keep the production proxy-hop configuration enabled.