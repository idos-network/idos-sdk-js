# Issuer Guide

## Required reading

* [idOS System Overview](README.md)
* [The idOS Enclave](enclave.md)

## SDK feature overview

The primary features provided by the Issuer SDK are:
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

You'll also need a `multibaseSigningKeyPair`, which will be used to sign the W3C VCs you issue. If you're unfamiliar with how to generate one, you can use the following example:

```js
import { Ed25519VerificationKey2020 } from "https://esm.sh/@digitalcredentials/ed25519-verification-key-2020";

const key = await Ed25519VerificationKey2020.generate();
console.log(key.privateKeyMultibase);  // -> z...  (multibase, multicodec-prefixed)
console.log(key.publicKeyMultibase);
```

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

Get our NPM packages
* https://www.npmjs.com/package/@idos-network/client
* https://www.npmjs.com/package/@idos-network/issuer

and their dependencies with pnpm (or your package manager of choice)

```
pnpm add @idos-network/client
pnpm add @idos-network/issuer
```

## Usage

### [ frontend ] Importing and initializing

```js
import { createIDOSClient, type idOSClient } from "@idos-network/client";

const idOSClient = createIDOSClient({
  enclaveOptions: {
    container: "#idOS-enclave",
  },
});
```

### [ backend ] Importing and initializing

```js
import { idOSIssuer as idOSIssuerClass } from "@idos-network/issuer";

const idOSIssuer = await idOSIssuerClass.init({
  nodeUrl: KWIL_NODE_URL,
  signingKeyPair: nacl.sign.keyPair.fromSecretKey(decode(ISSUER_SIGNING_SECRET_KEY)),
  encryptionSecretKey: decode(ISSUER_ENCRYPTION_SECRET_KEY),
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

Get your user's address from the signer above and confirm they have an idOS profile. If not, redirect them to your onboarding journey.

```js
const address = await signer.getAddress();
const hasProfile = await idOSClient.addressHasProfile(address);

if (!hasProfile) window.location = "https://kyc-provider.example.com/enroll";
```

#### Creating a profile

If they don't have a profile, you must create one for them. This procedure can only be done by a Permissioned Issuer. If you're interested in being one: securely generate an `ed25516` signing key, grab its public key in hex, and get in touch with us at engineering@idos.network.

To create a user profile in idOS, you need:
1. **A wallet address** associated with the user.
2. **A public encryption key** derived from either a password chosen by the user in the idOS enclave app.

##### Step 1: Deciding on a user id

Deciding on a user id for a user is an issuer decision. You can use whichever you want, as long as it's an [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).

```js
// backend

const userId = crypto.randomUUID();

// Remember it on your database
// e.g. session.user.update({ userId });

// Return it to the front-end to be used in the next step
return { userId }
```

##### Step 2: Getting the user's signing and encryption public keys

Use the `idOSClient.createUserEncryptionProfile` function to derive a public key for the user. This key will be used to encrypt and decrypt user's credential content.

```javascript
// frontend

const encryptionProfile = await idOSClient.createUserEncryptionProfile(userId);

const ownershipProofMessage = "Please sign this message to confirm you own this wallet address";

const ownershipProofSignature = await ethereum.request({
  method: "personal_sign",
  params: [ownershipProofMessage, address],
});

// Report it back to your server
// e.g. await yourServer.report(encryptionProfile, ownershipProofSignature);
```

##### Step 3: Creating a User Profile
Once the public key is derived, you can create the user profile in idOS by passing it to the `createUser` function alongside with user id and the wallet the user's going to use to drive their idOS profile.

```javascript
// backend

const user = {
  id: userId,
  recipient_encryption_public_key: encryptionProfile.userEncryptionPublicKey,
  encryption_password_store: encryptionProfile.encryptionPasswordStore,
};

const wallet = {
  address,
  wallet_type: "EVM", // Options: "EVM", "NEAR", "XRPL", "STELLAR"
  message: ownershipProofMessage,
  signature: ownershipProofSignature,
  public_key: ethers.SigningKey.recoverPublicKey(
    ethers.id(ownershipProofMessage)
    ownershipProofSignature,
  ),
};

