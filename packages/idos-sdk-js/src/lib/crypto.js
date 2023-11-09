import * as Utf8Codec from "@stablelib/utf8";
import * as Base64Codec from "@stablelib/base64"

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

    this.publicKey = this.provider.init(humanId, signerAddress, signerPublicKey);
    this.initialized = true;

    return this.publicKey;
  }


  async encrypt(message, receiverPublicKey) {
    if(typeof message === "string" || message instanceof String){
      message = Utf8Codec.encode(message)
    }
    if(typeof receiverPublicKey === "string" || receiverPublicKey instanceof String){
      receiverPublicKey = Base64Codec.decode(receiverPublicKey)
    }

    return this.provider.encrypt(message, receiverPublicKey);
  }

  async decrypt(message, senderPublicKey) {
    if(typeof message === "string" || message instanceof String){
      message = Utf8Codec.encode(message)
    }
    if(typeof senderPublicKey === "string" || senderPublicKey instanceof String){
      senderPublicKey = Base64Codec.decode(senderPublicKey)
    }

    return this.provider.decrypt(message, senderPublicKey);
  }
}
