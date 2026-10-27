---
"@idos-network/credentials": minor
---

Add a required `sourceOfFundsSource` (`"MANUAL"` | `"VERIFIED"`) to the KYC v3 `edd` section. A `"MANUAL"` (self-attested) source of funds adds no `edd` to `level()` and shows up as `claims.edd` in the public notes. KYC v3 credentials with an `edd` section but no `sourceOfFundsSource` no longer pass validation.
