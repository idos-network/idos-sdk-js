import { type KwilSigner, NodeKwil, WebKwil } from "@kwilteam/kwil-js";
import type { Config } from "@kwilteam/kwil-js/dist/api_client/config";
import type { ActionBody, CallBody, PositionalParams } from "@kwilteam/kwil-js/dist/core/action";
import type { DataInfo } from "@kwilteam/kwil-js/dist/core/database";
import invariant from "tiny-invariant";
import type { ActionSchemaElem } from "../kwil-actions/schema";
import { actionSchema } from "../kwil-actions/schema";

type CreateKwilClientParams = {
  chainId?: string;
  nodeUrl: string;
};

type KwilActions = typeof actionSchema;
type ActionName = keyof KwilActions;

type AllKwilCallAction = {
  [Name in ActionName]: {
    name: Name;
    // biome-ignore lint/suspicious/noExplicitAny: This is fine
    inputs: Record<KwilActions[Name][number]["name"], any>;
  };
};

type KwilCallActionRequestParams = AllKwilCallAction[ActionName];

type AllKwilExecuteAction = {
  [Name in ActionName]: AllKwilCallAction[Name] & { description: string };
};

type KwilExecuteActionRequestParams = AllKwilExecuteAction[ActionName];

/**
 * A client for interacting with kwil with type-safe abstractions for `call` and `execute`.
 * Has utility methods for creating actions and setting a signer.
 */
export class KwilActionClient {
  signer?: KwilSigner;
  readonly client: NodeKwil | WebKwil;

  constructor(client: NodeKwil | WebKwil) {
    this.client = client;
  }

  #createActionInputs(actionName: string, params: Record<string, unknown> = {}): PositionalParams {
    if (!params || !Object.keys(params).length) return [];

    const args = (actionSchema as Record<string, readonly ActionSchemaElem[]>)[actionName];

    return args.map(({ name }) => {
      const value = params[name];
      // Handle falsy values appropriately
      if (value === "" || value === 0) return value;
      return value ?? null;
    }) as PositionalParams;
  }

  #actionTypes(actionName: string): DataInfo[] {
    const args = actionSchema[actionName];
    return args.map((arg) => arg.type);
  }

  /**
   * Calls an action on the kwil nodes. This similar to `GET` like request.
   */
  async call<T = unknown>(
    params: KwilCallActionRequestParams,
    signer: KwilSigner | undefined = this.signer,
  ): Promise<T> {
    const action: CallBody = {
      name: params.name,
      namespace: "main",
      inputs: this.#createActionInputs(params.name, params.inputs),
      types: this.#actionTypes(params.name),
    };

    const response = await this.client.call(action as CallBody, signer);

    return response?.data?.result as T;
  }

  /**
   * Executes an action on the kwil nodes. This similar to `POST` like request.
   */
  async execute(
    params: KwilExecuteActionRequestParams,
    signer: KwilSigner | undefined = this.signer,
    synchronous = true,
  ): Promise<string | undefined> {
    invariant(signer, "Signer is not set, you must set it before executing an action");
    const action: ActionBody = {
      name: params.name,
      namespace: "main",
      description: params.description,
      inputs: [this.#createActionInputs(params.name, params.inputs)],
      types: this.#actionTypes(params.name),
    };
    const response = await this.client.execute(action, signer, synchronous);
    return response.data?.tx_hash;
  }

  setSigner(signer: KwilSigner | undefined): void {
    this.signer = signer;
  }

  /**
   * Creates action inputs from the given parameters that are used in the action body.
   */
}

const DEFAULT_TIMEOUT = 30_000;

const createKwilClient =
  (Cls: new (opts: Config) => NodeKwil | WebKwil) =>
  async ({ nodeUrl: kwilProvider, chainId }: CreateKwilClientParams): Promise<KwilActionClient> => {
    const _kwil = new Cls({ kwilProvider, chainId: "" });
    chainId ||= (await _kwil.chainInfo({ disableWarning: true })).data?.chain_id;
    invariant(chainId, "Can't discover `chainId`. You must pass it explicitly.");

    return new KwilActionClient(new Cls({ kwilProvider, chainId, timeout: DEFAULT_TIMEOUT }));
  };

/**
 * Create a kwil client for node.js environment
 */
export const createNodeKwilClient: (params: CreateKwilClientParams) => Promise<KwilActionClient> =
  createKwilClient(NodeKwil);

/**
 * Create a kwil client for browser environment
 */
export const createWebKwilClient: (params: CreateKwilClientParams) => Promise<KwilActionClient> =
  createKwilClient(WebKwil);
