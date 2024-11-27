# idOS JavaScript SDK

![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

| Folder                                                 | Contents                                                                                              |
| :----------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **[`📁 idos-sdk-js`](./packages/idos-sdk-js/)**        | Source and docs for the idOS JavaScript SDK                                                           |
| [`📁 idos-enclave`](./apps/idos-enclave)               | Source for the idOS Enclave hosted at [enclave.idos.network](https://enclave.idos.network)            |
| [`📁 idos-data-dashboard`](./apps/idos-data-dashboard) | Source for the idOS data dashboard hosted at [dashboard.idos.network](https://dashboard.idos.network) |
| [`📁 idos-example-dapp`](./examples/idos-example-dapp) | A sample dapp demonstrating SDK usage.                                                                |

## Installation

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk) and its dependencies with pnpm or the equivalent of your package manager of choice:
```
pnpm add @idos-network/idos-sdk ethers near-api-js
```

## 10,000 foot view

```js
import { idOS } from "@idos-network/idos-sdk";

// Connect your user's wallet however you do it today, for example:
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();

// Initialize the SDK
const idos = await idOS.init({enclaveOptions: {container: "#idos-container"}});
await idos.setSigner("EVM", signer);

// Overview of user's credentials
const credentials = await idos.data.list("credentials");
console.log(credentials);
// [{ id: "4f4d...", issuer: "Fractal ID", type: "KYC"}, ...]
```

More details on https://github.com/idos-network/idos-sdk-js/blob/main/packages/idos-sdk-js#quickstart

## Support

Please follow the process outlined here: https://github.com/idos-network/.github/blob/main/profile/README.md
