class Nonce {
  constructor(length = 32, uuid = false) {
    const values = uuid
      ? crypto.randomUUID().substring(0, length)
      : crypto.getRandomValues(new Uint8Array(length));
    return Buffer.from(values);
  }
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
      throw new Error("User is not in the idOS");
    }
    this.publicKeys = await this.provider.init(humanId, signerPublicKey);
    return this.publicKeys.encryption;
  }

  async sign(message) {
    return await this.provider.sign(message);
  }

  async verifySig(message, signature, signerPublicKey) {
    return await this.provider.verifySig(message, signature, signerPublicKey);
  }

  async encrypt(message, receiverPublicKey) {
    return await this.provider.encrypt(message, receiverPublicKey);
  }

  async decrypt(message, senderPublicKey) {
    return await this.provider.decrypt(message, senderPublicKey);
  }
}
