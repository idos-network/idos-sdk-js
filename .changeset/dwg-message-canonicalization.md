---
"@idos-network/kwil-infra": minor
"@idos-network/client": minor
"@idos-network/issuer": minor
---

Export `toDelegatedWriteGrantBaseParams` so DWG request input maps 1:1 into `createCredentialByDelegatedWriteGrant`. Canonicalize ed25519 signer identifiers and 64-character hexadecimal grantee identifiers to lowercase hex to match kwild `@caller`.
