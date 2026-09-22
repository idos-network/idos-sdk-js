/**
 * VarType is the type of the data in the database.
 *
 * Although Kwil supports text, int, bool, blob, uuid, uint256, decimal, and null types, kwil-js only supports text, int, bool, decimal, and null. If you need to send blob, uuid, or uint256 types, you should send them as a javascript string.
 *
 */
export enum VarType {
  UUID = "uuid",
  TEXT = "text",
  INT8 = "int8",
  BOOL = "bool",
  NUMERIC = "numeric",
  NULL = "null",
  BYTEA = "bytea",
  UNKNOWN = "unknown",
}

export enum AttributeType {
  INVALID_TYPE = "",
  PRIMARY_KEY = "PRIMARY_KEY",
  UNIQUE = "UNIQUE",
  NOT_NULL = "NOT_NULL",
  DEFAULT = "DEFAULT",
  MIN = "MIN",
  MAX = "MAX",
  MIN_LENGTH = "MIN_LENGTH",
  MAX_LENGTH = "MAX_LENGTH",
}

export enum IndexType {
  INVALID_INDEX_TYPE = "",
  BTREE = "BTREE",
  UNIQUE_BTREE = "UNIQUE_BTREE",
}

export enum EncodingType {
  INVALID_ENCODING_TYPE = 0,
  RLP_ENCODING,
}

export enum PayloadType {
  INVALID_PAYLOAD_TYPE = "invalid",
  EXECUTE_ACTION = "execute",
  CALL_ACTION = "call_action",
  TRANSFER = "transfer",
  RAW_STATEMENT = "raw_statement",
}

export enum SerializationType {
  INVALID_SERIALIZATION_TYPE = "invalid",
  SIGNED_MSG_CONCAT = "concat",
  SIGNED_MSG_EIP712 = "eip712",
}

export enum BytesEncodingStatus {
  INVALID_ENCODING_STATUS = "invalid",
  BASE64_ENCODED = "base64_encoded",
  HEX_ENCODED = "hex_encoded",
  UINT8_ENCODED = "uint8_encoded",
}

export enum EnvironmentType {
  BROWSER = "browser",
  NODE = "node",
}

export enum AuthenticationMode {
  PRIVATE = "private",
  OPEN = "open", // kwil-db in public mode, regardless of kgw running
}

export type PayloadBytesTypes =
  | BytesEncodingStatus.BASE64_ENCODED
  | BytesEncodingStatus.UINT8_ENCODED;

export enum BroadcastSyncType {
  SYNC = 0, // Ensures the transaction is accepted to mempool before responding (default behavior).
  COMMIT = 1, // Will wait for the transaction to be included in a block.
}

export enum AuthErrorCodes {
  PRIVATE_MODE = -1001,
  KGW_MODE = -901,
}

// For checking the unconfirmed nonce
export enum AccountStatus {
  // returns the latest confirmed nonce
  LATEST = 0,
  // returns the latest unconfirmed nonce
  PENDING = 1,
}

export enum AccountKeyType {
  // Eth
  SECP256K1 = "secp256k1",

  // ED25519
  ED25519 = "ed25519",
}

export enum AccessModifier {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
  VIEW = "VIEW",
}
