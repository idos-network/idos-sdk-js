import type { Wallet } from "@near-wallet-selector/core";
import type { Signer } from "ethers";

import { idOS } from "..";
import { assertNever } from "../../types";
import { EvmGrants } from "./evm";
import Grant from "./grant";
import { GrantChild } from "./grant-child";
import { NearGrants } from "./near";
import { Config } from "../config";

const SIGNER_TYPES = {
  EVM: EvmGrants,
  NEAR: NearGrants
} as const;

export type SignerType = keyof typeof SIGNER_TYPES;

export class Grants {
  static SIGNER_TYPES = SIGNER_TYPES;

  static near = {
    /**
     * @deprecated Use {@link Grants.methodNames} instead.
     */
    contractMethods: Object.values(NearGrants.contractMethods),
    methodNames: Object.values(NearGrants.contractMethods),
  };

  idOS: idOS;
  config: Config["grants"];

  constructor(
    idOS: idOS,
    config: Config["grants"],
  ) {
    this.idOS = idOS;
    this.config = config;
  }

  async init({ type, signer }: { type: "EVM"; signer: Signer }): Promise<ConnectedGrants>;

  async init({
    type,
    signer,
    accountId
  }: {
    type: "NEAR";
    signer: Wallet;
    accountId: string;
  }): Promise<ConnectedGrants>;

  async init({
    type,
    signer,
    accountId
  }: {
    type: SignerType;
    signer: Wallet | Signer;
    accountId?: string;
  }): Promise<ConnectedGrants> {
    let child;

    switch (type) {
      case "EVM":
        child = await EvmGrants.build({ signer: signer as Signer, options: this.config.evm });
        break;
      case "NEAR":
        child = await NearGrants.build({
          accountId: accountId!,
          signer: signer as Wallet,
          options: this.config.near,
        });
        break;
      default:
        child = assertNever(type, `Unexpected signer type: ${type}`);
    }

    return new ConnectedGrants(this.idOS, this.config, child);
  }

  async list(
    _args: {
      owner?: string;
      grantee?: string;
      dataId?: string;
    } = {}
  ): Promise<Grant[]> {
    throw new Error("Call idOS.setSigner first.");
  }

  async create(
    _tableName: string,
    _recordId: string,
    _address: string,
    _lockedUntil: number,
    _receiverPublicKey: string
  ): Promise<{ encryptedWith: string; transactionId: string }> {
    throw new Error("Call idOS.setSigner first.");
  }

  async revoke(
    _tableName: string,
    _recordId: string,
    _grantee: string,
    _dataId: string,
    _lockedUntil: number
  ): Promise<{ transactionId: string }> {
    throw new Error("Call idOS.setSigner first.");
  }
}

class ConnectedGrants extends Grants {
  #child: GrantChild;

  constructor(idOS: idOS, config: Config["grants"], child: GrantChild) {
    super(idOS, config);

    this.#child = child;
  }

  async init(_args: {
    type: SignerType;
    signer: Wallet | Signer;
    accountId?: string;
  }): Promise<ConnectedGrants> {
    throw new Error("Can't re-init");
  }

  async list(
    args: {
      owner?: string;
      grantee?: string;
      dataId?: string;
    } = {}
  ): Promise<Grant[]> {
    return this.#child.list(args);
  }

  async create(
    tableName: string,
    recordId: string,
    address: string,
    lockedUntil: number,
    receiverPublicKey: string
  ): Promise<{ encryptedWith: string; transactionId: string }> {
    const share = await this.idOS.data.share(tableName, recordId, receiverPublicKey);
    const payload = await this.#child.create({
      grantee: address,
      dataId: share.id,
      lockedUntil: lockedUntil
    });

    return {
      ...payload,
      encryptedWith: this.idOS.store.get("signer-public-key")
    };
  }

  async revoke(
    tableName: string,
    recordId: string,
    grantee: string,
    dataId: string,
    lockedUntil: number
  ): Promise<{ transactionId: string }> {
    await this.idOS.data.unshare(tableName, recordId);

    return this.#child.revoke({ grantee, dataId, lockedUntil });
  }
}
