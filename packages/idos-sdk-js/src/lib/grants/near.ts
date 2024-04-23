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

export class NearGrants implements GrantChild {
  #contract: nearAPI.Contract;
  #signer: Wallet;
  #publicKey: string;

  static defaultNetwork = import.meta.env.VITE_IDOS_NEAR_DEFAULT_NETWORK;
  static defaultContractId = import.meta.env.VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID;
  static defaultRpcUrl = import.meta.env.VITE_IDOS_NEAR_DEFAULT_RPC_URL;

  static contractMethods = {
    list: "find_grants",
    messageRecipient: "grant_message_recipient",
    messageForCreateBySignature: "insert_grant_by_signature_message",
    createBySignature: "insert_grant_by_signature",
    messageForRevokeBySignature: "delete_grant_by_signature_message",
    revokeBySignature: "delete_grant_by_signature",
  } as const;

  private constructor(signer: Wallet, contract: nearAPI.Contract, publicKey: string) {
    this.#signer = signer;
    this.#contract = contract;
    this.#publicKey = publicKey;
  }

  static async init({
    accountId,
    signer,
    options,
    publicKey,
  }: {
    accountId: string;
    signer: Wallet;
    options: NearGrantsOptions;
    publicKey: string;
  }): Promise<NearGrants> {
    const keylessNearConnection = await nearAPI.connect({
      networkId: options.network ?? NearGrants.defaultNetwork,
      keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
      nodeUrl: options.rpcUrl ?? NearGrants.defaultRpcUrl,
    });

    return new NearGrants(
      signer,
      new nearAPI.Contract(
        await keylessNearConnection.account(accountId),
        options.contractId ?? NearGrants.defaultContractId,
        {
          useLocalViewExecution: false,
          viewMethods: [
            NearGrants.contractMethods.list,
            NearGrants.contractMethods.messageRecipient,
            NearGrants.contractMethods.messageForCreateBySignature,
            NearGrants.contractMethods.messageForRevokeBySignature,
          ],
          changeMethods: [
            NearGrants.contractMethods.createBySignature,
            NearGrants.contractMethods.revokeBySignature,
          ],
        }
      ),
      publicKey
    );
  }

