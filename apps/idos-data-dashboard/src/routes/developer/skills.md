---
# Specify the following for Cursor rules
description: Guidelines for integrating idOS into an existing project
alwaysApply: false
---

# idOS Integration Assistant

**Role:** You are a precise, changeset-oriented code integration assistant. Use this manual to integrate idOS into an existing app with minimal disruption. Work in small, reviewable steps, explain each change briefly, and preserve the app's current wallet, auth, routing, and state-management choices.

This rule covers the idOS frontend **Client SDK** and backend **Consumer SDK** flow:

- Frontend: initialize the idOS client, connect the existing user wallet, check profile/credentials, and request user access grants.
- Backend: create KYC links, initialize the idOS consumer, list grants, retrieve shared credential contents, and verify credentials.

## Ground Rules

- Never introduce wallet libraries or frameworks on your own.
- Do **not** remove existing wallet libraries or frameworks automatically.
- Keep TypeScript **ESM** compatible, and avoid CommonJS requires.
- Favor additive, reversible edits; do not remove user logic.
- Keep private idOS keys and relay secrets on the backend only.
- Do not invent credential issuers, verification policy, retention policy, or KYC level. Use placeholders when the app does not already define them.
- Adapt all examples to the framework in the target project. Do not force Express, React, Next.js, Remix, or another stack if the app already uses something else.
- Prefer typed helpers and existing API/client patterns over one-off fetch calls.

---

## 0) Detect Context & Plan

1. Identify:
   - Package manager: npm, pnpm, yarn, bun, or workspace tooling.
   - Frontend framework and routing style.
   - Backend framework and route/middleware style.
   - Whether frontend and backend live in the same package, separate packages, or a monorepo workspace.
   - Environment/configuration storage: `.env`, framework env files, deployment config, secrets manager, typed config module, etc.
   - Existing wallet connection code and signer/address access.
   - Existing authenticated user/session model.
   - Existing API client pattern from frontend to backend.
   - Existing KYC, onboarding, compliance, credential, or profile flows.
   - Existing lint, typecheck, and test commands.

2. Before editing, produce a short implementation plan:
   - Files to add or change.
   - Frontend flow changes.
   - Backend/API changes.
   - Required env variables.
   - Verification commands.

3. If wallet or auth context is unclear:
   - Ask only the minimum necessary question, or
   - Use placeholders that keep the code compiling and clearly mark where app-specific values must be supplied.

---

## 1) Dependencies

- Install the SDK packages in the package that owns each runtime:
  - Frontend/client runtime: `@idos-network/client`
  - Backend/server runtime: `@idos-network/consumer`
  - KYC relay JWT signing: `jsonwebtoken`

- Add signer helper dependencies only when needed by the chosen backend signer type:
  - Ed25519/Nacl signer: `tweetnacl` and, when not already available, `@idos-network/utils`
  - EVM signer: use the app's existing `ethers` installation if present; do not add it unless the project already uses EVM wallets or the user asks.
  - Stellar signer: `@stellar/stellar-sdk`
  - XRPL signer: `ripple-keypairs`

> Produce installation commands based on the repo's package manager.

Examples:

```sh
pnpm add @idos-network/client
pnpm add @idos-network/consumer jsonwebtoken
pnpm add -D @types/jsonwebtoken
```

For a workspace, scope the install to the correct package. Example:

```sh
pnpm --filter <frontend-package> add @idos-network/client
pnpm --filter <backend-package> add @idos-network/consumer jsonwebtoken
pnpm --filter <backend-package> add -D @types/jsonwebtoken
```

---

## 2) Configuration

- Add public frontend configuration through the app's existing public-env mechanism:
  - `IDOS_NETWORK_URL=https://nodes.playground.idos.network`
  - Optional app/framework alias if needed, for example `VITE_IDOS_NETWORK_URL`, `NEXT_PUBLIC_IDOS_NETWORK_URL`, or `PUBLIC_IDOS_NETWORK_URL`.

