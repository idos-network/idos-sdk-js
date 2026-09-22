# kwil-js integration tests

Integration tests for [`@idos-network/kwil-js`](../../packages/kwil-js). They talk to a **live
Kwil node** — they create namespaces, deploy actions and broadcast transactions — so they are not
part of `pnpm test` and do not run in CI.

They live here rather than in the package because they need a node, credentials and several
signing libraries that the published package must not depend on.

## Running

```bash
cp .env.example .env   # then fill it in
pnpm --filter kwil-js-integration test:integration
```

`PRIVATE_KEY` must be an Ethereum/secp256k1 key that is funded on the target chain when
`GAS_ON=TRUE`. The `GATEWAY_ON`, `GAS_ON` and `PRIVATE_MODE` switches select which suites run —
with all of them `FALSE` you get the plain node suites (database, arrays, variables, edge cases,
nonce, latin characters).

## Getting a node

Point `KWIL_PROVIDER` at any reachable Kwil node. To run one locally, use the compose setup from
[kwil-db](https://github.com/trufnetwork/kwil-db) — it builds `kwild` from that repo, which is why
it is not vendored here. The version this fork tracks is in
[the package README](../../packages/kwil-js/README.md#version-compatibility).

## Reaching into kwil-js internals

Some assertions cover types and helpers that `@idos-network/kwil-js` deliberately does not export.
Those imports use the `kwil-js-src/*` alias (see `vitest.config.ts` and `tsconfig.json`), which
resolves straight to `packages/kwil-js/src`. Everything the package exports publicly is imported
as `@idos-network/kwil-js` so the tests keep exercising the real entry points.
