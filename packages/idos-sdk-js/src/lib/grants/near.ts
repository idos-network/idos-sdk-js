import type { SignMessageParams, SignedMessage, Wallet } from "@near-wallet-selector/core";
import * as Base64Codec from "@stablelib/base64";
import * as nearAPI from "near-api-js";
import { Nonce } from "../nonce";
import Grant from "./grant";
import { GrantChild } from "./grant-child";

interface NearContractGrant {
  owner: string;
  grantee: string;
  data_id: string;
  locked_until: number;
}

const compact = <T extends Object>(obj: T): Partial<T> => {
  return Object.fromEntries(Object.entries(obj).filter(([_k, v]) => v)) as Partial<T>;
};

export interface NearGrantsOptions {
  network?: string;
  contractId?: string;
  rpcUrl?: string;
}

export class NearGrants extends GrantChild {
  #contract: nearAPI.Contract;
  #signer: Wallet;
  #owner: string;
  #publicKey: string;

  static defaultNetwork = import.meta.env.VITE_IDOS_NEAR_DEFAULT_NETWORK;
  static defaultContractId = import.meta.env.VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID;
  static defaultRpcUrl = import.meta.env.VITE_IDOS_NEAR_DEFAULT_RPC_URL;

  static contractMethods = {
    list: "find_grants",
    create: "insert_grant_by_signature",
    prepareMessage: "insert_grant_by_signature_message",
    revoke: "delete_grant_by_signature"
  } as const;

  private constructor(
    signer: Wallet,
    owner: string,
    contract: nearAPI.Contract,
    publicKey: string
  ) {
    super();
    this.#signer = signer;
    this.#owner = owner;
    this.#contract = contract;
    this.#publicKey = publicKey;
  }

  static async build({
    accountId,
    signer,
    options,
    publicKey
  }: {
    accountId: string;
    signer: Wallet;
    options: NearGrantsOptions;
    publicKey: string;
  }): Promise<NearGrants> {
    const keylessNearConnection = await nearAPI.connect({
      networkId: options.network ?? this.defaultNetwork,
      keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
      nodeUrl: options.rpcUrl ?? this.defaultRpcUrl
    });

    return new this(
      signer,
      accountId,
      new nearAPI.Contract(
        await keylessNearConnection.account(accountId),
        options.contractId ?? this.defaultContractId,
        {
          viewMethods: [this.contractMethods.list],
          changeMethods: []
        }
      ),
      publicKey
    );
  }

  #result(
    grant: Omit<NearContractGrant, "owner">,
    transactionResult: nearAPI.providers.FinalExecutionOutcome | undefined
  ): { grant: Grant; transactionId: string } {
    if (!transactionResult) throw new Error("Unexpected absent transactionResult");

    return {
      grant: {
        grantee: grant.grantee,
        lockedUntil: grant.locked_until,
        dataId: grant.data_id,
        owner: this.#owner
      },
      transactionId: transactionResult.transaction.hash
    };
  }

  // FIXME: near-rs expects data_id, near-ts expects dataId
  async list({
    owner,
    grantee,
    dataId: data_id
  }: Partial<Omit<Grant, "lockedUntil">> = {}): Promise<Grant[]> {
    if (!(owner || grantee)) throw new Error("Must provide `owner` and/or `grantee`");

    const grantsFilter: Partial<Omit<NearContractGrant, "locked_until">> = compact({
      owner,
      grantee,
      data_id
    });

    // @ts-ignore This is not declared, but it's documented. See https://docs.near.org/tools/near-api-js/contract#call-contract
    const method = this.#contract[this.constructor.contractMethods.list] as (
      args: Partial<NearContractGrant>
    ) => Promise<NearContractGrant[]>;

    return (await method(grantsFilter)).map(
      (o) =>
        new Grant({
          ...o,
          dataId: o.data_id,
          lockedUntil: o.locked_until / 1e6
        })
    );
  }

  // FIXME: near-rs expects data_id, near-ts expects dataId
  async create({
    grantee,
    dataId: data_id,
    lockedUntil
  }: Omit<Grant, "owner"> & { wait?: boolean }): Promise<{ grant: Grant; transactionId: string }> {
    const locked_until = lockedUntil && lockedUntil * 1e7;

    const recipient = "idos.network";
    const nonceSuggestion = Buffer.from(new Nonce(32).bytes);
    const message = [
      "operation: insertGrant",
      `owner: ${this.#publicKey}`,
      `grantee: ${grantee}`,
      `dataId: ${data_id}`,
      `lockedUntil: ${locked_until}`
    ].join("\n");

    const { nonce = nonceSuggestion, signature } = (await (
      this.#signer.signMessage as (
        _: SignMessageParams
      ) => Promise<SignedMessage & { nonce?: Uint8Array }>
    )({
      message,
      recipient,
      nonce: nonceSuggestion
    }))!;

    const grant = {
      owner: this.#publicKey,
      grantee,
      data_id,
      locked_until,
      nonce: Array.from(nonce),
      signature: Array.from(Base64Codec.decode(signature))
    };

    let transactionResult;
    try {
      transactionResult =
        (await this.#signer.signAndSendTransaction({
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: NearGrants.contractMethods.create,
                args: grant,
                gas: "30000000000000",
                deposit: "0"
              }
            }
          ]
        })) || undefined;
    } catch (e) {
      throw new Error("Grant creation failed", { cause: e });
    }

    return this.#result(grant, transactionResult);
  }

  // FIXME: near-rs expects data_id, near-ts expects dataId
  async revoke({
    grantee,
    dataId: data_id,
    lockedUntil
  }: Omit<Grant, "owner">): Promise<{ grant: Grant; transactionId: string }> {
    const locked_until = lockedUntil && lockedUntil * 1e7;

    const recipient = "idos.network";
    const nonceSuggestion = Buffer.from(new Nonce(32).bytes);
    const message = [
      "operation: deleteGrant",
      `owner: ${this.#publicKey}`,
      `grantee: ${grantee}`,
      `dataId: ${data_id}`,
      `lockedUntil: ${locked_until}`
    ].join("\n");

    const { nonce = nonceSuggestion, signature } = (await (
      this.#signer.signMessage as (
        _: SignMessageParams
      ) => Promise<SignedMessage & { nonce?: Uint8Array }>
    )({
      message,
      recipient,
      nonce: nonceSuggestion
    }))!;

    const grant = {
      owner: this.#publicKey,
      grantee,
      data_id,
      locked_until,
      nonce: Array.from(nonce),
      signature: Array.from(Base64Codec.decode(signature))
    };

    let transactionResult;
    try {
      transactionResult =
        (await this.#signer.signAndSendTransaction({
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: NearGrants.contractMethods.revoke,
                args: grant,
                gas: "30000000000000",
                deposit: "0"
              }
            }
          ]
        })) || undefined;
    } catch (e) {
      throw new Error("Grant revocation failed", { cause: e });
    }

    return this.#result(grant, transactionResult);
  }
}
