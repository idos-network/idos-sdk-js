import { Utils as KwilUtils, WebKwil } from "@kwilteam/kwil-js";

export class KwilWrapper {
  constructor(options) {
    this.dbId = "x625a832c84f02fbebb229ee3b5e66b6767802b29d87acf72b8dd05d1";
    this.client = new WebKwil({ kwilProvider: options.url });
  }

  /**
   * Returns the schema of the database.
   */
  get schema() {
    return this.client.getSchema(this.dbId);
  }

  async setSigner(signer, publicKey) {
    this.signer = signer || this.signer;
    this.publicKey = this.publicKey || publicKey || (await KwilUtils.recoverSecp256k1PubKey(this.signer));
  }

  async buildAction(actionName, inputs) {
    const action = this.client
      .actionBuilder()
      .dbid(this.dbId)
      .name(actionName)
      .publicKey(this.publicKey)
      .signer(this.signer)
      .nearConfig({});

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
