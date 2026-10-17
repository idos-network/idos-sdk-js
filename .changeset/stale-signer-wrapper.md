---
"@idos-network/client": patch
---

A client returned by `withUserSigner()` (and the logged-in client made from it) now throws once another `withUserSigner()` call or a logout replaces its signer, instead of running reads and writes as the newer caller. Logging out a stale client no longer clears the newer session.