- Add private backend configuration through the app's existing server-only secret mechanism:
  - `IDOS_NETWORK_URL=https://nodes.playground.idos.network`
  - `IDOS_RELAY_URL=https://verify.staging.sandbox.fractal.id`
  - `IDOS_RELAY_PRIVATE_KEY="REPLACE_WITH_RELAY_PRIVATE_KEY"`
  - `IDOS_CONSUMER_AUTH_KEY="REPLACE_WITH_CONSUMER_SIGNING_PRIVATE_KEY"`
  - `IDOS_CONSUMER_ENC_KEY="REPLACE_WITH_CONSUMER_ENCRYPTION_PRIVATE_KEY"`
  - `IDOS_ACCEPTED_ISSUER_PUBLIC_KEY="REPLACE_WITH_ACCEPTED_ISSUER_PUBLIC_KEY"`
  - `IDOS_ACCEPTED_ISSUER_ID="REPLACE_WITH_ACCEPTED_ISSUER_ID_OR_URL"`
  - `IDOS_CONSUMER_PUBLIC_IDENTIFIER="REPLACE_WITH_CONSUMER_WALLET_IDENTIFIER"`

- Treat key formats carefully:
  - `IDOS_RELAY_PRIVATE_KEY` is used only to sign relay JWTs for KYC.
  - `IDOS_CONSUMER_AUTH_KEY` is the backend consumer signing private key. For an Ed25519/Nacl signer, this is usually a hex-encoded secret key.
  - `IDOS_CONSUMER_ENC_KEY` is the backend recipient encryption private key, usually the base64-encoded `nacl.BoxKeyPair.secretKey` expected by the Consumer SDK.
  - `IDOS_CONSUMER_PUBLIC_IDENTIFIER` must match how idOS identifies the consumer/grantee for grants. For EVM this is typically the wallet address. For XRPL, use the XRP address, not the raw public key.

- Never expose backend values in frontend bundles, logs, public runtime config, analytics, or error responses.

---

## 3) Frontend idOS Client Setup

- Find the app's highest reasonable client-side boundary for SDK initialization:
  - React provider/hook, route component, service module, or state machine.
  - Avoid initializing repeatedly on every render.
  - Make sure the enclave container exists in the DOM.

- Initialize the client:

```ts
import { createIDOSClient, type idOSClient } from "@idos-network/client";

const idosClient: idOSClient = createIDOSClient({
  nodeUrl: publicConfig.IDOS_NETWORK_URL,
  enclaveOptions: { container: "#idOS-enclave" },
});
```

- Add the enclave container in the relevant frontend layout/page:

```tsx
<div id="idOS-enclave" />
```

- Reuse the app's existing wallet connection. Do not replace it. Once the app has a signer/address, pass the signer to idOS:

```ts
const idosWithUser = await idosClient.withUserSigner(existingWalletSigner);
```

- If the app only exposes an address and not a signer, find the existing signer/provider abstraction. idOS needs a user signer so the user can authorize idOS operations.

---

## 4) Frontend Profile, Credential, and Grant Flow

- After the user connects a wallet, check whether the wallet has an idOS profile:

```ts
const address = await existingWalletSigner.getAddress();
const hasProfile = await idosClient.addressHasProfile(address);
```

- If no profile exists:
  - Send the user through the app's KYC flow if this integration adds one.
  - Otherwise link to the configured issuer/onboarding route.
  - Do not silently fail or continue to grant requests without a profile.

- Filter for acceptable credentials before requesting access:

```ts
const credentials = await idosWithUser.filterCredentials({
  acceptedIssuers: [
    {
      authPublicKey: publicConfig.IDOS_ACCEPTED_ISSUER_PUBLIC_KEY,
    },
  ],
  publicNotesFieldFilters: {
    pick: {},
    omit: {},
  },
  privateFieldFilters: {
    pick: {},
    omit: {},
  },
});
```

- Check whether the user has already granted this consumer access:

```ts
const grants = await idosWithUser.getAccessGrantsOwned();
const existingGrant = grants.find(
  (grant) =>
    grant.ag_grantee_wallet_identifier ===
    publicConfig.IDOS_CONSUMER_PUBLIC_IDENTIFIER,
);
```

- If no suitable grant exists, request one for the selected credential:

