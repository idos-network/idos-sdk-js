---
"@idos-network/enclave": patch
"@idos-network/utils": patch
---

Copy a profile's remember-duration deadline onto the live enclave, and drop a cached key when the stored user id is gone, so another enclave's reset cannot leave that key usable. An earlier deadline on this instance reloads a shared session that another enclave extended, instead of clearing it.
