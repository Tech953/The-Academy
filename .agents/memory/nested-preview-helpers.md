---
name: Nested preview helpers
description: Replit Vite helper plugins can inject root-relative URLs that fail behind a path-based artifact preview.
---

Root-relative preview helper assets are not safe to inject into an artifact served below a non-root preview path. The dev banner plugin hardcodes its helper URL at the proxy root and has no base-path option, so it must be omitted for nested previews.

**Why:** The local Vite server can serve the root helper directly, but the managed artifact proxy forwards only the configured artifact path; the browser then reports a misleading helper failure even when the slide itself renders correctly.

**How to apply:** Keep the helper enabled for root previews, but gate it on the configured base path being `/` for path-based artifacts. Verify the proxied browser console after plugin changes.