# idOS Issuer JavaScript SDK

[![NPM](https://img.shields.io/npm/v/@idos-network/idos-sdk?logo=npm)](https://www.npmjs.com/package/@idos-network/idos-sdk) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

## Installation

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk) and its dependencies with pnpm or the equivalent of your package manager of choice:
```
pnpm add @idos-network/idos-issuer-sdk-js
```


## Quickstart

```
import { createIssuerConfig } from "@idos-network/idos-issuer-sdk-js";
import { Wallet } from "ethers";

const wallet = new Wallet("YOUR_PRIVATE_KEY");

const issuerConfig = await createIssuerConfig({
  nodeUrl: "https://node.url",
  secretKey: "YOUR_SECRET_KEY",
  signer: wallet // Or use a KeyPair from near-api-js
});

The issuer config is an object that contains the issuer's configuration interact with idOS.

### Creating a human profile.

In order to create a human profile in idOS, you need to have a wallet associated with the human and a public key for the human.
Passing ids are optional and will be auto-generated if not provided.


```
import { createHuman } from "@idos-network/idos-issuer-sdk-js";
import issuerConfig from "./issuer-config.js";

const human = {
  id: crypto.randomUUID(),
  current_public_key: "DERIVED_PUBLIC_KEY",
}

const wallet = {
  id: crypto.randomUUID(),
  address: "0x0",
  wallet_type: "EVM",
  message: "SIGN_MESSAGE",
  signature: "DERIVED_SIGNATURE",
  public_key: "DERIVED_PUBLIC_KEY",   
}

const human = await createHuman(issuerConfig, human, wallet);
```

## Developing the SDK locally

Run:
```
pnpm dev
```
This will run a dev server with watch mode that will rebuild every time any of the source files are changed.

You can also create a production build by running the following command in the root folder of the SDK package:
```
pnpm build
```
