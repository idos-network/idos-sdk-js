# @idos-network/kwil-infra

## 5.1.0

### Minor Changes

- 406ea59: Build the credential `broader_signature` message locally instead of asking the node for it. The issuer key signed whatever text `credential_broader_message` returned, so a lying node could pick the recipient or get arbitrary text signed. `@idos-network/client`, `@idos-network/issuer` and `@idos-network/mm-operator` no longer call that action.

  New: `prepareCredentialBroaderMessage` and `localCredentialBroaderMessageFor(recipientWallet, chainId)` in `@idos-network/credentials/utils` (byte for byte equal to idos-kwild's `PrepareCredentialBroaderMessage`), `toChecksumAddress` (EIP-55) in `@idos-network/utils/codecs`, and `KwilActionClient.chainId`. If you pass your own `broaderMessageFor`, switch to `localCredentialBroaderMessageFor`; don't sign text fetched from the network.

### Patch Changes

- Updated dependencies [406ea59]
  - @idos-network/utils@3.3.0

## 5.0.0

### Major Changes

- 729c7d7: Remove the `mm_token` Kwil signer. KGW and kwild no longer accept MetaMask UKYC storage tokens as a login; MM users are now managed only by an MM operator (`idOSMmOperator` in the new `@idos-network/mm-operator` package).

  - `@idos-network/kwil-infra`: removed `createMmTokenAuth`, `isMmTokenAuth`, `mmTokenStorageId` and the `MmTokenAuth`, `MmTokenEnvelope`, `MmTokenPayload` types; `Wallet` and `KwilSignerType` no longer include `MmTokenAuth`. `createKgwAuthenticatedBlobGateway` takes `accessToken?: string` (a UKYC storage token) instead of `mmAuth`. The KGW-authenticated fetch no longer re-logs in when blob-gateway rejects a storage token (`401 MM_TOKEN_INVALID` / `MM_TOKEN_EXPIRED`).
  - Regenerated actions: new `getUserAsMmOperator`, `createUserAsMmOperator`, `getCredentialsAsMmOperator`, `createPreliminaryCredentialAsMmOperator`, `requestUserWipeAsMmOperator`, each taking the user's UKYC storage token as `storage_token`. `upsertWalletAsInserter` no longer accepts `wallet_type: "MM"` (`AddWalletType`), and `not_before` / `not_after` are required again.
  - `@idos-network/client`: an `MmTokenAuth` is no longer a valid signer, and the client never creates `ukyc://` credentials. `removeCredential` rejects `ukyc://` credentials: they go only with a full data wipe.
  - `@idos-network/consumer`: removed `mmAuth` from `idOSConsumer.init`. `rescindSharedCredential` rejects `ukyc://` credentials before calling Kwil.
  - `@idos-network/issuer`: `CredentialByDelegatedWriteGrantBaseParams` no longer has `ukycStorageId`; delegated write grants can't write for MM users.

### Minor Changes

- 729c7d7: New package `@idos-network/mm-operator` with `idOSMmOperator`: the MM operator creates MetaMask users, reads and writes their `ukyc://` credentials through blob-gateway, and wipes them (`getUser`, `createUser`, `getCredentials`, `createCredential`, `getCredentialContent`, `requestUserWipe`, `wipeUser`). It signs Kwil calls with the operator's ed25519 key and reaches blob-gateway with a KGW session of the same key. Every method also takes the user's UKYC storage token, which kwild verifies in each MM operator action and blob-gateway on each blob request: `getUser(storageToken)`, `createUser({ id, recipientEncryptionPublicKey, walletId, storageToken })`, `getCredentials({ userId, storageToken })`, `requestUserWipe({ userId, deleteToken })`. A user's credentials all live in one UKYC storage (the first credential's); tokens for another storage are refused. Kwil token rejections surface as `idOSMmOperatorError` codes `STORAGE_TOKEN_INVALID`, `STORAGE_TOKEN_USER_MISMATCH` and `STORAGE_MISMATCH`. See the package README. `@idos-network/instrumentation` traces it as the `@idos-network/mm-operator` module.

  `@idos-network/utils/blob-gateway`: `BlobGateway.deleteStorage()` (`DELETE /blob/v1/storage`, the MM user wipe), `decodeUkycStorageToken()`, `BLOB_GATEWAY_MM_ERROR_CODES` / `BlobGatewayMmErrorCode` (including `WIPE_STORAGE_MISMATCH`), `isBlobGatewayStorageTokenError()` and `isBlobGatewayUserWipeInProgressError()`. `requireAccessTokenForUkycContent` is deprecated.

  The MM operator views (`getUser`, `getCredentials`, `getCredentialContent`) reject a bad token instead of returning no rows: Kwil reports a failing view action in the call response's `error` field, which `KwilActionClient.call` ignored. `KwilActionClient` has a new opt-in `throwOnCallError` property (default `false`, other callers are unchanged) that makes `call` throw `KwilCallError`; `idOSMmOperator` sets it. `@idos-network/utils/blob-gateway`: `decodeUkycStorageToken()` and `BlobGateway` accept a storage token with an `AccessToken ` / `Bearer ` prefix (new `normalizeUkycStorageToken()`) and send a single `AccessToken ` prefix.

