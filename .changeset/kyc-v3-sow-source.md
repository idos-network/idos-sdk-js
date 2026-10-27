---
"@idos-network/credentials": minor
---

Add a required `source` (`"MANUAL"` | `"VERIFIED"`) to the KYC v3 `sourceOfWealth` section. A `"MANUAL"` (self-attested) source of wealth is kept in the credential but adds no `sow` to `level()` and does not count towards `kycLevel` 3. KYC v3 credentials with a source of wealth but no `source` no longer pass validation.
