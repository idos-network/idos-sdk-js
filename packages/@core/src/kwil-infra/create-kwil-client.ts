import { type KwilSigner, NodeKwil, WebKwil } from "@kwilteam/kwil-js";
import type { Config } from "@kwilteam/kwil-js/dist/api_client/config";
import type { ActionBody, CallBody, PositionalParams } from "@kwilteam/kwil-js/dist/core/action";
import invariant from "tiny-invariant";
import { actionSchema } from "../kwil-actions/schema";

interface CreateKwilClientParams {
  chainId?: string;
  nodeUrl: string;
}

type ActionName = keyof typeof actionSchema;

type KwilCallActionRequestParams<Name extends ActionName = ActionName> = {
  name: Name;
  // biome-ignore lint/suspicious/noExplicitAny: we don't need to be strict here.
  inputs?: Name extends ActionName ? Record<(typeof actionSchema)[Name][number], any> : never;
};

interface KwilExecuteActionRequestParams extends KwilCallActionRequestParams {
  description?: string;
}

/**
 * A client for interacting with kwil with type-safe abstractions for `call` and `execute`.
 * Has utility methods for creating actions and setting a signer.
 */
export class KwilActionClient {
  public signer?: KwilSigner;

  constructor(public readonly client: NodeKwil | WebKwil) {}

  /**
   * Calls an action on the kwil nodes. This similar to `GET` like request.
   */
  async call<T = unknown>(params: KwilCallActionRequestParams, signer = this.signer) {
    const action: CallBody = {
      name: params.name,
      namespace: "main",
      inputs: this._createActionInputs(params.name, params.inputs),
    };

    const response = await this.client.call(action as CallBody, signer);
    return response?.data?.result as T;
  }

  /**
   * Executes an action on the kwil nodes. This similar to `POST` like request.
   */
  async execute<T = unknown>(
    params: KwilExecuteActionRequestParams,
    signer = this.signer,
    synchronous = true,
  ) {
    invariant(signer, "Signer is not set, you must set it before executing an action");
    const action: ActionBody = {
      name: params.name,
      namespace: "main",
      description: params.description,
      inputs: [this._createActionInputs(params.name, params.inputs)],
    };
    const response = await this.client.execute(action, signer, synchronous);
    return response.data?.tx_hash as T;
  }

  /**
   * Not sure if this is needed here or should the `signer` be passed in the `execute` method itself, or in the constructor, but it's here for now.
   */
  setSigner(signer: KwilSigner | undefined) {
    this.signer = signer;
  }

  /**
   * Creates action inputs from the given parameters that are used in the action body.
   */
  private _createActionInputs(
    actionName: string,
    params: Record<string, unknown> = {},
  ): PositionalParams {
    if (!params || !Object.keys(params).length) return [];

    const keys = (actionSchema as Record<string, readonly string[]>)[actionName];
    return keys.map((key) => {
      const value = params[key];
      // Handle falsy values appropriately
      if (value === "" || value === 0) return value;
      return value ?? null;
    }) as PositionalParams;
  }
}

const DEFAULT_TIMEOUT = 30_000;

const createKwilClient =
  (Cls: new (opts: Config) => NodeKwil | WebKwil) =>
  async ({ nodeUrl: kwilProvider, chainId }: CreateKwilClientParams) => {
    const _kwil = new Cls({ kwilProvider, chainId: "" });
    chainId ||= (await _kwil.chainInfo({ disableWarning: true })).data?.chain_id;
    invariant(chainId, "Can't discover `chainId`. You must pass it explicitly.");

    return new KwilActionClient(new Cls({ kwilProvider, chainId, timeout: DEFAULT_TIMEOUT }));
  };

/**
 * Create a kwil client for node.js environment
 */
export const createNodeKwilClient = createKwilClient(NodeKwil);

/**
 * Create a kwil client for browser environment
 */
export const createWebKwilClient = createKwilClient(WebKwil);
