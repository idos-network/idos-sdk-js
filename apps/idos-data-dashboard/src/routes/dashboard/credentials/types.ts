type idOSCredentialStatus = "pending" | "contacted" | "approved" | "rejected" | "expired";

export type idOSCredential = {
  credential_type: string;
  human_id: string;
  id: string;
  issuer: string;
  original_id: string;
  credential_level: string;
  credential_status: idOSCredentialStatus;
};
