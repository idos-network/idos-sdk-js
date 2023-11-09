import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";

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

  async init({ accountId, signer, type, publicKey }) {
    this.type = type;

    if (type === "EVM") {
      this.#child = new EvmGrants();
    }

    if (type === "NEAR") {
      this.#child = new NearGrants();
    }

    await this.#child.init({ accountId, signer, publicKey });

    return { publicKey };
  }

  async list(args) {
    return this.#child.list(args);
  }

  // FIXME: near-rs expects data_id, near-ts expects dataId
  async get_credential_shared({ id } = {}) {
    if (!this.idOS.crypto.initialized) await this.idOS.crypto.init();

    let records = await this.idOS.kwilWrapper.call(`get_credential_shared`, { id }, `Get your credential in idOS`);
    let record = records.find((r) => r.id === id);
    record.content = Utf8Codec.decode(
      await this.idOS.crypto.decrypt(
        Base64Codec.decode(record.content),
        Base64Codec.decode(record.encryption_public_key)
      )
    );
    return record;
  }

  async create(tableName, recordId, address, receiverPublicKey, lockedUntil = undefined) {
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
