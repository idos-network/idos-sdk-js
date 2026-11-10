# idOS Issuer JavaScript SDK

Server-side SDK for issuing and managing credentials in idOS. Designed for backend services that verify user identity and issue verifiable credentials.

[![NPM](https://img.shields.io/npm/v/@idos-network/issuer?logo=npm)](https://www.npmjs.com/package/@idos-network/issuer) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCiPjxnIGlkPSJTVkdSZXBvX2JnQ2FycmllciIgc3Ryb2tlLXdpZHRoPSIwIj48L2c+PGcgaWQ9IlNWR1JlcG9fdHJhY2VyQ2FycmllciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48L2c+PGcgaWQ9IlNWR1JlcG9faWNvbkNhcnJpZXIiPiA8cGF0aCBkPSJNMTYgMTZsMy04IDMuMDAxIDhBNS4wMDIgNS4wMDIgMCAwMTE2IDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNMiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMiAxNnoiPjwvcGF0aD4gPHBhdGggZD0iTTcgMjFoMTAiPjwvcGF0aD4gPHBhdGggZD0iTTEyIDN2MTgiPjwvcGF0aD4gPHBhdGggZD0iTTMgN2gyYzIgMCA1LTEgNy0yIDIgMSA1IDIgNyAyaDIiPjwvcGF0aD4gPC9nPjwvc3ZnPgo=)

> ⚖️ Legalities
>
> By downloading, installing, or implementing any of the idOS' SDKs, you acknowledge that you have read and understood idOS' Privacy Policy and Transparency Document.
>
> - <https://www.idos.network/legal/privacy-policy>
> - <https://www.idos.network/legal/transparency-document>

## Installation

```bash
pnpm add @idos-network/issuer
```

## Quick Start

```typescript
import { idOSIssuer as idOSIssuerClass } from "@idos-network/issuer";

// Initialize with your signing keypair
const idOSIssuer = await idOSIssuerClass.init({
  nodeUrl: "https://nodes.idos.network",
  signingKeyPair, // Your signing keypair
});

// Create a user profile
await idOSIssuer.createUser(user, wallet);

// Build and issue a W3C Verifiable Credential
const credential = await idOSIssuer.buildCredential(credentialFields, credentialSubject, issuer);

// Write blob-backed credential using delegated write grant
await idOSIssuer.createCredentialByDelegatedWriteGrant(
  credentialPayload,
  delegatedWriteGrant,
  consumerEncryptionPublicKey,
);
```

## MetaMask users (MM operator)

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
token only) and blob-gateway get the same token. A rejected token always throws `idOSMmOperatorError` (also from the read
methods); an empty result never means a bad token.

**One storage per user:** the storage of the user's first `ukyc://` credential (also while it is
still pending) is the user's storage. Tokens for another storage are refused for reads, new
credentials and wipes. A user without credentials accepts a token for any storage.

```typescript
import { idOSMmOperator } from "@idos-network/issuer";

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

## Documentation

For complete documentation, examples, and implementation guides:

- 📖 **[Issuer Guide](../../docs/guide-issuer.md)** - Comprehensive implementation guide
- 🏗️ **[System Overview](../../docs/README.md)** - Understanding idOS architecture
- 🔒 **[Encryption](../../docs/encryption.md)** - Encryption key management
- ✍️ **[Signatures](../../docs/signatures.md)** - Signer implementation details

## Key Features

- **User Profile Creation** - Create and manage user profiles in idOS
- **Credential Issuance** - Issue W3C Verifiable Credentials
- **Delegated Write Grants** - Write credentials on behalf of users
- **Credential Management** - Edit and revoke issued credentials
- **Multi-Chain Support** - Works with EVM, NEAR, XRPL, and Stellar wallets
- **Schema Validation** - Optional validation against W3C VC schemas

## Support

Please follow the process outlined here: <https://github.com/idos-network/.github/blob/main/profile/README.md>

---

## Developing the SDK locally

Run:

```bash
pnpm dev
```

This will start the compiler in watch mode that will rebuild every time any of the source files are changed.

You can also create a production build by running the following command in the root folder of the SDK package:

```bash
pnpm build
```
