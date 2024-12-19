import type { idOSUser, idOSUserAttribute, idOSWallet } from "@idos-network/idos-sdk-types";
import { KwilSigner, Utils as KwilUtils, WebKwil } from "@kwilteam/kwil-js";
import type { ActionBody, ActionInput } from "@kwilteam/kwil-js/dist/core/action";
import type { CustomSigner, EthSigner } from "@kwilteam/kwil-js/dist/core/builders.d";
import Grant from "./grants/grant";

export class KwilWrapper {
  static defaults = {
    kwilProvider: import.meta.env.VITE_IDOS_NODE_URL,
    chainId: import.meta.env.VITE_IDOS_NODE_KWIL_CHAIN_ID,
    dbId: import.meta.env.VITE_IDOS_NODE_KWIL_DB_ID,
    grantsPerPage: 7,
  };

  client: WebKwil;
  kwilProvider: string;
  dbId: string;
  signer?: KwilSigner;

  constructor(
    client: WebKwil,
    kwilProvider: string = KwilWrapper.defaults.kwilProvider,
    dbId: string = KwilWrapper.defaults.dbId,
  ) {
    this.client = client;
    this.kwilProvider = kwilProvider;
    this.dbId = dbId;
  }

  static async init({
    nodeUrl = KwilWrapper.defaults.kwilProvider,
    dbId = KwilWrapper.defaults.dbId,
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

    return new KwilWrapper(new WebKwil({ kwilProvider: nodeUrl, chainId }), nodeUrl, dbId);
  }

  get schema() {
    return this.client.getSchema(this.dbId);
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

  async buildAction(
    actionName: string,
    // biome-ignore lint/suspicious/noExplicitAny: TBD
    inputs: Record<string, any>[] | null | any,
    description?: string,
  ) {
    const payload: ActionBody = {
      name: actionName,
      dbid: this.dbId,
      inputs: [],
    };

    if (description) {
      payload.description = `*${description}*`;
    }

    if (inputs) {
      for (const input of inputs) {
        if (!input || (input && Object.keys(input).length === 0)) {
          continue;
        }
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
    // biome-ignore lint/suspicious/noExplicitAny: TBD
    actionInputs: Record<string, any> | null,
    description?: string,
    useSigner = true,
  ) {
    if (useSigner && !this.signer) throw new Error("Call idOS.setSigner first.");

    const action = await this.buildAction(actionName, [actionInputs], description);

    const res = await this.client.call(action, useSigner ? this.signer : undefined);

    return res.data?.result;
  }

  async execute(
    actionName: string,
    actionInputs: Record<string, unknown>[],
    description?: string,
    synchronous = true,
  ) {
    if (!this.signer) throw new Error("No signer set");

    const action = await this.buildAction(actionName, actionInputs, description);
    const res = await this.client.execute(action, this.signer, synchronous);
    return res.data?.tx_hash;
  }

  async getUserProfile(): Promise<idOSUser> {
    const [user] = (await this.call("get_user", null)) as unknown as [idOSUser];
    return user;
  }

  async hasProfile(userAddress: string): Promise<boolean> {
    const result = (await this.call(
      "has_profile",
      { address: userAddress },
      undefined,
      false,
      // biome-ignore lint/suspicious/noExplicitAny: TBD
    )) as any;

    return !!result[0]?.has_profile;
  }

  async getGrantsGrantedCount(): Promise<number> {
    const response = (await this.call("get_internal_ag_granted_count", null)) as unknown as {
      count: number;
    }[];
    return response[0].count;
  }

  async getGrantsGranted(
    page: number,
    size = KwilWrapper.defaults.grantsPerPage,
  ): Promise<{ grants: Grant[]; totalCount: number }> {
    if (!page) throw new Error("paging starts from 1");
    const list = (await this.call("get_internal_ag_granted", { page, size })) as any;
    const totalCount = await this.getGrantsGrantedCount();

    const grants = list.map(
      (grant: any) =>
        new Grant({
          ownerHumanId: grant.ag_owner_user_id,
          granteeAddress: grant.ag_grantee_wallet_identifier,
          dataId: grant.data_id,
          lockedUntil: grant.locked_until,
          ownerAddress: "",
        }),
    );
    return {
      grants,
      totalCount,
    };
  }

  async getLitAttrs() {
    const attrs = (await this.call("get_attributes", null)) as unknown as idOSUserAttribute[];
    return attrs.filter((attr) => attr.attribute_key.startsWith("lit-"));
  }

  async getUserWallets() {
    return (await this.call("get_wallets", null)) as unknown as idOSWallet[];
  }
  async getEvmUserWallets() {
    const userWallets = (await this.getUserWallets()) as unknown as idOSWallet[];
    return userWallets.filter((wallet) => wallet.wallet_type === "EVM");
  }
}
