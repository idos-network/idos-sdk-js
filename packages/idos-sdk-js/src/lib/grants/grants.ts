import type { Wallet } from "@near-wallet-selector/core";
import type { Signer } from "ethers";

import { idOS } from "..";
import { assertNever } from "../../types";
import { EvmGrants, EvmGrantsOptions } from "./evm";
import Grant from "./grant";
import { GrantChild } from "./grant-child";
import { NearGrants, NearGrantsOptions } from "./near";

const SIGNER_TYPES = {
  EVM: EvmGrants,
  NEAR: NearGrants
} as const;

export type SignerType = keyof typeof SIGNER_TYPES;

export class Grants {
  static SIGNER_TYPES = SIGNER_TYPES;
  static evm = {
    defaultChainId: EvmGrants.defaultChainId
  };
  static near = {
    /**
     * @deprecated Use {@link Grants.methodNames} instead.
     */
    contractMethods: Object.values(NearGrants.contractMethods),
    methodNames: Object.values(NearGrants.contractMethods),
    /**
     * @deprecated Use {@link Grants.contractId } instead.
     */
    defaultContractId: NearGrants.defaultContractId,
    contractId: NearGrants.defaultContractId,
    defaultNetwork: NearGrants.defaultNetwork
  };

  idOS: idOS;
  evmGrantsOptions: EvmGrantsOptions;
  nearGrantsOptions: NearGrantsOptions;

  constructor(
    idOS: idOS,
    evmGrantsOptions: EvmGrantsOptions = {},
    nearGrantsOptions: NearGrantsOptions = {}
  ) {
    this.idOS = idOS;
    this.evmGrantsOptions = evmGrantsOptions;
    this.nearGrantsOptions = nearGrantsOptions;
  }

  async init({ type, signer }: { type: "EVM"; signer: Signer }): Promise<ConnectedGrants>;

  async init({
    type,
    signer,
    accountId,
    publicKey
  }: {
    type: "NEAR";
    signer: Wallet;
    accountId: string;
    publicKey: string;
  }): Promise<ConnectedGrants>;

  async init({
    type,
    signer,
    accountId,
    publicKey
  }: {
    type: SignerType;
    signer: Wallet | Signer;
    accountId?: string;
    publicKey?: string;
  }): Promise<ConnectedGrants> {
    let child;

    switch (type) {
      case "EVM":
        child = await EvmGrants.build({ signer: signer as Signer, options: this.evmGrantsOptions });
        break;
      case "NEAR":
        if (accountId === undefined) throw new Error("accountId required for NEAR signers");
        if (publicKey === undefined) throw new Error("publicKey required for NEAR signers");
        child = await NearGrants.build({
          accountId,
          signer: signer as Wallet,
          options: this.nearGrantsOptions,
          publicKey
        });
        break;
      default:
        child = assertNever(type, `Unexpected signer type: ${type}`);
    }

    return new ConnectedGrants(this.idOS, child);
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
  ): Promise<{ grant: Grant; transactionId: string }> {
    throw new Error("Call idOS.setSigner first.");
  }

  async revoke(
    _tableName: string,
    _recordId: string,
    _grantee: string,
    _dataId: string,
    _lockedUntil: number
  ): Promise<{ grant: Grant; transactionId: string }> {
    throw new Error("Call idOS.setSigner first.");
  }
}

class ConnectedGrants extends Grants {
  #child: GrantChild;

  constructor(idOS: idOS, child: GrantChild) {
    super(idOS);
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
  ): Promise<{ grant: Grant; transactionId: string }> {
    const share = await this.idOS.data.share(tableName, recordId, receiverPublicKey);

    return await this.#child.create({
      grantee: address,
      dataId: share.id,
      lockedUntil: lockedUntil
    });
  }

  async revoke(
    tableName: string,
    recordId: string,
    grantee: string,
    dataId: string,
    lockedUntil: number
  ): Promise<{ grant: Grant; transactionId: string }> {
    await this.idOS.data.unshare(tableName, recordId);

    return this.#child.revoke({ grantee, dataId, lockedUntil });
  }
}
