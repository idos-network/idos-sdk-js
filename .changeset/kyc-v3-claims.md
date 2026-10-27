---
"@idos-network/credentials": minor
---

Add `claims` to KYC v3 public notes: what the credential claims (`identity`, `address` and each level addon) and how each claim was obtained, self-attested (`"MANUAL"`) data included. Add `matchClaims()` and `claimsFromPublicNotes()`, which derive the claims of older credentials from their level, and a `claims` option to `highestMatchingCredential()`. Deprecate `matchLevelOrHigher()`, `pickHighestMatchingLevel()` and the `addons` option of `highestMatchingCredential()`, since the level leaves out self-attested data. Export the `Claim`, `Claims`, `ClaimSource`, `ClaimSources` and `ClaimRequirements` types.
