import * as nearAPI from "near-api-js";

export class NearGrants {
  #contract;
  #wallet;

  static defaultContractId = "idos-dev-2.testnet";
  static contractMethods = {
    list: "find_grants",
    create: "insert_grant",
    revoke: "delete_grant",
  };

  constructor() {}

  async init({ accountId, wallet, contractId }) {
    this.#wallet = wallet;
    await this.#connectContract(accountId, contractId);
  }

  // FIXME: near-rs expects data_id, near-ts expects dataId
  async list({ owner, grantee, dataId: data_id, lockedUntil } = {}) {
    lockedUntil *= 1e7;

    let grantsFilter = { owner, grantee, data_id, lockedUntil };
    Object.entries(grantsFilter).forEach(([k, v]) => !v && delete grantsFilter[k]);

    if (!(owner || grantee)) {
      throw new Error("Must provide `owner` and/or `grantee`");
    }

    const grants = await this.#contract[this.constructor.contractMethods.list](grantsFilter);
    grants.forEach((grant) => (grant.lockedUntil /= 1e6));
    return grants;
  }

  // FIXME: near-rs expects data_id, near-ts expects dataId
  async create({ grantee, dataId: data_id, lockedUntil } = {}) {
    lockedUntil *= 1e7;
    let transactionResult;
    let newGrant = { grantee, data_id, lockedUntil };
    Object.entries({ grantee, data_id, lockedUntil }).forEach(([k, v]) => !v && delete newGrant[k]);

    try {
      transactionResult = await this.#wallet.signAndSendTransaction({
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
  async revoke({ grantee, dataId: data_id } = {}) {
    let transactionResult;

    try {
      transactionResult = await this.#wallet.signAndSendTransaction({
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: this.constructor.contractMethods.revoke,
              args: { grantee, data_id },
              gas: "30000000000000",
            },
          },
        ],
      });
    } catch (e) {
      throw new Error("Grant creation failed", {
        cause: JSON.parse(e.message).kind,
      });
    }
    return { transactionId: transactionResult.transaction.hash };
  }

  async #connectContract(accountId, contractId) {
    contractId = contractId || this.constructor.defaultContractId;

    const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();
    const nearConnection = await nearAPI.connect({
      networkId: "testnet",
      keyStore: keyStore,
      nodeUrl: "https://rpc.testnet.near.org",
    });

    const account = await nearConnection.account(accountId);
    this.#contract = new nearAPI.Contract(account, contractId, {
      viewMethods: [this.constructor.contractMethods.list],
    });
  }
}
