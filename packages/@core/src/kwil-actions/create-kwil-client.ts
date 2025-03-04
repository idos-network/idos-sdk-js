import { type KwilSigner, NodeKwil, WebKwil } from "@kwilteam/kwil-js";
import invariant from "tiny-invariant";

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
    const action = this._createAction(params);
    const response = await this.client.call(action, signer);
    return response.data as T;
  }

  /**
   * Executes an action on the kwil nodes. This similar to `POST` like request.
   */
  async execute<T = unknown>(
    params: KwilActionReqParams,
    signer = this.signer,
    synchronous = true,
  ) {
    invariant(signer, "Signer is not set, you must set it before executing an action");
    const action = this._createAction(params);
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
   * Creates an action body from the given parameters to be used in the `call` and `execute` methods.
   */
  private _createAction(params: KwilCallActionRequestParams | KwilExecuteActionRequestParams) {
    return {
      ...params,
      namespace: "main",
      inputs: this._createActionInputs(params.inputs),
    };
  }

  /**
   * Creates action inputs from the given parameters that are used in the action body.
   */
  private _createActionInputs(params: Record<string, unknown> = {}) {
    if (!Object.keys(params).length) return [];
    const prefixedEntries = Object.entries(params).map(([key, value]) => [`$${key}`, value]);
    const prefixedObject = Object.fromEntries(prefixedEntries);
    return prefixedObject;
  }
}

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
  });

  return new KwilActionClient(client);
}
