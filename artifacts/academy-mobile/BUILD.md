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
npx eas-cli build -p android --profile preview
```

The `preview` profile produces an internal-distribution APK. The local static
build check does not replace the EAS native Android build.

## Release connectivity smoke check

Before handing off a preview APK or production app bundle, run the
credential-free release check from the workspace root:

```bash
pnpm --filter @workspace/academy-mobile run check-release
RELEASE_PROFILE=production pnpm --filter @workspace/academy-mobile run check-release
```

The check reads `EXPO_PUBLIC_DOMAIN` from the selected profile in `eas.json`,
then verifies `/api/healthz` and a representative `POST /api/ai/describe`
request. It does not require an EAS build or credentials. If either request
fails, the command prints the exact profile and URL that needs attention.

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
