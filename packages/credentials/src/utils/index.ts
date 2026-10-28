import {
  createBlobContentReference,
  createUkycContentReference,
} from "@idos-network/utils/blob-gateway";
import { base64Encode, hexEncode, utf8Encode } from "@idos-network/utils/codecs";
import { encryptContent } from "@idos-network/utils/cryptography";
import { every, get } from "es-toolkit/compat";
import nacl from "tweetnacl";

import type {
  BiometricSource,
  ContactSource,
  ResidentialAddressSource,
  ScreeningSource,
  SourceOfFundsSource,
  SourceOfWealthSource,
} from "../schemas/enums";
import type { idOSCredential, SignedCredentialContentReference } from "../types";

// Proxying functions
export * from "./issuer";
export * from "./transliterate";

export type BaseLevel = "unverified" | "basic" | "plus";
export type Addon =
  | "liveness"
  | "email"
  | "phoneNumber"
  | "edd"
  | "sow"
  | "screening"
  | "onboarding";

// The sources each level addon can have. Keyed by every Addon (see ClaimSources), so adding
// an addon without its sources fails to compile.
interface AddonSources {
  liveness: BiometricSource;
  email: ContactSource;
  phoneNumber: ContactSource;
  edd: SourceOfFundsSource;
  sow: SourceOfWealthSource;
  screening: ScreeningSource;
  // The onboarding questionnaire is filled in by the person, so it is always self-attested.
  onboarding: "MANUAL";
}

/** The sources each claim can have, e.g. `ClaimSources["address"]` is a `ResidentialAddressSource`. */
export type ClaimSources = {
  identity: "VERIFIED";
  address: ResidentialAddressSource;
} & { [K in Addon]: AddonSources[K] };
/** What a KYC credential claims: its identity, address, and each level addon. */
export type Claim = keyof ClaimSources;
/** How a claim was obtained, for any claim. */
export type ClaimSource = ClaimSources[Claim];
/** The claims in KYC public notes, each with how it was obtained. */
export type Claims = { [K in Claim]?: ClaimSources[K] };
/** Accepted sources per claim, e.g. `{ liveness: ["LIVENESS"], email: ["VERIFIED", "MANUAL"] }`. */
export type ClaimRequirements = { [K in Claim]?: ClaimSources[K][] };

// What a level addon says about how its claim was obtained.
const LEVEL_ADDON_SOURCES: { [K in Addon]: ClaimSources[K] } = {
  liveness: "LIVENESS",
  email: "VERIFIED",
  phoneNumber: "VERIFIED",
  edd: "VERIFIED",
  sow: "VERIFIED",
  screening: "DB",
  onboarding: "MANUAL",
};

/**
 * The claims in a credential's public notes. Credentials issued before `claims` existed only
 * have a level, so their claims are derived from it: everything a level lists counts as
 * verified, except liveness (a liveness check), screening (a database check) and onboarding
 * (always self-attested).
 */
export function claimsFromPublicNotes(publicNotes: { level?: string; claims?: Claims }): Claims {
  if (publicNotes.claims) return publicNotes.claims;
  if (!publicNotes.level) return {};

  const { base, addons } = parseLevel(publicNotes.level);
  const claims: Claims = Object.fromEntries(
    addons
      .filter((addon) => addon in LEVEL_ADDON_SOURCES)
      .map((addon) => [addon, LEVEL_ADDON_SOURCES[addon]]),
  );
  if (base === "basic" || base === "plus") claims.identity = "VERIFIED";
  if (base === "plus") claims.address = "PROOF_OF_ADDRESS";
  return claims;
}

/** Whether every required claim is present with one of its accepted sources. */
export function matchClaims(
  required: ClaimRequirements,
  publicNotes: Parameters<typeof claimsFromPublicNotes>[0],
): boolean {
  const claims = claimsFromPublicNotes(publicNotes);
  return Object.entries(required).every(([claim, sources]) => {
    const source = claims[claim as Claim];
    return source !== undefined && (sources as ClaimSource[]).includes(source);
  });
}

