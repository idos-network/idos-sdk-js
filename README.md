# idOS JavaScript SDK

![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

| Folder                                                 | Contents                                                                                              |
| :----------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **[`📁 idos-sdk-js`](./packages/idos-sdk-js/)**        | Source and docs for the idOS JavaScript SDK                                                           |
| [`📁 idos-enclave`](./apps/idos-enclave)               | Source for the idOS Enclave hosted at [enclave.idos.network](https://enclave.idos.network)            |
| [`📁 idos-data-dashboard`](./apps/idos-data-dashboard) | Source for the idOS data dashboard hosted at [dashboard.idos.network](https://dashboard.idos.network) |
| [`📁 idos-example-dapp`](./apps/idos-example-dapp)     | A sample dapp demonstrating SDK usage.                                                                |

## Installation

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk) with `pnpm add @idos-network/idos-sdk` (or the equivalent of your package manager of choice).

## Quickstart

```js
import { idOS } from "@idos-network/idos-sdk";

// initialize SDK
const idos = await idOS.init({ container: "#idos" });
await idos.auth.setEvmSigner(connectedSigner);
await idos.crypto.init();

// read data from the connected user's idOS profile
const credentials = await idos.data.list("credentials");

// write data to the connected user's idOS profile
const attribute = await idos.data.create("attributes", {
  attribute_key: "foo",
  value: "bar",
});
```

See the more complete example at at [apps/idos-example-dapp](./apps/idos-example-dapp).
