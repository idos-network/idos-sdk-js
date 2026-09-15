---
"@idos-network/instrumentation": minor
"@idos-network/kwil-infra": patch
---

Add `@idos-network/instrumentation`: OpenTelemetry instrumentation for the idOS SDK.

Traces the public methods of `@idos-network/client`, `/consumer`, `/issuer`, the
enclave providers and `verifyCredential`, with the `KwilActionClient.call` /
`.execute` round-trips they trigger nested underneath as `db.*` spans.

`KwilActionClient` gains a `waitForTx` method: the tx-confirmation polling a
synchronous `execute` already did, split out so it can be traced on its own.
Behaviour is unchanged.

Arguments and return values are never recorded — they carry credentials and keys.
Use `requestHook` / `responseHook` to opt in per deployment.