export function parseLevel(level: string): {
  base: BaseLevel;
  addons: Addon[];
} {
  const [base, ...addons] = level.split("+") as [BaseLevel, ...Addon[]];
  return { base, addons };
}

export function assertNoExtraFields(
  section: string,
  expectedFields: ReadonlySet<string>,
  value: object | undefined,
): void {
  const extraFields = Object.keys(value ?? {}).filter((field) => !expectedFields.has(field));

  if (extraFields.length > 0) {
    throw new Error(`Unexpected ${section} fields: ${extraFields.join(", ")}`);
  }
}

/** @deprecated The level leaves out self-attested data. Use `matchClaims` instead. */
export function matchLevelOrHigher(
  level: BaseLevel,
  requiredAddons: Addon[],
  currentLevel: string,
): boolean {
  const { base: currentBaseLevel, addons: currentAddons } = parseLevel(currentLevel);

  // Basic can only match basic or plus not unverified
  if (level === "basic" && currentBaseLevel === "unverified") {
    return false;
  }

  // Plus can only match plus
  if (level === "plus" && currentBaseLevel !== "plus") {
    return false;
  }

  return requiredAddons.every((addon) => currentAddons.includes(addon));
}

export function levelScore(level: string): number {
  const { base, addons } = parseLevel(level);
  let score = 0;

  if (base === "basic") {
    score += 50;
  }

  if (base === "plus") {
    score += 100;
  }

  score += addons.length * 10;

  return score;
}

/** @deprecated The level leaves out self-attested data. Use `matchClaims` instead. */
export function pickHighestMatchingLevel(
  levels: string[],
  requiredLevel: BaseLevel,
  requiredAddons: Addon[],
): string | null {
  return (
    levels
      .filter((currentLevel) => matchLevelOrHigher(requiredLevel, requiredAddons, currentLevel))
      .sort((a, b) => {
        const aAddons = levelScore(a);
        const bAddons = levelScore(b);
        return bAddons - aAddons; // descending
      })[0] ?? null
  );
}

