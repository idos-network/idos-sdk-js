import type { TypedDataDomain, TypedDataField } from "ethers";

export type PbcAddress = string;
export type Bytes32 = string;
export type Bytes24 = string;
export type Address = string;
export type Bytes = string;

export const UPLOAD_TYPES: Record<string, TypedDataField[]> = {
  UploadSignatureMessage: [
    { name: "share_commitments", type: "bytes32[]" },
    { name: "recovering_addresses", type: "string[]" },
  ],
};

export const DOWNLOAD_TYPES: Record<string, TypedDataField[]> = {
  DownloadSignatureMessage: [
    { name: "recovering_address", type: "string" },
    { name: "timestamp", type: "uint64" },
    { name: "public_key", type: "bytes32" },
  ],
};

export const UPDATE_TYPES: Record<string, TypedDataField[]> = {
  UpdateWalletsSignatureMessage: [
    { name: "recovering_addresses", type: "string[]" },
    { name: "timestamp", type: "uint64" },
  ],
};

export const ADD_ADDRESS_TYPES: Record<string, TypedDataField[]> = {
  AddAddressSignatureMessage: [
    { name: "recovering_address", type: "string" },
    { name: "address_to_add", type: "string" },
    { name: "timestamp", type: "uint64" },
  ],
};

export const REMOVE_ADDRESS_TYPES: Record<string, TypedDataField[]> = {
  RemoveAddressSignatureMessage: [
    { name: "recovering_address", type: "string" },
    { name: "address_to_remove", type: "string" },
    { name: "timestamp", type: "uint64" },
  ],
};

export interface UploadSignatureMessage {
  share_commitments: Bytes32[];
  recovering_addresses: Address[];
}

export interface Sharing {
  share_commitments: Bytes32[];
  recovering_addresses: Address[];
  share_data: Bytes;
}

export interface DownloadSignatureMessage {
  recovering_address: Address;
  timestamp: number;
  public_key: Bytes32;
}

export type DownloadRequest = DownloadSignatureMessage;

export interface AddAddressSignatureMessage {
  recovering_address: Address;
  address_to_add: Address;
  timestamp: number;
}

export type AddAddressRequest = AddAddressSignatureMessage;

export interface RemoveAddressSignatureMessage {
  recovering_address: Address;
  address_to_remove: Address;
  timestamp: number;
}

export type RemoveAddressRequest = RemoveAddressSignatureMessage;

export interface UpdateWalletsSignatureMessage {
  recovering_addresses: Address[];
  timestamp: number;
}

export type UpdateWalletsRequest = UpdateWalletsSignatureMessage;

export interface EncryptedShare {
  encrypted_share: Bytes;
  public_key: Bytes32;
  nonce: Bytes24;
}

export type DownloadMessageToSign = {
  domain: TypedDataDomain;
  types: Record<string, TypedDataField[]>;
  value: DownloadSignatureMessage;
};

export type UploadMessageToSign = {
  domain: TypedDataDomain;
  types: Record<string, TypedDataField[]>;
  value: UploadSignatureMessage;
};

export type AddAddressMessageToSign = {
  domain: TypedDataDomain;
  types: Record<string, TypedDataField[]>;
  value: AddAddressSignatureMessage;
};

export type RemoveAddressMessageToSign = {
  domain: TypedDataDomain;
  types: Record<string, TypedDataField[]>;
  value: RemoveAddressSignatureMessage;
};
