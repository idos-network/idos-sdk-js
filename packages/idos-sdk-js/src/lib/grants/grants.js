import { EvmGrants } from "./evm";
import { NearGrants } from "./near";

export class Grants {
  #child;
  near = {
    contractMethods: Object.values(NearGrants.contractMethods),
    defaultContractId: NearGrants.defaultContractId,
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

    await this.#child.init({ account, signer, wallet });
  }

  async list(args) {
    return this.#child.list(args);
  }

  async create(tableName, recordId, address, lockedUntil, receiverPublicKey) {
    const share = await this.idOS.data.share(tableName, recordId, receiverPublicKey);
    const payload = await this.#child.create({
      grantee: address,
      dataId: share.id,
      lockedUntil: lockedUntil,
    });
    return {
      ...payload,
      encryptedWith: this.idOS.store.get("signer-public-key"),
    };
  }

  async revoke(tableName, recordId, grantee, dataId, lockedUntil) {
    await this.idOS.data.unshare(tableName, recordId);
    return this.#child.revoke({ grantee, dataId, lockedUntil });
  }
}
