import { Base64String, EncodedQueryParams, HexString } from "../utils/types";
import { KGWAuthInfo, AuthenticatedBody } from "./auth";
import { Database } from "./database";
import { AccountStatus, BroadcastSyncType, BytesEncodingStatus } from "./enums";
import { MsgData } from "./message";
import { AccountId, DatasetInfoServer } from "./network";
import { TxnData } from "./tx";
import { TxResult } from "./txQuery";

export interface JsonRPCRequest<T> {
  jsonrpc: string;
  id: number;
  method: JSONRPCMethod;
  params: T;
}

export enum JSONRPCMethod {
  // TODO: Should we implement version? It hasn't historically existed on Kwil-JS, but i notice it in kwil-db.
  METHOD_HEALTH = "user.health",
  METHOD_PING = "user.ping",
  METHOD_CHAIN_INFO = "user.chain_info",
  METHOD_ACCOUNT = "user.account",
  METHOD_BROADCAST = "user.broadcast",
  METHOD_CALL = "user.call",
  METHOD_DATABASES = "user.databases",
  METHOD_PRICE = "user.estimate_price",
  METHOD_QUERY = "user.query",
  METHOD_TX_QUERY = "user.tx_query",
  METHOD_SCHEMA = "user.schema",
  METHOD_KGW_PARAM = "kgw.authn_param",
  METHOD_KGW_AUTHN = "kgw.authn",
  METHOD_KGW_LOGOUT = "kgw.logout",
  METHOD_CHALLENGE = "user.challenge",
}

export interface SchemaRequest {
  namespace: string;
}

export interface AccountRequest {
  id: AccountId;
  status: AccountStatus;
}

export interface BroadcastRequest {
  tx: TxnData<BytesEncodingStatus.BASE64_ENCODED>;
  sync?: BroadcastSyncType;
}

export type CallRequest = MsgData<BytesEncodingStatus.BASE64_ENCODED>;

export type ChainInfoRequest = EmptyRequest;

export type ChallengeRequest = EmptyRequest;

export type HealthRequest = EmptyRequest;

interface EmptyRequest {
  [key: string]: never;
}

export interface ListDatabasesRequest {
  owner?: HexString;
}

export interface PingRequest {
  message: string;
}

export interface EstimatePriceRequest {
  tx: TxnData<BytesEncodingStatus.BASE64_ENCODED>;
}

export interface SelectQueryRequest {
  query: string;
  params: EncodedQueryParams;
}

export interface TxQueryRequest {
  tx_hash: string;
}

export type AuthParamRequest = EmptyRequest;

export type AuthnRequest = AuthenticatedBody<BytesEncodingStatus.HEX_ENCODED>;

export interface AuthnLogoutRequest {
  account: Base64String;
}

export interface JsonRPCResponse<T> {
  jsonrpc: string;
  id: number;
  result: T;
  error?: JsonRPCError;
}

interface JsonRPCError {
  code?: number;
  message?: string;
  data?: object;
}

export interface SchemaResponse {
  schema: Database & {
    owner: string;
  };
}

export interface AccountResponse {
  id?: AccountId;
  balance: string;
  nonce: number;
}

export interface BroadcastResponse {
  tx_hash: Base64String;
  result?: {
    code: number;
    gas: number;
    log: string;
    events: any[];
  };
}

export interface ChainInfoResponse {
  chain_id: string;
  block_height: number;
  block_hash: string;
}

export interface ChallengeResponse {
  challenge: HexString;
}

export interface HealthResponse {
  healthy: boolean;
  version: string;
  chainInfoResponse: ChainInfoResponse;
  blockTimeStamp: number;
  blockAge: number;
  syncing: boolean;
  appHeight: number;
  appHash: HexString;
  peerCount: number;
  mode: string;
}

export type SelectQueryResponse = QueryResponse;
export type CallResponse = {
  query_result: QueryResponse;
  logs?: string;
  error?: string;
};

export interface QueryResponse {
  column_names: string[];
  column_types: ColumnType[];
  values: any[];
}

export interface ColumnType {
  name: string;
  is_array: boolean;
  metadata: Array<number>;
}

export interface ListDatabasesResponse {
  databases?: DatasetInfoServer[];
}

export interface PingResponse {
  message: string;
}

export interface EstimatePriceResponse {
  price: string;
}

export interface TxQueryResponse {
  tx_hash: string;
  height: number;
  tx: TxnData<BytesEncodingStatus.BASE64_ENCODED>;
  tx_result: TxResult;
}

export type AuthParamResponse = KGWAuthInfo;

export interface AuthnResponse {
  result: string;
}
