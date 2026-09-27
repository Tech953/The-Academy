---
name: EAS installer digests
description: Provider checksum availability and safe use in native handoff.
---

As of 2026-09-27, the official EAS CLI build query selects artifact URLs but does not request a portable installer SHA-256 field. EAS output may still surface a checksum through other metadata or a future version, so cloud checksums remain optional.

**Why:** EAS fingerprint hashes identify build inputs, not the bytes of the generated APK, AAB, or IPA, and cannot verify a downloaded installer.

**How to apply:** Check the current EAS build output before relying on a checksum field. Accept only a valid 64-hex SHA-256 tied to artifact metadata; never fall back to `fingerprint.hash`. Keep cloud handoffs valid when no provider digest is available, while making clear that checksum verification then cannot run.