---
"@idos-network/utils": minor
"@idos-network/credentials": minor
"@idos-network/kwil-infra": minor
"@idos-network/client": minor
"@idos-network/consumer": minor
"@idos-network/issuer": minor
---

Address new `ukyc://` blobs by the sha256 of the ciphertext, so the signed content URI pins the encrypted bytes. Reads of dev credentials whose blob id is still a UUID keep working (size check only).

`buildPreliminaryIDOSCredential` takes `ukycStorageId` instead of a finished `contentUri`. `createCredentialByDelegatedWriteGrant` drops `originalContentUri` and `copyContentUri`; pass one `ukycStorageId` (omit it to keep IPFS). `mmTokenCredentialContentUri` is removed; `mmTokenStorageId` remains.
