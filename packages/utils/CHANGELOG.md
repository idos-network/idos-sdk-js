# @idos-network/utils

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
