import { Utils as KwilUtils, WebKwil } from "@kwilteam/kwil-js";

export class KwilWrapper {
  constructor({ nodeUrl: kwilProvider }) {
    this.dbId = "x625a832c84f02fbebb229ee3b5e66b6767802b29d87acf72b8dd05d1"; // staging
    // this.dbId = "xc67930faf8ec97471caf3925a664a9bd87315ddc29efeb04ec9e76bb"; // playground
    this.client = new WebKwil({ kwilProvider });
  }

  get schema() {
    return this.client.getSchema(this.dbId);
  }

  setSigner({ signer, publicKey, signatureType }) {
    Object.assign(this, { signer, publicKey, signatureType });
  }

  async buildAction(actionName, inputs, description) {
    const action = this.client
      .actionBuilder()
      .dbid(this.dbId)
      .name(actionName)
      .publicKey(this.publicKey)
      .signer(this.signer, this.signatureType);

    if (description) {
      action.description(`*${description}*`);
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

  async call(actionName, actionInputs, description) {
    const action = await this.buildAction(actionName, actionInputs, description);
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
    const result = await this.call("get_wallet_human_id", null, "See your idOS profile ID");
    return result[0]?.human_id || null;
  }
}
