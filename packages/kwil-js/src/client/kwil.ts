import { LRUCache } from "lru-cache";

import Client from "../api_client/client";
import { KwilConfig } from "../api_client/config";
import { Auth } from "../auth/auth";
import {
  ActionBody,
  CallBody,
  isNamedParam,
  NamedParams,
  PositionalParams,
  transformActionInput,
} from "../core/action";
import {
  AuthenticationMode,
  AuthErrorCodes,
  BroadcastSyncType,
  EnvironmentType,
  PayloadType,
} from "../core/enums";
import { SelectQueryRequest } from "../core/jsonrpc";
import { KwilSigner } from "../core/kwilSigner";
import { Message, MsgReceipt } from "../core/message";
import { Account, ChainInfo, ChainInfoOpts } from "../core/network";
import { RawStatementPayload } from "../core/payload";
import { GenericResponse } from "../core/resreq";
import { AuthBody } from "../core/signature";
import { TxReceipt } from "../core/tx";
import { TxInfoReceipt } from "../core/txQuery";
import { Funder } from "../funder/funder";
import { Action } from "../transaction/action";
import { PayloadTx } from "../transaction/payloadTx";
import { generateDBID } from "../utils/dbid";
import { inferKeyType } from "../utils/keys";
import { resolveNamespace, validateNamespace } from "../utils/namespace";
import { encodeParameters, encodeRawStatementParameters } from "../utils/parameterEncoding";
import { bytesToHex } from "../utils/serial";
import { Base64String, QueryParams } from "../utils/types";
import { wrap } from "./intern";

/**
 * The main class for interacting with the Kwil network.
 */

export abstract class Kwil<T extends EnvironmentType> extends Client {
  protected readonly chainId: string;
  private readonly autoAuthenticate: boolean;

  public funder: Funder<T>;
  public auth: Auth<T>;

  private authMode?: string; // To store the mode on the class for subsequent requests

  private actionsCache: LRUCache<string, object[]>;

  protected constructor(opts: KwilConfig) {
    super(opts);

    // set chainId
    this.chainId = opts.chainId;

    this.autoAuthenticate = opts.autoAuthenticate ?? true;

    // create cache
    this.actionsCache = new LRUCache<string, object[]>({
      max: 500,
      ttl: 24 * 1000 * 60 * 60, // 1 day TTL
    });

    // create funder
    this.funder = new Funder<T>(
      this,
      {
        broadcastClient: this.broadcastClient.bind(this),
      },
      this.chainId,
    );

    // create authenticate
    this.auth = new Auth<T>(
      {
        getAuthenticateClient: this.getAuthenticateClient.bind(this),
        postAuthenticateClient: this.postAuthenticateClient.bind(this),
        challengeClient: this.challengeClient.bind(this),
        logoutClient: this.logoutClient.bind(this),
      },
      this.config.kwilProvider,
      this.chainId,
    );

    //create a wrapped symbol of estimateCost method
    wrap(this, this.estimateCostClient.bind(this));
  }

  /**
   * Retrieves the actions in a database given its namespace.
   *
   * @param namespace - The namespace of the actions to retrieve.
   * @returns A promise that resolves to the actions in the database.
   */
  public async getActions(namespace: string): Promise<GenericResponse<object[]>> {
    if (!validateNamespace(namespace)) {
      throw new Error("Please provide a valid namespace");
    }

    // Check cache first
    const cached = this.actionsCache.get(namespace);
    if (cached !== undefined) {
      return {
        status: 200,
        data: cached,
      } as GenericResponse<object[]>;
    }

    // Fetch from database
    const response = await this.selectQuery(
      "SELECT * FROM info.actions WHERE namespace = $namespace",
      { $namespace: namespace },
    );

    // Cache successful responses
    if (response.data) {
      this.actionsCache.set(namespace, response.data);
    }

    return response;
  }

