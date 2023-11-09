import * as Utf8Codec from "@stablelib/utf8";

class Nonce {
  static random (length = 32, { bitCap = 8 } = {}) {
    const identity = _ => _;
    const bitmask = (bits, byte) => byte & bits;
    const [ typedArray, transformBytes = identity ] = {
      [ 7]: [Int8Array, bitmask.bind(null, 127)],
      [ 8]: [Uint8Array],
      [16]: [Uint16Array],
    }[bitCap];

    if (!typedArray) throw new Error(`\`bitCap = ${bitCap}\` not supported`);

    return crypto.getRandomValues(new typedArray(length)).map(transformBytes);
  }
}

export class Crypto {
  Nonce = Nonce;

  constructor(idOS) {
    this.idOS = idOS;
    this.initialized = false;
  }

  async init(humanId) {
    this.provider = this.idOS.enclave.provider;

    const signerAddress = this.idOS.store.get("signer-address");
    const signerPublicKey = this.idOS.store.get("signer-public-key");

    humanId ||= (await this.idOS.auth.currentUser()).humanId;

    if (!humanId) return;

    this.publicKey = await this.provider.init(humanId, signerAddress, signerPublicKey);
    this.idOS.store.set("encryption-public-key", this.publicKey);
    this.initialized = true;

    return this.publicKey;
  }

  async encrypt(message, receiverPublicKey) {
    if (!this.initialized) await this.init();

    [ message, receiverPublicKey ] = [message, receiverPublicKey]
      .map(arg => (typeof arg === "string" || arg instanceof String) ? Utf8Codec.encode(arg) : arg);

    return this.provider.encrypt(message, receiverPublicKey);
  }

  async decrypt(message, senderPublicKey) {
    if (!this.initialized) await this.init();

    [ message, senderPublicKey ] = [message, senderPublicKey]
      .map(arg => (typeof arg === "string" || arg instanceof String) ? Utf8Codec.encode(arg) : arg);

    return this.provider.decrypt(message, senderPublicKey);
  }
}
