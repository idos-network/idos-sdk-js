# idOS Issuer JavaScript SDK

[![NPM](https://img.shields.io/npm/v/@idos-network/issuer-sdk-js?logo=npm)](https://www.npmjs.com/package/@idos-network/idos-issuer-sdk-js) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

## Installing

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-issuer-sdk-js) and its dependencies with pnpm or the equivalent of your package manager of choice:

```bash
pnpm add @idos-network/idos-issuer-sdk-js
```

## Setting up

Create an issuer config with your secret key. This config will be used to interact with the idOS.

```js
// issuer-config.js
import { createIssuerConfig } from "@idos-network/idos-issuer-sdk-js";
import { Wallet } from "ethers";

const wallet = new Wallet("YOUR_PRIVATE_KEY");

const issuerConfig = await createIssuerConfig({
  nodeUrl: "https://nodes.idos.network/", // or nodes.playground.idos.network
  encryptionSecret: "YOUR_ENCRYPTION_SECRET_KEY",
  signer: wallet
});
```

## Creating a human profile

In order to create a human profile in idOS, you need to have a wallet associated with the human and a public key for the human.
Passing ids are optional and will be auto-generated if not provided.

```js
// createHumanDemo.js

import { createHuman } from "@idos-network/idos-issuer-sdk-js";
import issuerConfig from "./issuer-config.js";

/**
 * Represents a human profile in the idOS system.
 *
 * @typedef {Object} Human
 * @property {string} current_public_key - The public key derived from the user's keypair, used to encrypt credentials content.
 */

const human = {
  current_public_key: "DERIVED_PUBLIC_KEY",
}

/**
 * Represents the payload for a wallet associated with a human profile.
 *
 * @typedef {Object} WalletPayload
 * @property {string} address - The wallet address (e.g., an Ethereum address).
 * @property {string} wallet_type - The type of wallet, e.g., "EVM", "NEAR".
 * @property {string} message - The message that was signed by the user.
 * @property {string} signature - The derived signature for the message, created with the user's private key.
 * @property {string} public_key - The public key derived from the user's keypair.
 */

/**
 * The wallet payload object representing a wallet associated with the human profile.
 *
 * @type {WalletPayload}
 */

const walletPayload = {
  address: "0x0",
  wallet_type: "EVM",
  message: "app wants you to sign this message...",
  signature: "0x3fda8a9fef767d974ceb481d606587b17c29a23a0999e94d16c07628b33bad341cf808a1c0eae84406709f8153096f845942d22bb53ca84faaaabc9b35b87d6c1c",
  public_key: "RxG8ByhoFYA6fL5X3qw2Ar9wpblWtmPp5MKtlmBsl0c=",
}

// Will return a tuple with the human profile first then the wallet associated to the human.
const [profile, wallet] = await createHuman(issuerConfig, human, walletPayload);
```

## Writing credentials

In order to write a credential to idOS, the issuer needs to obtain permission from the user. This can be done in two ways: using Write Grants, or using Permissioned Credential Creation. Below are the two methods for writing credentials.

### Using Write Grants
The first method involves getting permission from the user via a Write Grant. This grants the issuer the ability to write to the user’s profile. To do this, you must first create a Write Grant using the idOS SDK.

Here's an example of creating a write grant, by calling the [addWriteGrant](https://github.com/idos-network/idos-sdk-js/tree/main/packages/idos-sdk-js#write-grants):

```js
import { idOS } from "@idos-network/idos-sdk-js";

const sdk = await idOS.init(...);

const issuerAddress = "0x0"; // The address of the grantee (in this case it's the Issuer's address).

// Create a write grant.
await sdk.data.addWriteGrant(issuerAddress);
```

This will create a write grant in the idOS for the given grantee address. Now, the issuer can create a credential:

```js
import { createCredentialByGrant } from "@idos-network/idos-issuer-sdk-js";
import issuerConfig from "./issuer-config.js";

const credential = {
  credential_level: "human",
  credential_type: "human",
  credential_status: "pending", // has also types of "contacted" | "approved" | "rejected" | "expired"
  issuer: "ISSUER_NAME",
  content: "VERIFIABLE_CREDENTIAL_CONTENT", // The verifiable credential content should be passed as is see example at https://verifiablecredentials.dev/
  encryption_public_key: "ISSUER_ENCRYPTION_PUBLIC_KEY",
}

const credential = await createCredentialByGrant(issuerConfig, credential);
```

This will create a credential in the idOS for the given grantee address.


> ⚠️ Notice
>
> The credential content should be passed as is. It will be encrypted for the recipient before being stored on the idOS.

### Using Permissioned Credential Creation
The second method allows the issuer to create a credential without a Write Grant by having a permissioned approach. This method assumes the issuer already has direct permission to write the credential.

In this case, the `createCredentialPermissioned` function is used to write the credential with necessary encryption.

Example:

```js
import { createCredentialPermissioned } from "@idos-network/idos-issuer-sdk-js";
import issuerConfig from "./issuer-config.js";

const credential = {
  credential_level: "human",
  credential_type: "human",
  credential_status: "pending", // has also types of "contacted" | "approved" | "rejected" | "expired"
  issuer: "ISSUER_NAME",
  content: "VERIFIABLE_CREDENTIAL_CONTENT", // The verifiable credential content should be passed as is see example at https://verifiablecredentials.dev/
  encryption_public_key: "ISSUER_ENCRYPTION_PUBLIC_KEY",
}

const credentialResult = await createCredentialPermissioned(issuerConfig, credential);
```

This method directly writes the credential to the idOS, assuming the issuer has the necessary permissions.

## Developing the SDK locally

Run:
```bash
pnpm dev
```

This will start the compiler in watch mode that will rebuild every time any of the source files are changed.

You can also create a production build by running the following command in the root folder of the SDK package:

```bash
pnpm build
```
