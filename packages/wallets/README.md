# idOS Wallet experiment

This library provides a unified way how to deal with server / client multi-chain wallets.

## React hooks

```typescript
// main-component.tsx
import { WalletProvider } from "@idos-network/wallets";

export function Main() {
  return (
    <WalletProvider><Outlet /></WalletProvider>
  );
}

// component.tsx
import { useWalletProvider } from "@idos-network/wallets";

export function SignInComponent() {
  const { connect, selectedWallet } = useWalletChooser();

  useEffect(() => {
    if (selectedWallet) {
      // Do whatever is needed
    }
  }, [selectedWallet]);


  return (
    <div>
      <button onClick={connect}>Sign in</button>
    </div>
  );
}
```

## Issue messages (server)

```typescript
import { generateSignInMessage } from "@idos-network/wallets/utils";

// For "ETH" we are using S.I.W.E. (Sign in with ethereum)
// that's why the method is different.
const signInMessage = generateSignInMessage(
  wallet.wallet.address,
  wallet.chain, // "eth" "stellar" "near"
  uri,
);

const genericMessage = "Whatever you need to sign.";

```

## Verify messages

```typescript
import { verifySignInMessage, verifyMessage } from "@idos-network/wallets/utils";

const signInResponse = await verifySignInMessage(
  "eth",
  wallet.address,
  wallet.publicKey,
  message, // From previous step
  signature, // From signature
);

const response = await verifyMessage(
  "eth",
  wallet.address,
  wallet.publicKey,
  message, // From previous step
  signature, // From signature
);

```