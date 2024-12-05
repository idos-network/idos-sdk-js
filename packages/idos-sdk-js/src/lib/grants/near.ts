import type { SignMessageParams, SignedMessage, Wallet } from "@near-wallet-selector/core";
import * as Base64Codec from "@stablelib/base64";
import type { Contract, connect, keyStores, providers } from "near-api-js";
import { Nonce } from "../nonce";
import Grant from "./grant";
import type { GrantChild } from "./grant-child";

interface NearContractGrant {
  owner: string;
  grantee: string;
  data_id: string;
  locked_until: number;
}

const compact = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  return Object.fromEntries(Object.entries(obj).filter(([_k, v]) => v)) as Partial<T>;
};

export interface NearGrantsOptions {
  network?: string;
  contractId?: string;
  rpcUrl?: string;
}

export class NearGrants implements GrantChild {
  #contract: Contract;
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

  private constructor(signer: Wallet, contract: Contract, publicKey: string) {
    this.#signer = signer;
    this.#contract = contract;
    this.#publicKey = publicKey;
  }

  static async init({
    accountId,
    signer,
    options,
    nearWalletPublicKey,
  }: {
    accountId: string;
    signer: Wallet;
    options: NearGrantsOptions;
    nearWalletPublicKey: string;
  }): Promise<NearGrants> {
    let near_api: {
      Contract: typeof Contract;
      connect: typeof connect;
      keyStores: typeof keyStores;
    };
    try {
      const { Contract, connect, keyStores } = await import("near-api-js");
      near_api = { Contract, connect, keyStores };
    } catch (e) {
      throw new Error("Can't load near-api-js");
    }

    const keylessNearConnection = await near_api.connect({
      networkId: options.network ?? NearGrants.defaultNetwork,
      keyStore: new near_api.keyStores.BrowserLocalStorageKeyStore(),
      nodeUrl: options.rpcUrl ?? NearGrants.defaultRpcUrl,
    });

    return new NearGrants(
      signer,
      new near_api.Contract(
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
          // biome-ignore lint/suspicious/noExplicitAny: fix `useLocalViewExecution` is not in  types.
        } as any,
      ),
      nearWalletPublicKey,
    );
  }

  #result(
    grant: NearContractGrant,
    transactionResult?: providers.FinalExecutionOutcome,
  ): { grant: Grant; transactionId: string } {
    if (!transactionResult) throw new Error("Unexpected absent transactionResult");

    return {
      grant: {
        ownerAddress: grant.owner,
        granteeAddress: grant.grantee,
        lockedUntil: grant.locked_until,
        dataId: grant.data_id,
      },
      transactionId: transactionResult.transaction.hash,
    };
  }

  async #sign(
    message: string,
    recipient: string,
    nonceSuggestion: Uint8Array = new Nonce(32).bytes,
  ) {
    // biome-ignore lint/style/noNonNullAssertion: Only non-signing wallets return void.
    const { nonce, signature: b64Signature } = (await (
      this.#signer.signMessage as (
        _: SignMessageParams,
      ) => Promise<SignedMessage & { nonce?: Uint8Array }>
    )({
      message,
      recipient,
      nonce: Buffer.from(nonceSuggestion),
    }))!;

    if (!nonce) throw new Error("signMessage is expected to return a nonce, but it didn't");

    return {
      signature: Base64Codec.decode(b64Signature),
      nonce,
    };
  }

  async list({
    ownerAddress: owner,
    granteeAddress: grantee,
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
      args: Partial<NearContractGrant>,
    ) => Promise<NearContractGrant[]>;

    return (await method(grantsFilter)).map(
      ({ data_id, locked_until, owner, grantee, ...values }) =>
        new Grant({
          ...values,
          ownerAddress: owner,
          granteeAddress: grantee,
          dataId: data_id,
          lockedUntil: locked_until / 1e6,
        }),
    );
  }

  /// Creates an AccessGrant for the current signer.
  ///
  /// NOTE: NEAR is problematic for the current implementation. The only way to create an AG in the contract if to
  /// create an dAG for yourself.
  async create({
    granteeAddress,
    dataId,
    lockedUntil,
  }: Omit<Grant, "ownerAddress"> & { wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }> {
    const ownerAddress = this.#publicKey;

    const recipient = await this.messageRecipient();
    const message = await this.messageForCreateBySignature({
      ownerAddress,
      granteeAddress,
      dataId,
      lockedUntil,
    });

    const { nonce, signature } = await this.#sign(message, recipient);

    return this.createBySignature({
      ownerAddress,
      granteeAddress,
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
    ownerAddress: owner,
    granteeAddress: grantee,
    dataId: data_id,
    lockedUntil,
  }: Grant): Promise<string> {
    const locked_until = lockedUntil && lockedUntil * 1e7;

    // @ts-ignore This is not declared, but it's documented. See https://docs.near.org/tools/near-api-js/contract#call-contract
    const method = this.#contract[NearGrants.contractMethods.messageForCreateBySignature] as (
      args: NearContractGrant,
    ) => Promise<string>;

    return await method({
      owner,
      grantee,
      data_id,
      locked_until,
    });
  }

  async createBySignature({
    ownerAddress: owner,
    granteeAddress: grantee,
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

    let transactionResult: providers.FinalExecutionOutcome | undefined;
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
    granteeAddress,
    dataId,
    lockedUntil,
  }: Omit<Grant, "ownerAddress"> & { wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }> {
    const ownerAddress = this.#publicKey;

    const recipient = await this.messageRecipient();
    const message = await this.messageForRevokeBySignature({
      ownerAddress,
      granteeAddress,
      dataId,
      lockedUntil,
    });

    const { nonce, signature } = await this.#sign(message, recipient);

    return this.revokeBySignature({
      ownerAddress,
      granteeAddress,
      dataId,
      lockedUntil,
      signature,
      nonce,
    });
  }

  async messageForRevokeBySignature({
    ownerAddress: owner,
    granteeAddress: grantee,
    dataId: data_id,
    lockedUntil,
  }: Grant): Promise<string> {
    const locked_until = lockedUntil && lockedUntil * 1e7;

    // @ts-ignore This is not declared, but it's documented. See https://docs.near.org/tools/near-api-js/contract#call-contract
    const method = this.#contract[NearGrants.contractMethods.messageForRevokeBySignature] as (
      args: NearContractGrant,
    ) => Promise<string>;

    return await method({
      owner,
      grantee,
      data_id,
      locked_until,
    });
  }

  async revokeBySignature({
    ownerAddress: owner,
    granteeAddress: grantee,
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

    let transactionResult: providers.FinalExecutionOutcome | undefined;
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
