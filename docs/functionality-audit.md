# The Academy — Functionality and Release-Readiness Audit

**Review date:** 2026-09-14  
**Surfaces reviewed:** Web frontend, API server, Expo mobile companion, shared game engine  
**Review type:** Offline/online functionality, installer/build readiness, internal contracts, visual quality, and utilitarian validation

## Executive summary

The Academy is operational in the configured development environment and has a strong offline foundation:

- The API server builds and answers health, curriculum, content-pack, AI description, and NPC dialogue requests.
- The web app renders its CRT boot experience and the production web build succeeds when the workflow-provided `PORT` and `BASE_PATH` variables are supplied.
- The mobile offline engine and relationship behavior have 60 passing tests.
- The mobile Expo preview responds successfully and displays the enrollment flow.
- The deterministic engine covers quizzes, dialogue, content packs, relationship tiers, and tone analysis without a network.

The project is **not yet release-ready for a complete online/offline distribution**. The highest-impact blockers are:

1. The mobile EAS profiles leave `EXPO_PUBLIC_DOMAIN` empty, so external APKs/AABs cannot reach the online API or AI enrichment.
2. The API server typecheck fails with 44 errors, including missing module/type declarations, route return-path errors, schema/Zod mismatches, and storage type mismatches.
3. The Expo static build script fails when Metro's default port is already occupied instead of selecting or accepting an alternate port.
4. The web production build requires undocumented environment variables when invoked directly, although the configured artifact workflow supplies them.
5. The API uses unrestricted CORS and the reviewed route surface does not show a consistent authentication/ownership guard; this requires an explicit deployment security decision before public release.

The visual system is distinctive and consistent, but the review found usability risks: the mobile tab bar remains visible on the enrollment screen, narrow web views display dense boot copy at the edge of the viewport, and the web console reports a missing `/favicon.ico` request.

## Review scope and evidence

### Commands and probes run

| Area | Check | Result |
| --- | --- | --- |
| Workspace | `pnpm install --lockfile-only --offline` | Pass; lockfile is consistent |
| Workspace | `pnpm run typecheck` | Fail; API package reports 44 TypeScript errors |
| Web | `pnpm --filter @workspace/academy run typecheck` | Fail; legacy web type errors remain |
| Web | `pnpm --filter @workspace/academy run build` without environment | Fail; `PORT` is required |
| Web | `PORT=18540 BASE_PATH=/ pnpm --filter @workspace/academy run build` | Pass with warnings |
| API | `pnpm --filter @workspace/api-server run build` | Pass; produces `dist/index.mjs` |
| API | `pnpm --filter @workspace/api-server run typecheck` | Fail; 44 TypeScript errors |
| Mobile | `pnpm --filter @workspace/academy-mobile run typecheck` | Pass |
| Mobile | `pnpm --filter @workspace/academy-mobile run test` | Pass; 2 files, 60 tests |
| Mobile | `pnpm --filter @workspace/academy-mobile run build` | Fail when port 8081 is occupied by another Metro/Vite process |
| Mobile | `pnpm exec eas --version` | Not available in the workspace; cloud EAS build was not run |
| Web runtime | `GET /` | Pass; HTTP 200 |
| API runtime | `GET /api/healthz` | Pass; HTTP 200, `{"status":"ok"}` |
| API runtime | `GET /api/content-pack` | Pass; HTTP 200 with current weekly pack |
| API runtime | `GET /api/courses` | Pass; HTTP 200 with course catalog |
| API runtime | Valid AI description request | Pass; HTTP 200 with generated description |
| API runtime | Valid NPC dialogue request | Pass; HTTP 200 with generated response |
| API validation | Empty AI and dialogue request bodies | Pass; HTTP 400 responses |
| API validation | Disallowed and malformed RSS URLs | Pass; HTTP 403 and HTTP 400 responses |
| API not-found behavior | Unknown saved game and character IDs | Pass; HTTP 404 responses |
| Mobile preview | Expo web root | Pass; HTTP 200 |

### Captured visual evidence

- [Web desktop boot screen](./audit-web-desktop.jpg)
- [Web narrow boot screen](./audit-web-narrow.jpg)
- [Mobile enrollment screen](./audit-mobile-phone.jpg)

## Installer and build readiness

### Web frontend

**Status: Conditional pass**

- The artifact workflow defines `PORT=18540` and `BASE_PATH=/`.
- The Vite production build succeeds when those variables are present.
- The build produces a static `dist/public` directory and the artifact config serves it with an SPA rewrite.
- A direct package build without the workflow environment fails immediately with `PORT environment variable is required`.
- The build emits a PostCSS `from` warning, sourcemap-location warnings, a dynamic-import/static-import warning for `seededRandom.ts`, and a large JavaScript chunk warning. The main JavaScript bundle is approximately 1.78 MB before gzip.

**Release implication:** The artifact workflow is configured correctly, but CI/GitHub instructions should set the required variables explicitly or the package build should provide safe production defaults.

### API server

**Status: Build pass, quality-gate fail**

