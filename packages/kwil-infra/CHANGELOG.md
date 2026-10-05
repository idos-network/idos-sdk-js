# @idos-network/kwil-infra

## 2.2.0

### Patch Changes

- 74180e3: Delete the FaceSign mnemonic when the signer resets, and clear the idOS enclave on logout.
- 3ae3d26: Add `@idos-network/instrumentation`: OpenTelemetry instrumentation for the idOS SDK.

  Traces the public methods of `@idos-network/client`, `/consumer` and `/issuer`,
  with the `KwilActionClient.call` / `.execute` round-trips they trigger nested
  underneath as `db.*` spans. Every target is a class method, so patching works
  through `patchModuleExports` with no ESM loader hook; `--import` stays supported
  for automatic patching.

  `KwilActionClient` gains a `waitForTx` method: the tx-confirmation polling a
  synchronous `execute` already did, split out so it can be traced on its own.
  Behavior is unchanged.

  Arguments and return values are never recorded — they carry credentials and keys.
  Use `requestHook` / `responseHook` to opt in per deployment.

- Updated dependencies [56b18ea]
  - @idos-network/utils@2.2.0

## 2.1.0

### Minor Changes

- e0a220c: Export `toDelegatedWriteGrantBaseParams` so DWG request input maps 1:1 into `createCredentialByDelegatedWriteGrant`. Canonicalize ed25519 signer identifiers and 64-character hexadecimal grantee identifiers to lowercase hex to match kwild `@caller`.

### Patch Changes

- @idos-network/utils@2.1.0

## 2.0.1

### Patch Changes

- Updated dependencies [1fb5dff]
  - @idos-network/utils@2.0.1

## 2.0.0

### Patch Changes

- @idos-network/utils@2.0.0

## 1.5.0

### Patch Changes

- Updated dependencies [76fd426]
  - @idos-network/utils@1.5.0

## 1.4.0

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

- Updated dependencies [772319f]
- Updated dependencies [772319f]
  - @idos-network/utils@1.2.1

## 1.2.0

### Minor Changes

- a9a7547: Replace online-first EVM validation to offline one

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

- ad4b090: Release test
- Updated dependencies [ad4b090]
  - @idos-network/utils@1.0.0
