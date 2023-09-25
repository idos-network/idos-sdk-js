# idOS JavaScript SDK

![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

| Folder | Contents |
| :--- | :--- |
| [`📁 idos-sdk-js`](./idos-sdk-js/) | Source and docs for the idOS JavaScript SDK |
| [`📁 idos-enclave`](./idos-enclave) | Source for the idOS Enclave hosted at [enclave.idos.network](https://enclave.idos.network). |
| [`📁 examples/dapp`](./examples/dapp) | A sample dapp demonstrating SDK usage. | 

## Installation

Run `yarn add @idos-network/idos-sdk` or `npm install @idos-network/idos-sdk` to install [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk).

## Quickstart

```js
import { idOS } from "@idos-network/idos-sdk";

// initialize SDK
const idos = new idOS({ url: "..." });
await idos.auth.setWalletSigner(connectedSigner);
// or          .setEnclaveSigner();
await idos.crypto.init();

// read data from the connected user's idOS profile
const credentials = await idos.data.list("credentials");

// write data to the connected user's idOS profile
const attribute = await idos.data.create("attributes", { key: "foo", value: "bar" });

// get an access grant (read data later, offline, without needing the user's signature)
await idos.grants.create(attribute, { address: "0xYou", encryptionPublicKey: "0xYours" });
```

See the more complete example at at [examples/dapp](./examples/dapp/).
