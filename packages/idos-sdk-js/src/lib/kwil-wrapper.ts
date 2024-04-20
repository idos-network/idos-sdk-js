import { KwilSigner, Utils as KwilUtils, WebKwil } from "@kwilteam/kwil-js";
import { type ActionBody, type ActionInput } from "@kwilteam/kwil-js/dist/core/action";
import type { CustomSigner, EthSigner } from "@kwilteam/kwil-js/dist/core/builders.d";

export class KwilWrapper {
  static defaults = {
    kwilProvider: import.meta.env.VITE_IDOS_NODE_URL,
    chainId: import.meta.env.VITE_IDOS_NODE_KWIL_CHAIN_ID,
    dbId: import.meta.env.VITE_IDOS_NODE_KWIL_DB_ID
  };

  dbId: string;
  kwilProvider: string;
  client: WebKwil;
  signer?: KwilSigner;
  signatureType?: string;

  constructor({
    nodeUrl: kwilProvider = KwilWrapper.defaults.kwilProvider,
    chainId = KwilWrapper.defaults.chainId,
    dbId = KwilWrapper.defaults.dbId
  }) {
    this.dbId = dbId;
    this.kwilProvider = kwilProvider;
    this.client = new WebKwil({ kwilProvider, chainId });
  }

  static async init({
    nodeUrl = KwilWrapper.defaults.kwilProvider,
    dbId = KwilWrapper.defaults.dbId
  }): Promise<KwilWrapper> {
    const kwil = new WebKwil({ kwilProvider: nodeUrl, chainId: "" });
    const chainId =
      (await kwil.chainInfo({ disableWarning: true })).data?.chain_id ??
      KwilWrapper.defaults.chainId;

    // This assumes that nobody else created a db named "idos".
    // Given we intend to not let db creation open, that's a safe enough assumption.
    if (dbId === KwilWrapper.defaults.dbId) {
      dbId =
        (await kwil.listDatabases()).data?.filter(({ name }) => name === "idos")[0].dbid ?? dbId;
    }

    return new KwilWrapper({ nodeUrl, dbId, chainId });
  }

  get schema() {
    return this.client.getSchema(this.dbId);
  }

  async setSigner({
    accountId,
    signer,
    signatureType
  }: {
    accountId: string;
    signer: EthSigner | CustomSigner;
    signatureType: string;
  }) {
    // To avoid re-using the old signer's kgw cookie.
    // When kwil-js supports multi cookies, we can remove this.
    this.client.auth.logout();

    if (signatureType === "nep413") {
      this.signer = new KwilSigner(signer as CustomSigner, accountId, signatureType);
    } else {
      this.signer = new KwilSigner(signer as EthSigner, accountId);
    }

    this.signatureType = signatureType;
  }

  async buildAction(
    actionName: string,
    // biome-ignore lint/suspicious/noExplicitAny: TBD
    inputs: Record<string, any>[] | null | any,
    description?: string
  ) {
    const payload: ActionBody = {
      action: actionName,
      dbid: this.dbId,
      inputs: []
    };

    if (description) {
      payload.description = `*${description}*`;
    }

    if (inputs) {
      for (const input of inputs) {
        const actionInput = new KwilUtils.ActionInput();
        for (const key in input) {
          actionInput.put(`$${key}`, input[key]);
        }
        payload.inputs = [...(payload.inputs as ActionInput[]), actionInput];
      }
    }

    return payload;
  }

  async call(
    actionName: string,
    actionInputs: Record<string, any> | null,
    description?: string,
    useSigner = true
  ) {
    const action = await this.buildAction(actionName, [actionInputs], description);

    const res = await this.client.call(action, useSigner ? this.signer : undefined);

    return res.data?.result;
  }

  async execute(
    actionName: string,
    actionInputs: Record<string, unknown>[],
    description?: string,
    synchronous?: boolean
  ) {
    if (!this.signer) throw new Error("No signer set");

    const action = await this.buildAction(actionName, actionInputs, description);
    const res = await this.client.execute(action, this.signer, synchronous);
    return res.data?.tx_hash;
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
