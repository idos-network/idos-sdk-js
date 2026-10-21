---
"@idos-network/kwil-js": patch
---

Reject a KGW auth challenge unless domain, version, chain id, URI, and origin are present and match the client, so the wallet does not sign a challenge it did not check.
