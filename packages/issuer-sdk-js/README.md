# idOS Issuer JavaScript SDK

[![NPM](https://img.shields.io/npm/v/@idos-network/issuer-sdk-js?logo=npm)](https://www.npmjs.com/package/@idos-network/idos-issuer-sdk-js) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

## Installing

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-issuer-sdk-js) and its dependencies with pnpm or the equivalent of your package manager of choice:

```bash
pnpm add @idos-network/idos-issuer-sdk-js
```

## Before you start

When using this package, you're going to need to be familiar with how a dApp works with the idOS. Make sure you read [idos-sdk-js's README](https://github.com/idos-network/idos-sdk-js/tree/main/packages/idos-sdk-js#readme) before you proceed.

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

To create a human profile in idOS, you need:
1. **A wallet** associated with the human.
2. **A public encryption key** derived from either a password or a passkey chosen by the user in the idOS enclave app.


## Process Overview

Below is a diagram showing the key steps in the human creation process:

#### Human Creation Process
<img src="./assets/add_user.drawio.svg" alt="Human Creation Process" width="100%">


#### Step 1: Deriving the Public Key

Use the `discoverUserEncryptionKey` function to derive a public key for the human. This key will be used to encrypt and decrypt human's credential content. This is accessible through the `idos` object.

```javascript
/*
 * Client side.
 */
import { idOS } from "@idos-network/idos-sdk";
const USER_HUMAN_ID = crypto.randomUUID();

async function derivePublicKey() {
  // Arguments are described on idos-sdk-js's README. Be sure to read it.
  const idos = await idOS.init(...);

  // Discover user encryption key
  const { encryptionPublicKey: DERIVED_PUBLIC_KEY } = await idos.enclave.provider.discoverUserEncryptionKey(USER_HUMAN_ID);

  return DERIVED_PUBLIC_KEY;
}
```


#### Step 2: Creating a Human Profile
Once the public key is derived, you can create the human profile in idOS by passing it to the `createHuman` function alongside with human id.

```javascript
// createHumanDemo.js (Server side.)

import { createHuman } from "@idos-network/idos-issuer-sdk-js";
import issuerConfig from "./issuer-config.js";

const human = {
  id: USER_HUMAN_ID,
  //  The public key derived from the user's keypair, used to encrypt credentials content.
  current_public_key: DERIVED_PUBLIC_KEY,
}

const walletPayload = {
  address: "0x0", // The wallet address (e.g., an Ethereum address).
  wallet_type: "EVM", // The type of wallet, e.g., "EVM", "NEAR".
  message: "app wants you to sign this message...", // The message that was signed by the user.
  signature: "0x3fda8a9fef767d974ceb481d606587b17c...", // The derived signature for the message, created with the user's private key.
  public_key: "RxG8ByhoFYA6fL5X3qw2Ar9wpblWtmPp5MKtlmBsl0c=",// The public key derived from the user's keypair.
}

// Will return a tuple with the human profile first then the wallet associated to the human.
const [profile, wallet] = await createHuman(issuerConfig, human, walletPayload);
```

## Writing credentials

In order to write a credential to idOS, the issuer needs to obtain permission from the user. This can be done in two ways: using Write Grants, or using Permissioned Credential Creation. Below are the two methods for writing credentials.

### Using Write Grants
The first method involves getting permission from the user via a Write Grant.

A Write Grant is a permission given by the user that allows a specific grantee to perform a few operations on their behalf. This is particularly relevant to not require the user to come back to your website if you want to add data to their profile.

To do this, you must first create a Write Grant using the idOS SDK. Here's an example of creating a write grant, by calling the [data.addWriteGrant](https://github.com/idos-network/idos-sdk-js/tree/main/packages/idos-sdk-js#write-grants):

```js
/*
 * Client side.
 */
import { idOS } from "@idos-network/idos-sdk-js";

// Arguments are described on idos-sdk-js's README. Be sure to read it.
const idos = await idOS.init(...);

// This is a placeholder for your signer's address. You could get it from
// some endpoint you expose. But, to keep it simple, we're using a constant.
const ISSUER_SIGNER_ADDRESS = "0xc00ffeec00ffeec00ffeec00ffeec00ffeec00ff";

// The user is going to grant you,
await idos.data.addWriteGrant(ISSUER_SIGNER_ADDRESS);
```

Now that the user has created a Write Grant for us, the issuer, we can create a credential for the user:

```js
import { createCredentialByGrant, encryptionPublicKey } from "@idos-network/idos-issuer-sdk-js";
import issuerConfig from "./issuer-config.js";

const credential = {
  // These three fields are public and are designed to assist dApps that rely
  // on your credentials with selecting the appropriate credential when
  // acquiring an Access Grant.
  //
  // You should decide on what's the most helpful content they can have. These
  // three are just an example.
  credential_type: "human",
  credential_level: "human",
  credential_status: "approved",

  // This is a string decided by you. Be sure to always use the same one to
  // make yourself discoverable by dApps.
  issuer: "MyCoolIssuer",

  // user id of the human who is creating the credential.
  human_id: USER_HUMAN_ID,

  // The verifiable credential content should be passed as is see example at https://verifiablecredentials.dev/ usually a stringfied JSON object.
  // `createCredentialByGrant` will encrypt this for us. using the Issuer's secret encryption key. along with the user's public encryption key.
  content: "VERIFIABLE_CREDENTIAL_CONTENT",

  // The public encryption key of the issuer.
  encryption_public_key: issuerConfig.issuerPublicEncryptionKey,

  // The public encryption key of the user who is creating the credential.
  userEncryptionPublicKey: DERIVED_PUBLIC_KEY
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
