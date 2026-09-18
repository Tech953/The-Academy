# Mobile build check

## Local static build

From the workspace root:

```bash
pnpm --filter @workspace/academy-mobile run build
```

The build script starts a production Metro server, downloads the iOS and
Android bundles and manifests, copies referenced assets, and writes the
generated deployment files under `artifacts/academy-mobile/static-build/`.

Metro uses port `8081` by default. If that port is occupied, the script
deterministically checks the next available ports and starts its own server
there. Set `EXPO_METRO_PORT` (or `METRO_PORT`) to choose the first port in
the search range:

```bash
EXPO_METRO_PORT=8090 pnpm --filter @workspace/academy-mobile run build
```

## Native installers

An installable APK still requires an Expo account and EAS cloud access:

```bash
cd artifacts/academy-mobile
npx eas-cli login
npx eas-cli init
pnpm run release:preview
```

The `preview` profile produces an internal-distribution APK. To run the same
guarded preview handoff for iOS, use:

```bash
pnpm run release:preview:ios
```

The local static build check does not replace the EAS native build.

For a production Android App Bundle, use:

```bash
pnpm run release:production
```

For a production iOS build, use the matching guarded command:

```bash
pnpm run release:production:ios
```

## Android bulletin relaunch lane

The repeatable native cache lane uses a separate internal APK profile so normal
preview and production builds never point at a local test server. Build the
lane APK with EAS, then install and exercise it on one attached emulator or
device:

```bash
npx eas-cli build --profile preview-lane --platform android
pnpm --filter @workspace/academy-mobile run android:bulletin-lane -- \
  --apk /path/to/preview-lane.apk
```

The runner requires `adb` and exactly one ready device unless `--device SERIAL`
is supplied. It fails with setup instructions when Android platform-tools, the
APK, or a device is missing; it never silently skips the lane.

The lane maps port 8765 with `adb reverse`, seeds a valid remote bulletin,
force-stops and relaunches while the refresh response is held open, and checks
that the cached bulletin is visible before the response completes. It then
corrupts and expires the native content-pack value through the lane-only deep
link harness and confirms both cases reach the deterministic local fallback.
The lane APK is intentionally separate from the normal `preview` profile.

All four native release commands run the credential-free connectivity check
for every configured EAS profile before starting EAS. A failed health or AI
enrichment request stops the command and prints the profile plus the exact URL
that needs attention. The `dev` and `build` commands do not run this check, so
local development and static builds remain independent of the published API.

## Release connectivity smoke check

The release commands above run this check automatically. To run the check
without starting an EAS build, use it directly from the workspace root:

```bash
pnpm --filter @workspace/academy-mobile run check-release
RELEASE_PROFILE=production pnpm --filter @workspace/academy-mobile run check-release
```

The check reads `EXPO_PUBLIC_DOMAIN` from the selected profile in `eas.json`,
then verifies `/api/healthz` and a representative `POST /api/ai/describe`
request. It does not require an EAS build or credentials. If either request
fails, the command prints the exact profile and URL that needs attention.
Network errors and HTTP 5xx responses get at most two brief retries; 4xx
responses and invalid success payloads stop immediately.

For an archiveable all-profile result, pass `--all` and `--report`. Human-readable
lines are still printed, while the JSON report contains one stable result entry
for every discovered profile:

```bash
pnpm --filter @workspace/academy-mobile run check-release -- \
  --all --report .local/outputs/academy-mobile-release-smoke.json
```

Before the connectivity requests, the release check also compares the Android
package in `app.json`, the selected profile's Android settings in `eas.json`,
and the generated Android metadata at `static-build/android/manifest.json`.
The `preview` profile must remain an internal APK profile; the `production`
profile must remain an Android App Bundle profile. If the generated metadata
is missing or stale, refresh it with the local static build before retrying the
release check.

Every archived report written by the release tooling includes
`schemaVersion: 1`. Consumers should require the current version before reading
report fields; a missing or unknown version should be treated as an unsupported
report rather than silently interpreted as the current contract. Future field
additions, renames, removals, or incompatible shape changes require an
intentional version increment and corresponding contract updates.

To run only this credential-free identity check without contacting the API:

```bash
pnpm --filter @workspace/academy-mobile run build
pnpm --filter @workspace/academy-mobile run check-release:identity
RELEASE_PROFILE=production pnpm --filter @workspace/academy-mobile run check-release:identity
```

