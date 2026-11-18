import { Config } from "../../api_client/config";
import { CallBodyNode } from "../../core/action";
import { EnvironmentType } from "../../core/enums";
import { KwilSigner } from "../../core/kwilSigner";
import { MsgReceipt } from "../../core/message";
import { GenericResponse } from "../../core/resreq";
import { Kwil } from "../kwil";

export class NodeKwil extends Kwil<EnvironmentType.NODE> {
  constructor(opts: Config) {
    super(opts);
  }

  /**
   * Calls a Kwil node. This can be used to execute read-only ('view') actions on Kwil.
   * If the action requires authentication in the Kwil Gateway, the kwilSigner should be passed. If the user is not authenticated, the user will be prompted to authenticate.
   *
   * @param {CallBodyNode} actionBody - The body of the action to send. This should use the `CallBody` interface.
   * @param {KwilSigner} kwilSigner (optional) - KwilSigner should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
   * @returns A `MsgReceipt` with `result`, optional `logs`, and optional `error`. `data.error` is set when the action executed but returned an application error via `error(...)` in Kuneiform. `data.result` may be empty in both error and "no rows" cases; check `data.error` first to distinguish.
   */
  public async call<T extends object>(
    actionBody: CallBodyNode,
    kwilSigner?: KwilSigner,
  ): Promise<GenericResponse<MsgReceipt<T>>> {
    return await this.baseCall(actionBody, kwilSigner, actionBody.cookie);
  }

  /**
   * Returns the KGW session cookie currently attached to Node requests.
   */
  public getKgwCookie(): string | undefined {
    return this.cookie;
  }

  /**
   * Authenticates with KGW, stores the returned session cookie, and returns it.
   */
  public async authenticateKGWAndSetCookie(signer: KwilSigner): Promise<string> {
    const res = await this.auth.authenticateKGW(signer);
    const cookie = res.data?.cookie;

    if (!cookie) {
      throw new Error("No cookie received from gateway. An error occurred with authentication.");
    }

    this.cookie = cookie;
    return cookie;
  }
}
