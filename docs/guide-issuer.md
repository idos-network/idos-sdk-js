# Issuer Guide

## Required reading

* [idOS System Overview](README.md)
* [The idOS Enclave](enclave.md)

## SDK feature overview

The primary affordances granted by the Issuer SDK are:
* checking if your user has an idOS profile, and create one otherwise;
* transforming IDV results into idOS credentials;
* implementing a [Passporting-compliant](passporting.md) onboarding flow.

## Getting started: what you'll need

### Compliance guidance

See [idOS Regulatory approach](https://docs.idos.network/compliance/idos-regulatory-approach) for more context, and discuss with your compliance officer:

* whether you’re going to be using [Passporting](passporting.md).

### Signature and encryption keys

> 🛑 DANGER 🛑
>
> Make sure you don't lose access to either secret keys. Otherwise, you won't be able to authenticate or decrypt credential contents. The idOS team won't be able to help you.

You'll need:
  - `encryptionSecretKey`: base64-encoded `nacl.BoxKeyPair` secret key. It'll be used to encrypt the credentials you issue to your users
    - see [Encryption](encryption.md) for more information
  - `signingKeyPair`: this can be a NEAR `KeyPair`, a `nacl.SignKeyPair`, or an `ethers.Wallet`. This will be used to sign RPC calls to the idOS nodes.
    - see [Signatures](signatures.md) for more information

### A frontend

Your frontend (web or native app), as your user’s touch point, is where you’ll:

- confirm that the user is in idOS;
- find whether the user already has your credential;
- otherwise, request write grant and take user through IDV.

### A backend

Your backend (private server) is where you’ll:

- create user profiles in idOS;
- write credentials to idOS;
- revoking previously issued credentials.

### Our Issuer SDK

Get [our NPM package](https://www.npmjs.com/package/@idos-network/issuer-sdk-js) and its dependencies with pnpm (or your package manager of choice):

```
pnpm add @idos-network/issuer-sdk-js
```

## Usage

### [ frontend ] Importing and initializing

* 💔💔💔 missing code
* 💔💔💔 missing enclave init (is the assumption that issuers should use the consumer SDK?)

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

### [ backend ] Importing and initializing

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

### [ frontend ] Connecting your user's wallet

Connect your user's wallet however you do it today, for example:

```js
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();
```

### [ frontend + backend ] Ensuring your user has an idOS profile

Get your user's address from the signer above and confirm they have an idOS profile. If not, redirect them to your Issuer. If you have an IDV integration, you can yourself be the issuer. See the [Issuer Guide](issuer.md) for more information.

```js
const address = await signer.getAddress();
const hasProfile = await idos.hasProfile(address);
```

If they don't have a profile, you must create one for them. This procedure can only be done by a Permissioned Issuer. Get in touch with us at engineering@idos.network if you're interested in being one.

To create a user profile in idOS, you need:
1. **A wallet address** associated with the user.
2. **A public encryption key** derived from either a password or a passkey chosen by the user in the idOS enclave app.

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

### [ frontend ] Setting signer

Pass your user’s signer to the SDK, so it knows where to send signature requests to.

```js
await idos.setSigner("EVM", signer);
```

### [ frontend ] Checking for issued credential

```typescript
const grants: IdosCredentials[] = await idos.getGrants({
  page: 1,
  size: 7,
})
```

If the user doesn’t already have your credential, you can proceed to requesting a write grant so you can issue and write it.

### [ frontend ] Requesting write grant

In order to write a credential to idOS, the issuer needs to obtain permission from the user. This can be done using a Delegated Write Grant (DWG).

A Delegated Write Grant (DWG) is a permission given by the user that allows a specific issuer to create a credential and it's copy for the issuer itself on the user's behalf. This is particularly relevant to not require the user to come back to your website if you want to add data to their profile. A DWG is a ERC-191 message that the user signs. The message contains fields:

```
* operation: delegatedWriteGrant
* owner: user_wallet_identifier
* consumer: grantee_wallet_identifier
* issuer public key: ed25519_public_key_hex_encoded
* id: _DWG_identifier
* access grant timelock: RFC3339_date_time_till_access_grant_will_be_locked
* not usable before: RFC3339_date_time_DWG_can_not_be_used_before
* not usable after: RFC3339_date_time_DWG_can_not_be_used_after
```

To do this, you must first to ask a user to sign DWG message:

```js
// This is a placeholder for your signer's address. You could get it from
// some endpoint you expose. But, to keep it simple, we're using a constant.
const CONSUMER_WALLET_IDENTIFIER = "0xc00ffeec00ffeec00ffeec00ffeec00ffeec00ff";
const ISSUER_SIGNER_PUBLIC_KEY = "6d28cf8e17e4682fbe6285e72b21aa26f094d8dbd18f7828358f822b428d069f"; // ed25519 public key

const currentTimestamp = Date.now();
const currentDate = new Date(currentTimestamp);
const notUsableAfter = new Date(currentTimestamp + 24 * 60 * 60 * 1000);
const delegatedWriteGrant = {
  owner_wallet_identifier: await signer.getAddress(),
  grantee_wallet_identifier: CONSUMER_WALLET_IDENTIFIER,
  issuer_public_key: ISSUER_SIGNER_PUBLIC_KEY,
  id: crypto.randomUUID(),
  access_grant_timelock: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),  // Need to cut milliseconds to have 2025-02-11T13:35:57Z datetime format
  not_usable_before: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
  not_usable_after: notUsableAfter.toISOString().replace(/.\d+Z$/g, "Z"),
};

// Get a message to sign
const message: string = await idos.data.requestDWGMessage(delegatedWriteGrant);

// Ask a user to sign the message.
const signature = await signer.signMessage(message);
```

Be sure you have the DWG message parameters and it's signature kept. You need to use them on server side later.

### [ backend ] Issuing and writing credentials

* 💔💔💔 missing passporting tricks

To issue a credential, one option is to build credentials (and sign) manually:

```js
const credentialContent = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
  ],
  id: "https://vc-issuers.cool-issuer.id/credentials/33ce045b-19f8-4f5a-89d9-4575f66f4d40",
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
};
```

Secondly you can use a credentials-builder, which help you to create a proper VerifiableCredentials object:

```js
import { buildCredentials } from "@idos-network/issuer-sdk-js/server";

const id = "z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3";
const issuer = "https://vc-issuers.cool.id/idos";

const credentialFields = {
  id: `${issuerName}/credentials/${id}`,
  level: "human",
  issued: new Date(),
  approvedAt: new Date(),
}

const credentialSubject = {
  id: `uuid:${id}`,
  firstName: "John",
  familyName: "Doe",
  dateOfBirth: new Date(),
  placeOfBirth: "New York",
  idDocumentCountry: "US",
  idDocumentNumber: "293902002",
  idDocumentType: "ID",
  idDocumentDateOfIssue: new Date(),
  idDocumentDateOfExpiry: new Date(),
  idDocumentFrontFile: Buffer.from("SOME_IMAGE"),
  selfieFile: Buffer.from("SOME_IMAGE"),
  residentialAddress: {
    street: "Main St",
    houseNumber: "123",
    additionalAddressInfo: "Apt 1",
    city: "New York",
    postalCode: "10001",
    country: "US",
  },
  residentialAddressProofFile: Buffer.from("SOME_IMAGE"),
  residentialAddressProofCategory: "UTILITY_BILL",
  residentialAddressProofDateOfIssue: new Date(),
}

const issuer = {
  id: `${issuer}/keys/1`,
  controller: `${issuer}/issuer/1`,
  publicKeyMultibase: "PUBLIC_MULTIBASE_KEY",
  privateKeyMultibase: "PRIVATE_KEY_MULTIBASE",
}

const credentialSubject = await buildCredentials(
  credentialFields,
  credentialSubject,
  issuer,
);
```

To write the credential you issued in the idOS, you'll make use of the write grant acquired above.

```js
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

const credentialContent = JSON.stringify("Content from previous section");

const credentialPayload = {
  id: crypto.randomUUID(),

  // user id of the user who is creating the credential.
  user_id: session.user.userId,

  // The verifiable credential content should be passed as it's seen in the example at https://verifiablecredentials.dev/ usually a stringified JSON object.
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
  delegatedWriteGrant.issuer_public_key,
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

### [ backend ] Revoking and editing credentials

The `editCredential` function allows issuers to update the public notes associated with a credential in the idOS. This is useful for actions like marking credentials as revoked or updating metadata.

In order for `editCredential` to work, the credential's `public_notes` field needs to be a valid JSON object with an `id` field, and the `public_notes_id` argument needs to have that value.

> ⚠️ Warning
>
> If the new `public_notes` value doesn't have an `id` field, you'll stop being able to edit that credential.

```js
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

A previously created credential can be revoked by the issuer by calling the `editCredential` function. When creating a credential, the `publicNotes` field needs to have an `id` field that will be used to identify the credential to be revoked. Pass this `id` to the `editCredential` function to revoke the credential.

```js
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
