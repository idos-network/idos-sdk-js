export class Nonce {
  bytes: Uint8Array;

  constructor(length = 32) {
    this.bytes = crypto.getRandomValues(new Uint8Array(length));
  }

  get clampUTF8() {
    return this.bytes.map((byte) => byte & 127);
  }
}
