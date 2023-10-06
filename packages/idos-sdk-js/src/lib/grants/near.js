import * as nearAPI from "near-api-js";

export class NearGrants {
  #account;
  #contract;
  #wallet;

  constructor() {}

  init({ account, wallet }) {
    this.#account = account;
    this.#wallet = wallet;
    this.#connectContract();
  }

  async list({ owner, grantee, id: dataId }) {
    return await this.#contract.find_grants({ owner, grantee, data_id: dataId });
  }

  async create({ grantee, id: dataId } = {}) {
    return await this.#wallet.signAndSendTransaction({
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "insert_grant",
            args: { grantee, data_id: dataId },
            gas: "30000000000000",
          },
        },
      ],
    });
  }

  async #connectContract() {
    const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();
    const nearConnection = await nearAPI.connect({
      networkId: "testnet",
      keyStore: keyStore,
      nodeUrl: "https://rpc.testnet.near.org",
    });

    const account = await nearConnection.account(this.#account);

    this.#contract = new nearAPI.Contract(account, "idos-dev-1.testnet", {
      viewMethods: ["find_grants"],
    });
  }
}