  /**
   * Retrieves an account using the owner's Ethereum wallet address.
   *
   * @param owner - The owner's identifier (e.g. Ethereum wallet address or ED25119 keys). Ethereum addresses and ED25519 public keys can be passed as a hex string (0x123...) or as bytes (Uint8Array).
   * @returns A promise that resolves to an Account object. The account object includes the account's id, balance, and nonce.
   */
  public async getAccount(
    owner: string | Uint8Array,
    keyType?: string,
  ): Promise<GenericResponse<Account>> {
    const resolvedKeyType = keyType ?? inferKeyType(owner);
    const identifier = owner instanceof Uint8Array ? bytesToHex(owner) : owner;

    return await this.getAccountClient({
      identifier,
      key_type: resolvedKeyType,
    });
  }

  /**
   * Executes a transaction on a Kwil network. These are mutative actions that must be mined on the Kwil network's blockchain.
   *
   * @param actionBody - The body of the action to send. This should use the `ActionBody` interface.
   * @param kwilSigner - The signer for the action transactions.
   * @param synchronous - (optional) If true, the broadcast will wait for the transaction to be mined before returning. If false, the broadcast will return the transaction hash immediately, regardless of if the transaction is successful. Defaults to false.
   * @returns A promise that resolves to the receipt of the transaction.
   */
  public async execute(
    actionBody: ActionBody,
    kwilSigner: KwilSigner,
    synchronous?: boolean,
  ): Promise<GenericResponse<TxReceipt>> {
    if (!actionBody.name) {
      throw new Error("name is required in actionBody");
    }

    // Ensure auth mode is set
    await this.ensureAuthenticationMode();

    const namespace = resolveNamespace(actionBody);

    // ActionInput[] has been deprecated.
    // This transforms the ActionInput[] into NamedInput[] to support legacy ActionInput[]
    let inputs: NamedParams[] | PositionalParams[] = [];
    if (actionBody.inputs && transformActionInput.isActionInputArray(actionBody.inputs)) {
      inputs = transformActionInput.toNamedParams(actionBody.inputs);
    } else {
      inputs = actionBody.inputs || [];
    }

    // else if (actionBody.inputs && transformPositionalParam.isPositionalParams(actionBody.inputs)) {
    //   // handle positional parameters
    //   inputs = transformPositionalParam.toNamedParams(actionBody.inputs);
    // } else {
    //   // If the inputs are not an ActionInput[] or PositionalParam[], we assume they are NamedParams[]
    //   inputs = actionBody.inputs || [];
    // }

    let tx = Action.createTx(this, {
      namespace,
      actionName: actionBody.name.toLowerCase(),
      description: actionBody.description || "",
      identifier: kwilSigner.identifier,
      chainId: this.chainId,
      signer: kwilSigner.signer,
      signatureType: kwilSigner.signatureType,
      nonce: actionBody.nonce,
      actionInputs: inputs,
      types: actionBody.types,
    });

    const transaction = await tx.buildTx(this.authMode === AuthenticationMode.PRIVATE);

    return await this.broadcastClient(
      transaction,
      synchronous ? BroadcastSyncType.COMMIT : BroadcastSyncType.SYNC,
    );
  }

  /**
   * Performs a read-only SELECT query on a database.
   * This operation does not modify state.
   *
   * @param query - The SELECT query to execute
   * @param params - Optional array of parameters to bind to the query ($1, $2, etc.)
   * @returns Promise resolving to query results
   */
  public async selectQuery<T extends object>(
    query: string,
    params?: QueryParams,
  ): Promise<GenericResponse<T[]>>;
  /**
   * @deprecated Use selectQuery(query, params?) instead. This method will be removed in next major version.
   */
  public async selectQuery(dbid: string, query: string): Promise<GenericResponse<object[]>>;
  public async selectQuery(
    query: string,
    params?: QueryParams | string,
  ): Promise<GenericResponse<object[]>> {
    // If params is a string, we're using the legacy method call
    if (typeof params === "string") {
      return this.legacySelectQuery(query, params);
    }

    const encodedParams = encodeParameters(params || {});

    const q: SelectQueryRequest = {
      query,
      params: encodedParams,
    };

    return await this.selectQueryClient(q);
  }

