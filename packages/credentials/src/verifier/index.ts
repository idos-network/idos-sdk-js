import type { JsonLDDocumentLoaderInstance } from "jsonld-document-loader";

import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import * as vc from "@digitalbazaar/vc";

import type { AvailableIssuerType, VerifiableCredential } from "../types";

import { issuerToKey } from "../utils";
import { defaultDocumentLoader } from "../utils/loader";

export type VerifyCredentialResult = [boolean, Map<AvailableIssuerType, vc.VerifyCredentialResult>];

/**
 * True if every `@context` in the document, at any depth, is a URL or a list of URLs.
 *
 * The proof covers the RDF graph, not the JSON. An embedded context object needs no document
 * loader, so it can map the JSON fields onto the signed graph in a different way and still verify.
 * Credentials are always issued with published context URLs, so anything else is rejected.
 */
export function hasOnlyContextUrls(value: unknown): boolean {
  if (Array.isArray(value)) return value.every(hasOnlyContextUrls);
  if (typeof value !== "object" || value === null) return true;

  return Object.entries(value).every(([key, entry]) => {
    if (key !== "@context") return hasOnlyContextUrls(entry);
    const contexts = Array.isArray(entry) ? entry : [entry];
    return contexts.every((context) => typeof context === "string");
  });
}

/**
 * Verifies the credential's proof against the given issuers.
 *
 * A credential whose `@context` is not made only of URLs is reported as not verified (see
 * `hasOnlyContextUrls`). Verifying does not tell which version the credential is: read it with
 * `parseCredential()`, never from the raw JSON, so the subject context is checked too.
 */
export async function verifyCredential<K>(
  credential: VerifiableCredential<K>,
  issuers: AvailableIssuerType[],
  customDocumentLoader?: JsonLDDocumentLoaderInstance,
): Promise<VerifyCredentialResult> {
  const resultsByIssuer: Map<AvailableIssuerType, vc.VerifyCredentialResult> = new Map();

  if (!hasOnlyContextUrls(credential)) return [false, resultsByIssuer];

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
      credential,
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
