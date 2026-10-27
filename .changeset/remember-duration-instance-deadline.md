---
"@idos-network/enclave": patch
"idos-enclave": patch
---

Check shared storage on every key use, so a live enclave drops its cached key and origin authorizations once another enclave instance expires, resets, or replaces the stored profile.