  private async legacySelectQuery(dbid: string, query: string): Promise<GenericResponse<object[]>> {
    console.warn(
      "WARNING: selectQuery(dbid, query) is deprecated and will be removed in the next major version. Use selectQuery(query, params?) instead.",
    );

    const q: SelectQueryRequest = {
      query: `{${dbid}}${query}`, // Append the dbid to the query to set the namespace
      params: {},
    };

    return await this.selectQueryClient(q);
  }

  /**
   * Executes a mutative SQL query (INSERT, UPDATE, DELETE) on a database.
   *
   * @param query - The SQL query to execute, including the database identifier in curly braces.
   *               Use parameterized queries with @paramName placeholders for better security (recommended):
   *               '{dbname}INSERT INTO users (name) VALUES (@name)'
   *
   *               Raw queries are possible but discouraged:
   *               '{dbname}INSERT INTO users (name) VALUES ('john')'
   *
   * @param params - Object containing named parameters to bind to the query. Parameters are referenced
   *                using @paramName syntax in the query.
   * @param kwilSigner - Required signer for executing mutative queries
   * @param synchronous - (optional) If true, waits for transaction to be mined
   *
   * @example
   * // Insert with parameters
   * await kwil.execSql(
   *   '{mydb}INSERT INTO users (name, email) VALUES ($name, $email)',
   *   { $name: 'John', $email: 'john@example.com' },
   *   signer
   * );
   *
   * // Update with parameters
   * await kwil.execSql(
   *   '{mydb}UPDATE users SET status = $status WHERE id = $id',
   *   { $status: 'active', $id: 123 },
   *   signer
   * );
   *
   * // Delete with parameters
   * await kwil.execSql(
   *   '{mydb}DELETE FROM users WHERE id = $id',
   *   { $id: 123 },
   *   signer
   * );
   *
   * @returns Promise resolving to transaction receipt
   */

  public async execSql(
    query: string,
    params: QueryParams,
    signer: KwilSigner,
    synchronous?: boolean,
  ): Promise<GenericResponse<TxReceipt>> {
    const encodedParams = encodeRawStatementParameters(params);

    const rawStatementPayload: RawStatementPayload = {
      statement: query,
      parameters: encodedParams,
    };

    const transaction = await PayloadTx.createTx(this, {
      chainId: this.chainId,
      description: `Performing a mutative query`,
      payload: rawStatementPayload,
      payloadType: PayloadType.RAW_STATEMENT,
      identifier: signer.identifier,
      signer: signer.signer,
      signatureType: signer.signatureType,
    }).buildTx();

    return await this.broadcastClient(
      transaction,
      synchronous ? BroadcastSyncType.COMMIT : BroadcastSyncType.SYNC,
    );
  }

  /**
   * Retrieves information about a transaction given its hash.
   *
   * @param hash - The `tx_hash` of the transaction.
   * @returns A promise that resolves to the transaction info receipt.
   */
  public async txInfo(hash: string): Promise<GenericResponse<TxInfoReceipt>> {
    return await this.txInfoClient(hash);
  }

  /**
   * Retrieves the chain id, block height, and latest block hash of the configured network.
   *
   * Will log a warning if the returned chain id does not match the configured chain id.
   *
   * @param {ChainInfoOpts} opts - Options for the chain info request.
   * @returns {ChainInfo} - A promise that resolves to the chain info.
   */
  public async chainInfo(opts?: ChainInfoOpts): Promise<GenericResponse<ChainInfo>> {
    const info = await this.chainInfoClient();

    if (!opts?.disableWarning && info.data?.chain_id !== this.chainId) {
      console.warn(
        `WARNING: Chain ID mismatch. Expected ${info.data?.chain_id}, got ${this.chainId}`,
      );
    }

    return info;
  }

  /**
   * Pings the server and gets a response.
   *
   * @returns A promise that resolves to a string indicating the server's response.
   */
  public async ping(): Promise<GenericResponse<string>> {
    return await this.pingClient();
  }

