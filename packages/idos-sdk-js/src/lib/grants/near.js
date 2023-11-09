import * as nearAPI from "near-api-js";

const IMPLICIT_ACCOUNTS_RE = /^[0-9a-f]{64,64}$/i;

export class NearGrants {
  #contract;
  #accountId;
  #publicKey;
  #signer;

  static defaultNetwork = import.meta.env.VITE_IDOS_NEAR_DEFAULT_NETWORK;
  static defaultContractId = import.meta.env.VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID;
  static defaultRpcUrl = import.meta.env.VITE_IDOS_NEAR_DEFAULT_RPC_URL;
  static contractMethods = {
    list: "find_grants",
    create: "insert_grant",
    revoke: "delete_grant",
  };

  constructor() {}

  async init({ accountId, signer, publicKey }) {
    this.#accountId = accountId;
    this.#publicKey = publicKey;
    this.#signer = signer;
    return this.#connectContract(accountId);
  }

  async #eldestKnownImplicitAccountForAccountId(accountId) {
    if (accountId === this.#accountId) return this.#publicKey;
    if (IMPLICIT_ACCOUNTS_RE.test(accountId)) return accountId;

    const allAccessKeys = await (await nearAPI.account(accountId)).getAccessKeys();

    const fullAccessKeys = allAccessKeys.filter((ak) => ak.access_key.permission === "FullAccess");
    if (!fullAccessKeys.length) throw new Error(`No FullAccess keys found for ${accountId}`);

    allAccessKeys.sort((a, b) => a.access_key.none - b.access_key.nonce);
    return allAccessKeys[0];
  }

  // FIXME: near-rs expects data_id, near-ts expects dataId
  async list({ owner, grantee, dataId: data_id, lockedUntil } = {}) {
    owner = this.#eldestKnownImplicitAccountForAccountId(owner);
    grantee = this.#eldestKnownImplicitAccountForAccountId(grantee);
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
    grantee = this.#eldestKnownImplicitAccountForAccountId(grantee);
    lockedUntil *= 1e7;

    let newGrant = { grantee, data_id, lockedUntil };
    Object.entries({ grantee, data_id, lockedUntil }).forEach(([k, v]) => !v && delete newGrant[k]);

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
  async revoke({ grantee, dataId: data_id } = {}) {
    grantee = this.#eldestKnownImplicitAccountForAccountId(grantee);

    let transactionResult;
    try {
      transactionResult = await this.#signer.signAndSendTransaction({
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
      throw new Error("Grant revocation failed", {
        cause: JSON.parse(e.message).kind,
      });
    }
    return { transactionId: transactionResult.transaction.hash };
  }

  async #connectContract(accountId) {
    const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();
    const nearConnection = await nearAPI.connect({
      networkId: this.constructor.defaultNetwork,
      keyStore: keyStore,
      nodeUrl: this.constructor.defaultRpcUrl,
    });

    const account = await nearConnection.account(accountId);
    this.#contract = new nearAPI.Contract(account, this.constructor.defaultContractId, {
      viewMethods: [this.constructor.contractMethods.list],
    });
  }
}
