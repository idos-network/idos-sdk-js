# @idos-network/credentials

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
