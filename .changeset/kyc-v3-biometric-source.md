---
"@idos-network/credentials": minor
---

Add a required `source` (`"LIVENESS"` | `"SELFIE"`) and `provider` to the KYC v3 `biometric` section. Only an active liveness check adds `liveness` to `level()` and reaches `kycLevel` 1; a plain selfie does not. `claims.liveness` carries the source. KYC v3 credentials with a biometric but no `source` or `provider` no longer pass validation.