## Release connectivity

The `preview` and `production` EAS profiles bake the public deployment hostname
into `EXPO_PUBLIC_DOMAIN` for both Android and iOS, so live AI descriptions,
NPC dialogue, and content-pack enrichment are enabled in distributed builds:

- Online base: `https://TheeAcademy.replit.app/api`
- Preview: online-enabled Android APK or iOS build with deterministic offline fallback
- Production: online-enabled Android App Bundle or iOS build with deterministic offline fallback
- Development: the local workflow supplies its development hostname

The public hostname is configuration, not a credential. If the published
backend is unavailable, `lib/gameFallbacks.ts` returns bundled deterministic
content and the core study loop remains local.

## Native handoff preflight

Use the handoff command for a profile-scoped EAS build. It runs the release
connectivity check first and will not start EAS when health or AI enrichment
fails:

```bash
RELEASE_PROFILE=preview pnpm --filter @workspace/academy-mobile run native-handoff
```

The command defaults to an Android preview build. The iOS package scripts above
select the iOS platform explicitly; you can also override the profile or
platform directly:

```bash
pnpm --filter @workspace/academy-mobile run native-handoff -- \
  --profile production --platform android
```

For an iOS production check without starting a cloud build:

```bash
pnpm --filter @workspace/academy-mobile run native-handoff -- \
  --check-only --profile production --platform ios
```

To verify the preflight without starting a cloud build:

```bash
pnpm --filter @workspace/academy-mobile run native-handoff -- --check-only
```

After a successful EAS build, the command writes the durable handoff report to
`.local/outputs/academy-mobile-native-handoff.json` (override this with
`RELEASE_REPORT_PATH`). The `build` record contains:

- `installerUrl` for a cloud APK, AAB, or IPA, or `installerPath` for a local
  installer artifact
- `installerSha256` for a local installer when the handoff process can read the
  file; cloud-only handoffs record no checksum and remain valid
- `version` from the EAS response, falling back to `app.json`
- the platform package identity, selected EAS `profile`, and build/capture
  `timestamp`
- safe EAS `buildId` and build-details page URL when supplied

The command refuses to mark a successful build as completed when it cannot find
an installer URL/path, version, package identity, profile, or timestamp. It
writes a failed metadata report instead of creating a partial installer
handoff. The report contains normalized metadata only; it does not persist EAS
CLI output, credentials, or command arguments.

Before distributing the installer, validate that handoff without a device or
network request:

```bash
pnpm --filter @workspace/academy-mobile run check-release:handoff
RELEASE_PROFILE=production pnpm --filter @workspace/academy-mobile run check-release:handoff
RELEASE_PLATFORM=ios pnpm --filter @workspace/academy-mobile run check-release:handoff
RELEASE_PLATFORM=ios RELEASE_PROFILE=production \
  pnpm --filter @workspace/academy-mobile run check-release -- --handoff
```

You can also pass the platform directly:

```bash
pnpm --filter @workspace/academy-mobile run check-release -- \
  --handoff --platform ios --profile preview
```

For the Android production shortcut, use:

```bash
pnpm --filter @workspace/academy-mobile run check-release:handoff:production
```

The selected profile reads the native handoff report (override it with
`RELEASE_HANDOFF_PATH`) and applies the matching distribution contract:
Android `preview` must remain an internal APK handoff, while Android
`production` must remain a store-distribution App Bundle handoff. For iOS,
`preview` must remain an internal IPA handoff and `production` must remain a
store-distribution IPA handoff. Each platform must keep the completed status,
selected profile, recorded version, installer type, and platform-specific
package identity aligned with `app.json` (`expo.android.package` or
`expo.ios.bundleIdentifier`). EAS Android version-code auto-increment metadata is
allowed alongside that app version.
Validation failures list every actionable mismatch and write a failed release
report instead of passing.

When a handoff report contains `build.installerSha256`, verify a downloaded
installer before distributing it:

```bash
RELEASE_HANDOFF_PATH=.local/outputs/academy-mobile-native-handoff.json \
  pnpm --filter @workspace/academy-mobile run check-release -- \
  --verify-checksum /path/to/downloaded/academy-preview.apk
```

The command exits successfully only when the downloaded file matches the
recorded SHA-256. Reports for cloud-only installers do not contain a checksum;
their normal handoff validation remains valid without a local file to hash.
