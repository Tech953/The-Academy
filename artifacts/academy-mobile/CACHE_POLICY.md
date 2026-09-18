# Bulletin cache compatibility policy

The mobile bulletin cache is an AsyncStorage value under
`academy-content-pack-v1`. App upgrades do not clear this key automatically.
The current reader applies the following policy:

- A cache written by the previous app version is compatible when it is the
  legacy v1 content-pack shape: a missing `schemaVersion` is migrated to
  schema `1`, and a missing `eventsRepaired` flag defaults to `false`.
- A compatible cache must still pass the current runtime contract and must not
  be expired. Valid cached content is made visible before the network refresh
  resolves.
- Expired values, malformed JSON, unknown schema versions, missing required
  fields, and invalid event collections are rejected. The app does not render
  rejected values; it uses the deterministic bundled content pack instead.
- A future incompatible cache shape requires an explicit migration and schema
  update. Do not silently reinterpret a newer schema as the current one.

`__tests__/cache-upgrade.test.tsx` is the upgrade-boundary contract: it uses the
same AsyncStorage adapter exposed to the provider, seeds a previous-version
value, holds refresh open to verify cached-first rendering, and checks expired
and malformed legacy values fall back deterministically.