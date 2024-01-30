import { EnclaveProvider, StoredData } from "./enclave-provider";
import * as Base64Codec from "@stablelib/base64";
import nacl, { BoxKeyPair } from "tweetnacl";

export interface ServerProviderOptions {
  secretKey: string;
}

export class ServerProvider extends EnclaveProvider {
  private keyPair: BoxKeyPair;
  private storage: Partial<StoredData> = {};

  constructor(options: ServerProviderOptions) {
    super();
    this.keyPair = nacl.box.keyPair.fromSecretKey(
      Base64Codec.decode(options.secretKey)
    );
  }

  async load(): Promise<StoredData> {
    return Promise.resolve(this.storage);
  }

  async init(
    humanId?: string,
    signerAddress?: string,
    signerPublicKey?: string
  ): Promise<Uint8Array> {
    this.storage = { humanId, signerAddress, signerPublicKey };
    return this.keyPair.publicKey;
  }

  async store(_key: string, _value: string): Promise<string> {
    return "";
  }
  async reset(): Promise<void> {
    return void 0;
  }

  async decrypt(fullMessage: Uint8Array, senderPublicKey: Uint8Array): Promise<Uint8Array> {
    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);
  
    const decrypted = nacl.box.open(message, nonce, senderPublicKey, this.keyPair.secretKey);

    if (!decrypted) {
      throw Error(
        `Couldn't decrypt. ${JSON.stringify(
          {
            fullMessage: Base64Codec.encode(fullMessage),
            message: Base64Codec.encode(message),
            nonce: Base64Codec.encode(nonce),
            senderPublicKey: Base64Codec.encode(senderPublicKey),
            serverPublicKey: Base64Codec.encode(this.keyPair.publicKey)
          },
          null,
          2
        )}`
      );
    }

    return decrypted;
  }
}
