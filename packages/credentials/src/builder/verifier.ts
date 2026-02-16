import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import * as vc from "@digitalbazaar/vc";
import type { JsonLDDocumentLoaderInstance } from "jsonld-document-loader";
import type {
  AvailableIssuerType,
  VerifiableCredential,
  VerifiableCredentialSubject,
} from "../types";
import { issuerToKey } from "../utils";
import { defaultDocumentLoader } from "./loader";

export type VerifyCredentialResult = [boolean, Map<AvailableIssuerType, vc.VerifyCredentialResult>];

export async function verifyCredential<K = VerifiableCredentialSubject>(
  credential: VerifiableCredential<K>,
  issuers: AvailableIssuerType[],
  customDocumentLoader?: JsonLDDocumentLoaderInstance,
): Promise<VerifyCredentialResult> {
  const resultsByIssuer: Map<AvailableIssuerType, vc.VerifyCredentialResult> = new Map();

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

    resultsByIssuer.set(issuer, verifyCredentialResult);

    if (verifyCredentialResult.verified) {
      return [true, resultsByIssuer];
    }
  }

  return [false, resultsByIssuer];
}
