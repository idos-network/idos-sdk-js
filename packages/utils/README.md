# idOS Utils

> ⚖️ Legalities
>
> By downloading, installing, or implementing any of the idOS’ SDKs, you acknowledge that you have read and understood idOS’ Privacy Policy and Transparency Document.
>
> - <https://www.idos.network/legal/privacy-policy>
> - <https://www.idos.network/legal/transparency-document>

## Developing the utils locally

```bash
pnpm build
```

## Encryption & decryption idOS

## Storage

## Enclave provider

In case you want to build your own enclave (like in a browser-extension) you should use the base or local provider like this:

```typescript
import { type AuthMethod, LocalEnclave } from "@idos-network/utils/enclave";

class ChromeExtensionEnclave extends LocalEnclave {
  async chooseAuthAndPassword(): Promise<{ authMethod: AuthMethod; password?: string }> {
    return self.showPasswordPopup(
      this.allowedAuthMethods,
      this.userId,
      this.expectedUserEncryptionPublicKey,
    );
  }

  async confirm(message: string): Promise<boolean> {
    return self.showConfirmPopup(message);
  }

  private async chooseAuthAndPassword() {
    // Open popup and prompt user to choose an authentication method and eventually password
  }
}
```

NOTE: Chrome extension background workers won't support classic local storage, you should use in-memory or dedicated chrome extension storage:

```typescript
import { ChromeExtensionStore } from "@idos-network/utils/store";

const configuration = new idOSClientConfiguration<ChromeExtensionEnclave>({
  nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
  chainId: import.meta.env.VITE_IDOS_CHAIN_ID,
  store: new ChromeExtensionStore(),
  enclaveOptions: {},
  enclaveProvider: ChromeExtensionEnclave,
});
```