```ts
const accessGrant = await idosWithUser.requestAccessGrant(selectedCredential.id);
```

- If the app needs delegated access grants, request a DAG message on the frontend and send it to the backend for insertion:

```ts
const dag = await idosWithUser.requestDAGMessage({
  dag_owner_wallet_identifier: userWalletIdentifier,
  dag_grantee_wallet_identifier: publicConfig.IDOS_CONSUMER_PUBLIC_IDENTIFIER,
  dag_data_id: selectedCredential.id,
  dag_locked_until: lockedUntilUnixTimestamp,
});
```

- Store only non-sensitive grant metadata on the frontend. Retrieve credential contents on the backend.

---

## 5) Backend KYC Relay Endpoint

- Add an authenticated backend endpoint that returns a KYC relay link.
- Use the app's existing auth middleware/session. The endpoint must know:
  - Current app user ID.
  - Current wallet address.
  - Relay client ID, if the app stores one.
  - Desired KYC level.

- Adapt this Express-style example to the app's framework:

```ts
import jwt from "jsonwebtoken";

app.get("/kyc", requireAuth, (req, res) => {
  const user = req.user;

  const token = jwt.sign(
    {
      clientId: user.relayClientId,
      level: "plus+liveness+idos",
      walletAddress: user.walletAddress,
      externalUserId: user.id,
      kyc: true,
    },
    process.env.IDOS_RELAY_PRIVATE_KEY!,
    { algorithm: "ES512", expiresIn: "1h" },
  );

  res.json({
    link: `${process.env.IDOS_RELAY_URL}/kyc?token=${encodeURIComponent(token)}`,
  });
});
```

- Validate that the route uses `IDOS_RELAY_URL` for the iframe URL, not the private key.
- Do not log the JWT or private key.
- Do not accept `externalUserId`, `walletAddress`, or KYC level blindly from the client when the server already has authenticated values.

---

## 6) Frontend KYC Iframe Flow

- Add a button/action that calls the backend KYC endpoint and opens the returned link in an iframe.

```tsx
{kycLink ? (
  <iframe
    src={kycLink}
    allow="camera fullscreen *"
    sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
  />
) : null}
```

- Add a message receiver for iframe events. Derive the allowed origin from the configured relay URL.

```ts
const relayOrigin = new URL(publicConfig.IDOS_RELAY_URL).origin;

const messageReceiver = useCallback(
  (message: MessageEvent) => {
    if (message.origin !== relayOrigin) return;

    if (message.data?.error) {
      setMessage(`KYC process failed with: ${JSON.stringify(message.data.error)}`);
      setKycLink(null);
      return;
    }

    if (message.data?.open) {
      window.open(message.data.open, message.data.target, message.data.features);
      return;
    }

    setMessage("KYC process is completed.");
    setKycLink(null);
  },
  [relayOrigin],
);

useEffect(() => {
  window.addEventListener("message", messageReceiver);
  return () => window.removeEventListener("message", messageReceiver);
}, [messageReceiver]);
```

- After KYC completion, refresh the profile/credential/grant state.

---

## 7) Backend Consumer SDK Setup

- Create a backend-only idOS consumer module/service.
- Initialize once per process when the framework supports it; otherwise cache the initialization promise.
- Pass:
  - `consumerSigner`
  - `recipientEncryptionPrivateKey`
  - Optional `nodeUrl`

Ed25519/Nacl signer example:

```ts
import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";
import { hexDecode } from "@idos-network/utils/codecs";
import nacl from "tweetnacl";

const secretKey = hexDecode(process.env.IDOS_CONSUMER_AUTH_KEY!);
const consumerSigner = nacl.sign.keyPair.fromSecretKey(secretKey);

export const idosConsumer = await idOSConsumerClass.init({
  consumerSigner,
  recipientEncryptionPrivateKey: process.env.IDOS_CONSUMER_ENC_KEY!,
  nodeUrl: process.env.IDOS_NETWORK_URL,
});
```

EVM signer example, only when the app already uses `ethers`:

