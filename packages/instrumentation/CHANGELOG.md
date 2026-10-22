# @idos-network/instrumentation

## 3.0.0

### Major Changes

- 67e82a7: Upgrade to OpenTelemetry JS SDK 3.x: `@opentelemetry/instrumentation` 0.300.x, which requires `@opentelemetry/api` >=1.10.0 and Node.js >=22.15.0. Tests and docs now use `@opentelemetry/sdk-trace` instead of the removed `sdk-trace-base`.

## 2.3.0

## 2.2.2

### Patch Changes

- e1408a1: Publish via npm trusted publishing (OIDC) with provenance; expand `repository` field in package manifests.

## 2.2.1

## 2.2.0

### Minor Changes

- 3ae3d26: Add `@idos-network/instrumentation`: OpenTelemetry instrumentation for the idOS SDK.

  Traces the public methods of `@idos-network/client`, `/consumer` and `/issuer`,
  with the `KwilActionClient.call` / `.execute` round-trips they trigger nested
  underneath as `db.*` spans. Every target is a class method, so patching works
  through `patchModuleExports` with no ESM loader hook; `--import` stays supported
  for automatic patching.

  `KwilActionClient` gains a `waitForTx` method: the tx-confirmation polling a
  synchronous `execute` already did, split out so it can be traced on its own.
  Behavior is unchanged.

  Arguments and return values are never recorded — they carry credentials and keys.
  Use `requestHook` / `responseHook` to opt in per deployment.
