import {
  claimsFromPublicNotes,
  type Claim,
  type ClaimSource,
} from "@idos-network/credentials/utils";

const CLAIM_LABELS: Record<Claim, string> = {
  identity: "Identity",
  liveness: "Liveness",
  address: "Address",
  email: "Email",
  phoneNumber: "Phone number",
  edd: "Enhanced due diligence",
  sow: "Source of wealth",
  screening: "Screening",
  onboarding: "Onboarding",
};

const SOURCE_LABELS: Record<ClaimSource, string> = {
  VERIFIED: "Verified",
  LIVENESS: "Liveness check",
  SELFIE: "Selfie only",
  MANUAL: "Self-attested",
  DB: "Database check",
  PROOF_OF_ADDRESS: "Proof of address",
  PROOF_OF_IDENTITY: "Proof of identity",
  EXTERNAL_DB: "External database",
  GPS: "GPS",
  AUTO_COMPLETE: "Autocomplete",
};

const SOURCE_VARIANTS: Record<ClaimSource, ClaimRow["variant"]> = {
  VERIFIED: "success",
  LIVENESS: "success",
  DB: "success",
  PROOF_OF_ADDRESS: "success",
  PROOF_OF_IDENTITY: "success",
  EXTERNAL_DB: "success",
  GPS: "default",
  SELFIE: "default",
  MANUAL: "warning",
  AUTO_COMPLETE: "warning",
};

export interface ClaimRow {
  claim: string;
  label: string;
  source: string;
  sourceLabel: string;
  variant: "success" | "warning" | "default";
}

/**
 * The claims in a credential's public notes, ready to display. Credentials issued before
 * `claims` existed get them derived from their level. Public notes come from the issuer, so
 * unknown claims and sources are shown as they are rather than trusted to be well-formed.
 */
export function claimRows(publicNotes: Record<string, unknown>): ClaimRow[] {
  const claims: Record<string, unknown> = claimsFromPublicNotes(publicNotes);
  const known = Object.keys(CLAIM_LABELS).filter((claim) => claim in claims);
  const unknown = Object.keys(claims).filter((claim) => !(claim in CLAIM_LABELS));

  return [...known, ...unknown]
    .filter((claim) => typeof claims[claim] === "string")
    .map((claim) => {
      const source = claims[claim] as string;
      return {
        claim,
        label: CLAIM_LABELS[claim as Claim] ?? claim,
        source,
        sourceLabel: SOURCE_LABELS[source as ClaimSource] ?? source,
        variant: SOURCE_VARIANTS[source as ClaimSource] ?? "default",
      };
    });
}
