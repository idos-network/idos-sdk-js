import * as nearAPI from "near-api-js";

const IMPLICIT_ACCOUNTS_RE = /^[0-9a-f]{64,64}$/i;

export class NearGrants {
  #contract;
  #accountId;
  #publicKey;
  #signer;
  #nearConnection;

  static defaultNetwork = import.meta.env.VITE_IDOS_NEAR_DEFAULT_NETWORK;
  static defaultContractId = import.meta.env.VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID;
  static defaultRpcUrl = import.meta.env.VITE_IDOS_NEAR_DEFAULT_RPC_URL;
  static contractMethods = {
    list: "find_grants",
    create: "insert_grant",
    revoke: "delete_grant",
  };

  constructor() {}

  dump() {
    return {
      contract: this.#contract,
      accountId: this.#accountId,
      publicKey: this.#publicKey,
      signer: this.#signer,
      nearConnection: this.#nearConnection,
    };
  }

  async init({ accountId, signer, publicKey }) {
    this.#accountId = accountId;
    this.#publicKey = publicKey;
    this.#signer = signer;
    this.#nearConnection = await nearAPI.connect({
      networkId: this.constructor.defaultNetwork,
      keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
      nodeUrl: this.constructor.defaultRpcUrl,
    });

    this.#contract = new nearAPI.Contract(
      await this.#nearConnection.account(accountId),
      this.constructor.defaultContractId,
      {
        viewMethods: [this.constructor.contractMethods.list],
        changeMethods: [this.constructor.contractMethods.create, this.constructor.contractMethods.revoke],
      }
    );
  }

  // FIXME: near-rs expects data_id, near-ts expects dataId
  async list({ owner: ownerPublicKey, grantee: granteePublicKey, dataId: data_id, lockedUntil } = {}) {
    lockedUntil *= 1e7;

    let grantsFilter = { owner: ownerPublicKey, grantee: granteePublicKey, data_id, lockedUntil };
    Object.entries(grantsFilter).forEach(([k, v]) => !v && delete grantsFilter[k]);

    if (!(grantsFilter.owner || grantsFilter.grantee)) {
      throw new Error("Must provide `owner` and/or `grantee`");
    }

    const grants = await this.#contract[this.constructor.contractMethods.list](grantsFilter);
    grants.forEach((grant) => (grant.lockedUntil /= 1e6));
    return grants;
  }

  // FIXME: near-rs expects data_id, near-ts expects dataId
  async create({ grantee: granteePublicKey, dataId: data_id, lockedUntil } = {}) {
    lockedUntil *= 1e7;

    let newGrant = { grantee: granteePublicKey, data_id, lockedUntil };
    Object.entries({ grantee: granteePublicKey, data_id, lockedUntil }).forEach(([k, v]) => !v && delete newGrant[k]);

    let transactionResult;
    try {
      transactionResult = await this.#signer.signAndSendTransaction({
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: this.constructor.contractMethods.create,
              args: newGrant,
              gas: "30000000000000",
            },
          },
        ],
      });
    } catch (e) {
      console.error(e);
      throw new Error("Grant creation failed");
    }
    return { transactionId: transactionResult.transaction.hash };
  }

  // FIXME: near-rs expects data_id, near-ts expects dataId
  async revoke({ grantee: granteePublicKey, dataId: data_id } = {}) {
    let transactionResult;
    try {
      transactionResult = await this.#signer.signAndSendTransaction({
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: this.constructor.contractMethods.revoke,
              args: { grantee: granteePublicKey, data_id },
              gas: "30000000000000",
            },
          },
        ],
      });
    } catch (e) {
      throw new Error("Grant revocation failed", {
        cause: JSON.parse(e.message).kind,
      });
    }
    return { transactionId: transactionResult.transaction.hash };
  }
}
