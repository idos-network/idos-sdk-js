---
"@idos-network/credentials": minor
---

Add `sourceOfFundsSource` (`"MANUAL"` | `"VERIFIED"`) to the KYC v3 `edd` section, required when it has a `sourceOfFundsProofFile`. A `"MANUAL"` (self-attested) source of funds adds no `edd` to `level()` and shows up as `claims.edd` in the public notes. An `edd` without a source counts as verified, as before. KYC v3 credentials with a source-of-funds proof file but no `sourceOfFundsSource` no longer pass validation.
