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

For a profile-specific build, pass the EAS profile so the generated iOS and
Android runtime metadata is checked against the host that Metro embeds:

```bash
RELEASE_PROFILE=preview pnpm --filter @workspace/academy-mobile run build
RELEASE_PROFILE=production pnpm --filter @workspace/academy-mobile run build
```

The selected profile host must match the validated EAS configuration on both
platforms before the build reports completion. An offline-only EAS profile with
no `EXPO_PUBLIC_DOMAIN` keeps the host unset; the app continues to use its
deterministic offline fallback.

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
`schemaVersion: 8`. Android identity and native-handoff reports include the
selected EAS profile as `androidProfile`; existing identity fields remain
unchanged. Production Android handoff records also retain EAS's optional
`build.androidVersionCode` separately from the human-facing `build.version`.
The code is omitted when EAS does not supply it, so preview and iOS reports
without it retain their prior field shape. A native handoff stopped by release
profile host validation also includes `hostValidation` with the affected
profile, expected published host, configured host, and validation stage, plus
a failed profile summary. Failed EAS builds include `easDiagnostics.stdout` with
failure-related lines and `easDiagnostics.stderr` with the final output excerpt.
Each excerpt is sanitized and capped at 4,000 characters; common credential
assignments, authorization headers, private-key blocks, and credential-bearing
URL parameters are redacted. The top-level error, EAS exit code, and successful
preflight summary remain separate. Signal-terminated EAS processes record
`easExitCode: null` and the signal in `easSignal`, with a termination-specific
error message. The handoff validator requires the current schema version before
reading handoff fields. Missing, older, and unsupported versions are reported as
invalid handoff reports, not as build or connectivity failures; regenerate the
report with the current release tooling before validating it.
Future field additions, renames, removals, or incompatible shape changes
require an intentional version increment and corresponding contract updates.

To run only this credential-free identity check without contacting the API:

```bash
RELEASE_PROFILE=preview pnpm --filter @workspace/academy-mobile run build
RELEASE_PROFILE=preview pnpm --filter @workspace/academy-mobile run check-release:identity
RELEASE_PROFILE=production pnpm --filter @workspace/academy-mobile run build
RELEASE_PROFILE=production pnpm --filter @workspace/academy-mobile run check-release:identity
```

## Release connectivity

The production EAS profile's `build.production.env.EXPO_PUBLIC_DOMAIN` is the
authoritative published hostname. The release guard requires preview to match
it. Both profiles bake the hostname into Android and iOS builds, so live AI
descriptions, NPC dialogue, and content-pack enrichment are enabled:

- Online base: derived from the authoritative production hostname in `eas.json`
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
- `installerSha256` for a local installer the handoff process can read, or for a
  cloud artifact when EAS provides a supported SHA-256 digest
- optional `installerSha256Source` set to `local` for a locally computed digest
  or `eas` for an EAS-provided digest; older reports without this field remain
  valid
- `version` from the EAS response, falling back to `app.json`
- optional `androidVersionCode` from EAS when the Android build returns one;
  this can auto-increment independently of the human-facing app version
- the platform package identity, selected EAS `profile`, and build/capture
  `timestamp`
- safe EAS `buildId` and build-details page URL when supplied

The command refuses to mark a successful build as completed when it cannot find
an installer URL/path, version, package identity, profile, or timestamp. It
writes a failed metadata report instead of creating a partial installer
handoff. The report contains normalized metadata only; it does not persist EAS
CLI output, credentials, or command arguments.

Before distributing the installer, validate the handoff report. These commands
run the local checker only; they do not contact a device or start EAS:

```bash
# Android preview
pnpm --filter @workspace/academy-mobile run check-release:handoff
# Android production
pnpm --filter @workspace/academy-mobile run check-release:handoff:production
# iOS preview
pnpm --filter @workspace/academy-mobile run check-release:handoff:ios
# iOS production
pnpm --filter @workspace/academy-mobile run check-release:handoff:ios:production
```

The selected profile reads the native handoff report (override it with
`RELEASE_HANDOFF_PATH`) and applies the matching distribution contract:
Android `preview` must remain an internal APK handoff, while Android
`production` must remain a store-distribution App Bundle handoff. For iOS,
`preview` must remain an internal IPA handoff and `production` must remain a
store-distribution IPA handoff. Each platform must keep the completed status,
selected profile, recorded version, installer type, and platform-specific
package identity aligned with `app.json` (`expo.android.package` or
`expo.ios.bundleIdentifier`). When EAS provides an Android version code, it is
recorded separately from the app version; it is optional, so preview and iOS
reports without that field remain valid.
Validation failures list every actionable mismatch and write a failed release
report instead of passing.

Pass the downloaded installer to the handoff gate to validate its metadata and
verify its checksum before distribution:

```bash
RELEASE_HANDOFF_PATH=.local/outputs/academy-mobile-native-handoff.json \
  pnpm --filter @workspace/academy-mobile run check-release -- \
  --handoff --verify-checksum /path/to/downloaded/academy-preview.apk
```

For a downloaded iOS IPA, select the iOS handoff contract and pass the `.ipa`
file to the same gate:

```bash
RELEASE_HANDOFF_PATH=.local/outputs/academy-mobile-native-handoff.json \
  pnpm --filter @workspace/academy-mobile run check-release -- \
  --handoff --platform ios --profile preview \
  --verify-checksum /path/to/downloaded/academy-preview.ipa
```

When a SHA-256 is recorded, a mismatch exits unsuccessfully and the failure
report includes the artifact path and expected and found digests. If the cloud
handoff has no recorded digest, the gate logs that file comparison was skipped
and still runs all other handoff checks. The standalone
`--verify-checksum /path/to/installer` command remains strict and requires a
recorded checksum.
