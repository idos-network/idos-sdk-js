import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";
import * as vc from "@digitalbazaar/vc";
import * as base85 from "base85";
import { JsonLdDocumentLoader } from "jsonld-document-loader";
import ed25519Signature2020V1 from "./cached-schemas/ed25519-signature-2020-v1";
import idosCredentialSubjectV1 from "./cached-schemas/idos-credential-subject-v1";
import idosCredentialsV1 from "./cached-schemas/idos-credentials-v1";
import v1 from "./cached-schemas/v1";

interface CredentialFields {
  id: string;

  /* Level of KYC verification performed (e.g., basic, intermediate, advanced). */
  level: string;

  /* Credential status */
  status: string;

  /* @default Date.now() */
  issued?: Date;

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
  idDocumentFrontFile: Buffer;

  /* ID Document Back File	File or URL representing the back of the identity document - if applicable. */
  idDocumentBackFile?: Buffer;

  /* (ID Document) Selfie File	File or URL of a selfie with the identity document for verification purposes. */
  selfieFile: Buffer;

  /* Residential Address	Full residential address of the individual - if applicable. */
  residentialAddress?: string;

  /* Residential Address Country	Country of the residential address - if applicable. */
  residentialAddressCountry?: string;

  /* Residential Address Proof Category	Type of document provided to verify the address(e.g., utility bill, bank statement). */
  residentialAddressProofCategory?: string;

  /* Residential Address Proof Date Of Issue	Date the address proof document was issued. */
  residentialAddressProofDateOfIssue: Date;

  /* Residential Address Proof File	File or URL of the document provided as address proof. */
  residentialAddressProofFile: Buffer;
}

function fileToBase85(file: Buffer) {
  return base85.encode(file);
}

function convertValues<K extends CredentialFields | CredentialSubject>(
  fields: K,
  map?: (key: keyof K, value: K[Extract<keyof K, string>]) => unknown,
): Record<string, unknown> {
  const acc: Record<string, unknown> = {};

  for (const key in fields) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      const value = fields[key];
      if (value instanceof Date) {
        acc[key] = value.toISOString();
      } else if (value instanceof Buffer) {
        // Convert file to base85
        acc[key] = fileToBase85(value);
      } else if (map) {
        acc[key] = map(key as keyof K, value);
      } else {
        acc[key] = value;
      }
    }
  }

  return acc;
}

export interface CredentialsIssuerConfig {
  /* Issuer of the credential (URL). */
  name: string;

  /* Issuer's private key in multibase format. */
  privateKeyMultibase: string;

  /* Issuer's public key in multibase format. */
  publicKeyMultibase: string;
}

const buildDocumentLoader = () => {
  const loader = new JsonLdDocumentLoader();
  loader.addStatic("https://www.w3.org/2018/credentials/v1", v1);
  loader.addStatic(
    "https://raw.githubusercontent.com/idos-network/idos-sdk-js/168f449a799620123bc7b01fc224423739500f94/packages/issuer-sdk-js/assets/idos-credentials-v1.json-ld",
    idosCredentialsV1,
  );
  loader.addStatic(
    "https://raw.githubusercontent.com/idos-network/idos-sdk-js/168f449a799620123bc7b01fc224423739500f94/packages/issuer-sdk-js/assets/idos-credential-subject-v1.json-ld",
    idosCredentialSubjectV1,
  );
  loader.addStatic("https://w3id.org/security/suites/ed25519-2020/v1", ed25519Signature2020V1);

  return loader.build();
};

export const buildCredentials = async (
  fields: CredentialFields,
  subject: CredentialSubject,
  issuer: CredentialsIssuerConfig,
) => {
  // Create credentials container
  const credential = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://raw.githubusercontent.com/idos-network/idos-sdk-js/168f449a799620123bc7b01fc224423739500f94/packages/issuer-sdk-js/assets/idos-credentials-v1.json-ld",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    type: ["VerifiableCredential"],
    issuer: issuer.name,
    ...convertValues(fields),
    credentialSubject: {
      "@context":
        "https://raw.githubusercontent.com/idos-network/idos-sdk-js/168f449a799620123bc7b01fc224423739500f94/packages/issuer-sdk-js/assets/idos-credential-subject-v1.json-ld",
      ...convertValues(subject),
    },
  };

  const key = await Ed25519VerificationKey2020.from({
    ...issuer,
    controller: issuer.name,
    type: "Ed25519VerificationKey2020",
  });
  const suite = new Ed25519Signature2020({ key });
  const documentLoader = buildDocumentLoader();

  return vc.issue({ credential, suite, documentLoader });
};
