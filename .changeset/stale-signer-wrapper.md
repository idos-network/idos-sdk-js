---
"@idos-network/client": patch
---

A client returned by `withUserSigner()` (and the logged-in client made from it) now throws once another `withUserSigner()` call or a logout replaces its signer, including through a `kwilClient` or `enclaveProvider` saved before that change. Logging out a stale client no longer clears the newer session or returns a client that can act as it. A logout whose enclave reset fails keeps failing until that reset finishes.
