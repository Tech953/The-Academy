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

## Android installer

An installable APK still requires an Expo account and EAS cloud access:

```bash
cd artifacts/academy-mobile
npx eas-cli login
npx eas-cli init
pnpm run release:preview
```

The `preview` profile produces an internal-distribution APK. The local static
build check does not replace the EAS native Android build.

For a production Android App Bundle, use the guarded production release
command:

```bash
pnpm run release:production
```

Both release commands run the credential-free connectivity check before
starting EAS. A failed health or AI enrichment request stops the command and
prints the profile plus the exact URL that needs attention. The `dev` and
`build` commands do not run this check, so local development and static builds
remain independent of the published API.

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

Before the connectivity requests, the release check also compares the Android
package in `app.json`, the `preview` profile's internal APK settings in
`eas.json`, and the generated Android metadata at
`static-build/android/manifest.json`. If the generated metadata is missing or
stale, refresh it with the local static build before retrying the release check.
To run only this credential-free identity check without contacting the API:

```bash
pnpm --filter @workspace/academy-mobile run build
pnpm --filter @workspace/academy-mobile run check-release:identity
```

## Release connectivity

The `preview` APK and `production` app bundle bake the public deployment
hostname into `EXPO_PUBLIC_DOMAIN`, so live AI descriptions, NPC dialogue, and
content-pack enrichment are enabled in distributed builds:

- Online base: `https://TheeAcademy.replit.app/api`
- Preview: online-enabled APK with deterministic offline fallback
- Production: online-enabled Android App Bundle with deterministic offline fallback
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

The command defaults to an Android preview build. Override the profile or
platform when needed:

```bash
pnpm --filter @workspace/academy-mobile run native-handoff -- \
  --profile production --platform android
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
- `version` from the EAS response, falling back to `app.json`
- the platform package identity, selected EAS `profile`, and build/capture
  `timestamp`
- safe EAS `buildId` and build-details page URL when supplied

The command refuses to mark a successful build as completed when it cannot find
an installer URL/path, version, package identity, profile, or timestamp. It
writes a failed metadata report instead of creating a partial installer
handoff. The report contains normalized metadata only; it does not persist EAS
CLI output, credentials, or command arguments.
