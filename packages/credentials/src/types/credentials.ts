// Other utility types
export type idOSCredential = {
  id: string;
  user_id: string;
  public_notes: string;
  content: string;
  encryptor_public_key: string;
  issuer_auth_public_key: string;
  original_id?: string | null;
};

export type InsertableIDOSCredential = Omit<idOSCredential, "id" | "original_id"> & {
  id?: idOSCredential["id"];
  content_hash?: string;
  public_notes_signature: string;
  broader_signature: string;
};

// TODO: This is a stub of the types for @digitalbazaar/vc
// when they introduce TypeScript support we should remove this
// The copy is here because `types.d.ts` file is not bundled.
export interface VerifiedCredentialsProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofValue: string;
  proofPurpose: string;
}

export interface VerifiableCredential<K> {
  "@context": string[];
  type: string[];
  issuer: string;
  id: string;
  level: string;
  kycLevel: number;
  issued: string;
  approvedAt: string;
  expirationDate: string;
  credentialSubject: K;
  issuanceDate: string;
  proof: VerifiedCredentialsProof;
}

export type VerifiedCredentials<K> = VerifiableCredential<K>;
