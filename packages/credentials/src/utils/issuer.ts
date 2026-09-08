import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";

import type { AvailableIssuerType, CustomIssuerType } from "../types";

function isIssuerKey(issuer: AvailableIssuerType): issuer is Ed25519VerificationKey2020 {
  return (
    typeof issuer === "object" &&
    issuer !== null &&
    "type" in issuer &&
    "id" in issuer &&
    "controller" in issuer
  );
}

function isCustomIssuerType(issuer: AvailableIssuerType): issuer is CustomIssuerType {
  return (
    typeof issuer === "object" &&
    issuer !== null &&
    "issuer" in issuer &&
    "publicKeyMultibase" in issuer
  );
}

export async function issuerToKey(
  issuer: AvailableIssuerType,
): Promise<Ed25519VerificationKey2020> {
  if (isIssuerKey(issuer)) {
    return issuer;
  }

  if (isCustomIssuerType(issuer)) {
    return await Ed25519VerificationKey2020.from({
      id: `${issuer.issuer}/keys/1`,
      controller: `${issuer.issuer}/issuers/1`,
      publicKeyMultibase: issuer.publicKeyMultibase,
      privateKeyMultibase: issuer.privateKeyMultibase,
      type: "Ed25519VerificationKey2020",
    });
  }

  return await Ed25519VerificationKey2020.from({ ...issuer, type: "Ed25519VerificationKey2020" });
}
