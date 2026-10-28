# @idos-network/credentials

## 3.1.0

### Minor Changes

- 9486131: Add optional `emailSource` / `phoneNumberSource` to the KYC v3 `contact` section. A `"MANUAL"` email or phone number no longer adds the `email` / `phoneNumber` addon to `level()`.
- 9486131: Add a required `source` (`"LIVENESS"` | `"SELFIE"`) and `provider` to the KYC v3 `biometric` section. Only an active liveness check adds `liveness` to `level()` and reaches `kycLevel` 1; a plain selfie does not. `claims.liveness` carries the source. KYC v3 credentials with a biometric but no `source` or `provider` no longer pass validation.
- 9486131: Add `claims` to KYC v3 public notes: what the credential claims (`identity`, `address` and each level addon) and how each claim was obtained, self-attested (`"MANUAL"`) data included. Add `matchClaims()` and `claimsFromPublicNotes()`, which derive the claims of older credentials from their level, and a `claims` option to `highestMatchingCredential()`. Deprecate `matchLevelOrHigher()`, `pickHighestMatchingLevel()` and the `addons` option of `highestMatchingCredential()`, since the level leaves out self-attested data. Export the `Claim`, `Claims`, `ClaimSource`, `ClaimSources` and `ClaimRequirements` types.
- 9486131: Add `selfieFileType` / `selfieFileName` to the KYC v3 `biometric` section and `sourceOfWealthProofFileType` / `sourceOfWealthProofFileName` to `sourceOfWealth`. A selfie now always needs both; a source-of-wealth proof file needs both when it is set. KYC v3 credentials with a selfie but no type or name no longer pass validation.
- 9486131: Add a required `source` (`"DB"`) to the KYC v3 `screening` section, shown as `claims.screening` in the public notes. Claims derived from the level of older credentials count `screening` as `"DB"` too. KYC v3 credentials with a screening but no `source` no longer pass validation.
- 9486131: Add `sourceOfFundsSource` (`"MANUAL"` | `"VERIFIED"`) to the KYC v3 `edd` section, required when it has a `sourceOfFundsProofFile`. A `"MANUAL"` (self-attested) source of funds adds no `edd` to `level()` and shows up as `claims.edd` in the public notes. An `edd` without a source counts as verified, as before. KYC v3 credentials with a source-of-funds proof file but no `sourceOfFundsSource` no longer pass validation.
- 9486131: Add a required `source` (`"MANUAL"` | `"VERIFIED"`) to the KYC v3 `sourceOfWealth` section. A `"MANUAL"` (self-attested) source of wealth is kept in the credential but adds no `sow` to `level()` and does not count towards `kycLevel` 3. KYC v3 credentials with a source of wealth but no `source` no longer pass validation.

### Patch Changes

- Updated dependencies [78ad0a9]
  - @idos-network/utils@3.0.1

## 3.0.0

### Patch Changes

- @idos-network/utils@3.0.0

## 2.3.0

### Minor Changes

- a072d3c: Add Latin forms of KycV3 fields stored in their original script (Cyrillic, German umlauts, …). A field marked with the new `@Transliterate()` decorator gets two read-only siblings, derived on read and never serialized:

  - `<field>Icao`: transliterated per ICAO 9303, as passports print names in the MRZ.
  - `<field>Latin`: a promise of the conventional spelling, backed by the `transliteration` package.

  The person's names and the address's street, additional info, region and city are marked.

  `transliteration` is an optional peer dependency this package never imports, so it adds nothing to an app that does not use `<field>Latin`. An app that does installs it and registers it once at startup; without that, `<field>Latin` rejects with instructions:

  ```ts
  import { registerTransliteration } from "@idos-network/credentials/utils";

  registerTransliteration(() => import("transliteration"));
  ```

### Patch Changes

- @idos-network/utils@2.3.0

## 2.2.2

### Patch Changes

- e1408a1: Publish via npm trusted publishing (OIDC) with provenance; expand `repository` field in package manifests.
- Updated dependencies [e1408a1]
  - @idos-network/utils@2.2.2

## 2.2.1

### Patch Changes

- @idos-network/utils@2.2.1

## 2.2.0

### Minor Changes

- f2dc464: KYC v3: replace `residentialAddress.verified` (boolean) with `residentialAddress.source` (`"MANUAL" | "GPS" | "EXTERNAL_DB" | "PROOF_OF_ADDRESS" | "PROOF_OF_IDENTITY" | "AUTO_COMPLETE"`), serialized as `residentialAddressSource`.

### Patch Changes

- Updated dependencies [56b18ea]
  - @idos-network/utils@2.2.0

## 2.1.0

### Minor Changes

- 0dc5952: Add file type and name into V3 credentials (extension, no need to release a V4)

### Patch Changes

- b3ca299: Fix credentials generator
  - @idos-network/utils@2.1.0

## 2.0.1

### Patch Changes

- Updated dependencies [1fb5dff]
  - @idos-network/utils@2.0.1

## 2.0.0

### Major Changes

- 8d06f30: New versioned verifiable credentials support

### Patch Changes

- @idos-network/utils@2.0.0

## 1.5.0

### Patch Changes

- Updated dependencies [76fd426]
  - @idos-network/utils@1.5.0

## 1.4.0

### Minor Changes

- 5e8c407: Unify base85 library

### Patch Changes

- Updated dependencies [5e8c407]
  - @idos-network/utils@1.4.0

## 1.3.1

### Patch Changes

- 565e87c: Report test coverage
- Updated dependencies [565e87c]
  - @idos-network/utils@1.3.1

## 1.3.0

### Minor Changes

- 5afaf1a: Dependency updates

### Patch Changes

- Updated dependencies [5afaf1a]
  - @idos-network/utils@1.3.0

## 1.2.1

### Patch Changes

- 772319f: Minor and patch dependency upgrades
- 772319f: Minor and patch dependency upgrades
- Updated dependencies [772319f]
- Updated dependencies [772319f]
  - @idos-network/utils@1.2.1

## 1.2.0

### Patch Changes

- @idos-network/utils@1.2.0

## 1.1.1

### Patch Changes

- Updated dependencies [e5df318]
  - @idos-network/utils@1.1.1

## 1.1.0

### Minor Changes

- 867ffcb: Update minor version to deploy

### Patch Changes

- Updated dependencies [867ffcb]
  - @idos-network/utils@1.1.0

## 1.0.0

### Patch Changes

- Updated dependencies [ad4b090]
  - @idos-network/utils@1.0.0
