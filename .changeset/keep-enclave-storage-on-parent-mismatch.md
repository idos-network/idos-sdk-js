---
"@idos-network/enclave": patch
"idos-enclave": patch
---

Stop wiping enclave storage when the parent sends a userId or expected public key that doesn't match the stored profile. The enclave now ignores the stored profile and asks the user to unlock. The stored keys and origin grants are only replaced after the user unlocks a different profile.
