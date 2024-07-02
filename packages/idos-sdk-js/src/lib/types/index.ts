type idOSCredentialStatus = "pending" | "contacted" | "approved" | "rejected" | "expired";

export type idOSHuman = {
  id: string;
};

export type idOSCredential = {
  id: string;
  human_id: string;
  issuer: string;
  original_id: string;
  credential_type: string;
  credential_level: string;
  credential_status: idOSCredentialStatus;
  content?: string;
  encryption_public_key: string;
};

export type idOSGrant = {
  owner: string;
  grantee: string;
  dataId: string;
  lockedUntil: number;
};

export type idOSWallet = {
  id: string;
  human_id: string;
  address: string;
  wallet_type: string;
  message: string;
  public_key: string;
  signature: string;
};

export type idOSHumanAttribute = {
  id: string;
  human_id: string;
  attribute_key: string;
  value: string;
};