- The esbuild bundle completes successfully and produces `artifacts/api-server/dist/index.mjs`.
- The configured production health path is `/api/healthz`, and the live endpoint returns 200.
- TypeScript validation fails with 44 errors. The failures include:
  - missing `@neondatabase/serverless` and `../shared/schema` declarations;
  - storage fields that do not match the database model;
  - `zod`/`drizzle-zod` type incompatibilities;
  - route handlers with incomplete return paths;
  - `ZodError.errors` usage that does not match the installed Zod API;
  - undeclared or mismatched integration storage types.

**Release implication:** The bundle can be produced, but the API does not currently have a clean static quality gate. The successful build should not be treated as proof that all route contracts are type-safe.

### Expo mobile app

**Status: Development preview pass, distributable build conditional**

- `app.json` has a stable Android package ID: `com.theacademy.mobile`.
- `eas.json` has:
  - a development APK profile;
  - a preview APK profile for internal distribution;
  - a production Android App Bundle profile.
- `metro.config.js` includes workspace-aware dependency paths, which is appropriate for pnpm/EAS resolution.
- No `.apk`, `.aab`, or `.ipa` exists in the repository.
- The EAS CLI is not installed in this workspace, and an EAS cloud build was not run because it requires the user's Expo account and external build service.
- Both preview and production EAS profiles set `EXPO_PUBLIC_DOMAIN` to an empty string.
- The mobile API layer correctly treats an empty domain as offline mode, but this means a package built from the current profiles cannot use online AI enrichment or content-pack sync.
- The repository's static Expo deployment build failed because it attempted to start Metro on port 8081 while another workspace preview already occupied that port. The script does not expose an alternate Metro port setting.
- Expo reports compatibility warnings for installed versions of `@react-native-community/netinfo`, `expo`, and `expo-constants`.

**Release implication:** The current configuration can produce an offline-capable package after a successful EAS build, but it is not configured for a complete online/offline mobile release.

## Online functionality review

### Verified working

1. **API health and routing**
   - `/api/healthz` returns a structured healthy response.
   - Curriculum and content-pack endpoints return data.
   - Unknown character/session IDs return controlled 404 responses.

2. **AI enrichment**
   - A valid `/api/ai/describe` request returned generated location prose.
   - A valid `/api/npc-dialogue` request returned a contextual faculty response.
   - Both endpoints reject incomplete input with controlled 400 responses.

3. **Content-pack generation**
   - The server generated a current weekly pack through the live AI path.
   - The runtime log confirmed a fresh weekly pack was generated.

4. **Input and upstream protection**
   - RSS input rejects malformed URLs and domains outside the allowlist.
   - AI and content-pack routes use dedicated rate limiters.
   - Request strings are trimmed and length-limited by the security middleware.

### Not fully verified

- Authenticated user creation, character ownership, game save/load, enrollment mutation, academic-progress mutation, and reading-progress persistence were not exercised with writes during this audit.
- Online-to-offline transitions driven by real device connectivity events were not run on a physical device.
- A production deployment with a real public backend domain was not tested.
- EAS-installed runtime behavior was not tested because no cloud-built package is present.

## Offline functionality review

### Verified working

The mobile test suite passed **60/60 tests** across two files. The suite verifies:

- no-backend detection when `EXPO_PUBLIC_DOMAIN` is unset;
- online request failure and timeout handling;
- offline fallback for location descriptions, object examination, and NPC replies;
- online responses taking precedence when the live request succeeds;
- seeded quiz generation for all four GED subjects;
- deterministic quiz output;
- deterministic NPC conversations across the dialogue archetypes;
- non-empty offline dialogue lines;
- deterministic offline content packs with required fields and events;
- offline emotion inference;
- relationship score-to-tier mapping;
- warm, hostile, curious, and neutral dialogue-tone handling;
- relationship shift clamping and display-once behavior.

The shared engine is correctly consumed by both web and mobile artifacts, and the offline engine itself makes no API calls.

### Persistence and recovery observations

- Mobile game state is persisted to AsyncStorage after initialization.
- State is restored on startup with a default-state merge.
- Core gameplay does not require a network.
- Corrupt or unavailable AsyncStorage currently falls back to a fresh game and suppresses the storage error. This prevents a crash but can conceal data loss from the player.
- The tests cover mocked request failures and fallbacks, but not a real app restart after a device-level offline session or a real NetInfo transition.

## Internal functionality and contract audit

### Positive findings

- `@workspace/game-engine` is the canonical shared location for seeded randomness, dialogue templates, events, study templates, content packs, and world layout.
- The mobile app uses direct fetch intentionally and keeps the offline engine local; it does not add database or OpenAPI codegen to the mobile package.
- Async actions in the mobile game context reset loading indicators in `finally` blocks.
- Relationship updates clamp scores to 0–100 and map them to explicit tiers.
- The API has explicit health, input-validation, rate-limiting, and not-found behavior in the exercised paths.
- Error boundary support exists in the mobile app.

### Risks and inconsistencies

1. **API type safety is currently broken — High**
   - The server builds despite 44 typecheck errors.
   - This weakens confidence in route return contracts, schema validation, persistent storage, and generated integration code.

