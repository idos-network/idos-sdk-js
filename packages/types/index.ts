export type idOSCredentialStatus = "pending" | "contacted" | "approved" | "rejected" | "expired";

export interface idOSHuman {
  id: string;
  current_user_enc_public_key: string;
}

export interface idOSCredential {
  id: string;
  user_id: string;
  issuer_auth_public_key: string;
  original_id?: string;
  public_notes: string;
  content: string;
  encryptor_public_key: string;
}

export interface idOSGrant {
  ownerAddress: string;
  granteeAddress: string;
  dataId: string;
  lockedUntil: number;
}

export interface idOSWallet {
  id: string;
  user_id: string;
  address: string;
  wallet_type: string;
  message: string;
  public_key: string;
  signature: string;
}

export interface idOSHumanAttribute {
  id: string;
  user_id: string;
  attribute_key: string;
  value: string;
}