await idOSIssuer.createUser(user, wallet);
```

### [ frontend ] Setting signer

Pass your user’s signer to the SDK, so it knows where to send signature requests to.

```js
idOSClient = await idOSClient.withUserSigner(signer);
```

### [ frontend ] Checking for issued credential

```typescript
const credentials: IdosCredential[] = await idOSClient.getAllCredentials();

credentials.filter(c =>
  c.issuer_auth_public_key === signingKeyPair.publicKey
  && JSON.parse(c.public_notes).type === "super-kyc"
);
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
const currentTimestamp = Date.now();
const currentDate = new Date(currentTimestamp);
const notUsableAfter = new Date(currentTimestamp + 24 * 60 * 60 * 1000);
const delegatedWriteGrant = {
  owner_wallet_identifier: await signer.getAddress(),
  grantee_wallet_identifier: signingKeyPair.address,
  issuer_public_key: signingKeyPair.publicKey,
  id: crypto.randomUUID(),
  access_grant_timelock: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),  // Need to cut milliseconds to have 2025-02-11T13:35:57Z datetime format
  not_usable_before: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
  not_usable_after: notUsableAfter.toISOString().replace(/.\d+Z$/g, "Z"),
};

const message: string = await idOSClient.requestDWGMessage(delegatedWriteGrant);

const signature = await signer.signMessage(message);
```

Be sure you have the DWG message parameters and its signature kept. You need to use them on server side later.

### [ backend ] Issuing and writing credentials

To issue a credential, you can use our W3C Verifiable Credentials helpers:

```js
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
  idDocumentType: "PASSPORT",
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
  controller: `${issuer}/issuers/1`,
  publicKeyMultibase: multibaseSigningKeyPair.publicKey,
  privateKeyMultibase: multibaseSigningKeyPair.privateKey,
}

const credential = await idOSIssuer.buildCredential(
  credentialFields,
  credentialSubject,
  issuer,
  true, // If you want to validate against schema
);
```

To write the credential you issued, you'll make use of the write grant acquired above.

```js
const publicNotesId = crypto.randomUUID();

const credentialsPublicNotes = {
  // `id` is required to make `editCredential` work.
  id: publicNotesId,
  type: "human",
  level: "human",
  status: "approved",
  issuer: "MyIssuer",
}

const credentialContent = JSON.stringify(credential);

const credentialPayload = {
  id: crypto.randomUUID(),
  user_id: userId,
  plaintextContent: Utf8Codec.encode(credentialContent),
  recipientEncryptionPublicKey: Utf8Codec.encode(userEncryptionPublicKey),
  publicNotes: JSON.stringify(credentialsPublicNotes),
}

await idOSIssuer.createCredentialsByDelegatedWriteGrant(
  credentialPayload,
  {
    id: delegatedWriteGrant.id,
    ownerWalletIdentifier: delegatedWriteGrant.owner_wallet_identifier,
    consumerWalletIdentifier: delegatedWriteGrant.grantee_wallet_identifier,
    issuerPublicKey: delegatedWriteGrant.issuer_public_key,
    accessGrantTimelock: delegatedWriteGrant.access_grant_timelock,
    notUsableBefore: delegatedWriteGrant.not_usable_before,
    notUsableAfter: delegatedWriteGrant.not_usable_after,
    signature,
 },
);
```

This will create a credential for the user in the idOS and a copy for you.

### [ backend ] Revoking and editing credentials

The `editCredential` function allows issuers to update the public notes associated with a credential in the idOS. This is useful for actions like marking credentials as revoked or updating metadata.

In order for `editCredential` to work, the credential's `public_notes` field needs to be a valid JSON object with an `id` field, and the `public_notes_id` argument needs to have that value.

> ⚠️ Warning
>
> If the new `public_notes` value doesn't have an `id` field, you'll stop being able to edit that credential.

```js
await idOSIssuer.editCredentialAsIssuer(
  publicNotes.id,
  JSON.stringify({
    ...credentialsPublicNotes,
    status: "revoked",
  }),
);
```
