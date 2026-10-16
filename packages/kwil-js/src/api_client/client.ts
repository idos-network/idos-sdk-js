import { AxiosResponse } from "axios";

import { KGWAuthInfo, AuthSuccess, AuthenticatedBody, LogoutResponse } from "../core/auth";
import {
  AccountStatus,
  AuthErrorCodes,
  BroadcastSyncType,
  BytesEncodingStatus,
  EnvironmentType,
} from "../core/enums";
import {
  AccountRequest,
  AccountResponse,
  AuthParamRequest,
  AuthParamResponse,
  AuthnLogoutRequest,
  AuthnRequest,
  AuthnResponse,
  BroadcastRequest,
  BroadcastResponse,
  CallRequest,
  CallResponse,
  ChainInfoRequest,
  ChainInfoResponse,
  ChallengeRequest,
  ChallengeResponse,
  EstimatePriceRequest,
  EstimatePriceResponse,
  HealthRequest,
  HealthResponse,
  JSONRPCMethod,
  JsonRPCRequest,
  JsonRPCResponse,
  ListDatabasesRequest,
  ListDatabasesResponse,
  PingRequest,
  PingResponse,
  QueryResponse,
  SelectQueryRequest,
  SelectQueryResponse,
  TxQueryRequest,
  TxQueryResponse,
} from "../core/jsonrpc";
import { CallClientResponse, Message } from "../core/message";
import { Account, AccountId, ChainInfo, DatasetInfo } from "../core/network";
import { GenericResponse } from "../core/resreq";
import { Transaction, TxReceipt } from "../core/tx";
import { TxInfoReceipt } from "../core/txQuery";
import { base64ToBytes } from "../utils/base64";
import { base64ToHex, bytesToHex, hexToBytes } from "../utils/serial";
import { HexString } from "../utils/types";
import { Api } from "./api";
import { ClientConfig } from "./config";

interface AuthError {
  status: number;
  data: {
    result: null;
  };
  authCode: AuthErrorCodes;
}

export default class Client extends Api {
  private unconfirmedNonce: boolean;
  private jsonRpcId: number = 1;

  constructor(opts: ClientConfig) {
    super(opts);
    this.unconfirmedNonce = opts.unconfirmedNonce || false;
  }

  protected async getAuthenticateClient(): Promise<GenericResponse<KGWAuthInfo>> {
    const body = this.buildJsonRpcRequest<AuthParamRequest>(JSONRPCMethod.METHOD_KGW_PARAM, {});

    const res = await super.post<JsonRPCResponse<AuthParamResponse>>(`/rpc/v1`, body);

    return checkRes(res, (r) => r.result);
  }

  protected async postAuthenticateClient<T extends EnvironmentType>(
    authBody: AuthenticatedBody<BytesEncodingStatus.HEX_ENCODED>,
  ): Promise<GenericResponse<AuthSuccess<T>>> {
    const body = this.buildJsonRpcRequest<AuthnRequest>(JSONRPCMethod.METHOD_KGW_AUTHN, authBody);

    const res = await super.post<JsonRPCResponse<AuthnResponse>>(`/rpc/v1`, body);

    if (typeof window === "undefined") {
      return checkRes(res, (r) => {
        const cookie = res.headers["set-cookie"];
        if (!cookie) {
          throw new Error(
            "No cookie received from gateway. An error occurred with authentication.",
          );
        }

        return {
          ...r.result,
          cookie: cookie[0],
        };
      });
    }

    // if we are in the browser, we don't need to return the cookie
    return checkRes(res, (r) => r.result);
  }

  // TODO: Update once KGW is updated for JSON RPC - DO NOT MERGE WITHOUT RESOLVING
  protected async logoutClient<T extends EnvironmentType>(
    identifier?: Uint8Array,
  ): Promise<GenericResponse<LogoutResponse<T>>> {
    const body = this.buildJsonRpcRequest<AuthnLogoutRequest>(JSONRPCMethod.METHOD_KGW_LOGOUT, {
      account: identifier ? bytesToHex(identifier) : "",
    });

    const res = await super.post<JsonRPCResponse<AuthnResponse>>(`/rpc/v1`, body);

    // if we are in nodejs, we need to return the cookie
    if (typeof window === "undefined") {
      return checkRes(res, (r) => {
        const cookie = res.headers["set-cookie"];
        if (!cookie) {
          throw new Error("No cookie received from gateway. An error occurred with logout.");
        }

        // if the cookie is empty, set the cookie to undefined
        if (cookie[0].startsWith("kgw_session=;")) {
          this.cookie = undefined;
        } else {
          // set the cookie
          this.cookie = cookie[0];
        }

        return {
          ...r.result,
          cookie: cookie[0],
        };
      });
    }

    // if we are in the browser, we don't need to return the cookie - the browser will handle it
    return checkRes(res, (r) => r.result);
  }

