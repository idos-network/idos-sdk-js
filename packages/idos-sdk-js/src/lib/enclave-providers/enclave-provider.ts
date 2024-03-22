export interface StoredData {
  encryptionPublicKey?: string;
  humanId?: string;
  signerAddress?: string;
  signerPublicKey?: string;
}

export abstract class EnclaveProvider {
  async load(): Promise<StoredData> {
    throw new Error("Unimplemented");
  }

  async init(
    _humanId?: string,
    _signerAddress?: string,
    _signerPublicKey?: string,
    _authMethod?: "passkey" | "password"
  ): Promise<Uint8Array> {
    throw new Error("Unimplemented");
  }

  async store(_key: string, _value: string): Promise<string> {
    throw new Error("Unimplemented");
  }

  async reset(): Promise<void> {
    throw new Error("Unimplemented");
  }

  async confirm(_message: string): Promise<boolean> {
    throw new Error("Unimplemented");
  }

  async encrypt(_message: Uint8Array, _receiverPublicKey?: Uint8Array): Promise<Uint8Array> {
    throw new Error("Unimplemented");
  }

  async decrypt(_message: Uint8Array, _senderPublicKey?: Uint8Array): Promise<Uint8Array> {
    throw new Error("Unimplemented");
  }
}
