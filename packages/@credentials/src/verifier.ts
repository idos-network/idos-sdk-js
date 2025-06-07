import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import * as vc from "@digitalbazaar/vc";
import type { JsonLDDocumentLoaderInstance } from "jsonld-document-loader";
import { type AvailableIssuerType, issuerToKey } from "./utils";
import { defaultDocumentLoader } from "./utils/loader";
import type { VerifiableCredential, VerifiableCredentialSubject } from "./utils/types";

export async function verifyCredentials<K = VerifiableCredentialSubject>(
  credential: VerifiableCredential<K>,
  issuers: AvailableIssuerType[],
  customDocumentLoader?: JsonLDDocumentLoaderInstance,
): Promise<boolean> {
  for (const issuer of issuers) {
    const publicKey = await issuerToKey(issuer);

    const vcVerifyingSuite = new Ed25519Signature2020({
      key: publicKey,
      verificationMethod: publicKey.id,
    });

    const controller = {
      "@context": "https://w3id.org/security/v2",
      id: publicKey.controller,
      assertionMethod: [publicKey.id],
      authentication: [publicKey.id],
    };

    // Verify the signature
    const verifyCredentialResult = await vc.verifyCredential<K>({
      credential: credential,
      suite: vcVerifyingSuite,
      controller,
      documentLoader: customDocumentLoader ?? defaultDocumentLoader,
    });

    if (verifyCredentialResult.verified) {
      return true;
    }
  }

  return false;
}
