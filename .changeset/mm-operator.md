---
"@idos-network/issuer": minor
"@idos-network/utils": minor
"@idos-network/kwil-infra": minor
---

Add `idOSMmOperator` to `@idos-network/issuer`: the MM operator creates MetaMask users, reads and writes their `ukyc://` credentials through blob-gateway, and wipes them (`getUser`, `createUser`, `getCredentials`, `createCredential`, `getCredentialContent`, `requestUserWipe`, `wipeUser`). It signs Kwil calls with the operator's ed25519 key and reaches blob-gateway with a KGW session of the same key. Every method also takes the user's UKYC storage token, which kwild verifies in each MM operator action and blob-gateway on each blob request: `getUser(storageToken)`, `createUser({ id, recipientEncryptionPublicKey, walletId, storageToken })`, `getCredentials({ userId, storageToken })`, `requestUserWipe({ userId, deleteToken })`. A user's credentials all live in one UKYC storage (the first credential's); tokens for another storage are refused. Kwil token rejections surface as `idOSMmOperatorError` codes `STORAGE_TOKEN_INVALID`, `STORAGE_TOKEN_USER_MISMATCH` and `STORAGE_MISMATCH`. See the issuer README.

`@idos-network/utils/blob-gateway`: `BlobGateway.deleteStorage()` (`DELETE /blob/v1/storage`, the MM user wipe), `decodeUkycStorageToken()`, `BLOB_GATEWAY_MM_ERROR_CODES` / `BlobGatewayMmErrorCode` (including `WIPE_STORAGE_MISMATCH`), `isBlobGatewayStorageTokenError()` and `isBlobGatewayUserWipeInProgressError()`. `requireAccessTokenForUkycContent` is deprecated.

The MM operator views (`getUser`, `getCredentials`, `getCredentialContent`) reject a bad token instead of returning no rows: Kwil reports a failing view action in the call response's `error` field, which `KwilActionClient.call` ignored. `KwilActionClient` has a new opt-in `throwOnCallError` property (default `false`, other callers are unchanged) that makes `call` throw `KwilCallError`; `idOSMmOperator` sets it. `@idos-network/utils/blob-gateway`: `decodeUkycStorageToken()` and `BlobGateway` accept a storage token with an `AccessToken ` / `Bearer ` prefix (new `normalizeUkycStorageToken()`) and send a single `AccessToken ` prefix.
