# Consumer Guide

## Required reading

* [idOS System Overview](README.md)
* [The Enclave](enclave.md)

## SDK feature overview

The primary affordances granted by the Consumer SDK are:
* checking if your user has an idOS profile and an adequate credential;
* requesting access to user credentials, with an optional timelock to prevent premature access revocation;
* retrieving and verifying credentials you've been granted access to;
* listing all access grants you've been given by your users;
* implementing a [Passporting-compliant](passporting.md) onboarding flow.

## Getting started: what you'll need

### Compliance guidance

See [idOS Regulatory approach](https://docs.idos.network/compliance/idos-regulatory-approach) for more context, and discuss with your compliance officer:

* which credential Issuers are you open to trusting;
* whether you’re going to be using [Passporting](passporting.md).

### Signature and encryption keys

> 🛑 DANGER 🛑
>
> Make sure you don't lose access to either secret keys. Otherwise, you won't be able to authenticate or decrypt credential contents. The idOS team won't be able to help you.

You'll need:
  - `recipientEncryptionPrivateKey`: base64-encoded `nacl.BoxKeyPair` secret key. It'll be used to decode the credential copies that the owners (users) share with you by creating access grants.
    - see [Encryption](encryption.md) for more information
  - `consumerSigner`: this can be a NEAR `KeyPair`, a `nacl.SignKeyPair`, or an `ethers.Wallet`. This will be used to sign RPC calls to the idOS nodes.
    - see [Signatures](signatures.md) for more information

### A frontend

Your frontend (web or native app), as your user’s touch point, is where you’ll:

- confirm that the user is in idOS;
- find whether the user has an adequate credential;
- request an access grant to user credentials.

### A backend

Your backend (private server) is where you’ll:

- retrieve user credentials you’ve been granted access to;
- list the access grants you’ve been granted.

### Our Consumer SDK

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk) and its dependencies with pnpm (or your package manager of choice):

```
pnpm add @idos-network/consumer-sdk-js
```

## Usage

### [ frontend ] Importing and initializing

* 💔💔💔 missing enclave init

```js
import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";

const consumer = await idOSConsumerClass.init({
  nodeUrl: NODE_URL,
  consumerSigner: nacl.sign.keyPair.fromSecretKey(hexDecode(OTHER_CONSUMER_SIGNING_SECRET_KEY)),
  recipientEncryptionPrivateKey: OTHER_CONSUMER_ENCRYPTION_SECRET_KEY,
});
```

### [ backend ] Importing and initializing

```typescript
import { idOS } from "@idos-network/consumer-sdk-js/server";
import nacl from "tweetnacl";

/**
 * Initializes the idOS SDK with the provided options.
 *
 * @async
 * @function init
 * @param {Object} options - Configuration options for initializing the SDK.
 * @param {string} options.recipientEncryptionPrivateKey - The recipient's encryption private key.
 * @param {KeyPair | SignKeyPair | ethers.Wallet} options.granteeSigner - The grantee's wallet or key pair for signing transactions.
 * @param {string} [options.nodeUrl="https://nodes.idos.network"] - The URL of the idOS node.
 * @param {string} [options.chainId] - The chain ID for the network (optional).
 * @returns {Promise<idOSGrantee>} - A promise that resolves to an instance of the idOS SDK.
 */

export const idos = await idOS.init({
  nodeUrl: process.env.IDOS_NODE_URL,
  recipientEncryptionPrivateKey: process.env.CONSUMER_ENCRYPTION_SECRET_KEY,
  // TODO require less crap from the user. This is way too much functions.
  consumerSigner: nacl.sign.keyPair.fromSecretKey(base64Decode(process.env.CONSUMER_SIGNING_SECRET_KEY))
});
```

### [ frontend ] Connecting your user's wallet

Connect your user's wallet however you do it today, for example:

```js
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();
```

### [ frontend ] Checking if you user has an idOS profile

Get your user's address from the signer above and confirm they have an idOS profile. If not, redirect them to your Issuer. If you have an IDV integration, you can yourself be the issuer. See the [Issuer Guide](issuer.md) for more information.

```js
const address = await signer.getAddress();
const hasProfile = await idos.hasProfile(address);
if (!hasProfile) window.location = "https://kyc-provider.example.com/enroll";
```

### [ frontend ] Setting signer

Pass your user’s signer to the SDK, so it knows where to send signature requests to.

```js
await idos.setSigner("EVM", signer);
```

### [ frontend ] Checking for existing access grant

* 💔💔💔 missing filtering by owner

```typescript
const grants: IdosCredentials[] = await idos.getGrants({
  page: 1,
  size: 7,
})
```

Optionally, you can double check that the existing access grant matches your requirements. You do this on your backend.

```typescript
const credentialContents: string = await idos.getSharedCredentialContentDecrypted('GRANT_DATA_ID')
```

If you don’t have an access grant, you can proceed to filtering the user’s credentials and requesting one or more access grants.


### [ frontend ] Filtering credentials

* 💔💔💔 missing filtering by issuer

```js
const entries = await idos.enclave.filterCredentials(credentials, {
  pick: {
    "credentialSubject.identification_document_country": "DE",
  },
  omit: {
    "credentialSubject.identification_document_type": "passport",
  },
});
```

### [ frontend ] Requesting access grant

* 💔💔💔 missing code (regular; delegated; timelocks)
* 💔💔💔 missing passporting tricks


### [ backend ] retrieving and verifying credential

* 💔💔💔 missing passporting tricks

```typescript
const credentialContents: string = await idos.getSharedCredentialContentDecrypted('GRANT_DATA_ID')

const valid = await verifiableCredentials.verify(credentialContents, {
  allowedIssuers: [verifiableCredentials.PLAYGROUND_FRACTAL_ISSUER],
})
```
