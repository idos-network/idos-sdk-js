---
"@idos-network/enclave": patch
"@idos-network/utils": patch
---

Copy a profile's remember-duration deadline onto the live enclave, so another enclave wiping the shared storage marker cannot keep that iframe's key usable past the deadline.
