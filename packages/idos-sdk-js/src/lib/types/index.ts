type idOSCredentialStatus = "pending" | "contacted" | "approved" | "rejected" | "expired";

export type idOSHuman = {
  id: string;
  current_public_key: string;
};

export type StorableAttribute = {
  key: string;
  value: string | string[];
};

export type BackupPasswordInfo = {
  data: {
    payload: {
      accessControlConditions: string[];
      passwordCiphers: { ciphertext: string; dataToEncryptHash: string };
    };
  };
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

export type UserWallet = {
  id: string;
  human_id: string;
  wallet_id: string;
  wallet_type: string;
  public_key: string;
  signature: string;
  inserter: string;
  message: string;
};
