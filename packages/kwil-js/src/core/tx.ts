import { strings } from "../utils/strings";
import { Base64String, HexString, Nillable, NonNil } from "../utils/types";
import { PayloadType, SerializationType, BytesEncodingStatus, PayloadBytesTypes } from "./enums";
import { Signature, SignatureType } from "./signature";

/**
 * `TxReceipt` is the interface for a payload structure for a a response from the Kwil `broadcast` GRPC endpoint.
 */
export interface TxReceipt {
  get tx_hash(): HexString;
}

/**
 * `TxnData` is the interface for a payload structure for a a request to the Kwil `broadcast` GRPC endpoint.
 */
export interface TxnData<T extends PayloadBytesTypes> {
  signature: Signature<T>;
  body: TxBody<T>;
  // when the other bytes are base64, it means it is time to turn the sender bytes to hex string
  sender: Nillable<T extends BytesEncodingStatus.BASE64_ENCODED ? HexString : Uint8Array>;
  serialization: SerializationType;
}

interface TxBody<T extends PayloadBytesTypes> {
  desc: string;
  payload: Nillable<T extends BytesEncodingStatus.BASE64_ENCODED ? Base64String : Uint8Array>;
  type: PayloadType;
  // once bytes are set to base64, it means the tx is ready to be sent over GRPC, which means BigInt needs to be converted to string
  fee: Nillable<T extends BytesEncodingStatus.BASE64_ENCODED ? string : bigint>;
  nonce: number | null;
  chain_id: string;
}

/**
 * `Transaction` is the payload structure for a a request to the Kwil `broadcast` GRPC endpoint.
 * All bytes in the payload are base64 encoded.
 */
export type Transaction = BaseTransaction<BytesEncodingStatus.BASE64_ENCODED>;

/**
 * `BaseTransaction` is the base class for a payload structure for a a request to the Kwil `broadcast` GRPC endpoint.
 * Bytes in the transaction can be typed to be either base64 encoded or Uint8Array. Uint8Array should be used when building the transaction within the SDK, and base64 should be used for the final transaction to be send over GRPC.
 *
 * @template {BytesEncodingStatus.BASE64_ENCODED | BytesEncodingStatus.UINT8_ENCODED} T - The type of bytes in the transaction. Can be either base64 encoded or Uint8Array.
 * @implements {TxnData<T>} - The transaction data interface.
 */
export class BaseTransaction<T extends PayloadBytesTypes> implements TxnData<T> {
  protected readonly data: Readonly<TxnData<T>>;

  constructor(data?: NonNil<TxnData<T>>) {
    // create basic template of tx. Null values are used to be compatible with both types in PayloadBytesTypes.
    this.data = data || {
      signature: {
        sig: null,
        type: SignatureType.SIGNATURE_TYPE_INVALID,
      },
      body: {
        desc: "",
        payload: null,
        type: PayloadType.INVALID_PAYLOAD_TYPE,
        fee: null,
        nonce: null,
        chain_id: "",
      },
      sender: null,
      serialization: SerializationType.SIGNED_MSG_CONCAT,
    };
  }

  public get txData(): Readonly<TxnData<T>> {
    return this.data;
  }

  public isSigned(): boolean {
    return !strings.isNilOrEmpty(this.data.signature.sig as string);
  }

  public get signature(): Readonly<Signature<T>> {
    return this.data.signature;
  }

  public get sender(): Nillable<
    T extends BytesEncodingStatus.BASE64_ENCODED ? Base64String : Uint8Array
  > {
    return this.data.sender;
  }

  public get body(): Readonly<TxBody<T>> {
    return this.data.body;
  }

  public get serialization(): SerializationType {
    return this.data.serialization;
  }
}

export namespace Txn {
  /**
   * Creates a new instance of the `BaseTransaction` class.
   * Bytes in the transaction can be typed to be either base64 encoded or Uint8Array. Uint8Array should be used when building the transaction within the SDK, and base64 should be used for the final transaction to be send over GRPC.
   *
   * @template {BytesEncodingStatus.BASE64_ENCODED | BytesEncodingStatus.UINT8_ENCODED} T - The type of bytes in the transaction. Can be either base64 encoded or Uint8Array.
   * @param {(tx: TxnData<T>) => void} configure - A function that takes in a `TxnData` object and sets fields on it.
   * @returns {BaseTransaction<T>} - A new instance of the `BaseTransaction` class.
   */
  export function create<T extends PayloadBytesTypes>(
    configure: (tx: TxnData<T>) => void,
  ): NonNil<BaseTransaction<T>> {
    // create basic template of tx. Null values are used to be compatible with both types in PayloadBytesTypes.
    const tx = {
      signature: {
        sig: null,
        type: SignatureType.SECP256K1_PERSONAL,
      },
      body: {
        desc: "",
        payload: null,
        type: PayloadType.INVALID_PAYLOAD_TYPE,
        fee: null,
        nonce: null,
        chain_id: "",
      },
      sender: null,
      serialization: SerializationType.SIGNED_MSG_CONCAT,
    };

    // Passes the 'tx' object to the 'configure' function allowing external modification of its properties before instantiation of BaseTransaction.
    configure(tx);

    return new BaseTransaction(tx);
  }

  /**
   * Copies an existing instance of the `BaseTransaction` class and modifies certain fields.
   *
   * Bytes in the transaction can be typed to be either base64 encoded or Uint8Array. Uint8Array should be used when building the transaction within the SDK, and base64 should be used for the final transaction to be send over GRPC.
   *
   * @template {BytesEncodingStatus.BASE64_ENCODED | BytesEncodingStatus.UINT8_ENCODED} T - The type of bytes in the transaction. Can be either base64 encoded or Uint8Array.
   * @param {BaseTransaction<PayloadBytesTypes>} source - The transaction to copy. It can be using either bytes types.
   * @param {(tx: TxnData<T>) => void} configure - A function that takes in a `TxnData` object and sets fields on it.
   * @returns {BaseTransaction<T>} - A new instance of the `BaseTransaction` class.
   */
  export function copy<T extends PayloadBytesTypes>(
    source: NonNil<BaseTransaction<PayloadBytesTypes>>,
    configure: (tx: TxnData<T>) => void,
  ): NonNil<BaseTransaction<T>> {
    return Txn.create((tx: TxnData<PayloadBytesTypes>) => {
      // copy all fields from source tx to new tx.
      tx.body = source.body;
      tx.signature = source.signature;
      tx.body = source.body;
      tx.sender = source.sender;
      tx.serialization = source.serialization;

      // Passes the 'tx' object to the 'configure' function allowing external modification of its properties before instantiation of BaseTransaction.
      configure(tx);
    });
  }
}
