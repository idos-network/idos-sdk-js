---
"@idos-network/credentials": minor
---

Add `VerifiableCredentialKycV4` and `VerifiableCredentialEddV2`, with the same fields as KYC v3 and EDD v1 under subject contexts that give every field an explicit IRI. Issue new credentials with them. KYC v4 subject dates are typed `xsd:dateTime`, matching the timestamps they carry. The terms are listed in a generated vocabulary document, `assets/idos-vocab.xml`. `verifyCredential` now reports a credential as not verified when any `@context` in it is not a URL: an embedded context could map the JSON fields onto the signed graph differently. Read verified credentials with `parseCredential`.
