export interface StoredData {
  encryptionPublicKey?: Uint8Array;
  humanId?: string;
  signerAddress?: string;
  signerPublicKey?: string;
}

export interface EnclaveProvider {
  load(): Promise<StoredData>;
  ready(humanId?: string, signerAddress?: string, signerPublicKey?: string): Promise<Uint8Array>;
  store(key: string, value: string): Promise<string>;
  reset(): Promise<void>;
  confirm(message: string): Promise<boolean>;
  encrypt(message: Uint8Array, receiverPublicKey?: Uint8Array): Promise<Uint8Array>;
  decrypt(message: Uint8Array, senderPublicKey?: Uint8Array): Promise<Uint8Array>;
}
