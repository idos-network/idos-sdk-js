import type { Wallet } from "@near-wallet-selector/core";
import * as nearAPI from "near-api-js";
import Grant from "./grant";

interface NearContractGrant {
  owner: string;
  grantee: string;
  data_id: string;
  locked_until: number;
}

const compact = <T extends Object>(obj: T): Partial<T> => {
  return Object.fromEntries(Object.entries(obj).filter(([_k, v]) => v)) as Partial<T>;
};

export class NearGrants {
  #contract: nearAPI.Contract;
  #signer: Wallet;

  static defaultNetwork = import.meta.env.VITE_IDOS_NEAR_DEFAULT_NETWORK;
  static defaultContractId = import.meta.env.VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID;
  static defaultRpcUrl = import.meta.env.VITE_IDOS_NEAR_DEFAULT_RPC_URL;
  static contractMethods = {
    list: "find_grants",
    create: "insert_grant",
    revoke: "delete_grant",
  } as const;

  private constructor(signer: Wallet, contract: nearAPI.Contract) {
    this.#signer = signer;
    this.#contract = contract;
  }

  static async build({ accountId, signer }: { accountId: string; signer: Wallet }): Promise<NearGrants> {
    const keylessNearConnection = await nearAPI.connect({
      networkId: this.defaultNetwork,
      keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
      nodeUrl: this.defaultRpcUrl,
    });

    return new this(
      signer,
      new nearAPI.Contract(await keylessNearConnection.account(accountId), this.defaultContractId, {
        viewMethods: [this.contractMethods.list],
        changeMethods: [],
      })
    );
  }

  // FIXME: near-rs expects data_id, near-ts expects dataId
  async list({ owner, grantee, dataId: data_id }: Partial<Omit<Grant, "lockedUntil">> = {}): Promise<Grant[]> {
    if (!(owner || grantee)) throw new Error("Must provide `owner` and/or `grantee`");

    let grantsFilter: Partial<Omit<NearContractGrant, "locked_until">> = compact({ owner, grantee, data_id });

    // @ts-ignore This is not declared, but it's documented. See https://docs.near.org/tools/near-api-js/contract#call-contract
    const method = this.#contract[this.constructor.contractMethods.list] as (
      args: Partial<NearContractGrant>
    ) => Promise<NearContractGrant[]>;

    return (await method(grantsFilter)).map((o) => ({ ...o, dataId: o.data_id, lockedUntil: (o.locked_until /= 1e6) }));
  }

  // FIXME: near-rs expects data_id, near-ts expects dataId
  async create({
    grantee,
    dataId: data_id,
    lockedUntil,
  }: Omit<Grant, "owner"> & { wait?: boolean }): Promise<{ transactionId: string }> {
    const locked_until = lockedUntil && lockedUntil * 1e7;
    const grant: Omit<NearContractGrant, "owner"> = { grantee, data_id, locked_until };

    let transactionResult;
    try {
      transactionResult = await this.#signer.signAndSendTransaction({
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: NearGrants.contractMethods.create,
              args: grant,
              gas: "30000000000000",
              deposit: "0",
            },
          },
        ],
      });
    } catch (e) {
      throw new Error("Grant creation failed", { cause: e });
    }
    if (!transactionResult) throw new Error("Unexpected absent transactionResult");
    return { transactionId: transactionResult.transaction.hash };
  }

  // FIXME: near-rs expects data_id, near-ts expects dataId
  async revoke({ grantee, dataId: data_id, lockedUntil }: Omit<Grant, "owner">): Promise<{ transactionId: string }> {
    const locked_until = lockedUntil && lockedUntil * 1e7;
    let grant: Omit<NearContractGrant, "owner"> = { grantee, data_id, locked_until };

    let transactionResult;
    try {
      transactionResult = await this.#signer.signAndSendTransaction({
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: NearGrants.contractMethods.revoke,
              args: grant,
              gas: "30000000000000",
              deposit: "0",
            },
          },
        ],
      });
    } catch (e) {
      throw new Error("Grant revocation failed", { cause: e });
    }
    if (!transactionResult) throw new Error("Unexpected absent transactionResult");
    return { transactionId: transactionResult.transaction.hash };
  }
}
