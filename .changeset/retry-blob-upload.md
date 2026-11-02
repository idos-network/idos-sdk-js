---
"@idos-network/utils": patch
---

Retry credential blob uploads after a network error or a 408, 429, 500, 502, 503 or 504 from the blob gateway: two retries, 1 s then 2 s apart. Each attempt now times out after 150 s, and a timeout is retried too. Tune this with the new `uploadRetries`, `uploadRetryDelayMs` and `uploadTimeoutMs` options on `BlobGateway`. If a retry finds the preliminary credential gone (404) or already finalized (409), the upload throws `BlobGatewayUploadOutcomeUnknownError`, because an earlier attempt whose response was lost may have created the credential.
