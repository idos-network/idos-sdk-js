---
"@idos-network/credentials": minor
---

Add `selfieFileType` / `selfieFileName` to the KYC v3 `biometric` section and `sourceOfWealthProofFileType` / `sourceOfWealthProofFileName` to `sourceOfWealth`. A selfie now always needs both; a source-of-wealth proof file needs both when it is set. KYC v3 credentials with a selfie but no type or name no longer pass validation.
