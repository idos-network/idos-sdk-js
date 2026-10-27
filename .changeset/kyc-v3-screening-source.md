---
"@idos-network/credentials": minor
---

Add a required `source` (`"DB"`) to the KYC v3 `screening` section, shown as `claims.screening` in the public notes. Claims derived from the level of older credentials count `screening` as `"DB"` too. KYC v3 credentials with a screening but no `source` no longer pass validation.
