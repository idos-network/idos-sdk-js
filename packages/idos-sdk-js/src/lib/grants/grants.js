import { EvmGrants } from "./evm";
import { NearGrants } from "./near";

export class Grants {
  #child;
  static near = {
    contractMethods: Object.values(NearGrants.contractMethods),
    defaultContractId: NearGrants.defaultContractId,
    defaultNetwork: NearGrants.defaultNetwork,
  };

  constructor(idOS) {
    this.idOS = idOS;
  }

  async init({ accountId, signer, type }) {
    this.type = type;

    if (type === "EVM") {
      this.#child = new EvmGrants();
    }

    if (type === "NEAR") {
      this.#child = new NearGrants();
    }

    await this.#child.init({ accountId, signer });
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
