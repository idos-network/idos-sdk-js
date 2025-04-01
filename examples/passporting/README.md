# idOS Passporting Demo

This app demonstrates the process of **passporting**: enabling an Obligated Entity (like OE2) to request a credential from an idOS user. The app identifies a suitable credential, asks the user to sign it, and creates a Delegated Access Grant (dAG) for the Entity to access the credential.

### Features

- Lists a user's credentials.
- Identifies a credential suitable for the Entity's needs.
- Allows the user to sign the credential and create a dAG.
- Facilitates the Entity's access to the credential via the dAG.

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

## Client-Side Implementation

#### Credential Matching

The app fetches and identifies a credential based on predefined criteria, such as values in the `public_notes` field.

#### Creating a Delegated Access Grant (dAG)

The app enables users to share a credential securely by signing it and generating a dAG for access.

### Code Overview

#### Credential Fetching

Fetches the credential by its ID using `useFetchCredential`:

```typescript
const useFetchCredential = (id: string) => {
  const idOS = useIdOS();

  return useSuspenseQuery({
    queryKey: ["credential-details", id],
    queryFn: () => idOS.data.get<idOSCredential>("credentials", id, false),
  });
};
```

#### Reusable Credential Identification

Checks if a credential is reusable (OE2 has access to it) using `useReusableCredentialId`:

```typescript
const useReusableCredentialId = (credential: idOSCredential) => {
  const idOS = useIdOS();

  return useSuspenseQuery<idOSCredential | null>({
    queryKey: ["reusable-credential", credential?.id],
    queryFn: async () => {
      if (!credential) return null;
      const contentHash = await idOS.data.getCredentialContentSha256Hash(credential.id);
      const reusableCredential = await hasReusableCredential(contentHash);
      return reusableCredential;
    },
  });
};
```

#### Generating a dAG

Users can duplicate and share credentials securely:

```typescript
const handleCredentialDuplicateProcess = () => {
  startTransition(async () => {
    if (!credential.data) return;

    const contentHash = await idOS.data.getCredentialContentSha256Hash(credential.data.id);

    const consumerSigningPublicKey = process.env.NEXT_PUBLIC_OTHER_CONSUMER_SIGNING_PUBLIC_KEY;
    const consumerEncryptionPublicKey = process.env.NEXT_PUBLIC_OTHER_CONSUMER_ENCRYPTION_PUBLIC_KEY;

    invariant(consumerSigningPublicKey, "NEXT_PUBLIC_OTHER_CONSUMER_SIGNING_PUBLIC_KEY is not set");
    invariant(consumerEncryptionPublicKey, "NEXT_PUBLIC_OTHER_CONSUMER_ENCRYPTION_PUBLIC_KEY is not set");

    const { id } = await idOS.data.shareCredential(
      credential.data.id,
      consumerEncryptionPublicKey,
      {
        consumerAddress: consumerSigningPublicKey,
        lockedUntil: 0,
      },
    );

    const dag = {
      dag_owner_wallet_identifier: address as string,
      dag_grantee_wallet_identifier: consumerSigningPublicKey,
      dag_data_id: id,
      dag_locked_until: 0,
      dag_content_hash: contentHash,
    };

    const message: string = await idOS.data.requestDAGMessage(dag);
    const signature = await signMessageAsync({ message });

    await invokePassportingService({
      ...dag,
      dag_signature: signature,
    });
    await queryClient.invalidateQueries({
      queryKey: ["reusable-credential", credential.data?.id],
    });
    await reusableCredential.refetch();
  });
};
```

#### UI Workflow

- **MatchingCredential Component**: Displays the credential details and manages the dAG creation process.
- **Home Component**: Provides a loading fallback and renders the `MatchingCredential` component inside a `Suspense` boundary.

```jsx
export default function Home() {
  return (
    <div className="flex h-full flex-col place-content-center items-center gap-4">
      <Suspense
        fallback={
          <div className="flex h-full flex-col place-content-center items-center gap-2">
            <CircularProgress aria-label="Searching for a matching credential..." />
            <p>Searching for a matching credential...</p>
          </div>
        }
      >
        <MatchingCredential />
      </Suspense>
    </div>
  );
}
```

## Server-Side Implementation
### Features

- Invokes the passporting service to transmit a dAG.
- Checks if a reusable credential is already available.

### Code Example

```ts
"use server";
import { createConsumerSdkInstance } from "@/consumer.config";
import invariant from "tiny-invariant";

export async function invokePassportingService(payload: {
  dag_owner_wallet_identifier: string;
  dag_grantee_wallet_identifier: string;
  dag_data_id: string;
  dag_locked_until: number;
  dag_content_hash: string;
  dag_signature: string;
}) {
  const serviceUrl = process.env.PASSPORTING_SERVICE_URL;
  const serviceApiKey = process.env.PASSPORTING_SERVICE_API_KEY;

  invariant(serviceUrl, "PASSPORTING_SERVICE_URL is not set");
  invariant(serviceApiKey, "PASSPORTING_SERVICE_API_KEY is not set");

  const response = await fetch(serviceUrl, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${serviceApiKey}`,
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());

  if (response.success === false) throw new Error(response.error.message);
}

export const hasReusableCredential = async (credentialHash: string) => {
  const consumerSdk = await createConsumerSdkInstance();
  return consumerSdk.getReusableCredentialCompliantly(credentialHash);
};
```
## How It Works

1. **Client-Side**: The user selects a credential to share, signs it, and creates a dAG.
2. **Server-Side**: The server verifies and transmits the dAG using the passporting service (OE1 server).
3. **Reusable Credential**: Checks if a credential can be reused to optimize the process.


### Environment Variables

- `NEXT_PUBLIC_DUMMY_CREDENTIAL_ID`: Dummy credential ID for testing.
- `NEXT_PUBLIC_OTHER_CONSUMER_SIGNING_PUBLIC_KEY`: Public Signing key for the consumer.
- `NEXT_PUBLIC_OTHER_CONSUMER_ENCRYPTION_PUBLIC_KEY`: Encryption public key for the consumer.
