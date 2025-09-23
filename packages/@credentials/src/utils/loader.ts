import { type JsonLDDocumentLoaderInstance, JsonLdDocumentLoader } from "jsonld-document-loader";

import ed25519Signature2020V1 from "../../assets/ed25519-signature-2020-v1.json";
import idosCredentialSubjectFaceIdV1 from "../../assets/idos-credential-subject-face-id-v1.json";
import idosCredentialSubjectV1 from "../../assets/idos-credential-subject-v1.json";
import idosCredentialsV1 from "../../assets/idos-credentials-v1.json";
import v1 from "../../assets/v1.json";

export const CONTEXT_V1 = "https://www.w3.org/2018/credentials/v1";
export const CONTEXT_ED25519_SIGNATURE_2020_V1 = "https://w3id.org/security/suites/ed25519-2020/v1";

// Check .github/workflow/pages.yml how those are deployed
export const CONTEXT_IDOS_CREDENTIAL_V1 =
  "https://idos-network.github.io/idos-sdk-js/credentials/idos-credentials-v1.json";
export const CONTEXT_IDOS_CREDENTIAL_V1_SUBJECT =
  "https://idos-network.github.io/idos-sdk-js/credentials/idos-credential-subject-v1.json";

export const CONTEXT_IDOS_CREDENTIAL_V1_FACE_ID =
  "https://idos-network.github.io/idos-sdk-js/credentials/idos-credential-subject-face-id-v1.json";

// Latest contexts for builder
export const CONTEXT_IDOS_CREDENTIAL: string = CONTEXT_IDOS_CREDENTIAL_V1;
export const CONTEXT_IDOS_CREDENTIAL_SUBJECT: string = CONTEXT_IDOS_CREDENTIAL_V1_SUBJECT;
export const CONTEXT_IDOS_SIGNATURE: string = CONTEXT_ED25519_SIGNATURE_2020_V1;
export const CONTEXT_IDOS_CREDENTIAL_FACE_ID: string = CONTEXT_IDOS_CREDENTIAL_V1_FACE_ID;

export function buildDocumentLoader(): JsonLDDocumentLoaderInstance {
  const loader = new JsonLdDocumentLoader();

  loader.addStatic(CONTEXT_V1, v1);
  loader.addStatic(CONTEXT_IDOS_CREDENTIAL_V1, idosCredentialsV1);
  loader.addStatic(CONTEXT_IDOS_CREDENTIAL_V1_SUBJECT, idosCredentialSubjectV1);
  loader.addStatic(CONTEXT_ED25519_SIGNATURE_2020_V1, ed25519Signature2020V1);
  loader.addStatic(CONTEXT_IDOS_CREDENTIAL_V1_FACE_ID, idosCredentialSubjectFaceIdV1);

  // DEPRECATED: Those should be removed
  [
    "1356fea6672d22deb07fedc5fa427478b2e1654c",
    "346f14468348e4f3dd00039c89ce9bb49d88777c",
    "1e8421744e037dfd7b0289cb39261c73ab6d643c",
    "0049d2e93f8913c42398372e2bb65d92bed38ac0",
  ].forEach((hash) => {
    loader.addStatic(
      `https://raw.githubusercontent.com/idos-network/idos-sdk-js/${hash}/packages/%40credentials/assets/idos-credentials-v1.json`,
      idosCredentialsV1,
    );
    loader.addStatic(
      `https://raw.githubusercontent.com/idos-network/idos-sdk-js/${hash}/packages/%40credentials/assets/idos-credential-subject-v1.json`,
      idosCredentialSubjectV1,
    );
  });

  // DEPRECATED: Those should be removed
  ["1bc3503f5302a7e42777076445d5b05fec8db429"].forEach((hash) => {
    loader.addStatic(
      `https://raw.githubusercontent.com/idos-network/idos-sdk-js/${hash}/packages/issuer-sdk-js/assets/idos-credentials-v1.json`,
      idosCredentialsV1,
    );
    loader.addStatic(
      `https://raw.githubusercontent.com/idos-network/idos-sdk-js/${hash}/packages/issuer-sdk-js/assets/idos-credential-subject-v1.json`,
      idosCredentialSubjectV1,
    );
  });

  return loader.build();
}

export const defaultDocumentLoader: JsonLDDocumentLoaderInstance = buildDocumentLoader();