2. **Mobile content-pack type duplication — Medium**
   - The mobile API file declares its own `ContentPack` interface while the shared engine and server maintain related content-pack shapes.
   - The current runtime response works, but future field changes can drift silently unless the structural contract is tested or centralized.

3. **Persistence errors are silent — Medium**
   - AsyncStorage write errors are caught and discarded.
   - A user can continue playing while believing progress is safe when a storage write has failed.

4. **Public API boundary needs an explicit auth decision — High for public deployment**
   - The Express app enables unrestricted CORS with `cors()`.
   - The inspected character, game-session, enrollment, and progress routes do not show a consistently applied authentication/ownership middleware at the app boundary.
   - Ownership helpers exist, but their use must be verified route by route before exposing persistent player data publicly.

5. **Managed deployment health evidence is inconsistent — Medium**
   - Historical deployment logs recorded a generic `/api` healthcheck returning 500 during startup.
   - The current artifact configuration specifies `/api/healthz`, and the direct endpoint returns 200.
   - The deployment probe and artifact health path should be confirmed to avoid a false-negative deployment health check.

## Visual and utilitarian review

### Web

**Strengths**

- The CRT boot screen has a clear identity: bright phosphor green, terminal typography, framed diagnostic sections, and a strong center alignment on desktop.
- The desktop boot view uses the available width well and preserves the retro visual hierarchy.
- The responsive narrow screenshot remains readable and does not horizontally overflow.

**Findings**

- **Medium — Narrow-screen density:** The 390px boot view pushes long diagnostic strings close to the viewport edge and compresses the system title. It remains usable, but the visual hierarchy is harder to scan on a phone.
- **Low — Missing favicon request:** Browser logs report one 404 resource request, and `/favicon.ico` returns 404 while `/favicon.svg` returns 200. The page should either reference the SVG explicitly or provide the conventional ICO route.
- **Low — Production payload size:** The main JavaScript bundle is approximately 1.78 MB before gzip, which can slow first load on low-bandwidth devices.
- **Low — Console noise:** The production build emits PostCSS and sourcemap warnings that should be cleaned before using build logs as a release signal.

### Mobile

**Strengths**

- The enrollment screen is legible at 402×874, maintains the CRT palette, and gives the user one obvious action.
- Space Mono and the green-on-black palette are consistent with the web identity.
- The input, enrollment button, and status/navigation affordances have clear borders and strong contrast.

**Findings**

- **Medium — Navigation before enrollment:** The bottom tab bar is visible while the user is still on the enrollment screen. This creates a utilitarian ambiguity: Faculty, Study, and Student File appear available before the player has enrolled, even though the main game state is not ready.
- **Medium — Platform-specific visual validation remains incomplete:** The screenshot is Expo web, not a native Android/iOS render. Native tab behavior, keyboard avoidance, safe-area spacing, and touch-target sizing still require device validation.
- **Low — Expo compatibility warnings:** Metro reports versions that are outside Expo's expected compatibility ranges. The app still starts, but native builds should use the expected versions before distribution.
- **Low — Deprecated style warnings:** Expo web logs deprecated `shadow*` and `pointerEvents` prop warnings. These do not currently block rendering but add noise and may become native compatibility issues.

## Prioritized findings

| Priority | Finding | Affected surface | User/release impact | Recommendation |
| --- | --- | --- | --- | --- |
| High | EAS profiles have no backend domain | Mobile online mode | Distributed APK/AAB cannot use live AI or content sync | Provide a stable published API domain in release profiles and verify it from an installed build |
| High | 44 API typecheck errors | API/server quality gate | Route/schema/storage regressions can ship behind a successful bundle | Restore a clean API typecheck before public release |
| High | Auth and ownership boundary is not consistently evident | API/player data | Public routes may expose or mutate persistent data without a verified user boundary | Perform a route-by-route auth and ownership review before deployment |
| Medium | Static mobile build depends on free port 8081 | Mobile installer pipeline | Clean builds can fail based on unrelated workspace processes | Make Metro port configurable or detect/reuse the existing project Metro instance |
| Medium | Direct web build requires workflow-only env variables | Web build/CI | GitHub/CI users can get an immediate build failure | Document `PORT`/`BASE_PATH` in the developer guide or provide production defaults |
| Medium | Persistence write failures are silent | Mobile offline continuity | Players may lose progress without feedback | Surface a recoverable save warning and add a restart/persistence test |
| Medium | Mobile navigation visible before enrollment | Mobile utility | Users may enter screens that are not yet meaningful | Hide or disable gameplay tabs until enrollment is complete |
| Low | Favicon 404 and build warnings | Web polish | Browser console and release logs are noisy | Add the favicon link/route and clean PostCSS/sourcemap warnings |
| Low | Large web bundle | Web performance | Slower first load on constrained connections | Split heavy desktop apps or lazy-load non-core modules |

## Overall decision

**Current disposition: Conditional release candidate for offline development testing; not approved for complete online/offline public distribution.**

The offline gameplay core is the strongest validated area. The next release gate should be the API typecheck/auth boundary and a real EAS package built with a reachable production backend. After that, native-device validation should confirm the mobile tab/enrollment flow, persistence across restart, and online/offline transitions.
