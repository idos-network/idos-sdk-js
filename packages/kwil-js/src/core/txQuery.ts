import { BytesEncodingStatus } from "./enums";
import { TxnData } from "./tx";

export interface TxResult {
  code: number;
  log: string;
  gasUsed: number;
  gasWanted: number;
  data: string;
  events: string[];
}

export interface TxInfoReceipt {
  get tx_hash(): string;
  get height(): number;
  get tx(): TxnData<BytesEncodingStatus.UINT8_ENCODED>;
  get tx_result(): TxResult;
}