  // DEPRECATED APIS BELOW
  /**
   * Generates a unique database identifier (DBID) from the provided owner's identifier (e.g. wallet address, public key, etc.) and a database name.
   *
   * @param owner - The owner's identifier (e.g wallet address, public key, etc.). Ethereum addresses can be passed as a hex string (0x123...) or as bytes (Uint8Array). NEAR protocol public keys can be passed as the base58 encoded public key (with "ed25519:" prefix), a hex string, or bytes (Uint8Array).
   * @param name - The name of the database. This should be a unique name to identify the database.
   * @deprecated DBID's are no longer in use.  This method will be removed in the next major version.
   * @returns A string that represents the unique identifier for the database.
   */

  public getDBID(owner: string | Uint8Array, name: string): string {
    console.warn(
      "WARNING: `getDBID()` is deprecated and will be removed in the next major version. Please use `kwil.selectQuery(query, params?)` instead.",
    );
    return generateDBID(owner, name);
  }

  /**
   * Calls a Kwil node. This can be used to execute read-only ('view') actions on Kwil.
   *
   * @param {CallBody} callBody - The message to send. The message can be built using the buildMsg() method in the Action class.
   * @param {KwilSigner} kwilSigner (optional) - KwilSigner should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
   * @param {(...args: any) => void} cookieHandlerCallback (optional) - the callback to handle the cookie if in the NODE environment
   * @returns A promise that resolves to the receipt of the message.
   */
  protected async baseCall<T extends object>(
    callBody: CallBody,
    kwilSigner?: KwilSigner,
    cookieHandlerCallback?: { setCookie: () => void; resetCookie: () => void },
  ): Promise<GenericResponse<MsgReceipt<T>>> {
    // Ensure auth mode is set
    await this.ensureAuthenticationMode();

    if (this.authMode === AuthenticationMode.OPEN) {
      // if nodeJS user passes a cookie, use it for the call
      if (cookieHandlerCallback) {
        cookieHandlerCallback.setCookie();
      }
      const message = await this.buildMessage(callBody, kwilSigner);
      const response = await this.callClient(message);

      // if nodeJS user passes a cookie, reset it after the call
      if (cookieHandlerCallback) {
        cookieHandlerCallback.resetCookie();
      }

      // if the user is not authenticated, prompt the user to authenticate
      if (response.authCode === AuthErrorCodes.KGW_MODE && this.autoAuthenticate) {
        if (!kwilSigner) {
          throw new Error("KGW authentication requires a KwilSigner");
        }
        const res = await this.auth.authenticateKGW(kwilSigner);

        // if cookie was returned with res.data, we are in nodejs and need to set the cookie
        if (res.data && "cookie" in res.data) {
          this.cookie = res.data.cookie;
        }
        return await this.callClient(message);
      }
      return response;
    }
    if (this.authMode === AuthenticationMode.PRIVATE) {
      const authBody = await this.handleAuthenticatePrivate(callBody, kwilSigner);
      const message = await this.buildMessage(
        callBody,
        kwilSigner,
        authBody.challenge,
        authBody.signature,
      );
      return await this.callClient(message);
    }

    throw new Error(
      "Unexpected authentication mode. If you hit this error, please report it to the Kwil team.",
    );
  }

  /**
   * Check if authMode is already set, if not call healthModeCheckClient()
   * healthModeCheckClient => RPC call to retrieve health of blockchain and kwild mode (PRIVATE or OPEN (PUBLIC))
   *
   */
  private async ensureAuthenticationMode(): Promise<void> {
    if (!this.authMode) {
      const health = await this.healthModeCheckClient();
      this.authMode = health.data?.mode;
    }
  }

