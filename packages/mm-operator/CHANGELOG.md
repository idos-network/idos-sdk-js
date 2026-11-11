# @idos-network/mm-operator

## 0.2.1

### Patch Changes

- d2c34bf: `blobGatewayUrl` is now optional in `idOSMmOperator.init`; it defaults to `nodeUrl`, like in the issuer, consumer and client.

## 0.2.0

### Minor Changes

- 4fb90a9: Force new deployment

## 0.1.0

### Minor Changes

- 729c7d7: New package `@idos-network/mm-operator` with `idOSMmOperator`: the MM operator creates MetaMask users, reads and writes their `ukyc://` credentials through blob-gateway, and wipes them (`getUser`, `createUser`, `getCredentials`, `createCredential`, `getCredentialContent`, `requestUserWipe`, `wipeUser`). It signs Kwil calls with the operator's ed25519 key and reaches blob-gateway with a KGW session of the same key. Every method also takes the user's UKYC storage token, which kwild verifies in each MM operator action and blob-gateway on each blob request: `getUser(storageToken)`, `createUser({ id, recipientEncryptionPublicKey, walletId, storageToken })`, `getCredentials({ userId, storageToken })`, `requestUserWipe({ userId, deleteToken })`. A user's credentials all live in one UKYC storage (the first credential's); tokens for another storage are refused. Kwil token rejections surface as `idOSMmOperatorError` codes `STORAGE_TOKEN_INVALID`, `STORAGE_TOKEN_USER_MISMATCH` and `STORAGE_MISMATCH`. See the package README. `@idos-network/instrumentation` traces it as the `@idos-network/mm-operator` module.

  `@idos-network/utils/blob-gateway`: `BlobGateway.deleteStorage()` (`DELETE /blob/v1/storage`, the MM user wipe), `decodeUkycStorageToken()`, `BLOB_GATEWAY_MM_ERROR_CODES` / `BlobGatewayMmErrorCode` (including `WIPE_STORAGE_MISMATCH`), `isBlobGatewayStorageTokenError()` and `isBlobGatewayUserWipeInProgressError()`. `requireAccessTokenForUkycContent` is deprecated.

  The MM operator views (`getUser`, `getCredentials`, `getCredentialContent`) reject a bad token instead of returning no rows: Kwil reports a failing view action in the call response's `error` field, which `KwilActionClient.call` ignored. `KwilActionClient` has a new opt-in `throwOnCallError` property (default `false`, other callers are unchanged) that makes `call` throw `KwilCallError`; `idOSMmOperator` sets it. `@idos-network/utils/blob-gateway`: `decodeUkycStorageToken()` and `BlobGateway` accept a storage token with an `AccessToken ` / `Bearer ` prefix (new `normalizeUkycStorageToken()`) and send a single `AccessToken ` prefix.

### Patch Changes

- Updated dependencies [729c7d7]
- Updated dependencies [729c7d7]
  - @idos-network/utils@3.2.0
  - @idos-network/kwil-infra@5.0.0
  - @idos-network/credentials@4.0.1
