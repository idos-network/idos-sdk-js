import { type JsonLDDocumentLoaderInstance, JsonLdDocumentLoader } from "jsonld-document-loader";

import ed25519Signature2020V1 from "../../assets/ed25519-signature-2020-v1.json";
import idosCredentialSubjectV1 from "../../assets/idos-credential-subject-v1.json";
import idosCredentialsV1 from "../../assets/idos-credentials-v1.json";
import v1 from "../../assets/v1.json";

export const CONTEXT_V1 = "https://www.w3.org/2018/credentials/v1";
export const CONTEXT_IDOS_CREDENTIALS_V1 =
  "https://raw.githubusercontent.com/idos-network/idos-sdk-js/1bc3503f5302a7e42777076445d5b05fec8db429/packages/issuer-sdk-js/assets/idos-credentials-v1.json";
export const CONTEXT_IDOS_CREDENTIALS_V1_SUBJECT =
  "https://raw.githubusercontent.com/idos-network/idos-sdk-js/1bc3503f5302a7e42777076445d5b05fec8db429/packages/issuer-sdk-js/assets/idos-credential-subject-v1.json";
export const CONTEXT_ED25519_SIGNATURE_2020_V1 = "https://w3id.org/security/suites/ed25519-2020/v1";

export function buildDocumentLoader(): JsonLDDocumentLoaderInstance {
  const loader = new JsonLdDocumentLoader();
  loader.addStatic(CONTEXT_V1, v1);
  loader.addStatic(CONTEXT_IDOS_CREDENTIALS_V1, idosCredentialsV1);
  loader.addStatic(CONTEXT_IDOS_CREDENTIALS_V1_SUBJECT, idosCredentialSubjectV1);
  loader.addStatic(CONTEXT_ED25519_SIGNATURE_2020_V1, ed25519Signature2020V1);

  return loader.build();
}

export const defaultDocumentLoader: JsonLDDocumentLoaderInstance = buildDocumentLoader();
