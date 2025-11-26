# idOS JavaScript SDK

![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

> ⚖️ Legalities
>
> By downloading, installing, or implementing any of the idOS’ SDKs, you acknowledge that you have read and understood idOS’ Privacy Policy and Transparency Document.
>
> - <https://www.idos.network/legal/privacy-policy>
> - <https://www.idos.network/legal/transparency-document>

## SDKs
| Folder                                   | Contents                                     |
| :--------------------------------------- | :------------------------------------------- |
| **[`📁 consumer`](./packages/consumer/)** | idOS JavaScript SDK for consumers            |
| **[`📁 issuer`](./packages/issuer)**      | idOS JavaScript SDK for issuers              |
| **[`📁 client`](./packages/client)**      | idOS JavaScript SDK for browser environments |

`@core` and `@controllers` are internal packages.

## Auxiliary Applications
| Folder                                                 | Contents                                                                                                                                |
| :----------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| [`📁 dashboard-for-dapps`](./apps/dashboard-for-dapps/) | Dashboard for dApp developers to access data that users shared with them. <br> Deployed at <https://dashboard-for-dapps.idos.network/>. |
| [`📁 idos-data-dashboard`](./apps/idos-data-dashboard)  | Interface for users to visualize and manage their idOS profile. <br> Deployed at <https://dashboard.idos.network/>.                     |
| [`📁 idos-enclave`](./apps/idos-enclave)                | A secure browser context for password input, key derivation, encryption, and decryption.                                                |
| [`📁 isle`](./apps/isle)                                | Full-featured standard UI for dApps to include in their application.                                                                    |
| [`📁 passporting-server`](./apps/idos-data-dashboard)   | Backend service for credential passporting between [Obliged Entities](./docs/glossary.md#obliged-entities).                             |

`idos-sdk-e2e` are the end-to-end tests.

## Examples
| Folder                                                     | Contents                                                                                                  |
| :--------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| [`📁 consumer-and-issuer`](./examples/consumer-and-issuer/) | Example implementation showing and application that's both the consumer and the issuer                    |
| [`📁 passporting`](./examples/passporting)                  | Demo of credential passporting between different [Obliged Entities](./docs/glossary.md#obliged-entities). |

## Installation

Get [client NPM packages](https://www.npmjs.com/package/@idos-network/client) and [consumer NPM packages](https://www.npmjs.com/package/@idos-network/consumer) and its dependencies with pnpm or the equivalent of your package manager of choice:
```
pnpm add @idos-network/client @idos-network/consumer ethers near-api-js
```

## 10,000 foot view

```js
import { createIDOSClient, type idOSClient } from "@idos-network/client";

// Connect your user's wallet however you do it today, for example:
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();

// Initialize the SDK (enclave is rendered as a full-screen iframe + modal)
let idOSClient = createIDOSClient({
  enclaveOptions: {
    // URL of your deployed idOS Enclave app (e.g. https://enclave.yourapp.com)
    // or the default hosted enclave: https://enclave.idos.network
    url: "https://enclave.idos.network",
  },
});
idOSClient = await idOSClient.withUserSigner(signer);

// Overview of user's credentials
const credentials = await idOSClient.getAllCredentials();
console.log(credentials);
// [{ id: "4f4d...", issuer: "Fractal ID", type: "KYC"}, ...]
```

More details on https://github.com/idos-network/idos-sdk-js/blob/main/packages/idos-sdk-js#quickstart

## Support

Please follow the process outlined here: https://github.com/idos-network/.github/blob/main/profile/README.md
