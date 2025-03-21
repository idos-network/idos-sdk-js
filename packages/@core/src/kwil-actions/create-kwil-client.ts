import { type KwilSigner, NodeKwil, WebKwil } from "@kwilteam/kwil-js";
import type { ActionBody, CallBody, PositionalParams } from "@kwilteam/kwil-js/dist/core/action";
import type { ValueType } from "@kwilteam/kwil-js/dist/utils/types";
import invariant from "tiny-invariant";
import { actionSchema } from "./schema";

interface CreateKwilClientParams {
  chainId?: string;
  nodeUrl: string;
}

interface KwilActionReqParams {
  name: string;
  // biome-ignore lint/suspicious/noExplicitAny: we don't need to be strict here.
  inputs?: Record<string, any>;
}

interface KwilCallActionRequestParams extends KwilActionReqParams {}
interface KwilExecuteActionRequestParams extends KwilActionReqParams {
  description?: string;
}

/**
 * A client for interacting with kwil with type-safe abstractions for `call` and `execute`.
 * Has utility methods for creating actions and setting a signer.
 */
export class KwilActionClient {
  private signer?: KwilSigner;

  constructor(private readonly client: NodeKwil | WebKwil) {}

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
  setSigner(signer: KwilSigner) {
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
    const keys = actionSchema[actionName];
    return keys.map((key) => (params[key] || null) as ValueType) as PositionalParams; // Return null if no key in input params
  }
}

const DEFAULT_TIMEOUT = 30_000;

/**
 * Create a kwil client for node.js environment
 */
export async function createNodeKwilClient(params: CreateKwilClientParams) {
  const _kwil = new NodeKwil({
    kwilProvider: params.nodeUrl,
    chainId: "",
  });

  const chainId = params.chainId || (await _kwil.chainInfo()).data?.chain_id;

  invariant(chainId, "Can't discover `chainId`. You must pass it explicitly.");

  const client = new NodeKwil({
    kwilProvider: params.nodeUrl,
    chainId,
    timeout: DEFAULT_TIMEOUT,
  });

  return new KwilActionClient(client);
}

/**
 * Create a kwil client for browser environment
 */
export async function createWebKwilClient(params: CreateKwilClientParams) {
  const _kwil = new WebKwil({
    kwilProvider: params.nodeUrl,
    chainId: "",
  });

  const chainId = params.chainId || (await _kwil.chainInfo()).data?.chain_id;

  invariant(chainId, "Can't discover `chainId`. You must pass it explicitly.");

  const client = new WebKwil({
    kwilProvider: params.nodeUrl,
    chainId,
    timeout: 30_000,
  });

  return new KwilActionClient(client);
}
