export class EnclaveProvider {
  constructor() {
    if (this.constructor === EnclaveProvider) {
      throw new Error("Abstract class EnclaveProvider can't be instantiated.");
    }
  }

  async init() {
    throw new Error(`${this.constructor} doesn't implement method \`init()\'.`);
  }

  async sign() {
    throw new Error(`${this.constructor} doesn't implement method \`sign()\'.`);
  }

  async verifySig() {
    throw new Error(`${this.constructor} doesn't implement method \`verifySig()\'.`);
  }

  async encrypt() {
    throw new Error(`${this.constructor} doesn't implement method \`encrypt()\'.`);
  }

  async decrypt() {
    throw new Error(`${this.constructor} doesn't implement method \`decrypt()\'.`);
  }
}
