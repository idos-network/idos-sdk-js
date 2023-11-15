import { Utils as KwilUtils, WebKwil } from "@kwilteam/kwil-js";

export class KwilWrapper {
  constructor({
    nodeUrl: kwilProvider = import.meta.env.VITE_IDOS_NODE_URL,
    chainId = import.meta.env.VITE_IDOS_NODE_KWIL_CHAIN_ID,
    dbId = import.meta.env.VITE_IDOS_NODE_KWIL_DB_ID,
  }) {
    this.dbId = dbId;
    this.kwilProvider = kwilProvider;
    this.client = new WebKwil({ kwilProvider, chainId });
  }

  get schema() {
    return this.client.getSchema(this.dbId);
  }

  setSigner({ signer, publicKey, signatureType }) {
    Object.assign(this, { signer, publicKey, signatureType });
  }

  async buildAction(actionName, inputs, description, useSigner = true) {
    const action = this.client.actionBuilder().dbid(this.dbId).name(actionName);

    if (description) {
      action.description(`*${description}*`);
    }

    if (useSigner) {
      action.publicKey(this.publicKey).signer(this.signer, this.signatureType);
    }

    if (inputs) {
      const actionInput = new KwilUtils.ActionInput();
      for (const key in inputs) {
        actionInput.put(`$${key}`, inputs[key]);
      }
      action.concat(actionInput);
    }
    return action;
  }

  async call(actionName, actionInputs, description, useSigner = true) {
    const action = await this.buildAction(actionName, actionInputs, description, useSigner);
    const msg = await action.buildMsg();
    const res = await this.client.call(msg);
    return res.data.result;
  }

  async broadcast(actionName, actionInputs, description) {
    const action = await this.buildAction(actionName, actionInputs, description);
    const tx = await action.buildTx();
    const res = await this.client.broadcast(tx);
    return res.data.tx_hash;
  }

  async getHumanId() {
    const result = await this.call("get_wallet_human_id", {}, "See your idOS profile ID");
    return result[0]?.human_id || null;
  }

  async hasProfile(address) {
    const result = await this.call("has_profile", { address }, undefined, false);
    return !!result[0]?.has_profile;
  }
}
