# idOS MM Operator JavaScript SDK

Server-side SDK for the idOS **MM operator**: the service that manages MetaMask (MM) users in
idOS. It is a separate role from an issuer (`@idos-network/issuer`).

## Installation

```bash
pnpm add @idos-network/mm-operator
```

## Usage

MetaMask (MM) users keep their credentials in MetaMask's UKYC storage (`ukyc://` URIs) and
never sign anything to idOS. Only an **MM operator** works with them: an inserter that the idOS
owner listed in `mm_operators`, and only for the users it created. `idOSMmOperator` signs Kwil
calls with the operator's ed25519 delegate key and logs in to KGW with the same key for
blob-gateway.

The operator key alone can't do anything to an MM user: **every method also takes a UKYC
storage token** minted by the user's app. kwild verifies it in each MM operator action
(signature, audience, expiry, operation) and checks that its `signing_public_key` is the user's
MM wallet key; blob-gateway and UKYC verify it again on blob requests
(`Authorization: AccessToken …`). Tokens passed to write actions end up on-chain; they are
useless without an MM operator key or session. A token may carry an `AccessToken ` or
`Bearer ` prefix and surrounding whitespace: the SDK strips them, so Kwil (which takes the raw
token only) and blob-gateway get the same token. A token Kwil rejects throws `idOSMmOperatorError`
(also from the read methods); an empty result never means a bad token. blob-gateway's rejections
are `BlobGatewayHttpError` (see Errors below), and `createCredential` decodes the token first, so
one that isn't base64url JSON throws a plain `Error` before any request.

**One storage per user:** the storage of the user's first `ukyc://` credential (also while it is
still pending) is the user's storage. Tokens for another storage are refused for reads, new
credentials and wipes. A user without credentials accepts a token for any storage.

```typescript
import { idOSMmOperator } from "@idos-network/mm-operator";

const operator = await idOSMmOperator.init({
  nodeUrl: "https://nodes.idos.network",
  blobGatewayUrl: "https://blob.idos.network",
  signingKeyPair, // the operator's delegate key (nacl.SignKeyPair)
});

// Any valid token of the user selects the user (its signing_public_key = MM wallet key).
let user = await operator.getUser(storageToken);
if (!user) {
  // Token with `write`; its signing_public_key becomes the MM wallet key.
  await operator.createUser({ id: userId, recipientEncryptionPublicKey, walletId, storageToken });
  user = { id: userId, recipientEncryptionPublicKey, frozen: false };
}

// Token with `read`. Empty while the user is frozen for a wipe.
const rows = await operator.getCredentials({ userId: user.id, storageToken });

// Token with `write` (and `read`, to resolve an unknown upload outcome).
// Resolves after blob-gateway finalized the credential.
const { id } = await operator.createCredential({
  userId: user.id,
  storageToken,
  publicNotes,
  plaintextContent,
  issuerAuthSecretKey, // the issuer's ed25519 secret key
});

// Token with `read`. Decrypt `ciphertext` with the user's encryption key.
const { ciphertext, encryptorPublicKey } = await operator.getCredentialContent({
  credentialId: id,
  storageToken,
});

// Token with `delete`: freezes the user, deletes the UKYC storage, then the idOS user.
// Safe to repeat; run it as a retried job.
await operator.wipeUser({ userId: user.id, deleteToken });
```

| Method                                                                                           | Token op | Does                                                                                                                                         |
| ------------------------------------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `getUser(storageToken)`                                                                          | any      | `{ id, recipientEncryptionPublicKey, frozen }` of the token key's user, or `null` (no such user, or another operator's)                      |
| `createUser({ id, recipientEncryptionPublicKey, walletId, storageToken })`                       | `write`  | User and MM wallet (key = token's `signing_public_key`) in one transaction                                                                   |
| `getCredentials({ userId, storageToken })`                                                       | `read`   | `get_credentials_as_mm_operator` rows; `[]` while frozen                                                                                     |
| `createCredential({ userId, storageToken, publicNotes, plaintextContent, issuerAuthSecretKey })` | `write`  | Encrypts, signs with the MM wallet as recipient, stages, uploads to `ukyc://<storage_id>/blobs/<sha256(ciphertext)>`, waits for the finalize |
| `getCredentialContent({ credentialId, storageToken })`                                           | `read`   | `{ ciphertext, encryptorPublicKey }`, checked against the URI hash and size                                                                  |
| `requestUserWipe({ userId, deleteToken })`                                                       | `delete` | Freezes the user. No-op when already frozen (the token is still checked)                                                                     |
| `wipeUser({ userId?, deleteToken })`                                                             | `delete` | `getUser(deleteToken)`, `requestUserWipe` unless frozen, then `DELETE /blob/v1/storage`                                                      |

`wipeUser` wipes the user the token names. With `userId`, a token of another user is refused
(`STORAGE_TOKEN_USER_MISMATCH`). It is safe to repeat, and it succeeds when idOS has no MM user for
the token's key: never created and already wiped look the same, since a wipe leaves no trace, and
either way idOS holds nothing for that key. It then calls blob-gateway anyway, which answers 204
without touching UKYC; `userId` can't be checked in that case, because every lookup by user id
needs a token of that user. Another operator's user gets 403 `WIPE_FORBIDDEN`.

Errors:

- `idOSMmOperatorError` with `code`:
  - `USER_NOT_FOUND`: no managed user has the token's key;
  - `STORAGE_TOKEN_USER_MISMATCH`: the token's key isn't `userId`'s MM wallet;
  - `STORAGE_TOKEN_INVALID`: kwild rejected the token (malformed, bad signature, expired, wrong
    operation); get a new token from the app;
  - `STORAGE_MISMATCH`: the token (or the credential URI) is for another storage than the user's;
  - `USER_WIPE_IN_PROGRESS`, `CREDENTIAL_NOT_FOUND`.

  Codes that come from Kwil keep the Kwil error as `cause`.

- `BlobGatewayHttpError` (`@idos-network/utils/blob-gateway`) with blob-gateway's `code`, listed
  in `BLOB_GATEWAY_MM_ERROR_CODES`. For example `MM_TOKEN_EXPIRED` (get a new token from the app;
  `isBlobGatewayStorageTokenError()`), `USER_WIPE_IN_PROGRESS`, `WIPE_FORBIDDEN`,
  `WIPE_STORAGE_MISMATCH` (409: the delete token's storage isn't the user's; nothing deleted), or
  `GATEWAY_WIPE_FAILED` (retry).
- `BlobGatewayUploadOutcomeUnknownError` from `createCredential` when the upload may have
  finalized and the credential couldn't be found; look it up before creating it again.
- Other Kwil errors from the schema, such as `Unauthorized MM operator` or
  `the user is not managed by this MM operator`.
