# `@idos-network/instrumentation`

OpenTelemetry instrumentation for the idOS JavaScript SDK, modelled on
[`@opentelemetry/instrumentation-pg`](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/packages/instrumentation-pg).

Patches the SDK's public methods so that every idOS operation shows up as a span,
with the kwil round-trips it triggers nested underneath.

## Install

```sh
pnpm add @idos-network/instrumentation @opentelemetry/api
```

## Setup

Every target is a class method, which lives on a prototype or a constructor —
ordinary mutable objects. So patching needs no module loader hook: import the
idOS module and hand its namespace over, once per package you use.

```ts
import * as issuer from "@idos-network/issuer";
import * as kwil from "@idos-network/kwil-infra";
import { IdosInstrumentation } from "@idos-network/instrumentation";

const instrumentation = new IdosInstrumentation();
instrumentation.setTracerProvider(provider); // omit to use the global provider

instrumentation.patchModuleExports("@idos-network/issuer", issuer);
instrumentation.patchModuleExports("@idos-network/kwil-infra", kwil);
```

This is the same call in Node and in the browser, and it survives bundling.
Patching a prototype also applies to instances that already exist, so there is
no race with `idOSIssuer.init()`.

In the browser, `new IdosInstrumentation({ requireParentSpan: true })` is worth
it: without it, an idOS call made outside a user-interaction span produces a
single-span orphan trace.

### Automatic patching in Node (optional)

`InstrumentationBase` can also patch on import, with no app code at all. The
idOS packages are ESM-only, so that needs Node's loader hook — and two separate
things have to happen before the app imports any idOS package:

```ts
// telemetry.mjs
import { register } from "node:module";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { IdosInstrumentation } from "@idos-network/instrumentation";

register("@opentelemetry/instrumentation/hook.mjs", import.meta.url); // installs the loader
registerInstrumentations({ instrumentations: [new IdosInstrumentation()] }); // says what to patch
```

```sh
node --import ./telemetry.mjs ./app.mjs
```

Worth it if you already launch with `--import`; otherwise prefer
`patchModuleExports`, which has no launch-flag to forget in a Dockerfile.

Two things that look like they should work and do not:

- `--import @opentelemetry/instrumentation/hook.mjs` on its own. `hook.mjs` is a
  loader module exporting `resolve`/`load`/`initialize`, so importing it
  registers nothing — it has to be passed to `register()`.
- `registerInstrumentations` called from inside your app. By then the idOS
  modules are loaded and their namespaces are sealed.

## What gets traced

| Module                     | Spans                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `@idos-network/kwil-infra` | `KwilActionClient.call` / `.execute` — the idOS equivalent of `pg.Client.query` — and `.waitForTx` |
| `@idos-network/client`     | `idOSClientConfiguration` / `Idle` / `WithUserSigner` / `LoggedIn` methods                          |
| `@idos-network/issuer`     | `idOSIssuer` methods and `idOSIssuer.init`                                                         |
| `@idos-network/consumer`   | `idOSConsumer` methods and `idOSConsumer.init`                                                     |

The enclave is not traced: it is local key material and iframe/MPC work, not
where request latency lives. `verifyCredential` is covered as
`idOSConsumer.verifyCredential`, which delegates straight to it.

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
