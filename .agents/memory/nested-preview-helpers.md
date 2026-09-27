---
name: Nested preview helpers
description: Replit Vite helper plugins can inject root-relative URLs that fail behind a path-based artifact preview.
---

Root-relative preview helper assets are not safe to inject into an artifact served below a non-root preview path. The dev banner plugin hardcodes its helper URL at the proxy root and has no base-path option, so it must be omitted for nested previews.

**Why:** The local Vite server can serve the root helper directly, but the managed artifact proxy forwards only the configured artifact path; the browser then reports a misleading helper failure even when the slide itself renders correctly. Vite config bundling can also rewrite cartographer's `import.meta.url` fallback, making its beacon lookup fail and silently omit the injected output.

**How to apply:** Keep the helper enabled for root previews, but gate it on the configured base path being `/` for path-based artifacts. For installed-plugin compatibility checks, import the plugin directly into a middleware-mode Vite server instead of relying only on output from the bundled app config, and assert that the plugin actually injected its expected output before scanning URLs.

For the runtime error overlay, transformed HTML alone cannot prove error reporting works. Use a browser against a development Vite server, wait for its real HMR websocket connection, trigger a runtime error, and assert the server receives the overlay's custom event. Check that the observed websocket route is covered by the artifact's configured service paths.

**Why:** A preview can render normally while the HMR socket or runtime error event is broken; the server receiving the browser's error is the behavior that matters.

**How to apply:** For nested-preview regressions, verify both the base-prefixed client URL and a real browser-to-server HMR error report. Keep this fixture development-only and separate from production output.