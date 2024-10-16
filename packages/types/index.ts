export type idOSCredentialStatus = "pending" | "contacted" | "approved" | "rejected" | "expired";

export interface idOSHuman {
  id: string;
  current_public_key: string;
}

export interface idOSCredential {
  id: string;
  human_id: string;
  issuer: string;
  original_id: string;
  credential_type: string;
  credential_level: string;
  credential_status: idOSCredentialStatus;
  content: string;
  encryption_public_key: string;
}

export interface idOSGrant {
  owner: string;
  grantee: string;
  dataId: string;
  lockedUntil: number;
}

export interface idOSWallet {
  id: string;
  human_id: string;
  address: string;
  wallet_type: string;
  message: string;
  public_key: string;
  signature: string;
}

export interface idOSHumanAttribute {
  id: string;
  human_id: string;
  attribute_key: string;
  value: string;
}

export interface idOSRevocationDocument {
  // @todo: define the interface
  id: string;
  revokedCredentialId: string;
  newStatus: "revoked";
  verificationMethod: string;
  proof: object;
}
