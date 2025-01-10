import { type KwilSigner, NodeKwil, Utils, WebKwil } from "@kwilteam/kwil-js";
import type { ActionBody } from "@kwilteam/kwil-js/dist/core/action";
import invariant from "tiny-invariant";

interface CreateKwilClientParams {
  chainId?: string;
  dbId?: string;
  nodeUrl: string;
}

interface KwilActionReqParams {
  name: string;
  description?: string;
  // biome-ignore lint/suspicious/noExplicitAny: we don't need to be strict here.
  inputs?: Record<string, any>;
}

/**
 * A client for interacting with kwil with type-safe abstractions for `call` and `execute`.
 * Has utility methods for creating actions and setting a signer.
 */
export class KwilActionClient {
  private signer?: KwilSigner;

  constructor(
    private readonly client: NodeKwil | WebKwil,
    private readonly dbId: string,
  ) {}

  /**
   * Calls an action on the kwil nodes. This similar to `GET` like request.
   */
  async call<T = unknown>(params: KwilActionReqParams, signer = this.signer) {
    const action = this.#createAction(params);
    return this.client.call(action, signer) as T;
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
    const action = this.#createAction(params);

    return this.client.execute(action, signer, synchronous) as T;
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
  #createAction(params: KwilActionReqParams): ActionBody {
    return {
      ...params,
      dbid: this.dbId,
      inputs: [this.#createActionInputs(params.inputs)],
    };
  }

  /**
   * Creates action inputs from the given parameters that are used in the action body.
   */
  #createActionInputs(params: Record<string, unknown> = {}): Utils.ActionInput {
    const prefixedEntries = Object.entries(params).map(([key, value]) => [`$${key}`, value]);
    const prefixedObject = Object.fromEntries(prefixedEntries);
    return Utils.ActionInput.fromObject(prefixedObject);
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
  const dbid =
    params.dbId ||
    (await _kwil.listDatabases()).data?.filter(({ name }) => name === "idos")[0].dbid;

  invariant(chainId, "Can't discover `chainId`. You must pass it explicitly.");
  invariant(dbid, "Can't discover `dbId`. You must pass it explicitly.");

  const client = new NodeKwil({
    kwilProvider: params.nodeUrl,
    chainId,
  });

  return new KwilActionClient(client, dbid);
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
  const dbid =
    params.dbId ||
    (await _kwil.listDatabases()).data?.filter(({ name }) => name === "idos")[0].dbid;

  invariant(chainId, "Can't discover `chainId`. You must pass it explicitly.");
  invariant(dbid, "Can't discover `dbId`. You must pass it explicitly.");

  const client = new WebKwil({
    kwilProvider: params.nodeUrl,
    chainId,
  });

  return new KwilActionClient(client, dbid);
}
