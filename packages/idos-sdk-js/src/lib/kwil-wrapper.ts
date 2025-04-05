import { ActionSchema } from "@idos-network/core/kwil-actions";
import type { idOSUser } from "@idos-network/core/types";
import { KwilSigner, WebKwil } from "@kwilteam/kwil-js";
import type { ActionBody, CallBody, PositionalParams } from "@kwilteam/kwil-js/dist/core/action";
import type { CustomSigner, EthSigner } from "@kwilteam/kwil-js/dist/core/builders.d";

export class KwilWrapper {
  static defaults = {
    kwilProvider: import.meta.env.VITE_IDOS_NODE_URL,
    chainId: import.meta.env.VITE_IDOS_NODE_KWIL_CHAIN_ID,
  };

  client: WebKwil;
  kwilProvider: string;
  signer?: KwilSigner;

  constructor(client: WebKwil, kwilProvider: string = KwilWrapper.defaults.kwilProvider) {
    this.client = client;
    this.kwilProvider = kwilProvider;
  }

  static async init({ nodeUrl = KwilWrapper.defaults.kwilProvider }): Promise<KwilWrapper> {
    const kwil = new WebKwil({ kwilProvider: nodeUrl, chainId: "" });
    const chainId =
      (await kwil.chainInfo({ disableWarning: true })).data?.chain_id ??
      KwilWrapper.defaults.chainId;

    return new KwilWrapper(new WebKwil({ kwilProvider: nodeUrl, chainId }), nodeUrl);
  }

  async setSigner({
    accountId,
    signer,
    signatureType,
  }: {
    accountId: string;
    signer: EthSigner | CustomSigner;
    signatureType: string;
  }) {
    if (signatureType === "nep413") {
      this.signer = new KwilSigner(signer as CustomSigner, accountId, signatureType);
    } else {
      this.signer = new KwilSigner(signer as EthSigner, accountId);
    }
  }

  async buildExecAction(
    actionName: string,
    // biome-ignore lint/suspicious/noExplicitAny: TBD
    inputs: Record<string, any>[] | null | any,
    description?: string,
  ) {
    const payload: ActionBody = {
      name: actionName,
      namespace: "main",
      // biome-ignore lint/suspicious/noExplicitAny: TBD
      inputs: (Array.isArray(inputs) ? inputs : []).map((input: Record<string, any>) =>
        this.createActionInputs(actionName, input),
      ),
    };

    if (description) {
      payload.description = `*${description}*`;
    }

    return payload;
  }

  async buildCallAction(
    actionName: string,
    // biome-ignore lint/suspicious/noExplicitAny: TBD
    inputs: Record<string, any>[] | null | any,
  ) {
    const payload: CallBody = {
      name: actionName,
      namespace: "main",
      inputs: this.createActionInputs(actionName, inputs),
    };

    return payload;
  }

  createActionInputs(actionName: string, params: Record<string, unknown> = {}): PositionalParams {
    if (!params || !Object.keys(params).length) return [];
    const args = ActionSchema[actionName];
    return args.map(({ name }) => {
      const value = params[name];
      // Handle falsy values appropriately
      if (value === "" || value === 0) return value;
      return value ?? null;
    }) as PositionalParams;
  }

  async call(
    actionName: string,
    // biome-ignore lint/suspicious/noExplicitAny: TBD
    actionInputs: Record<string, any> | null,
    useSigner = true,
  ) {
    if (useSigner && !this.signer) throw new Error("Call idOS.setSigner first.");

    const action = await this.buildCallAction(actionName, actionInputs);
    const res = await this.client.call(action, useSigner ? this.signer : undefined);

    // biome-ignore lint/suspicious/noExplicitAny: TBD
    return (res.data as any)?.result;
  }

  async execute(
    actionName: string,
    actionInputs: Record<string, unknown>[],
    description?: string,
    synchronous = true,
  ) {
    if (!this.signer) throw new Error("No signer set");
    const action = await this.buildExecAction(actionName, actionInputs, description);
    const res = await this.client.execute(action, this.signer, synchronous);
    return res.data?.tx_hash;
  }

  async getUserProfile(): Promise<idOSUser> {
    const res = await this.call("get_user", null);

    return res[0] as idOSUser;
  }

  async hasProfile(userAddress: string): Promise<boolean> {
    const result = (await this.call(
      "has_profile",
      { address: userAddress },
      false,
      // biome-ignore lint/suspicious/noExplicitAny: TBD
    )) as any;

    return !!result[0]?.has_profile;
  }
}