### Patch Changes

- Updated dependencies [729c7d7]
  - @idos-network/utils@3.2.0

## 4.0.0

### Major Changes

- 38a1991: Address new `ukyc://` blobs by the sha256 of the ciphertext, so the signed content URI pins the encrypted bytes. Reads of dev credentials whose blob id is still a UUID keep working (size check only).

  `buildPreliminaryIDOSCredential` takes `ukycStorageId` instead of a finished `contentUri`. `createCredentialByDelegatedWriteGrant` drops `originalContentUri` and `copyContentUri`; pass one `ukycStorageId` (omit it to keep IPFS). `mmTokenCredentialContentUri` is removed; `mmTokenStorageId` remains.

  `@idos-network/credentials` signing helpers now take a required `broaderMessageFor: (publicNotesSignature, contentUri) => Promise<string>` callback and are async: `buildSignedCredentialContentReference` and `buildEphemeralSignedCredentialContentReference` return `Promise<SignedCredentialContentReference>`, and `BuildPreliminaryIDOSCredentialArgs` requires `broaderMessageFor`. Fetch the message from the node with `credentialBroaderMessage` from `@idos-network/kwil-infra/actions` (`.then((row) => row.message)`) and `await` the result. `@idos-network/client` and `@idos-network/issuer` supply the callback themselves.

### Patch Changes

- e999de0: Sign credential broader signatures over the message the node returns, and reject adding an MM wallet.
- Updated dependencies [1668234]
- Updated dependencies [38a1991]
  - @idos-network/utils@3.1.0

## 3.0.1

### Patch Changes

- b1466c8: Delete a FaceSign key already stored in the browser before that key can be added to an idOS profile.
- 47c1b10: Only trust a my-near-wallet redirect when its signature matches the saved request, its account is the connected account, and its public key is a full-access key of that account.
- dc34ffe: Reject NEAR signatures whose NEP-413 recipient is not `idos.network`.
- Updated dependencies [78ad0a9]
  - @idos-network/utils@3.0.1

## 3.0.0

### Patch Changes

- Updated dependencies [add7f44]
  - @idos-network/kwil-js@0.2.2
  - @idos-network/utils@3.0.0

## 2.3.0

### Patch Changes

- @idos-network/utils@2.3.0

## 2.2.2

### Patch Changes

- e1408a1: Publish via npm trusted publishing (OIDC) with provenance; expand `repository` field in package manifests.
- Updated dependencies [e1408a1]
  - @idos-network/kwil-js@0.2.1
  - @idos-network/utils@2.2.2

## 2.2.1

### Patch Changes

- ed9a1ad: Fail fast with a clear error when signing Kwil messages with Xaman (Xumm), which can't produce the raw message signature KGW verifies, and reject non-hex XRP signatures.
  - @idos-network/utils@2.2.1

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

- c27ea68: Use `@idos-network/kwil-js` 0.1.11.
- 3484957: Move `@idos-network/kwil-js` into the monorepo and align it with the other packages.

  - ESM-only build via `tsdown`, tests on `vitest` (was `tsc` + a custom esbuild script and `jest`)
  - Public subpath exports renamed: `@idos-network/kwil-js/dist/api_client/config` -> `/config`, `/dist/core/action` -> `/action`, `/dist/core/database` -> `/database`
  - Removed the deprecated `getSchema`, `deploy`, `drop` and `listDatabases` methods, which only threw
  - Dropped the `jssha`, `long` and `uuid` dependencies in favour of `@noble/hashes` and platform built-ins
  - Integration tests moved to the private `kwil-js-integration` app, which runs them against a live Kwil node outside CI

- Updated dependencies [3484957]
- Updated dependencies [56b18ea]
  - @idos-network/kwil-js@0.2.0
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
