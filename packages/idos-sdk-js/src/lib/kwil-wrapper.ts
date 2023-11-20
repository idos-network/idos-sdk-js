import { Utils as KwilUtils, WebKwil } from "@kwilteam/kwil-js";
import type { SignerSupplier } from "@kwilteam/kwil-js/dist/core/builders.d";
import { Signer } from "ethers";

export class KwilWrapper {
  dbId: string;
  kwilProvider: string;
  client: WebKwil;
  signer?: Signer | ((message: Uint8Array) => Promise<Uint8Array>);
  publicKey?: string;
  signatureType?: string;

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

  setSigner({
    signer,
    publicKey,
    signatureType,
  }: {
    signer: Signer | ((message: Uint8Array) => Promise<Uint8Array>);
    publicKey: string;
    signatureType: string;
  }) {
    this.signer = signer;
    this.publicKey = publicKey;
    this.signatureType = signatureType;
  }

  async buildAction(
    actionName: string,
    inputs: Record<string, any> | null,
    description?: string,
    useSigner: boolean = true
  ) {
    const action = this.client.actionBuilder().dbid(this.dbId).name(actionName);

    if (description) {
      action.description(`*${description}*`);
    }

    if (useSigner) {
      if (!this.publicKey || !this.signer || !this.signatureType) throw new Error("Call idOS.setSigner first.");

      action.publicKey(this.publicKey).signer(
        this.signer as SignerSupplier, // TODO: pkoch knows the types line up enough (i.e., it runs just fine as is), but he didn't find a way to express that in types.
        this.signatureType
      );
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

  async call(
    actionName: string,
    actionInputs: Record<string, any> | null,
    description?: string,
    useSigner: boolean = true
  ) {
    const action = await this.buildAction(actionName, actionInputs, description, useSigner);
    const msg = await action.buildMsg();
    const res = await this.client.call(msg);
    return res.data!.result;
  }

  async broadcast(actionName: string, actionInputs: Record<string, any>, description?: string) {
    const action = await this.buildAction(actionName, actionInputs, description);
    const tx = await action.buildTx();
    const res = await this.client.broadcast(tx);
    return res.data!.tx_hash;
  }

  async getHumanId(): Promise<string | null> {
    const result = (await this.call("get_wallet_human_id", {}, "See your idOS profile ID")) as any;
    return result[0]?.human_id;
  }

  async hasProfile(address: string): Promise<boolean> {
    const result = (await this.call("has_profile", { address }, undefined, false)) as any;
    return !!result[0]?.has_profile;
  }
}
