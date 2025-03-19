import * as vc from "@digitalbazaar/vc";

const cred = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://raw.githubusercontent.com/trustfractal/claim-schemas/686bd9c0b44f8af03831f7dc31f7d6a9b6b5ff5b/verifiable_credential/fractal_id.json-ld",
    "https://w3id.org/security/suites/ed25519-2020/v1",
  ],
  id: "uuid:909225d0-6af3-416d-a770-fd6c15bb06da",
  type: ["VerifiableCredential"],
  issuer: "https://vc-issuers.next.fractal.id/idos",
  level: "human",
  credentialSubject: {
    id: "uuid:fc7af2fd-4b37-48c6-96a6-ea09ec257282",
    wallets: [
      { currency: "eth", verified: true, address: "0x2591f18f0a7339c167b2ddf813fbf50b9970e8c2" },
    ],
    emails: [{ verified: false, address: "derp@derp.dep" }],
  },
  status: "approved",
  issuanceDate: "2024-05-03T14:02:06Z",
  approved_at: "2024-05-03T14:02:06Z",
  proof: {
    type: "Ed25519Signature2020",
    created: "2024-05-03T14:45:13Z",
    verificationMethod:
      "https://vc-issuers.next.fractal.id/idos#z6Mkqm5JuLvBcHkbQogDXz5p5ppTY4DF5FLhoRd2VM9NaKp5",
    proofPurpose: "assertionMethod",
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    proofValue:
      "z5QRnxqqXMZ7dyB5Sd7RLPLhpUdA99UXRzJd93ekr1Q8BL2KAStkNoqFwkq5DVveUXULA5qWGm9JMDfuytBi6aVP4",
  },
};

interface CredentialFields {
  id: string;

  /* Level of KYC verification performed (e.g., basic, intermediate, advanced). */
  level: string;

  /* Credential status */
  credentialStatus: string;

  /* Issuer of the credential. */
  issuer: string;

  /* @default Date.now() */
  issuanceDate?: Date;

  /* Date the credential was approved. */
  approvedAt?: Date;

  /* Date the credential was revoked. */
  expirationDate?: Date;
}

interface CredentialSubject {
  /* ID(unique credential)	Unique identifier for the credential itself. */
  id: string;

  /* Given name of the individual. */
  firstName: string;

  /* Surname of the individual. */
  familyName: string;

  /* Family name at birth (e.g., maiden name). */
  maidenName?: string;

  /* Unique identifier issued by a government authority (e.g., SSN, Tax ID). */
  governmentId: string;

  /* Type of government identifier (e.g., Social Security Number, Tax ID, etc.). */
  govermentIdType: string;

  /* Date of birth of the individual. */
  dateOfBirth: Date;

  /* City and state/province of birth. */
  placeOfBirth: string;

  /* Country that issued the identity document. */
  idDocumentCountry: string;

  /* ID Document Number	Unique number on the identity document. */
  idDocumentNumber: string;

  /* ID Document Type	Type of identity document(e.g., Passport, Driver’s License, National ID). */
  idDocumentType: string;

  /* ID Document Date of Issue	Date the identity document was issued. */
  idDocumentDateOfIssue: Date;

  /* ID Document Date of Expiry	Expiration date of the identity document - if applicable. */
  idDocumentDateOfExpiry?: Date;

  /* ID Document Front File	File or URL representing the front of the identity document. */
  idDocumentFrontFile: File;

  /* ID Document Back File	File or URL representing the back of the identity document - if applicable. */
  idDocumentBackFile?: File;

  /* (ID Document) Selfie File	File or URL of a selfie with the identity document for verification purposes. */
  selfieFile: File;

  /* Residential Address	Full residential address of the individual - if applicable. */
  residentialAddress?: string;

  /* Residential Address Country	Country of the residential address - if applicable. */
  residentialAddressCountry?: string;

  /* Residential Address Proof Category	Type of document provided to verify the address(e.g., utility bill, bank statement). */
  residentialAddressProofCategory?: string;

  /* Residential Address Proof Date Of Issue	Date the address proof document was issued. */
  residentialAddressProofDateOfIssue: Date;

  /* Residential Address Proof File	File or URL of the document provided as address proof. */
  residentialAddressProofFile: File;
}

export const convertValues = (fields: CredentialFields | CredentialSubject) => {};

export const buildCredentials = (
  fields: CredentialFields,
  subject: CredentialSubject,
  key: string,
) => {
  // Create credentials container
  const credential = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://raw.githubusercontent.com/trustfractal/claim-schemas/686bd9c0b44f8af03831f7dc31f7d6a9b6b5ff5b/verifiable_credential/fractal_id.json-ld",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    type: ["VerifiableCredential", "idOSCredential"],
    // TODO: Convert dates to ISO
    ...fields,
    credentialSubject: {
      "@context": "https://www.w3.org/2018/credentials/v1",
      // TODO: Convert files & dates
      ...subject,
    },
    /*proof: {
      type: "Ed25519Signature2020",
      created: "2024-05-03T14:45:13Z",
      verificationMethod:
        "https://vc-issuers.next.fractal.id/idos#z6Mkqm5JuLvBcHkbQogDXz5p5ppTY4DF5FLhoRd2VM9NaKp5",
      proofPurpose: "assertionMethod",
      "@context": ["https://www.w3.org/ns/credentials/v2"],
      proofValue:
        "z5QRnxqqXMZ7dyB5Sd7RLPLhpUdA99UXRzJd93ekr1Q8BL2KAStkNoqFwkq5DVveUXULA5qWGm9JMDfuytBi6aVP4",
    },*/
  };

  return vc.issue({ credential, suite, documentLoader });
};