  protected async getAccountClient(accountId: AccountId): Promise<GenericResponse<Account>> {
    const body = this.buildJsonRpcRequest<AccountRequest>(JSONRPCMethod.METHOD_ACCOUNT, {
      id: accountId,
      status: this.unconfirmedNonce ? AccountStatus.PENDING : AccountStatus.LATEST,
    });

    const res = await super.post<JsonRPCResponse<AccountResponse>>(`/rpc/v1`, body);

    return checkRes(res, (r) => {
      return {
        ...r.result,
        id: r.result.id,
      };
    });
  }

  protected async listDatabasesClient(owner?: Uint8Array): Promise<GenericResponse<DatasetInfo[]>> {
    const body = this.buildJsonRpcRequest<ListDatabasesRequest>(JSONRPCMethod.METHOD_DATABASES, {
      owner: owner ? bytesToHex(owner) : undefined,
    });

    const res = await super.post<JsonRPCResponse<ListDatabasesResponse>>(`/rpc/v1`, body);

    return checkRes(res, (r) => {
      if (!r.result.databases) {
        return [];
      }

      return r.result.databases.map((db) => {
        return {
          ...db,
          owner: hexToBytes(db.owner),
        };
      });
    });
  }

  protected async estimateCostClient(tx: Transaction): Promise<GenericResponse<string>> {
    const body = this.buildJsonRpcRequest<EstimatePriceRequest>(JSONRPCMethod.METHOD_PRICE, {
      tx: tx.txData,
    });

    const res = await super.post<JsonRPCResponse<EstimatePriceResponse>>(`/rpc/v1`, body);

    return checkRes(res, (r) => r.result.price);
  }

  protected async broadcastClient(
    tx: Transaction,
    broadcastSync?: BroadcastSyncType,
  ): Promise<GenericResponse<TxReceipt>> {
    if (!tx.isSigned()) {
      throw new Error("Tx must be signed before broadcasting.");
    }

    const body = this.buildJsonRpcRequest<BroadcastRequest>(JSONRPCMethod.METHOD_BROADCAST, {
      tx: tx.txData,
      ...(broadcastSync ? { sync: broadcastSync } : {}),
    });

    const res = await super.post<JsonRPCResponse<BroadcastResponse>>(`/rpc/v1`, body);
    return checkRes(res, (r) => {
      // if r.result.result is included, it means that the user sent the transaction with a sync type of COMMIT
      // if any error occurred when submitting the transaction will be included in r.result.result
      // if r.result.result.code is not zero, it means that an error occurred when committing the transaction to a block

      if (r.result.result && r.result.result?.code !== 0) {
        throw new Error(JSON.stringify(r.result) || `Transaction failed after broadcast.`);
      }

      const txHash = base64ToHex(r.result.tx_hash);
      if (!/^[0-9a-fA-F]{64}$/.test(txHash)) {
        throw new Error(`invalid tx_hash length: expected 64 hex chars, got ${txHash.length}`);
      }

      return {
        tx_hash: txHash,
      };
    });
  }

  protected async pingClient(): Promise<GenericResponse<string>> {
    const body = this.buildJsonRpcRequest<PingRequest>(JSONRPCMethod.METHOD_PING, {
      message: "ping",
    });

    const res = await super.post<JsonRPCResponse<PingResponse>>(`/rpc/v1`, body);

    return checkRes(res, (r) => r.result.message);
  }

  protected async chainInfoClient(): Promise<GenericResponse<ChainInfo>> {
    const body = this.buildJsonRpcRequest<ChainInfoRequest>(JSONRPCMethod.METHOD_CHAIN_INFO, {});

    const res = await super.post<JsonRPCResponse<ChainInfoResponse>>(`/rpc/v1`, body);

    return checkRes(res, (r) => {
      return {
        chain_id: r.result.chain_id,
        height: r.result.block_height.toString(),
        hash: r.result.block_hash,
      };
    });
  }

  protected async healthModeCheckClient(): Promise<GenericResponse<HealthResponse>> {
    // JsonRPCRequest to Determine mode (KGW or Private)
    const body = this.buildJsonRpcRequest<HealthRequest>(JSONRPCMethod.METHOD_HEALTH, {});

    const res = await super.post<JsonRPCResponse<HealthResponse>>(`/rpc/v1`, body);

    return checkRes(res, (r) => r.result);
  }

  protected async challengeClient(): Promise<GenericResponse<HexString>> {
    // JsonRPCRequest to generate a challenge
    const body = this.buildJsonRpcRequest<ChallengeRequest>(JSONRPCMethod.METHOD_CHALLENGE, {});

    const res = await super.post<JsonRPCResponse<ChallengeResponse>>(`/rpc/v1`, body);

    return checkRes(res, (r) => r.result.challenge);
  }

