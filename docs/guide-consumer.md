# Consumer Guide

## Required reading

* [idOS System Overview](README.md)
* [The Enclave](enclave.md)

## SDK feature overview

The primary features provided by the Consumer SDK are:
* checking if your user has an idOS profile and an adequate credential;
* requesting access to user credentials, with an optional timelock to prevent premature access revocation;
* retrieving and verifying credentials you've been granted access to;
* listing all access grants you've been given by your users;
* implementing a [Passporting-compliant](passporting.md) onboarding flow.

## Getting started: what you'll need

### Compliance guidance

See [idOS Regulatory approach](https://docs.idos.network/compliance/idos-regulatory-approach) for more context, and discuss with your compliance officer:

* which credential Issuers are you open to trusting;
* how long, if at all, you need to retain access to user data;
* whether you’re going to be using [Passporting](passporting.md).

### Signature and encryption keys

> 🛑 DANGER 🛑
>
> Make sure you don't lose access to either secret keys. Otherwise, you won't be able to authenticate or decrypt credential contents. The idOS team won't be able to help you.

You'll need:
  - `recipientEncryptionPrivateKey`: base64-encoded `nacl.BoxKeyPair` secret key. It'll be used to decode the credential copies that the owners (users) share with you by creating access grants.
    - see [Encryption](encryption.md) for more information
  - `consumerSigner`: this can be a NEAR `KeyPair`, or an `ethers.Wallet`. This will be used to sign RPC calls to the idOS nodes.
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

Get our NPM packages
* https://www.npmjs.com/package/@idos-network/client
* https://www.npmjs.com/package/@idos-network/consumer

and their dependencies with pnpm (or your package manager of choice)

```
pnpm add @idos-network/client
pnpm add @idos-network/consumer
```

## Usage

### [ frontend ] Importing and initializing

```js
import { createIDOSClient, type idOSClient } from "@idos-network/client";

const idOSClient = createIDOSClient({
  enclaveOptions: { container: "#idOS-enclave" },
});
```

### [ backend ] Importing and initializing

```typescript
import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";

const idOSConsumer = await idOSConsumerClass.init({
  consumerSigner,
  recipientEncryptionPrivateKey,
});
```

### [ backend ] Signer implementations

To initialize the idOS Consumer SDK, you need to pass in something as a `consumerSigner`. That something needs to conform to an interface that varies between signer types:

#### Ed25519 Signer (Nacl)

```typescript
{
  privateKey: Uint8Array,
  publicKey: Uint8Array,
  sign: (message: Uint8Array) => Uint8Array
}
```

**Implementation with tweetnacl:**
```typescript
import nacl from "tweetnacl";
import { hexDecode } from "@idos-network/core";

// Option 1: Generate a new key pair
const signer = nacl.sign.keyPair();

// Option 2: Use existing secret key
const secretKey = "your_32_byte_secret_key_here";
const signer = nacl.sign.keyPair.fromSecretKey(hexDecode(secretKey));
```

#### XRPL Signer Interface

```typescript
{
  privateKey: string,
  publicKey: string,
  sign: (message: string) => string
}
```

**Implementation with ripple-keypairs:**
```typescript
import * as xrpKeypair from "ripple-keypairs";

// Option 1: Generate from seed
const seed = "sEd7BpLCVJPuJj9S7tfp8igyA54oiZW";
const signer = xrpKeypair.deriveKeypair(seed);

// Option 2: Create from secret key (when you don't have a seed)
const secretKey = "EDAF8E853F43D3A59375239ED5B85AABAAC5E4556C5CE0D5458259668697455C07";
const publicKey = "ED9A5A5420707D80B24C83C0333EBFBB1E8290530DFF45D39B7305B0982CA0D1E8";

const signer = {
  privateKey: secretKey,
  publicKey: publicKey,
  sign: (message: string) => xrpKeypair.sign(message, secretKey)
};
```

> **Important for XRPL Signers**: The `NEXT_PUBLIC_OTHER_CONSUMER_SIGNING_PUBLIC_KEY` environment variable should contain the **XRP address**, not the public key. You can derive the address from the public key using:
>
> ```typescript
> const address = xrpKeypair.deriveAddress(signer.publicKey);
> // Use this address as NEXT_PUBLIC_OTHER_CONSUMER_SIGNING_PUBLIC_KEY
> ```

#### EVM Signer Interface

```typescript
{
  sign: (message: string | Uint8Array) => Promise<string>
}
```

**Implementation with ethers:**
```typescript
import { Wallet } from "ethers";

// Option 1: From private key
const privateKey = "0x..."; // Your private key
const signer = new Wallet(privateKey);

// Option 2: From mnemonic
const mnemonic = "your twelve word mnemonic phrase here";
const signer = Wallet.fromPhrase(mnemonic);
```

### SDK Initialization

After creating your signer, initialize the SDK:

```typescript
import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";

const idOSConsumer = await idOSConsumerClass.init({
  consumerSigner: signer,
  recipientEncryptionPrivateKey: "your_encryption_private_key",
  nodeUrl: "https://nodes.idos.network", // optional
});
```

### Signer Type Detection

The idOS Consumer SDK automatically detects the signer type and handles signature verification appropriately:

- **Nacl signers**: Use Ed25519 signatures
- **XRP signers**: Use ripple-keypairs with Ed25519 (XRPL format)
- **Ethers signers**: Use EIP-191 secp256k1 signatures

### Accessing the Signer

You can access the signer instance from the consumer:

```typescript
const consumer = await idOSConsumerClass.init(config);
const signer = consumer.signer;

// The signer can be used for custom signing operations
if (typeof signer.signer === "function") {
  const message = new TextEncoder().encode("Hello, idOS!");
  const signature = await signer.signer(message);
  console.log("Signature:", signature);
}
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
const hasProfile = await idOSClient.addressHasProfile(address);

if (!hasProfile) window.location = "https://kyc-provider.example.com/enroll";
```

### [ frontend ] Setting signer

Pass your user's signer to the SDK, so it knows where to send signature requests to.

```js
idOSClient = await idOSClient.withUserSigner(signer);
```

### [ frontend ] Checking for existing access grant

```js
const grants: IdosGrant[] = await idOSClient.getAccessGrantsOwned();
grants.filter(g =>
  g.ag_grantee_wallet_identifier === consumerSigner.address,
);
```


### [ backend ] Checking for existing access grant

You can double check that the existing access grant matches your requirements. You will do this on your backend.

```js
const grants: IdosGrant[] = await idOSConsumer.getGrants({
  user_id, // idOS user.id, but be sure, that this value is securely passed to your code
});
```

Access Grants queries are paginated by default, but you can modify pagination settings by:

```js
const grants: idOSGrant[] = await idOSClient.getGrants({
  page: 1,
  size: 7,
});
```

And you can get the credentials contents from the grant via:

```typescript
const credentialContents: string = await idOSConsumer.getSharedCredentialContentDecrypted('GRANT_DATA_ID')
```

If you don't have an access grant, you can proceed to filtering the user's credentials and requesting one or more access grants.


### [ frontend ] Filtering credentials

Credential filtering is done by calling the method `filterCredentials` from the `idOSClient` and passing the filtering requirements:
```typescript
const filteredCredentials: idOSCredential[] = await idOSClient.filterCredentials({
    acceptedIssuers: [{
      authPublicKey, // the accepted issuer auth public key to filter credentials by
    }],
    // OPTIONAL. A list of public notes fields of a credential that should be picked or omitted.
    publicNotesFieldFilters: {
      pick: {},
      omit: {},
    },
    // OPTIONAL. A list of private fields of a credential that should be picked or omitted.
    privateFieldFilters: {
      pick: {},
      omit: {},
    },
});
```
This will return a list of `idOSCredentials` that match the filtering criteria.

### [ frontend ] Requesting access grant


The simplest way to do this is to ask the user to create and insert an access grant for you.

```typescript
const accessGrant: idOSGrant = await idOSClient.requestAccessGrant('CREDENTIAL_ID')
```

Alternatively, you can ask for a delegated access grant, which the user creates:

```js
await idOSClient.requestDAGMessage({
  dag_owner_wallet_identifier, // This is the user
  dag_grantee_wallet_identifier, // This is you, the consumer
  dag_data_id,
  dag_locked_until, // Unix timestamp. According to your compliance officer's instructions.
});
```

and you then insert after sending it to your backend:

```js
await idOSConsumer.createAccessGrantByDag({
  dag_data_id,
  dag_owner_wallet_identifier,
  dag_grantee_wallet_identifier,
  dag_signature,
  dag_locked_until,
});
```

#### Using passporting

* TODO: missing code examples for [passporting](passporting.md):
    * ask for credential duplicate (C1.2) separately and before asking for AG
    * get hash from C1.2 and use it on dAG request
    * send dAG to own backend, which proxy sends to OE1's passporting server

### [ backend ] Retrieving and verifying credential

```typescript
const credentialContents: string = await idOSConsumer.getSharedCredentialContentDecrypted('GRANT_DATA_ID')
```

If you're using passporting:
```typescript
const credentialContents: string = await idOSConsumer.getReusableCredentialCompliantly('GRANT_DATA_ID')
```

## Verify credentials signature

It's strongly recommended to verify signature, before you use credentials! If you need a helper to verify that the W3C VC is something you want to trust, here's an example:

```js
const allowedIssuers = [
  {
    issuer: "https://kyc-provider.example.com/idos",
    publicKeyMultibase: "z6MkfjxfHddp5Pf1GGUSJQ3m6PEycX2DFTVFruUMZsHPXoJx",
  },
];

const [verificationResult] = await idOSConsumer.verifyCredentials(credentials, allowedIssuers);

console.log("Result: ", verificationResult);
```
