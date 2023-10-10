import { EvmGrants } from "./evm";
import { NearGrants } from "./near";

export class Grants {
  #child;

  near = {
    contractMethods: Object.values(NearGrants.contractMethods),
  };

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
    // TODO: create idOS record duplicate
    return this.#child.create(args);
  }

  async revoke(args) {
    // TODO: delete idOS record duplicate
    return this.#child.revoke(args);
  }
}
