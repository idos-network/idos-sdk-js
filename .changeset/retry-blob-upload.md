---
"@idos-network/utils": patch
"@idos-network/client": patch
"@idos-network/issuer": patch
---

Retry credential blob uploads after a network error, a timeout, or a 408, 429, 500, 502, 503 or 504 from the blob gateway: two retries, 1 s then 2 s apart. Each attempt times out after 150 s. Tune this with the new `uploadRetries`, `uploadRetryDelayMs` and `uploadTimeoutMs` options on `BlobGateway`.

When the credentials may have been created even though the upload failed, the upload throws `BlobGatewayUploadOutcomeUnknownError` with the affected `credentialIds`. This covers a last attempt that may have reached the gateway, a retry that finds the preliminary credential gone or already finalized, and a success response that is unreadable or reports CIDs that do not match the uploaded bytes. `createCredential` and `requestAccessGrant` then look the credential up by id and read its blob back, and return normally only if it exists and matches the upload.
