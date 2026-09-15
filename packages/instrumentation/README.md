# `@idos-network/instrumentation`

OpenTelemetry instrumentation for the idOS JavaScript SDK, modelled on
[`@opentelemetry/instrumentation-pg`](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/packages/instrumentation-pg).

Patches the SDK's public methods so that every idOS operation shows up as a span,
with the kwil round-trips it triggers nested underneath.

## Install

```sh
pnpm add @idos-network/instrumentation @opentelemetry/api
```

## Node (`@idos-network/issuer`, `@idos-network/consumer`)

```ts
import { IdosInstrumentation } from "@idos-network/instrumentation";
import { registerInstrumentations } from "@opentelemetry/instrumentation";

registerInstrumentations({ instrumentations: [new IdosInstrumentation()] });
```

The idOS packages are ESM-only, so Node's ESM loader hook has to be registered
**before** anything imports them — the same requirement every OpenTelemetry
instrumentation has for ESM. Either use
`--import @opentelemetry/instrumentation/hook.mjs`, or put the
`registerInstrumentations` call in a file you load with `node --import ./telemetry.mjs`.

## Browser (`@idos-network/client`)

There are no module loader hooks in a browser, and a bundler has already frozen
the import graph by the time your code runs. Hand the imported namespace over
instead:

```ts
import * as idosClient from "@idos-network/client";
import { IdosInstrumentation } from "@idos-network/instrumentation";

const instrumentation = new IdosInstrumentation({ requireParentSpan: true });
instrumentation.setTracerProvider(provider);
instrumentation.patchModuleExports("@idos-network/client", idosClient);
```

`requireParentSpan` is worth turning on in the browser: without it, an idOS call
made outside a user-interaction span produces a single-span orphan trace.

## What gets traced

| Module                      | Spans                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| `@idos-network/kwil-infra`  | `KwilActionClient.call` / `.execute` — the idOS equivalent of `pg.Client.query` — and `.waitForTx` |
| `@idos-network/client`      | `idOSClientConfiguration` / `Idle` / `WithUserSigner` / `LoggedIn` methods, and `IframeEnclave`    |
| `@idos-network/issuer`      | `idOSIssuer` methods and `idOSIssuer.init`                                                         |
| `@idos-network/consumer`    | `idOSConsumer` methods and `idOSConsumer.init`                                                     |
| `@idos-network/credentials` | `verifyCredential`                                                                                 |
| `@idos-network/enclave`     | `LocalEnclave` methods                                                                             |

Kwil spans carry `db.system.name=kwil`, `db.namespace=main` and
`db.operation.name=<action>`; `execute` also records `idos.kwil.tx_hash`. Every
span carries `idos.sdk.package`, `idos.sdk.class` and `idos.sdk.method`.

A synchronous `execute` broadcasts the transaction and then polls until it is
mined, which is usually where its latency goes. The wait is its own
`idos.kwil.waitForTx` child span, carrying `idos.kwil.tx_hash`, so broadcast time
and confirmation time show up separately. When it fails, `error.type` tells the
two outcomes apart: `KwilTxFailedError` (the chain rejected the transaction)
versus `KwilTxPollTimeoutError` (it was never mined inside the deadline).

The HTTP calls underneath are _not_ covered here — use
`@opentelemetry/instrumentation-undici` (Node) or
`@opentelemetry/instrumentation-fetch` (browser) alongside this package, and
they will nest under the spans above.

## No arguments or return values are recorded

idOS SDK arguments and return values are credentials, wallet identifiers and
encryption keys. Nothing derived from them is put on a span by default — only
fixed identifiers such as the kwil action name. If you need more, opt in per
deployment with `requestHook` / `responseHook`:

```ts
new IdosInstrumentation({
  requestHook: (span, { className, methodName, args }) => {
    if (className === "idOSConsumer" && methodName === "getCredentialSharedFromIDOS") {
      span.setAttribute("idos.credential.id", String(args[0]));
    }
  },
});
```

## Config

| Option              | Default | Meaning                                              |
| ------------------- | ------- | ---------------------------------------------------- |
| `enabled`           | `true`  | Whether the instrumentation patches on registration. |
| `requireParentSpan` | `false` | Only create spans when one is already active.        |
| `requestHook`       | –       | Add attributes from the call arguments.              |
| `responseHook`      | –       | Add attributes from the resolved value.              |
