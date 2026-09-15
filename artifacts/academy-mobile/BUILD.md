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