---
"@idos-network/utils": patch
---

Compute blob CIDs with `ipfs-unixfs-importer@17` instead of `ipfs-only-hash`. CIDs stay the same. This removes `protobufjs@6` and about 100 other transitive dependencies, including the ones with known CVEs.
