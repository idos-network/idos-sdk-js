import * as StableUtf8 from "@stablelib/utf8";

class Nonce {
  // returns Uint8Array
  static random = (length = 32) => (
    crypto.getRandomValues(new Uint8Array(length))
  )

  // returns Uint8Array
  static trimmedUUID = (length = 32) => (
    StableUtf8.encode(crypto.randomUUID().substring(0, length))
  )

  static fill = (value = 0, length = 32) => (
    new Uint8Array(length).fill(value)
  )
}

export class Crypto {
  Nonce = Nonce;
  constructor(idOS) {
    this.idOS = idOS;
  }

  async init() {
    this.provider = this.idOS.enclave.provider;
    let signerPublicKey = this.idOS.store.get("signer-public-key");
    let humanId = this.idOS.store.get("human-id");
    humanId = humanId || (await this.idOS.auth.currentUser()).humanId;

    if (!humanId) {
      console.warn("User is not in the idOS");
      return;
    }
    this.publicKeys = await this.provider.init(humanId, signerPublicKey);
    return this.publicKeys.encryption;
  }

  async encrypt(message, receiverPublicKey) {
    return await this.provider.encrypt(message, receiverPublicKey);
  }

  async decrypt(message, senderPublicKey) {
    return await this.provider.decrypt(message, senderPublicKey);
  }
}