  #result(
    grant: NearContractGrant,
    transactionResult: nearAPI.providers.FinalExecutionOutcome | undefined
  ): { grant: Grant; transactionId: string } {
    if (!transactionResult) throw new Error("Unexpected absent transactionResult");

    return {
      grant: {
        owner: grant.owner,
        grantee: grant.grantee,
        lockedUntil: grant.locked_until,
        dataId: grant.data_id,
      },
      transactionId: transactionResult.transaction.hash,
    };
  }

  async #sign(
    message: string,
    recipient: string,
    nonceSuggestion: Buffer = Buffer.from(new Nonce(32).bytes)
  ) {
    // biome-ignore lint/style/noNonNullAssertion: Only non-signing wallets return void.
    const { nonce = nonceSuggestion, signature: b64Signature } = (await (
      this.#signer.signMessage as (
        _: SignMessageParams
      ) => Promise<SignedMessage & { nonce?: Uint8Array }>
    )({
      message,
      recipient,
      nonce: nonceSuggestion,
    }))!;
    const signature = Base64Codec.decode(b64Signature);

    return { signature, nonce };
  }

  async list({
    owner,
    grantee,
    dataId: data_id,
  }: Partial<Omit<Grant, "lockedUntil">> = {}): Promise<Grant[]> {
    if (!(owner || grantee)) throw new Error("Must provide `owner` and/or `grantee`");

    const grantsFilter: Partial<Omit<NearContractGrant, "locked_until">> = compact({
      owner,
      grantee,
      data_id,
    });

    // @ts-ignore This is not declared, but it's documented. See https://docs.near.org/tools/near-api-js/contract#call-contract
    const method = this.#contract[this.constructor.contractMethods.list] as (
      args: Partial<NearContractGrant>
    ) => Promise<NearContractGrant[]>;

    return (await method(grantsFilter)).map(
      ({ data_id, locked_until, ...values }) =>
        new Grant({
          ...values,
          dataId: data_id,
          lockedUntil: locked_until / 1e6,
        })
    );
  }

  /// Creates an AccessGrant for the current signer.
  ///
  /// NOTE: NEAR is problematic for the current implementation. The only way to create an AG in the contract if to
  /// create an dAG for yourself.
  async create({
    grantee,
    dataId,
    lockedUntil,
  }: Omit<Grant, "owner"> & { wait?: boolean }): Promise<{ grant: Grant; transactionId: string }> {
    const owner = this.#publicKey;

    const recipient = await this.messageRecipient();
    const message = await this.messageForCreateBySignature({
      owner,
      grantee,
      dataId,
      lockedUntil,
    });

    const { nonce, signature } = await this.#sign(message, recipient);

    return this.createBySignature({
      owner,
      grantee,
      dataId,
      lockedUntil,
      signature,
      nonce,
    });
  }

  async messageRecipient() {
    // @ts-ignore This is not declared, but it's documented. See https://docs.near.org/tools/near-api-js/contract#call-contract
    const method = this.#contract[
      NearGrants.contractMethods.messageRecipient
    ] as () => Promise<string>;

    return await method();
  }

  async messageForCreateBySignature({
    owner,
    grantee,
    dataId: data_id,
    lockedUntil,
  }: Grant): Promise<string> {
    const locked_until = lockedUntil && lockedUntil * 1e7;

    // @ts-ignore This is not declared, but it's documented. See https://docs.near.org/tools/near-api-js/contract#call-contract
    const method = this.#contract[NearGrants.contractMethods.messageForCreateBySignature] as (
      args: NearContractGrant
    ) => Promise<string>;

    return await method({
      owner,
      grantee,
      data_id,
      locked_until,
    });
  }

  async createBySignature({
    owner,
    grantee,
    dataId: data_id,
    lockedUntil,
    signature,
    nonce,
  }: Grant & { signature: Uint8Array; nonce: Uint8Array; wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }> {
    if (!nonce) throw new Error("Must provide nonce");

    const locked_until = lockedUntil && lockedUntil * 1e7;
    const grant = {
      owner,
      grantee,
      data_id,
      locked_until,
    };

    let transactionResult;
    try {
      transactionResult =
        (await this.#signer.signAndSendTransaction({
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: NearGrants.contractMethods.createBySignature,
                args: {
                  ...grant,
                  nonce: Array.from(nonce),
                  signature: Array.from(signature),
                },
                gas: "30000000000000",
                deposit: "0",
              },
            },
          ],
        })) || undefined;
    } catch (e) {
      throw new Error("Grant creation by signature failed", { cause: e });
    }

    return this.#result(grant, transactionResult);
  }

  /// Revokes an AccessGrant for the current signer.
  ///
  /// NOTE: NEAR is problematic for the current implementation. The only way to revoke an AG in the contract if to
  /// create an dAG for yourself.
  async revoke({
    grantee,
    dataId,
    lockedUntil,
  }: Omit<Grant, "owner"> & { wait?: boolean }): Promise<{ grant: Grant; transactionId: string }> {
    const owner = this.#publicKey;

    const recipient = await this.messageRecipient();
    const message = await this.messageForRevokeBySignature({
      owner,
      grantee,
      dataId,
      lockedUntil,
    });

    const { nonce, signature } = await this.#sign(message, recipient);

    return this.revokeBySignature({
      owner,
      grantee,
      dataId,
      lockedUntil,
      signature,
      nonce,
    });
  }

  async messageForRevokeBySignature({
    owner,
    grantee,
    dataId: data_id,
    lockedUntil,
  }: Grant): Promise<string> {
    const locked_until = lockedUntil && lockedUntil * 1e7;

    // @ts-ignore This is not declared, but it's documented. See https://docs.near.org/tools/near-api-js/contract#call-contract
    const method = this.#contract[NearGrants.contractMethods.messageForRevokeBySignature] as (
      args: NearContractGrant
    ) => Promise<string>;

    return await method({
      owner,
      grantee,
      data_id,
      locked_until,
    });
  }

  async revokeBySignature({
    owner,
    grantee,
    dataId: data_id,
    lockedUntil,
    signature,
    nonce,
  }: Grant & { signature: Uint8Array; nonce: Uint8Array; wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }> {
    if (!nonce) throw new Error("Must provide nonce");

    const locked_until = lockedUntil && lockedUntil * 1e7;
    const grant = {
      owner,
      grantee,
      data_id,
      locked_until,
    };

    let transactionResult;
    try {
      transactionResult =
        (await this.#signer.signAndSendTransaction({
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: NearGrants.contractMethods.revokeBySignature,
                args: {
                  ...grant,
                  nonce: Array.from(nonce),
                  signature: Array.from(signature),
                },
                gas: "30000000000000",
                deposit: "0",
              },
            },
          ],
        })) || undefined;
    } catch (e) {
      throw new Error("Grant revocation by signature failed", { cause: e });
    }

    return this.#result(grant, transactionResult);
  }
}
