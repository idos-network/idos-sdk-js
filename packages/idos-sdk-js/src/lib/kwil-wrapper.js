import { Utils as KwilUtils, WebKwil } from "@kwilteam/kwil-js";

export class KwilWrapper {
  constructor(options) {
    //this.dbId = "x625a832c84f02fbebb229ee3b5e66b6767802b29d87acf72b8dd05d1";
    this.dbId = "xc67930faf8ec97471caf3925a664a9bd87315ddc29efeb04ec9e76bb";
    this.client = new WebKwil({ kwilProvider: options.url });
  }

  /**
   * Returns the schema of the database.
   */
  get schema() {
    return this.client.getSchema(this.dbId);
  }

  async setSigner(signer, publicKey, signatureType) {
    this.signer = signer || this.signer;
    this.publicKey = publicKey || this.publicKey || (await KwilUtils.recoverSecp256k1PubKey(this.signer));
    this.signatureType = signatureType || this.signatureType || "secp256k1_ep";
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
    return res.data.result;
  }
}
