import * as nearAPI from "near-api-js";

export class NearGrants {
  #contract;
  #wallet;

  static contractMethods = {
    list: "find_grants",
    create: "insert_grant",
    revoke: "delete_grant",
  };

  constructor() {}

  init({ accountId, wallet, contractId }) {
    this.#wallet = wallet;
    this.#connectContract(accountId, contractId);
  }

  async list({ owner, grantee, dataId } = {}) {
    if (!(owner || grantee)) {
      throw new Error("Must provide `owner` and/or `grantee`");
    }

    return await this.#contract[
      this.constructor.contractMethods.list
    ]({ owner, grantee, dataId });
  }

  async create({ grantee, dataId } = {}) {
    let transactionResult;

    try {
      transactionResult = await this.#wallet.signAndSendTransaction({
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: this.constructor.contractMethods.create,
              args: { grantee, dataId },
              gas: "30000000000000",
            },
          },
        ],
      });
    } catch (e) {
      throw new Error("Grant creation failed", {
        cause: JSON.parse(e.message).kind
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
        cause: JSON.parse(e.message).kind
      });
    }

    return { transactionId: transactionResult.transaction.hash };
  }

  async #connectContract(accountId, contractId) {
    contractId = contractId || "idos-dev-1.testnet";

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
