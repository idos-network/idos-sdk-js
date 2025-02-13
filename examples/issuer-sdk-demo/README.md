# idOS Issuer SDK Demo

This app demonstrates the process of credential management using the idOS issuer SDK. It allows users to create, manage, and share credentials securely. The app supports creating credentials via permissioned issuers, write grants, and reusable credentials. It also provides a user-friendly interface to list and refresh credentials.

### Features

- `Profile Creation`: Users can create an idOS profile if they don't already have one.
- `Credential Management`: Users can create credentials via:
    - Permissioned Issuer: Directly from a trusted issuer.
    - Write Grant: By granting write access to an issuer.
    - Reusable Credential: Creating reusable credentials for efficient sharing.
- `Credential Listing`: Displays a list of the user's credentials.

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

#### Profile Creation

If the user doesn't have an idOS profile, they are prompted to create one. Once the profile is created, the app initializes the idOS SDK and sets up the necessary permissions.

```typescript
export async function createProfile(
  publicKey: string,
  userId: string,
  wallet: CreateWalletReqParams,
) {
  const issuer = await getIssuerConfig();
  await createUser(issuer, { id: userId, recipient_encryption_public_key: publicKey }, wallet);
}
```

#### Issue Credentials for users

The app enables issuers to issue credentials for their users.

which is done in two ways:

- Permissioned Issuer: Directly from a trusted issuer.

```typescript
export async function createCredentialByPermissionedIssuer(
  userId: string,
  userEncryptionPublicKey: string,
) {
  const issuer = await getIssuerConfig();

  await createCredentialPermissioned(issuer, {
    userId,
    plaintextContent: generateCredential("demo@idos.network", ethers.Wallet.createRandom().address),
    publicNotes: JSON.stringify({ ...publicNotes, id: crypto.randomUUID() }),
    recipientEncryptionPublicKey: Base64.decode(userEncryptionPublicKey),
  });
}
```

### Environment Variables

- `NEXT_PUBLIC_KWIL_NODE_URL`: URL of the idOS node.
- `NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX`: Public Signing key for the issuer (hex encoded).
- `NEXT_ISSUER_SIGNING_SECRET_KEY`: Signing secret key for the issuer.
- `NEXT_ISSUER_ENCRYPTION_SECRET_KEY`: Encryption secret key for the issuer.
