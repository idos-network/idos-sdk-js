import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";
import * as vc from "@digitalbazaar/vc";
import * as base85 from "base85";
import { JsonLdDocumentLoader } from "jsonld-document-loader";

import ed25519Signature2020V1 from "../../assets/ed25519-signature-2020-v1.json";
import idosCredentialSubjectV1 from "../../assets/idos-credential-subject-v1.json";
import idosCredentialsV1 from "../../assets/idos-credentials-v1.json";
import v1 from "../../assets/v1.json";

export interface CredentialFields {
  id: string;

  /* Level of KYC verification performed (e.g., basic, intermediate, advanced). */
  level: string;

  /* @default Date.now() */
  issued?: Date;

  /* Date the credential was approved. */
  approvedAt?: Date;

  /* Date the credential was revoked. */
  expirationDate?: Date;
}

export interface CredentialResidentialAddress {
  /* Street address. */
  street: string;

  /* House number. */
  houseNumber?: string;

  /* Additional address information (e.g., apartment number). */
  additionalAddressInfo?: string;

  /* Locality (e.g., city, town). */
  city: string;

  /* Postal code. */
  postalCode: string;

  /* Country. */
  country: string;
}

export interface CredentialSubject {
  /* ID(unique credential)	Unique identifier for the credential itself. */
  id: string;

  /* Given name of the individual. */
  firstName: string;

  /* Surname of the individual. */
  familyName: string;

  /* Family name at birth (e.g., maiden name). */
  maidenName?: string;

  /* Unique identifier issued by a government authority (e.g., SSN, Tax ID). */
  governmentId?: string;

  /* Type of government identifier (e.g., Social Security Number, Tax ID, etc.). */
  governmentIdType?: string;

  /* Date of birth of the individual. */
  dateOfBirth: Date;

  /* City and state/province of birth. */
  placeOfBirth: string;

  /* Country that issued the identity document. */
  idDocumentCountry: string;

  /* ID Document Number	Unique number on the identity document. */
  idDocumentNumber: string;

  /* ID Document Type	Type of identity document(e.g., Passport, Driver's License, National ID). */
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
  residentialAddress?: CredentialResidentialAddress;

  /* Residential Address Proof Category	Type of document provided to verify the address(e.g., utility bill, bank statement). */
  residentialAddressProofCategory?: string;

  /* Residential Address Proof Date Of Issue	Date the address proof document was issued. */
  residentialAddressProofDateOfIssue?: Date;

  /* Residential Address Proof File	File or URL of the document provided as address proof. */
  residentialAddressProofFile?: Buffer;
}

export interface CredentialsIssuerConfig {
  /* Issuers id */
  id: string;

  /* Issuer of the credential (URL). */
  controller: string;

  /* Issuer's private key in multibase format. */
  privateKeyMultibase: string;

  /* Issuer's public key in multibase format. */
  publicKeyMultibase: string;
}

const CONTEXT_V1 = "https://www.w3.org/2018/credentials/v1";
const CONTEXT_IDOS_CREDENTIALS_V1 =
  "https://raw.githubusercontent.com/idos-network/idos-sdk-js/1bc3503f5302a7e42777076445d5b05fec8db429/packages/issuer-sdk-js/assets/idos-credentials-v1.json";
const CONTEXT_IDOS_CREDENTIALS_V1_SUBJECT =
  "https://raw.githubusercontent.com/idos-network/idos-sdk-js/1bc3503f5302a7e42777076445d5b05fec8db429/packages/issuer-sdk-js/assets/idos-credential-subject-v1.json";
const CONTEXT_ED25519_SIGNATURE_2020_V1 = "https://w3id.org/security/suites/ed25519-2020/v1";

export class CredentialsBuilderService {
  private fileToBase85(file: Buffer) {
    return base85.encode(file, "ascii85");
  }

  private capitalizeFirstLetter(str: string) {
    return str[0].toUpperCase() + str.slice(1);
  }

  private convertValues<
    K extends CredentialFields | CredentialSubject | CredentialResidentialAddress,
  >(fields: K, prefix?: string): Record<string, unknown> {
    const acc: Record<string, unknown> = {};

    for (const key in fields) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        const value = fields[key];
        const name = prefix ? `${prefix}${this.capitalizeFirstLetter(key)}` : key;
        if (value instanceof Date) {
          acc[name] = value.toISOString();
        } else if (value instanceof Buffer) {
          // Convert file to base85
          acc[name] = this.fileToBase85(value);
        } else {
          acc[name] = value;
        }
      }
    }

    return acc;
  }

  buildDocumentLoader() {
    const loader = new JsonLdDocumentLoader();
    loader.addStatic(CONTEXT_V1, v1);
    loader.addStatic(CONTEXT_IDOS_CREDENTIALS_V1, idosCredentialsV1);
    loader.addStatic(CONTEXT_IDOS_CREDENTIALS_V1_SUBJECT, idosCredentialSubjectV1);
    loader.addStatic(CONTEXT_ED25519_SIGNATURE_2020_V1, ed25519Signature2020V1);

    return loader.build();
  }

  async buildCredentials(
    fields: CredentialFields,
    subject: CredentialSubject,
    issuer: CredentialsIssuerConfig,
  ) {
    const { residentialAddress, ...subjectData } = subject;

    // Create credentials container
    const credential = {
      "@context": [CONTEXT_V1, CONTEXT_IDOS_CREDENTIALS_V1, CONTEXT_ED25519_SIGNATURE_2020_V1],
      type: ["VerifiableCredential"],
      issuer: issuer.controller,
      ...this.convertValues(fields),
      credentialSubject: {
        "@context": CONTEXT_IDOS_CREDENTIALS_V1_SUBJECT,
        ...this.convertValues(subjectData),
        ...(residentialAddress ? this.convertValues(residentialAddress, "residentialAddress") : {}),
      },
    };

    const key = await Ed25519VerificationKey2020.from({
      ...issuer,
      type: "Ed25519VerificationKey2020",
    });
    const suite = new Ed25519Signature2020({ key });
    const documentLoader = this.buildDocumentLoader();

    return vc.issue({ credential, suite, documentLoader });
  }
}
