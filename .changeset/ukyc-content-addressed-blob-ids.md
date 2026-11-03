---
"@idos-network/utils": minor
"@idos-network/credentials": major
"@idos-network/kwil-infra": major
"@idos-network/client": major
"@idos-network/consumer": major
"@idos-network/issuer": major
---

Address new `ukyc://` blobs by the sha256 of the ciphertext, so the signed content URI pins the encrypted bytes. Reads of dev credentials whose blob id is still a UUID keep working (size check only).

`buildPreliminaryIDOSCredential` takes `ukycStorageId` instead of a finished `contentUri`. `createCredentialByDelegatedWriteGrant` drops `originalContentUri` and `copyContentUri`; pass one `ukycStorageId` (omit it to keep IPFS). `mmTokenCredentialContentUri` is removed; `mmTokenStorageId` remains.

`@idos-network/credentials` signing helpers now take a required `broaderMessageFor: (publicNotesSignature, contentUri) => Promise<string>` callback and are async: `buildSignedCredentialContentReference` and `buildEphemeralSignedCredentialContentReference` return `Promise<SignedCredentialContentReference>`, and `BuildPreliminaryIDOSCredentialArgs` requires `broaderMessageFor`. Fetch the message from the node with `credentialBroaderMessage` from `@idos-network/kwil-infra/actions` (`.then((row) => row.message)`) and `await` the result. `@idos-network/client` and `@idos-network/issuer` supply the callback themselves.
