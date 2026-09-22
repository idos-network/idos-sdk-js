// network.ts contains interfaces for network-related data structures.

import { HexString } from "../utils/types";
import { AccountKeyType, BytesEncodingStatus } from "./enums";

export interface AccountId {
  identifier: string;
  // can be a built in key type, or a string if using a custom signer
  key_type: AccountKeyType | string;
}

export interface Account {
  id?: AccountId;
  balance: string;
  nonce: number;
}

export interface ChainInfo {
  chain_id: string;
  height: string;
  hash: string;
}

export interface ChainInfoOpts {
  disableWarning?: boolean;
}

export type DatasetInfo = DatasetInfoBase<BytesEncodingStatus.UINT8_ENCODED>;

export type DatasetInfoServer = DatasetInfoBase<BytesEncodingStatus.HEX_ENCODED>;

export interface DatasetInfoBase<T extends BytesEncodingStatus> {
  name: string;
  owner: T extends BytesEncodingStatus.HEX_ENCODED ? HexString : Uint8Array;
  dbid: string;
}
