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

Helpers for key derivation and NaCl box encryption used by idOS.

```ts
import nacl from "tweetnacl";
import { decrypt, encrypt, keyDerivation } from "@idos-network/utils/encryption";

const sender = nacl.box.keyPair();
const receiver = nacl.box.keyPair();

const derivedKey = await keyDerivation("SuperSecretPassword!", "9f51b3b2-4cbe-4c2b-8ea3-0b0c1b2f1a11");
const message = new TextEncoder().encode("hello");

const { content, encryptorPublicKey } = encrypt(message, sender.publicKey, receiver.publicKey);
const decrypted = await decrypt(content, receiver, encryptorPublicKey);
```

## Storage

Storage abstractions with optional expiration handling and codec piping.

```ts
import { LocalStorageStore } from "@idos-network/utils/store";
import { base64Codec } from "@idos-network/utils/codecs";

const store = new LocalStorageStore().pipeCodec(base64Codec);
await store.set("secret", new Uint8Array([1, 2, 3]));
const secret = await store.get<Uint8Array>("secret");

await store.setRememberDuration(7); // days

```

## Cryptography

NaCl box helpers and a convenience wrapper for nonce-prefixed, base64 messages.

```ts
import nacl from "tweetnacl";
import { encryptContent, NoncedBox } from "@idos-network/utils/cryptography";
import { base64Encode } from "@idos-network/utils/codecs";

const sender = nacl.box.keyPair();
const recipient = nacl.box.keyPair();
const message = new TextEncoder().encode("hello");

const fullMessage = encryptContent(message, recipient.publicKey, sender.secretKey);

const box = new NoncedBox(recipient);
const plaintext = await box.decrypt(base64Encode(fullMessage), base64Encode(sender.publicKey));
```

## Codecs

Common encoding helpers used across idOS.

```ts
import { fromBytesToJson, hexEncodeSha256Hash, toBytes } from "@idos-network/utils/codecs";

const data = toBytes({ hello: "world" });
const hashHex = hexEncodeSha256Hash(data);
const parsed = fromBytesToJson<{ hello: string }>(data);
```
