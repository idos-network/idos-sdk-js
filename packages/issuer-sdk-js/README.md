# idOS Issuer JavaScript SDK

[![NPM](https://img.shields.io/npm/v/@idos-network/issuer-sdk-js?logo=npm)](https://www.npmjs.com/package/@idos-network/issuer-sdk-js) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

## Installing

Get [our NPM package](https://www.npmjs.com/package/@idos-network/issuer-sdk-js) and its dependencies with pnpm or the equivalent of your package manager of choice:

```bash
pnpm add @idos-network/issuer-sdk-js
```

## Before you start

When using this package, you're going to need to be familiar with how a dApp works with the idOS. Make sure you read [idos-sdk-js's README](https://github.com/idos-network/idos-sdk-js/tree/main/packages/idos-sdk-js#readme) before you proceed.

## Setting up

Create an issuer config with your secret key. This config will be used to interact with the idOS.

```js
// issuer-config.js
import { createIssuerConfig } from "@idos-network/issuer-sdk-js";
import * as Base64 from "@stablelib/base64";
const signingKeyPair = nacl.sign.keyPair.fromSecretKey(ISSUER_SIGNING_SECRET_KEY);
const encryptionSecretKey = Base64.decode(ISSUER_ENCRYPTION_SECRET_KEY);

const issuerConfig = await createIssuerConfig({
  // To use a non-prod environment, pass in "nodes.playground.idos.network".
  nodeUrl: "https://nodes.idos.network/",
  signingKeyPair,
  encryptionSecretKey
});
```

## Creating a user profile

This procedure can only be done by a Permissioned Issuer. Get in touch with us at engineering@idos.network if you're interested in being one.

To create a user profile in idOS, you need:
1. **A wallet address** associated with the user.
2. **A public encryption key** derived from either a password or a passkey chosen by the user in the idOS enclave app.

### User Creation Process
<img src="https://raw.githubusercontent.com/idos-network/idos-sdk-js/main/packages/issuer-sdk-js/assets/add-user.drawio.svg" alt="User Creation Process" width="100%">


#### Step 1: Decide on a user id

Deciding on a user id for a user is an issuer decision. You can use whichever you want, as long as it's an [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).

```js
// Server side

const userId = crypto.randomUUID();

// Remember it on your database
session.user.update({ userId })

// Return it to the front-end to be used in the next step
return { userId }
```

#### Step 2: Derive the Public Key

Use the `idos.discoverUserEncryptionPublicKey` function to derive a public key for the user. This key will be used to encrypt and decrypt user's credential content.

```javascript
// Client side

import { idOS } from "@idos-network/idos-sdk-js";

// Arguments are described on idos-sdk-js's README. Be sure to read it.
// Note: make sure to set mode to "new" since you're creating a new idOS profile
const initParams = { ...YOUR_IDOS_INIT_PARAMS, mode: "new" };
const idos = await idOS.init(...);

// Get userId associated with this user from your server
const { userId } = await yourServer.getIdosInformation();

// Discover user encryption key
const { userEncryptionPublicKey } = await idos.discoverUserEncryptionPublicKey(userId);

// Report it back to your server
await yourServer.reportIdosEncryptionPublicKey(userEncryptionPublicKey);
```


#### Step 3: Creating a User Profile
Once the public key is derived, you can create the user profile in idOS by passing it to the `createUser` function alongside with user id and the wallet the user's going to use to drive their idOS profile.

```javascript
// Server side

import { createUser } from "@idos-network/issuer-sdk-js";
import issuerConfig from "./issuer-config.js";

// Get this from the user's request, and remember it
const currentPublicKey = request.params['userEncryptionPublicKey']
session.user.currentPublicKey = currentPublicKey

// Get the stored user id
const userId = session.user.userId

// Build the user object
const user = {
  id: userId,
  recipient_encryption_public_key: currentPublicKey,
}

// Build the wallet object
const walletPayload = {
  // The user's wallet address (e.g., an Ethereum address)
  address: "0x0",
  // The type of user wallet (e.g., "EVM", "NEAR")
  wallet_type: "EVM",
  // The message that was signed by the address
  message: "app wants you to sign this message...",
  // The derived signature for the message, created with the user wallet
  signature: "0x3fda8a9fef767d974ceb481d606587b17c...",
  // The user wallet's public key
  public_key: "RxG8ByhoFYA6fL5X3qw2Ar9wpblWtmPp5MKtlmBsl0c=",
}

// Create the user on idOS nodes, and get some information back.
const [profile, wallet] = await createUser(issuerConfig, user, walletPayload);
```

## Writing credentials

In order to write a credential to idOS, the issuer needs to obtain permission from the user. This can be done in two ways: using Delegated Write Grant (DWG), or using Permissioned Credential Creation. Below are the two methods for writing credentials.

### Using Delegated Write Grant
The first method involves getting permission from the user via a Delegated Write Grant

A Delegated Write Grant (DWG) is a permission given by the user that allows a specific issuer to create a credential and it's copy for the issuer itself on the user's behalf. This is particularly relevant to not require the user to come back to your website if you want to add data to their profile. A DWG is a ERC-191 message that the user signs. The message contains fields:
- operation: delegatedWriteGrant
- owner: _user_wallet_identifier_
- grantee: _grantee_wallet_identifier_
- id: _DWG_identifier
- access grant timelock: _RFC3339_date_time_till_access_grant_will_be_locked_
- not usable before: _RFC3339_date_time_DWG_can_not_be_used_before_
- not usable after: _RFC3339_date_time_DWG_can_not_be_used_after_

To do this, you must first to ask a user to sign DWG message:

```js
// Client side

import { idOS } from "@idos-network/idos-sdk-js";
import * as Utf8Codec from "@stablelib/utf8";

// Arguments are described on idos-sdk-js's README. Be sure to read it.
const idos = await idOS.init(...);

// This is a placeholder for your signer's address. You could get it from
// some endpoint you expose. But, to keep it simple, we're using a constant.
const ISSUER_SIGNER_ADDRESS = "0xc00ffeec00ffeec00ffeec00ffeec00ffeec00ff";

const { signMessageAsync } = useSignMessage();
const currentTimestamp = Date.now();
const currentDate = new Date(currentTimestamp);
const notUsableAfter = new Date(currentTimestamp + 24 * 60 * 60 * 1000);
const delegatedWriteGrant = {
  owner_wallet_identifier: address as string,
  grantee_wallet_identifier: ISSUER_SIGNER_ADDRESS,
  id: crypto.randomUUID(),
  access_grant_timelock: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),  // Need to cut milliseconds to have 2025-02-11T13:35:57Z datetime format
  not_usable_before: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
  not_usable_after: notUsableAfter.toISOString().replace(/.\d+Z$/g, "Z"),
};

// Get a message to sign
const message: string = await idos.data.requestDWGSignature(delegatedWriteGrant);

// Ask a user to signt the message.
const signature = await signMessageAsync({ message });
```
Be sure you have the DWG message parameters and it's signature kept. You need to use them on server side later.

Now that the user has created a DWG for us, the issuer, we can create a credential for the user and the credential copy to ourselves:

```js
// Server side

import { createCredentialsByDelegatedWriteGrant } from "@idos-network/issuer-sdk-js";
import issuerConfig from "./issuer-config.js";

const publicNotesId = crypto.randomUUID();

const credentialsPublicNotes = {
  // `id` is required to make `editCredential` work.
  id: publicNotesId,
  type: "human",
  level: "human",
  status: "approved",
  // make yourself discoverable by dApps.
  issuer: "MyCoolIssuer",
}

const credentialContent = JSON.stringify({
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
  ],
  id: "uuid:087b9cf0-a968-471d-a4e8-a805a05357ed",
  type: ["VerifiableCredential"],
  issuer: "https://vc-issuers.cool-issuer.id/",
  level: "human",
  credentialSubject: {
    id: "uuid:33ce045b-19f8-4f5a-89d9-4575f66f4d40",
    name: "John Doe",
    email: "johndoe@example.com",
    country: "USA",
  },
  issuanceDate: "2022-06-01T12:00:00Z",
  expirationDate: "2022-06-30T12:00:00Z",
  proof: {
    type: "Ed25519Signature2020",
    created: "2022-06-01T12:00:00Z",
    verificationMethod: "https://vc-issuers.fractal.id/idos/keys/1",
    proofPurpose: "assertionMethod",
    proofValue: "z22DAdBQgJXUh69e4y9a7t7n9f6c7m7b8a6v6w5z4x3y2x1w",
  },
})

const credentialPayload = {
  id: crypto.randomUUID(),

  // user id of the user who is creating the credential.
  user_id: session.user.userId,

  // The verifiable credential content should be passed as it's seen in the example at https://verifiablecredentials.dev/ usually a stringfied JSON object.
  // credential content is encrypted, using the Issuer's secret encryption key, along with the receiver's public encryption key.
  // plaintextContent should be passed as a Uint8Array.
  plaintextContent: Utf8Codec.encode(credentialContent),

  // The public encryption key of the user who is creating the credential. also passed as a Uint8Array.
  recipientEncryptionPublicKey: Utf8Codec.encode(session.user.userEncryptionPublicKey),

   // These notes will be publicly disclosed and accessible without needing to decrypt the credential.
  publicNotes: JSON.stringify(credentialsPublicNotes),
}

// Prepare DWG params and the message signature got from user on previous step
const delegatedWriteGrant = {
  delegatedWriteGrant.owner_wallet_identifier,
  delegatedWriteGrant.grantee_wallet_identifier,
  delegatedWriteGrant.id,
  delegatedWriteGrant.access_grant_timelock,
  delegatedWriteGrant.not_usable_before,
  delegatedWriteGrant.not_usable_after,
  signature,
}

const credential = await createCredentialsByDelegatedWriteGrant(issuerConfig, credentialPayload, delegatedWriteGrant);
```

This will create a credential for user in the idOS and copy for the issuer.


> ⚠️ Notice
>
> The credential content should be passed as is. It will be encrypted for the recipient before being stored on the idOS.


### Using Permissioned Credential Creation
The second method allows the issuer, by virtue of being a Permissioned Issuer, to create a credential without a Write Grant. Get in touch with us at engineering@idos.network if you're interested in being one.

For this method, use the `createCredentialPermissioned` function to write the credential with the necessary encryption.

Example:

```js
// Server side

import { createCredentialPermissioned } from "@idos-network/issuer-sdk-js";
import issuerConfig from "./issuer-config.js";

// See the previous example for more details on these fields
await createCredentialPermissioned(issuerConfig, credentialPayload);
```

## Sharing credentials

The SDK provides issuer to share credentials with other grantees. This function is called `shareCredentialByGrant`.
```js
// Server side
import issuerConfig from "./issuer-config.js";

await shareCredentialByGrant(issuerConfig,{
  ...credentialPayload,
  grantee: "GRANTEE_WALLET_ADDRESS",
  recipientEncryptionPublicKey: new Uint8Array([/* grantee public encryption key (in bytes) */]),
  lockedUntil: Math.floor(Date.now() / 1000) + 1000,
  originalCredentialId: credentialPayload.id,
});
```
## Editing credentials

The `editCredential` function allows issuers to update the public notes associated with a credential in the idOS. This is useful for actions like marking credentials as revoked or updating metadata.

In order for `editCredential` to work, the credential's `public_notes` field needs to be a valid JSON object with an `id` field, and the `public_notes_id` argument needs to have that value.

> ⚠️ Warning
>
> If the new `public_notes` value doesn't have an `id` field, you'll stop being able to edit that credential.

```js
// Server side
import issuerConfig from "./issuer-config.js";
const public_notes_id = crypto.randomUUID();
await editCredential(issuerConfig, {
  public_notes_id: publicNotesId,
  public_notes: JSON.stringify({
    ...credentialsPublicNotes,
    status: "revoked",
  }),
});
```

### Revoking a credential
A previously created credential can be revoked by the issuer by calling the `editCredential` function. When creating a credential, the `publicNotes` field needs to have an `id` field that will be used to identify the credential to be revoked. Pass this `id` to the `editCredential` function to revoke the credential.

```js
// Server side

import { editCredential } from "@idos-network/issuer-sdk-js";
import issuerConfig from "./issuer-config.js";

await editCredential(issuer, {
    publicNotesId: id, // the `id` of the credential to be revoked that is stored in the `publicNotes` field.
    publicNotes: JSON.stringify({
      ...publicNotes,
      status: "revoked" // updating the credential status to revoked
    }),
  });
```


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
