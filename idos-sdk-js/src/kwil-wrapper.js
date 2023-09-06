import { WebKwil, Utils as KwilUtils } from "@kwilteam/kwil-js";

export class KwilWrapper {
  constructor(options) {
    this.dbId = "x625a832c84f02fbebb229ee3b5e66b6767802b29d87acf72b8dd05d1";
    this.client = new WebKwil({ kwilProvider: options.url });
  }

  async setSigner(signer) {
    this.signer = signer;
    this.publicKey = await KwilUtils.recoverSecp256k1PubKey(signer);
  }

  async buildAction(actionName, inputs) {
    const action = this.client
      .actionBuilder()
      .dbid(this.dbId)
      .publicKey(this.publicKey)
      .signer(this.signer)
      .name(actionName);

    if (inputs) {
      const actionInput = new KwilUtils.ActionInput();

      for (const key in inputs) {
        actionInput.put(`$${key}`, inputs[key]);
      }

      action.concat(actionInput);
    }

    return action;
  }

  async call(actionName, actionInputs) {
    const action = await this.buildAction(actionName, actionInputs);
    const msg = await action.buildMsg();

    const res = await this.client.call(msg);

    return res.data.result;
  }

  async broadcast(actionName, actionInputs) {
    const action = await this.buildAction(actionName, actionInputs);
    const tx = await action.buildTx();

    const res = await this.client.broadcast(tx);

    return res.data.result;
  }
}
