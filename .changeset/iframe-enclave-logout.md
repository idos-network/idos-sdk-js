---
"@idos-network/client": patch
---

Fix logout with the iframe enclave. `IframeEnclave.reset` threw, so logout never finished. It now asks the enclave to forget the calling origin: it drops the cached key and that origin's grant, and leaves storage that other sites share in place.
