# idOS Passporting Demo

This app demonstrates the process of **passporting**: enabling an Obligated Entity (like OE2) to request a credential from an idOS user. The app identifies a suitable credential, asks the user to sign it, and creates a Delegated Access Grant (dAG) for the Entity to access the credential.

## Features

- Lists a user's credentials.
- Identifies a credential suitable for the Entity's needs.
- Allows the user to sign the credential and create a dAG.
- Facilitates the Entity's access to the credential via the dAG.

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

## Key Components

### Credential Matching

The app fetches and identifies a credential based on predefined criteria, such as values in the `public_notes` field.

### Creating a Delegated Access Grant (dAG)

The app enables users to share a credential securely by signing it and generating a dAG for access.

## Code Overview

### Credential Fetching

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

### Reusable Credential Identification

Checks if a credential is reusable using `useReusableCredentialId`:

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

### Generating a dAG

Users can duplicate and share credentials securely:

```typescript
const handleCredentialDuplicateProcess = () => {
  startTransition(async () => {
    if (!credential.data) return;

    const contentHash = await idOS.data.getCredentialContentSha256Hash(credential.data.id);

    const granteeSigningPublicKey = process.env.NEXT_PUBLIC_GRANTEE_SIGNING_PUBLIC_KEY;
    const granteeEncryptionPublicKey = process.env.NEXT_PUBLIC_GRANTEE_ENCRYPTION_PUBLIC_KEY;

    invariant(granteeSigningPublicKey, "NEXT_PUBLIC_GRANTEE_SIGNING_PUBLIC_KEY is not set");
    invariant(granteeEncryptionPublicKey, "NEXT_PUBLIC_GRANTEE_ENCRYPTION_PUBLIC_KEY is not set");

    const { id } = await idOS.data.shareCredential(
      credential.data.id,
      granteeEncryptionPublicKey,
      {
        granteeAddress: granteeSigningPublicKey,
        lockedUntil: 0,
      },
    );

    const dag = {
      dag_owner_wallet_identifier: address as string,
      dag_grantee_wallet_identifier: granteeSigningPublicKey,
      dag_data_id: id,
      dag_locked_until: 0,
      dag_content_hash: contentHash,
    };

    const message: string = await idOS.data.requestDAGSignature(dag);
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

### UI Workflow

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

## Environment Variables

- `NEXT_PUBLIC_DUMMY_CREDENTIAL_ID`: Dummy credential ID for testing.
- `NEXT_PUBLIC_GRANTEE_SIGNING_PUBLIC_KEY`: Public Signing key for the grantee.
- `NEXT_PUBLIC_GRANTEE_ENCRYPTION_PUBLIC_KEY`: Encryption public key for the grantee.

## Dependencies

- [React](https://reactjs.org/)
- [@idos-network/idos-sdk](https://www.npmjs.com/package/@idos-network/idos-sdk)
- [@tanstack/react-query](https://tanstack.com/query)
- [Wagmi](https://wagmi.sh/)
- [@heroui/react](https://www.npmjs.com/package/@heroui/react)

## Running the Demo

1. Set up the environment variables in a `.env` file.
2. Start the app and interact with the demo:
   ```bash
   pnpm dev
   ```

## License

This project is licensed under the MIT License.