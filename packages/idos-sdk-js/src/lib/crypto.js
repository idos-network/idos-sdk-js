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
};

export class Crypto {
  Nonce = Nonce;

  constructor(idOS) {
    this.idOS = idOS;
  }

  async init() {
    this.provider = this.idOS.enclave.provider;

    const signerAddress = this.idOS.store.get("signer-address");
    const signerPublicKey = this.idOS.store.get("signer-public-key");

    const { humanId } = await this.idOS.auth.currentUser();

    if (!humanId) return;

    this.publicKey = this.provider.init(humanId, signerAddress, signerPublicKey);

    return this.publicKey;
  }


  async encrypt(message, receiverPublicKey) {
    [ message, receiverPublicKey ] = [message, receiverPublicKey]
      .map(arg => (typeof arg === "string" || arg instanceof String) ? Utf8Codec.encode(arg) : arg);

    return this.provider.encrypt(message, receiverPublicKey);
  }

  async decrypt(message, senderPublicKey) {
    [ message, senderPublicKey ] = [message, senderPublicKey]
      .map(arg => (typeof arg === "string" || arg instanceof String) ? Utf8Codec.encode(arg) : arg);

    return this.provider.decrypt(message, senderPublicKey);
  }

  async confirm(message) {
    return this.provider.confirm(message);
  }
}
