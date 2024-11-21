import type { idOSCredential } from "@idos-network/idos-sdk-types";
import type { Wallet } from "@near-wallet-selector/core";
import type { Signer } from "ethers";

import type { Data } from "../data";
import type { Enclave } from "../enclave";
import { assertNever } from "../utils";
import { EvmGrants, type EvmGrantsOptions } from "./evm";
import type Grant from "./grant";
import type { GrantChild } from "./grant-child";
import { NearGrants, type NearGrantsOptions } from "./near";

const SIGNER_TYPES = {
  EVM: EvmGrants,
  NEAR: NearGrants,
} as const;

export type SignerType = keyof typeof SIGNER_TYPES;

export class Grants {
  static SIGNER_TYPES = SIGNER_TYPES;
  static evm = {
    defaultChainId: EvmGrants.defaultChainId,
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
    defaultNetwork: NearGrants.defaultNetwork,
  };

  evmGrantsOptions: EvmGrantsOptions;
  nearGrantsOptions: NearGrantsOptions;

  constructor(
    public readonly data: Data,
    public readonly enclave: Enclave,
    evmGrantsOptions: EvmGrantsOptions = {},
    nearGrantsOptions: NearGrantsOptions = {},
  ) {
    this.evmGrantsOptions = evmGrantsOptions;
    this.nearGrantsOptions = nearGrantsOptions;
  }

  async connect({ type, signer }: { type: "EVM"; signer: Signer }): Promise<ConnectedGrants>;

  async connect({
    type,
    signer,
    accountId,
    publicKey,
  }: {
    type: "NEAR";
    signer: Wallet;
    accountId: string;
    publicKey: string;
  }): Promise<ConnectedGrants>;

  async connect({
    type,
    signer,
    accountId,
    publicKey,
  }: {
    type: SignerType;
    signer: Wallet | Signer;
    accountId?: string;
    publicKey?: string;
  }): Promise<ConnectedGrants> {
    let child: EvmGrants | NearGrants;

    switch (type) {
      case "EVM":
        child = await EvmGrants.init({ signer: signer as Signer, options: this.evmGrantsOptions });
        break;
      case "NEAR":
        if (accountId === undefined) throw new Error("accountId required for NEAR signers");
        if (publicKey === undefined) throw new Error("publicKey required for NEAR signers");
        child = await NearGrants.init({
          accountId,
          signer: signer as Wallet,
          options: this.nearGrantsOptions,
          publicKey,
        });
        break;
      default:
        child = assertNever(type, `Unexpected signer type: ${type}`);
    }

    return new ConnectedGrants(this.data, this.enclave, child);
  }

  async list(
    _args: {
      owner?: string;
      grantee?: string;
      dataId?: string;
    } = {},
  ): Promise<Grant[]> {
    throw new Error("Call idOS.setSigner first.");
  }

  async create(
    _tableName: string,
    _recordId: string,
    _address: string,
    _lockedUntil: number,
    _receiverPublicKey: string,
  ): Promise<{ grant: Grant; transactionId: string }> {
    throw new Error("Call idOS.setSigner first.");
  }

  async revoke(
    _tableName: string,
    _recordId: string,
    _grantee: string,
    _dataId: string,
    _lockedUntil: number,
  ): Promise<{ grant: Grant; transactionId: string }> {
    throw new Error("Call idOS.setSigner first.");
  }

  async shareMatchingEntry(
    _tableName: string,
    _publicFields: Record<string, string>,
    _privateFieldFilters: {
      pick: Record<string, string>;
      omit: Record<string, string>;
    },
    _address: string,
    _lockedUntil: number,
    _receiverPublicKey: string,
  ): Promise<{ grant: Grant; transactionId: string }> {
    throw new Error("Call idOS.setSigner first.");
  }
}

class ConnectedGrants extends Grants {
  #child: GrantChild;

  constructor(
    public readonly data: Data,
    public readonly enclave: Enclave,
    child: GrantChild,
  ) {
    super(data, enclave);
    this.#child = child;
  }

  async list(
    args: {
      owner?: string;
      grantee?: string;
      dataId?: string;
    } = {},
  ): Promise<Grant[]> {
    return this.#child.list(args);
  }

  async create(
    tableName: string,
    recordId: string,
    address: string,
    lockedUntil: number,
    receiverPublicKey: string,
  ): Promise<{ grant: Grant; transactionId: string }> {
    const share = await this.data.share(tableName, recordId, receiverPublicKey);

    return await this.#child.create({
      grantee: address,
      dataId: share.id,
      lockedUntil: lockedUntil,
    });
  }

  async shareMatchingEntry(
    tableName: string,
    publicFields: Record<string, string>,
    privateFieldFilters: {
      pick: Record<string, string>;
      omit: Record<string, string>;
    },
    address: string,
    lockedUntil: number,
    receiverPublicKey: string,
  ): Promise<{ grant: Grant; transactionId: string }> {
    const allEntries = (await this.data.list(tableName)) as unknown as idOSCredential[];

    const filteredEntries = allEntries.filter((entry) => {
      const keys = Object.keys(publicFields);

      for (const key of keys) {
        const meta = JSON.parse(entry.public_notes) as Record<string, string>;
        if (meta[key] !== publicFields[key]) return false;
      }

      return true;
    });

    const filteredEntriesWithContent = await Promise.all(
      filteredEntries.map(async (credential) => {
        const fullCredential = await this.data.get(
          "credentials",
          (credential as unknown as idOSCredential).id,
          false,
        );
        return fullCredential;
      }),
    );

    if (!filteredEntriesWithContent.length) throw new Error("No matching credentials to share");

    const eligibleEntries = await this.enclave.filterCredentials(
      filteredEntriesWithContent as Record<string, string>[],
      privateFieldFilters,
    );

    if (!eligibleEntries.length) throw new Error("No matching credentials");

    const selectedEntry = eligibleEntries[0];
    const { id: dataId } = await this.data.share(tableName, selectedEntry.id, receiverPublicKey);

    return await this.#child.create({
      grantee: address,
      dataId,
      lockedUntil,
    });
  }

  async revoke(
    tableName: string,
    recordId: string,
    grantee: string,
    dataId: string,
    lockedUntil: number,
  ): Promise<{ grant: Grant; transactionId: string }> {
    await this.data.unshare(tableName, recordId);

    return this.#child.revoke({ grantee, dataId, lockedUntil });
  }

  async messageForCreateBySignature(grant: Grant) {
    return this.#child.messageForCreateBySignature(grant);
  }

  async messageForRevokeBySignature(grant: Grant) {
    return this.#child.messageForRevokeBySignature(grant);
  }
}
