export type Credential = {
  id: string;
  human_id: string;
  issuer: string;
  credential_type: string;
  content: string;
  original_id: string;
  shares?: string[];
  encryption_public_key: string;
};
