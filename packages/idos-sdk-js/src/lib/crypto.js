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

    return this.provider.init(humanId, signerAddress, signerPublicKey);
  }

  async encrypt(message, receiverPublicKey) {
    [ message, receiverPublicKey ] = [message, receiverPublicKey]
      .filter(arg => typeof arg === "string" || arg instanceof string)
      .map(Utf8codec.encode);

    return this.provider.encrypt(message, receiverPublicKey);
  }

  async decrypt(message, senderPublicKey) {
    [ message, senderPublicKey ] = [message, senderPublicKey]
      .filter(arg => typeof arg === "string" || arg instanceof string)
      .map(Utf8codec.encode);

    return this.provider.decrypt(message, senderPublicKey);
  }

  async confirm(message) {
    return this.provider.confirm(message);
  }
}
