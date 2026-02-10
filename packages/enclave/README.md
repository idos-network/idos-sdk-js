# idOS Enclave

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

## Enclave provider

In case you want to build your own enclave (like in a browser-extension) you should use the base or local provider like this:

```typescript
import type {
  EncryptionPasswordStore,
  MPCPasswordContext,
  PasswordContext,
} from "@idos-network/enclave";
import { LocalEnclave, type LocalEnclaveOptions } from "@idos-network/enclave/local";

const ENCLAVE_AUTHORIZED_ORIGINS_KEY = "enclave-authorized-origins";

export class Enclave extends LocalEnclave<LocalEnclaveOptions> {
  // Override
}
```

## MPC

```typescript
import { idOSClientConfiguration } from "@idos-network/client";
import { ChromeExtensionStore } from "@idos-network/utils/store";
import { Enclave as ChromeExtensionEnclave } from "./enclave"; // The custom Enclave from the example above

const configuration = new idOSClientConfiguration<ChromeExtensionEnclave>({
  nodeUrl: "https://nodes.idos.network",
  enclaveOptions: {
    // Your enclave options here
  },
  enclaveProvider: ChromeExtensionEnclave,
  store: new ChromeExtensionStore(),
});
```
