# @idos-network/issuer

## 2.2.0

### Patch Changes

- c27ea68: Use `@idos-network/kwil-js` 0.1.11.
- 3484957: Move `@idos-network/kwil-js` into the monorepo and align it with the other packages.

  - ESM-only build via `tsdown`, tests on `vitest` (was `tsc` + a custom esbuild script and `jest`)
  - Public subpath exports renamed: `@idos-network/kwil-js/dist/api_client/config` -> `/config`, `/dist/core/action` -> `/action`, `/dist/core/database` -> `/database`
  - Removed the deprecated `getSchema`, `deploy`, `drop` and `listDatabases` methods, which only threw
  - Dropped the `jssha`, `long` and `uuid` dependencies in favour of `@noble/hashes` and platform built-ins
  - Integration tests moved to the private `kwil-js-integration` app, which runs them against a live Kwil node outside CI

- Updated dependencies [74180e3]
- Updated dependencies [3ae3d26]
- Updated dependencies [c27ea68]
- Updated dependencies [3484957]
- Updated dependencies [f2dc464]
- Updated dependencies [56b18ea]
  - @idos-network/kwil-infra@2.2.0
  - @idos-network/kwil-js@0.2.0
  - @idos-network/credentials@2.2.0
  - @idos-network/utils@2.2.0

## 2.1.0

### Minor Changes

- e0a220c: Export `toDelegatedWriteGrantBaseParams` so DWG request input maps 1:1 into `createCredentialByDelegatedWriteGrant`. Canonicalize ed25519 signer identifiers and 64-character hexadecimal grantee identifiers to lowercase hex to match kwild `@caller`.

### Patch Changes

- Updated dependencies [e0a220c]
- Updated dependencies [b3ca299]
- Updated dependencies [0dc5952]
  - @idos-network/kwil-infra@2.1.0
  - @idos-network/credentials@2.1.0
  - @idos-network/utils@2.1.0

## 2.0.1

### Patch Changes

- Updated dependencies [1fb5dff]
  - @idos-network/utils@2.0.1
  - @idos-network/credentials@2.0.1
  - @idos-network/kwil-infra@2.0.1

## 2.0.0

### Major Changes

- 8d06f30: New versioned verifiable credentials support

### Patch Changes

- Updated dependencies [8d06f30]
  - @idos-network/credentials@2.0.0
  - @idos-network/utils@2.0.0
  - @idos-network/kwil-infra@2.0.0

## 1.5.0

### Patch Changes

- Updated dependencies [76fd426]
  - @idos-network/utils@1.5.0
  - @idos-network/credentials@1.5.0
  - @idos-network/kwil-infra@1.5.0

## 1.4.0

### Patch Changes

- Updated dependencies [5e8c407]
  - @idos-network/credentials@1.4.0
  - @idos-network/utils@1.4.0
  - @idos-network/kwil-infra@1.4.0

## 1.3.1

### Patch Changes

- Updated dependencies [565e87c]
  - @idos-network/credentials@1.3.1
  - @idos-network/kwil-infra@1.3.1
  - @idos-network/utils@1.3.1

## 1.3.0

### Minor Changes

- 5afaf1a: Dependency updates

### Patch Changes

- Updated dependencies [5afaf1a]
  - @idos-network/credentials@1.3.0
  - @idos-network/kwil-infra@1.3.0
  - @idos-network/utils@1.3.0

## 1.2.1

### Patch Changes

- Updated dependencies [772319f]
- Updated dependencies [772319f]
  - @idos-network/credentials@1.2.1
  - @idos-network/utils@1.2.1
  - @idos-network/kwil-infra@1.2.1

## 1.2.0

### Patch Changes

- Updated dependencies [a9a7547]
  - @idos-network/kwil-infra@1.2.0
  - @idos-network/credentials@1.2.0
  - @idos-network/utils@1.2.0

## 1.1.1

### Patch Changes

- Updated dependencies [e5df318]
  - @idos-network/utils@1.1.1
  - @idos-network/credentials@1.1.1
  - @idos-network/kwil-infra@1.1.1

## 1.1.0

### Minor Changes

- 867ffcb: Update minor version to deploy

### Patch Changes

- Updated dependencies [867ffcb]
  - @idos-network/credentials@1.1.0
  - @idos-network/kwil-infra@1.1.0
  - @idos-network/utils@1.1.0

## 1.0.0

### Patch Changes

- ad4b090: Release test
- Updated dependencies [ad4b090]
  - @idos-network/kwil-infra@1.0.0
  - @idos-network/utils@1.0.0
  - @idos-network/credentials@1.0.0
