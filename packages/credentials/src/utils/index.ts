import { createBlobContentReference } from "@idos-network/utils/blob-gateway";
import { base64Encode, hexEncode, utf8Encode } from "@idos-network/utils/codecs";
import { encryptContent } from "@idos-network/utils/cryptography";
import { every, get } from "es-toolkit/compat";
import nacl from "tweetnacl";

import type { idOSCredential, SignedCredentialContentReference } from "../types";

// Proxying functions
export * from "./issuer";

export type BaseLevel = "unverified" | "basic" | "plus";
export type Addon =
  | "liveness"
  | "email"
  | "phoneNumber"
  | "edd"
  | "sow"
  | "screening"
  | "onboarding";

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
  }: {
    addons?: Addon[];
    publicNotesConstraint?: Record<string, number | string>;
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
  issuerSigningSecretKey: Uint8Array = nacl.sign.keyPair().secretKey,
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
  /** When set (MM / `ukyc://`), skip IPFS CID hashing. */
  contentUri?: string;
}

export async function buildPreliminaryIDOSCredential({
  publicNotes,
  plaintextContent,
  recipientEncryptionPublicKey,
  // For user-issued credentials, use a fresh ephemeral key for the signed reference
  // For issuer-side, use the signing key pair
  issuerSigningSecretKey = nacl.sign.keyPair().secretKey,
  contentUri,
}: BuildPreliminaryIDOSCredentialArgs): Promise<Omit<PreliminaryIDOSCredential, "id">> {
  const ephemeralKeyPair = nacl.box.keyPair();
  const encryptedContent = encryptContent(
    plaintextContent,
    recipientEncryptionPublicKey, // user or dwg recipient
    ephemeralKeyPair.secretKey,
  );

  const contentReference = contentUri
    ? { uri: contentUri, size: encryptedContent.byteLength }
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
