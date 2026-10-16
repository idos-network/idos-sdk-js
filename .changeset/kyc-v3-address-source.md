---
"@idos-network/credentials": minor
---

KYC v3: replace `residentialAddress.verified` (boolean) with `residentialAddress.source` (`"MANUAL" | "GPS" | "EXTERNAL_DB" | "PROOF_OF_ADDRESS" | "PROOF_OF_IDENTITY" | "AUTO_COMPLETE"`), serialized as `residentialAddressSource`.
