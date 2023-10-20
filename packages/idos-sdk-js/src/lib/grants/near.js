import * as nearAPI from "near-api-js";

export class NearGrants {
  #contract;
  #wallet;

  static defaultContractId = "idos-dev-1.testnet";
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

  async list({ owner, grantee, dataId, lockedUntil } = {}) {
    lockedUntil *= 1e7;

    let grantsFilter = { owner, grantee, dataId, lockedUntil };
    Object.entries(grantsFilter).forEach(([k, v]) => !v && delete grantsFilter[k]);

    if (!(owner || grantee)) {
      throw new Error("Must provide `owner` and/or `grantee`");
    }

    const grants = await this.#contract[this.constructor.contractMethods.list](grantsFilter);

    grants.forEach((grant) => (grant.lockedUntil /= 1e6));

    return grants;
  }

  async create({ grantee, dataId, lockedUntil } = {}) {
    lockedUntil *= 1e7;

    let transactionResult;

    let newGrant = { grantee, dataId, lockedUntil };
    Object.entries({ grantee, dataId, lockedUntil }).forEach(([k, v]) => !v && delete newGrant[k]);

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
      throw new Error("Grant creation failed", {
        // cause: JSON.parse(e.message).kind,
      });
    }

    return { transactionId: transactionResult.transaction.hash };
  }

  async revoke({ grantee, dataId } = {}) {
    let transactionResult;

    try {
      transactionResult = await this.#wallet.signAndSendTransaction({
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: this.constructor.contractMethods.revoke,
              args: { grantee, dataId },
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