  /**
   * Builds a message with a chainId, namespace, name, and description of the action.
   * NOT INCLUDED => challenge, sender, signature
   *
   * @param callBody - The message to send. The message can be built using the buildMsg() method in the Action class.
   * @param kwilSigner (optional) - KwilSigner should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
   * @param challenge (optional) - To ensure a challenge is passed into the message before the signer in PRIVATE mode
   * @param signature (optional) - To ensure a signature is passed into the message before the signer in PRIVATE mode
   * @returns A message object that can be sent to the Kwil network.
   * @throws — Will throw an error if the action is being built or if there's an issue with the schema or account retrieval.
   * @throws — Will throw an error if the action is not a view action.
   */
  private async buildMessage(
    callBody: CallBody,
    kwilSigner?: KwilSigner,
    challenge?: string,
    signature?: Base64String,
  ): Promise<Message> {
    if (!callBody.name) {
      throw new Error("name is required in actionBody");
    }

    const namespace = resolveNamespace(callBody);

    // ActionInput[] is deprecated. So we are converting any ActionInput[] to an Entries[]
    let inputs: NamedParams[] | PositionalParams[] = [];
    if (callBody.inputs && transformActionInput.isActionInputArray(callBody.inputs)) {
      // For a call only one entry is allowed, so we only need to convert the first ActionInput
      inputs = [transformActionInput.toSingleEntry(callBody.inputs)];
    } else if (callBody.inputs && isNamedParam(callBody.inputs)) {
      inputs = [callBody.inputs];
    } else {
      inputs = callBody.inputs ? [callBody.inputs] : [];
    }

    // pre Challenge message
    let msg = Action.createTx<EnvironmentType.BROWSER>(this, {
      chainId: this.chainId,
      namespace,
      actionName: callBody.name,
      description: "",
      actionInputs: inputs,
      types: callBody.types,
    });

    /**
     * PUBLIC MODE
     * include the sender when the user passes a KwilSigner to kwil.call().
     * This is because the sender is required for queries that use @caller
     *
     */
    if (kwilSigner && this.authMode === AuthenticationMode.OPEN) {
      this.addSignerToMessage(msg, kwilSigner);
    }

    /**
     * PRIVATE MODE
     * include the sender when the user passes a KwilSigner to kwil.call().
     * only AFTER a challenge and signature is attached to the message
     *
     */
    if (kwilSigner && this.authMode === AuthenticationMode.PRIVATE) {
      if (challenge && signature) {
        // add challenge and signature to the message
        msg.challenge = challenge;
        msg.signature = signature;
        this.addSignerToMessage(msg, kwilSigner);
      }
    }

    return await msg.buildMsg(this.authMode === AuthenticationMode.PRIVATE);
  }

  /**
   * Adds a signer to the message
   *
   * @param msgBuilder - The Action class that handles the building of the message
   * @param kwilSigner - KwilSigner should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
   * @returns the Action class responsible for building the view action message with the sender attached
   *
   */
  private addSignerToMessage(
    msg: Action<EnvironmentType.BROWSER>,
    kwilSigner: KwilSigner,
  ): Action<EnvironmentType.BROWSER> {
    msg.signer = kwilSigner.signer;
    msg.signatureType = kwilSigner.signatureType;
    msg.identifier = kwilSigner.identifier;

    return msg;
  }

  /**
   * Checks authentication errors for PRIVATE mode
   * Signs message and then retries request for successful response
   *
   * @param {CallBodyNode} actionBody - The message to send. The message can be built using the buildMsg() method in the Action class.
   * @param {KwilSigner} kwilSigner (optional) - KwilSigner should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
   * @returns the authentication body that consists of the challenge and signature required for PRIVATE mode
   */

  private async handleAuthenticatePrivate(
    actionBody: CallBody,
    kwilSigner?: KwilSigner,
  ): Promise<AuthBody> {
    if (this.autoAuthenticate) {
      try {
        // PRIVATE MODE AUTHENTICATION
        if (this.authMode === AuthenticationMode.PRIVATE) {
          if (!kwilSigner) {
            throw new Error("Private mode authentication requires a KwilSigner.");
          }

          return await this.auth.authenticatePrivateMode(actionBody, kwilSigner);
        }
      } catch (error) {
        throw new Error(`Authentication failed: ${error}`);
      }
    }

    throw new Error("Authentication process did not complete successfully");
  }
}