export function highestMatchingCredential<K extends { public_notes: string }>(
  credentials: K[],
  requiredLevel: BaseLevel,
  {
    addons: requiredAddons = [],
    publicNotesConstraint = {},
    claims: acceptedClaimSources = {},
  }: {
    /** @deprecated Use `claims` instead. */
    addons?: Addon[];
    publicNotesConstraint?: Record<string, number | string>;
    /** Accepted sources per claim, e.g. `{ email: ["VERIFIED", "MANUAL"] }`. See `matchClaims`. */
    claims?: ClaimRequirements;
  },
): K | undefined {
  const matchingCredentials = credentials
    .map((credential) => {
      const publicNotes = JSON.parse(credential.public_notes || "{}");
      return {
        credential,
        publicNotes,
      };
    })
    .filter(({ publicNotes }) => {
      const level = publicNotes.level;

      if (!level) {
        return false;
      }

      if (!matchLevelOrHigher(requiredLevel, requiredAddons, level)) {
        return false;
      }

      for (const key in publicNotesConstraint) {
        if (publicNotes[key] !== publicNotesConstraint[key]) {
          return false;
        }
      }

      if (!matchClaims(acceptedClaimSources, publicNotes)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const aLevel = a.publicNotes.level;
      const bLevel = b.publicNotes.level;
      return levelScore(bLevel) - levelScore(aLevel); // descending
    })
    .map(({ credential }) => credential);

  return matchingCredentials[0];
}

export function recordFilter(
  rec: Record<string, unknown>,
  pick: Record<string, unknown[]>,
  omit: Record<string, unknown[]>,
): boolean {
  const matchCriteria = (content: Record<string, unknown>, criteria: Record<string, unknown[]>) =>
    every(Object.entries(criteria), ([path, targetSet]) => targetSet.includes(get(content, path)));

  if (Object.keys(pick).length > 0 && !matchCriteria(rec, pick)) {
    // Fast fail on pick criteria
    return false;
  }

  if (Object.keys(omit).length > 0 && matchCriteria(rec, omit)) {
    // Fast fail on omit criteria
    return false;
  }

  return true;
}

export function buildSignedCredentialContentReference(
  publicNotes: string,
  contentUri: string,
  issuerSigningSecretKey: Uint8Array,
): SignedCredentialContentReference {
  const { publicKey, secretKey } = nacl.sign.keyPair.fromSecretKey(issuerSigningSecretKey);

  const publicNotesSignature = nacl.sign.detached(utf8Encode(publicNotes), secretKey);

  return {
    public_notes: publicNotes,
    public_notes_signature: base64Encode(publicNotesSignature),

    broader_signature: base64Encode(
      nacl.sign.detached(
        Uint8Array.from([...publicNotesSignature, ...utf8Encode(contentUri)]),
        secretKey,
      ),
    ),

    issuer_auth_public_key: hexEncode(publicKey, true),
  };
}

/** User-issued share copy: sign with a fresh ephemeral key (need not match original issuer). */
export function buildEphemeralSignedCredentialContentReference(
  publicNotes: string,
  contentUri: string,
): SignedCredentialContentReference {
  return buildSignedCredentialContentReference(
    publicNotes,
    contentUri,
    nacl.sign.keyPair().secretKey,
  );
}

export type PreliminaryIDOSCredential = {
  id: string;
  contentUri: string;
  contentSize: number;
  encryptedContent: Uint8Array;
  publicNotes: string;
  publicNotesSignature: string;
  broaderSignature: string;
  issuerAuthPublicKey: string;
  encryptorPublicKey: string;
};

export function mapPreliminaryToIDOSCredential(
  preliminaryCredential: PreliminaryIDOSCredential,
): Omit<idOSCredential, "user_id"> {
  return {
    id: preliminaryCredential.id,
    content_uri: preliminaryCredential.contentUri,
    content_size: preliminaryCredential.contentSize,
    public_notes: preliminaryCredential.publicNotes,
    issuer_auth_public_key: preliminaryCredential.issuerAuthPublicKey,
    encryptor_public_key: preliminaryCredential.encryptorPublicKey,
  };
}

export interface BuildPreliminaryIDOSCredentialArgs {
  publicNotes: string;
  plaintextContent: Uint8Array;
  recipientEncryptionPublicKey: Uint8Array;
  issuerSigningSecretKey?: Uint8Array;
  /** When set (MM / UKYC), `blob_id` is `sha256` of the ciphertext instead of an IPFS CID. */
  ukycStorageId?: string;
}

export async function buildPreliminaryIDOSCredential({
  publicNotes,
  plaintextContent,
  recipientEncryptionPublicKey,
  // For user-issued credentials, use a fresh ephemeral key for the signed reference
  // For issuer-side, use the signing key pair
  issuerSigningSecretKey = nacl.sign.keyPair().secretKey,
  ukycStorageId,
}: BuildPreliminaryIDOSCredentialArgs): Promise<Omit<PreliminaryIDOSCredential, "id">> {
  const ephemeralKeyPair = nacl.box.keyPair();
  const encryptedContent = encryptContent(
    plaintextContent,
    recipientEncryptionPublicKey, // user or dwg recipient
    ephemeralKeyPair.secretKey,
  );

  const contentReference = ukycStorageId
    ? createUkycContentReference(ukycStorageId, encryptedContent)
    : await createBlobContentReference(encryptedContent);
  const signedReference = buildSignedCredentialContentReference(
    publicNotes,
    contentReference.uri,
    issuerSigningSecretKey,
  );

  return {
    contentUri: contentReference.uri,
    contentSize: contentReference.size,
    encryptedContent,
    publicNotes,
    publicNotesSignature: signedReference.public_notes_signature,
    broaderSignature: signedReference.broader_signature,
    issuerAuthPublicKey: signedReference.issuer_auth_public_key,
    encryptorPublicKey: base64Encode(ephemeralKeyPair.publicKey),
  };
}
