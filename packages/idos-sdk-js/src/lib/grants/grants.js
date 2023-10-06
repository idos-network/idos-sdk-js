import { EvmGrants } from "./evm";
import { NearGrants } from "./near";

export class Grants {
  #child;
  constructor(idOS) {
    this.idOS = idOS;
  }

  async init({ account, signer, type, wallet }) {
    this.type = type;

    if (type === "evm") {
      this.#child = new EvmGrants();
    }

    if (type === "near") {
      this.#child = new NearGrants();
    }

    this.#child.init({ account, signer, wallet });
  }

  async list(args) {
    return this.#child.list(args);
  }

  async create(args) {
    return this.#child.create(args);
  }

  async revoke(args) {
    return this.#child.create(args);
  }
}