```ts
import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";
import { Wallet } from "ethers";

const consumerSigner = new Wallet(process.env.IDOS_CONSUMER_AUTH_KEY!);

export const idosConsumer = await idOSConsumerClass.init({
  consumerSigner,
  recipientEncryptionPrivateKey: process.env.IDOS_CONSUMER_ENC_KEY!,
  nodeUrl: process.env.IDOS_NETWORK_URL,
});
```

- Keep this module out of frontend imports. If the framework shares files between server and client, place it in a clearly server-only location.

---

## 8) Backend Access Grants and Credential Retrieval

- Add authenticated backend endpoints/services for grant checks and credential reads.
- Never trust arbitrary `user_id` or `data_id` from the client without checking it belongs to the authenticated user/session and expected flow.

- List grants for a known idOS user:

```ts
const { grants, totalCount } = await idosConsumer.getAccessGrants({
  user_id: idosUserId,
  page: 1,
  size: 20,
});
```

- If the frontend sends a delegated access grant message, insert it on the backend:

```ts
await idosConsumer.createAccessGrantByDag({
  dag_data_id,
  dag_owner_wallet_identifier,
  dag_grantee_wallet_identifier,
  dag_signature,
  dag_locked_until,
});
```

- Retrieve decrypted credential contents from an approved grant:

```ts
const credentialContents =
  await idosConsumer.getCredentialSharedContentDecrypted(grant.data_id);
```

- Parse credential contents as structured data only after confirming the expected format. Handle malformed data as a failed credential read.

---

## 9) Credential Verification

- Verify credential signatures before using credential contents for product, compliance, or access-control decisions.
- Use the app's configured allowlist of accepted issuers.

```ts
const allowedIssuers = [
  {
    issuer: process.env.IDOS_ACCEPTED_ISSUER_ID!,
    publicKeyMultibase: process.env.IDOS_ACCEPTED_ISSUER_PUBLIC_KEY!,
  },
];

const verificationResults = await idosConsumer.verifyCredential(
  credentialContents,
  allowedIssuers,
);

const [verificationResult] = verificationResults;

if (!verificationResult?.verified) {
  throw new Error("idOS credential verification failed");
}
```

- Do not continue with unverified credentials unless the user explicitly asks for a prototype-only implementation, and mark that code as unsafe for production.

---

## 10) Suggested App Flow

1. User signs in to the app.
2. User connects wallet using the app's existing wallet flow.
3. Frontend initializes idOS client.
4. Frontend calls `addressHasProfile(address)`.
5. If no profile exists, user starts KYC through the backend KYC link and iframe.
6. After KYC, frontend refreshes idOS profile and credential state.
7. Frontend filters credentials for accepted issuers.
8. Frontend checks existing grants for this consumer.
9. Frontend requests an access grant when needed.
10. Backend lists grants and retrieves decrypted credential contents.
11. Backend verifies credentials against accepted issuers.
12. App stores only the minimum derived status/metadata it needs.

---

## 11) Run & Verify

1. Run the package manager install.
2. Run formatter if the project has one.
3. Run lint if available.
4. Run TypeScript typecheck if the project uses TypeScript.
5. Run focused tests for changed frontend and backend flows if available.
6. Manually verify:
   - Frontend bundle does not contain backend idOS secrets.
   - idOS enclave container is present.
   - Wallet signer is passed to `withUserSigner`.
   - KYC link comes from the backend and uses `IDOS_RELAY_URL`.
   - Iframe message origin matches the configured relay origin.
   - Backend consumer initializes with server-only secrets.
   - Credential reads happen only after grant checks.
   - Credentials are verified before use.

---

## Reference Map

- Frontend client initialization: `createIDOSClient`, `withUserSigner`
- Frontend profile check: `addressHasProfile`
- Frontend credential filtering: `filterCredentials`
- Frontend grants: `getAccessGrantsOwned`, `requestAccessGrant`, `requestDAGMessage`
- Backend consumer initialization: `idOSConsumer.init`
- Backend grant listing: `getAccessGrants`
- Backend delegated grant insertion: `createAccessGrantByDag`
- Backend credential retrieval: `getCredentialSharedContentDecrypted`
- Backend credential verification: `verifyCredential`
