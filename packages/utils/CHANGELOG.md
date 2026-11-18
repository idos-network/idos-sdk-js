# @idos-network/utils

## 3.3.0

### Minor Changes

- 406ea59: Build the credential `broader_signature` message locally instead of asking the node for it. The issuer key signed whatever text `credential_broader_message` returned, so a lying node could pick the recipient or get arbitrary text signed. `@idos-network/client`, `@idos-network/issuer` and `@idos-network/mm-operator` no longer call that action.

  New: `prepareCredentialBroaderMessage` and `localCredentialBroaderMessageFor(recipientWallet, chainId)` in `@idos-network/credentials/utils` (byte for byte equal to idos-kwild's `PrepareCredentialBroaderMessage`), `toChecksumAddress` (EIP-55) in `@idos-network/utils/codecs`, and `KwilActionClient.chainId`. If you pass your own `broaderMessageFor`, switch to `localCredentialBroaderMessageFor`; don't sign text fetched from the network.

## 3.2.0

### Minor Changes

- 729c7d7: New package `@idos-network/mm-operator` with `idOSMmOperator`: the MM operator creates MetaMask users, reads and writes their `ukyc://` credentials through blob-gateway, and wipes them (`getUser`, `createUser`, `getCredentials`, `createCredential`, `getCredentialContent`, `requestUserWipe`, `wipeUser`). It signs Kwil calls with the operator's ed25519 key and reaches blob-gateway with a KGW session of the same key. Every method also takes the user's UKYC storage token, which kwild verifies in each MM operator action and blob-gateway on each blob request: `getUser(storageToken)`, `createUser({ id, recipientEncryptionPublicKey, walletId, storageToken })`, `getCredentials({ userId, storageToken })`, `requestUserWipe({ userId, deleteToken })`. A user's credentials all live in one UKYC storage (the first credential's); tokens for another storage are refused. Kwil token rejections surface as `idOSMmOperatorError` codes `STORAGE_TOKEN_INVALID`, `STORAGE_TOKEN_USER_MISMATCH` and `STORAGE_MISMATCH`. See the package README. `@idos-network/instrumentation` traces it as the `@idos-network/mm-operator` module.

  `@idos-network/utils/blob-gateway`: `BlobGateway.deleteStorage()` (`DELETE /blob/v1/storage`, the MM user wipe), `decodeUkycStorageToken()`, `BLOB_GATEWAY_MM_ERROR_CODES` / `BlobGatewayMmErrorCode` (including `WIPE_STORAGE_MISMATCH`), `isBlobGatewayStorageTokenError()` and `isBlobGatewayUserWipeInProgressError()`. `requireAccessTokenForUkycContent` is deprecated.

  The MM operator views (`getUser`, `getCredentials`, `getCredentialContent`) reject a bad token instead of returning no rows: Kwil reports a failing view action in the call response's `error` field, which `KwilActionClient.call` ignored. `KwilActionClient` has a new opt-in `throwOnCallError` property (default `false`, other callers are unchanged) that makes `call` throw `KwilCallError`; `idOSMmOperator` sets it. `@idos-network/utils/blob-gateway`: `decodeUkycStorageToken()` and `BlobGateway` accept a storage token with an `AccessToken ` / `Bearer ` prefix (new `normalizeUkycStorageToken()`) and send a single `AccessToken ` prefix.

## 3.1.0

### Minor Changes

- 38a1991: Address new `ukyc://` blobs by the sha256 of the ciphertext, so the signed content URI pins the encrypted bytes. Reads of dev credentials whose blob id is still a UUID keep working (size check only).

  `buildPreliminaryIDOSCredential` takes `ukycStorageId` instead of a finished `contentUri`. `createCredentialByDelegatedWriteGrant` drops `originalContentUri` and `copyContentUri`; pass one `ukycStorageId` (omit it to keep IPFS). `mmTokenCredentialContentUri` is removed; `mmTokenStorageId` remains.

  `@idos-network/credentials` signing helpers now take a required `broaderMessageFor: (publicNotesSignature, contentUri) => Promise<string>` callback and are async: `buildSignedCredentialContentReference` and `buildEphemeralSignedCredentialContentReference` return `Promise<SignedCredentialContentReference>`, and `BuildPreliminaryIDOSCredentialArgs` requires `broaderMessageFor`. Fetch the message from the node with `credentialBroaderMessage` from `@idos-network/kwil-infra/actions` (`.then((row) => row.message)`) and `await` the result. `@idos-network/client` and `@idos-network/issuer` supply the callback themselves.

### Patch Changes

- 1668234: Retry credential blob uploads after a network error, a timeout, or a 408, 429, 500, 502, 503 or 504 from the blob gateway: two retries, 1 s then 2 s apart. Each attempt times out after 150 s. Tune this with the new `uploadRetries`, `uploadRetryDelayMs` and `uploadTimeoutMs` options on `BlobGateway`.

  When the credentials may have been created even though the upload failed, the upload throws `BlobGatewayUploadOutcomeUnknownError` with the affected `credentialIds`. This covers a last attempt that may have reached the gateway, a retry that finds the preliminary credential gone or already finalized, and a success response that is unreadable or reports CIDs that do not match the uploaded bytes. `createCredential` and `requestAccessGrant` then look the credential up by id and read its blob back (60 s deadline), and return normally only if it exists and matches the upload. `BlobGateway.fetchBlob` takes an optional `signal`.

## 3.0.1

### Patch Changes

- 78ad0a9: Compute blob CIDs with `ipfs-unixfs-importer@17` instead of `ipfs-only-hash`. CIDs stay the same. This removes `protobufjs@6` and about 100 other transitive dependencies, including the ones with known CVEs.

## 3.0.0

## 2.3.0

## 2.2.2

### Patch Changes

- e1408a1: Publish via npm trusted publishing (OIDC) with provenance; expand `repository` field in package manifests.

## 2.2.1

## 2.2.0

### Patch Changes

- 56b18ea: Forget a cached encryption profile once its remember duration has elapsed, including while the enclave stays open.

## 2.1.0

## 2.0.1

### Patch Changes

- Updated dependencies [1fb5dff]

## 2.0.0

## 1.5.0

### Minor Changes

- 76fd426: Upgrade dependencies

## 1.4.0

### Minor Changes

- 5e8c407: Unify base85 library

## 1.3.1

### Patch Changes

- 565e87c: Report test coverage

## 1.3.0

### Minor Changes

- 5afaf1a: Dependency updates

## 1.2.1

### Patch Changes

- 772319f: Minor and patch dependency upgrades
- 772319f: Minor and patch dependency upgrades

## 1.2.0

## 1.1.1

### Patch Changes

- e5df318: Upgrade dependencies

## 1.1.0

### Minor Changes

- 867ffcb: Update minor version to deploy

## 1.0.0

### Patch Changes

- ad4b090: Release test
