export class EnclaveProvider {
  constructor() {
    if (this.constructor === EnclaveProvider) {
      throw new Error("Abstract class EnclaveProvider can't be instantiated.");
    }
  }

  async init() {
    throw new Error(`${this.constructor} doesn't implement method \`init()\`.`);
  }

  async reset() {
    throw new Error(`${this.constructor} doesn't implement method \`init()\`.`);
  }

  async encrypt() {
    throw new Error(`${this.constructor} doesn't implement method \`encrypt()\`.`);
  }

  async decrypt() {
    throw new Error(`${this.constructor} doesn't implement method \`decrypt()\`.`);
  }
}