  protected async selectQueryClient(query: SelectQueryRequest): Promise<GenericResponse<object[]>> {
    const body = this.buildJsonRpcRequest<SelectQueryRequest>(JSONRPCMethod.METHOD_QUERY, query);
    const res = await super.post<JsonRPCResponse<SelectQueryResponse>>(`/rpc/v1`, body);

    return checkRes(res, (r) => this.parseQueryResponse(r.result));
  }

  protected async txInfoClient(tx_hash: string): Promise<GenericResponse<TxInfoReceipt>> {
    const body = this.buildJsonRpcRequest<TxQueryRequest>(JSONRPCMethod.METHOD_TX_QUERY, {
      tx_hash,
    });

    const res = await super.post<JsonRPCResponse<TxQueryResponse>>(`/rpc/v1`, body);

    return checkRes(res, (r) => {
      return {
        ...r.result,
        tx: {
          ...r.result.tx,
          body: {
            ...r.result.tx.body,
            payload: base64ToBytes(r.result.tx.body.payload as string),
            fee: BigInt(r.result.tx.body.fee || 0),
          },
          signature: {
            ...r.result.tx.signature,
            sig: base64ToBytes(r.result.tx.signature.sig as string),
          },
          sender: hexToBytes(r.result.tx.sender || ""),
        },
      };
    });
  }

  protected async callClient(msg: Message): Promise<CallClientResponse<any>> {
    const body = this.buildJsonRpcRequest<CallRequest>(JSONRPCMethod.METHOD_CALL, {
      body: msg.body,
      auth_type: msg.auth_type,
      sender: msg.sender || "",
      signature: msg.signature || "",
    });

    const res = await super.post<JsonRPCResponse<CallResponse>>(`/rpc/v1`, body);

    const errorResponse = this.checkAuthError(res);
    if (errorResponse) {
      return errorResponse;
    }

    return checkRes(res, (r) => ({
      result: this.parseQueryResponse(r.result.query_result),
      logs: r.result.logs,
      error: r.result.error ?? undefined,
    }));
  }

  private buildJsonRpcRequest<T>(method: JSONRPCMethod, params: T): JsonRPCRequest<T> {
    return {
      jsonrpc: "2.0",
      id: this.jsonRpcId++,
      method,
      params,
    };
  }

  // Check for specific error codes and return http status, result of view action, and rpc authError code (if applicable)
  private checkAuthError<T>(
    res: AxiosResponse<JsonRPCResponse<T>>,
  ): CallClientResponse<AuthError> | null {
    const errorCode = res.data.error?.code;

    if (errorCode === AuthErrorCodes.PRIVATE_MODE || errorCode === AuthErrorCodes.KGW_MODE) {
      return {
        status: res.status,
        data: undefined,
        authCode: errorCode,
      };
    }
    return null;
  }

  private parseQueryResponse(queryResponse: QueryResponse): object[] {
    const { column_names, values } = queryResponse;

    if (!values || values.length === 0) {
      return [];
    }

    // Create a mapping function once that will be reused for all rows
    const mapValueToColumn = (rowValues: any[]): Record<string, any> => {
      const obj: Record<string, any> = {};
      for (let i = 0; i < column_names.length; i++) {
        obj[column_names[i]] = rowValues[i];
      }
      return obj;
    };

    // Map each row of values to an object using the column mapping
    return values.map(mapValueToColumn);
  }
}

function checkRes<T, R>(
  res: AxiosResponse<JsonRPCResponse<T>>,
  selector: (r: JsonRPCResponse<T>) => R | undefined,
): GenericResponse<R> {
  switch (res.status) {
    case 200:
      break;
    case 401:
      throw new Error(JSON.stringify(res.data) || "Unauthorized.");
    case 404:
      throw new Error(JSON.stringify(res.data) || "Not found.");
    case 500:
      throw new Error(JSON.stringify(res.data) || "Internal server error.");
    default:
      throw new Error(
        JSON.stringify(res.data) ||
          "An unknown error has occurred.  Please check your network connection.",
      );
  }

  if (!res.data) {
    throw new Error(`failed to parse response: ${res}`);
  }

  if (res.data.error) {
    const data = res.data.error.data ? `, data: ${JSON.stringify(res.data.error.data)}` : "";
    throw new Error(
      `JSON RPC call error: code: ${res.data.error.code}, message: ${res.data.error.message}` +
        data,
    );
  }

  if (res.data.jsonrpc !== "2.0") {
    throw new Error(JSON.stringify(res.data) || "Invalid JSON RPC response.");
  }

  if (!res.data.result) {
    throw new Error(JSON.stringify(res.data) || "No result in JSON RPC response.");
  }

  return {
    status: res.status,
    data: selector(res.data),
  };
}
