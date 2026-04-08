# Client Guide

## Required reading

- [idOS System Overview](README.md)
- [The idOS Enclave](enclave.md)
- [Encryption](encryption.md)
- [Signatures](signatures.md)

## What the Client SDK is for

`@idos-network/client` is the user-facing SDK. It helps your app:

- connect a user wallet signer to idOS;
- check whether the connected wallet already has an idOS profile;
- allow user to get encryption key from MPC nodes;
- list and filter credentials available to the user;
- decrypt credential content on demand;
- create access grants so users can share credentials with consumers;
- manage user wallets.

## Installation

Install the client package:

```bash
pnpm add @idos-network/client
```

## Quick architecture

Most integrations follow this client state flow:

1. **Configuration**: create a client with node URL and enclave options.
2. **Idle**: runtime is ready, no wallet signer attached yet.
3. **With user signer**: signer attached, user identity known.
4. **Logged in**: profile fetched and enclave configured for the user.

Some methods are only available in specific states. For example, `logIn()` is available after `withUserSigner(...)`, and credential operations are available after `logIn()`.

## 1) Initialize the client

```ts
import { createIDOSClient } from "@idos-network/client";

const idOSClientIdle = await createIDOSClient({
  nodeUrl: "https://nodes.idos.network",
  enclaveOptions: {
    container: "#idos-enclave",
  },
}).createClient();
```

## 2) Attach the user signer

Use your app's wallet integration (for example, ethers) and attach the signer:

```ts
import { ethers } from "ethers";

const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();

const idOSClientWithSigner = await idOSClientIdle.withUserSigner(signer);
```

## 3) Check profile and log in

Once the signer is attached, check if the user has an idOS profile and then log them in:

```ts
const hasProfile = await idOSClientWithSigner.hasProfile();

if (!hasProfile) {
  // Redirect to your onboarding/profile-creation flow.
}

const idOSClientLoggedIn = await idOSClientWithSigner.logIn();
```

After login, `idOSClientLoggedIn.user` contains user metadata from idOS.

## 4) Read and filter credentials

### List all credential headers

```ts
const credentials = await idOSClientLoggedIn.getAllCredentials();
```

This returns list items (metadata/public notes), not decrypted private content.

### Filter credentials by issuer, level, and fields

```ts
const filtered = await idOSClientLoggedIn.filterCredentials({
  acceptedIssuers: [{ authPublicKey: "ISSUER_AUTH_PUBLIC_KEY_HEX" }],
  credentialLevelOrHigherFilter: {
    userLevel: "basic",
    requiredAddons: ["email", "liveness"],
  },
  publicNotesFieldFilters: {
    pick: { type: ["human"] },
    omit: {},
  },
});
```

### Read private content for a specific credential

```ts
const content = await idOSClientLoggedIn.getCredentialContent("CREDENTIAL_ID");
const contentHash = await idOSClientLoggedIn.getCredentialContentSha256Hash("CREDENTIAL_ID");
```

The SDK decrypts through the enclave provider, so plaintext handling stays in the user session context.

## 5) Share a credential (request access grant)

To share a credential with a consumer app/service, create an access grant:

```ts
const grant = await idOSClientLoggedIn.requestAccessGrant("CREDENTIAL_ID", {
  consumerAuthPublicKey: "CONSUMER_AUTH_PUBLIC_KEY_HEX",
  consumerEncryptionPublicKey: "CONSUMER_ENCRYPTION_PUBLIC_KEY_BASE64",
  lockedUntil: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // optional
});
```

`requestAccessGrant(...)` creates a shared credential copy encrypted for the consumer and returns the created grant payload.

## 6) Manage wallets

Add a wallet:

```ts
await idOSClientLoggedIn.addWallet({
  id: crypto.randomUUID(),
  address: "0x...",
  public_key: "0x...",
  message: "Sign this message to prove wallet ownership",
  signature: "0x...",
  wallet_type: "EVM",
});
```

List and remove wallets:

```ts
const wallets = await idOSClientLoggedIn.getWallets();
await idOSClientLoggedIn.removeWallet(wallets[0].id);
```

`wallet_type` must match one of the supported chains (for example `EVM`, `NEAR`, `XRPL`, `STELLAR`).

## Optional: onboarding helper for profile creation

If your product includes profile creation, the client SDK can generate the encryption profile that your backend/issuer flow needs:

```ts
const encryptionProfile = await idOSClientWithSigner.createUserEncryptionProfile("USER_UUID");
```

Then pass `encryptionProfile` and wallet ownership proof to your backend service that performs user creation in idOS.

## Optional: request a delegated write grant signature

If an issuer integration needs user consent for delegated writes, ask the user to sign a DWG message:

```ts
const delegatedWriteGrant = {
  owner_wallet_identifier: await signer.getAddress(),
  grantee_wallet_identifier: "ISSUER_WALLET_IDENTIFIER",
  issuer_public_key: "ISSUER_AUTH_PUBLIC_KEY_HEX",
  id: crypto.randomUUID(),
  access_grant_timelock: new Date().toISOString().replace(/\.\d+Z$/g, "Z"),
  not_usable_before: new Date().toISOString().replace(/\.\d+Z$/g, "Z"),
  not_usable_after: new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .replace(/\.\d+Z$/g, "Z"),
};

const message = await idOSClientLoggedIn.requestDWGMessage(delegatedWriteGrant);
const signature = await signer.signMessage(message);
```

Your backend/issuer service can then submit this grant and signature when writing credentials on behalf of the user.

## Logout

```ts
const idOSClientIdleAgain = await idOSClientLoggedIn.logOut();
```
