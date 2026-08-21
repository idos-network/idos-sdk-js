import { base64Decode, base64Encode, hexEncode, utf8Encode } from "@idos-network/utils/codecs";
import { every, get } from "es-toolkit/compat";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

import type { InsertableIDOSCredential } from "../types";

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

  // TODO: Consider pop+ or uniqueness+ scenarios
  if (level === "plus" && currentBaseLevel !== "plus") {
    return false;
  }

  return requiredAddons.every((addon) => currentAddons.includes(addon));
}

export function levelScore(level: string): number {
  const { base, addons } = parseLevel(level);
  let score = 0;

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

export function buildInsertableIDOSCredential(
  userId: string,
  publicNotes: string,
  content: string,
  encryptorPublicKey: string,
): InsertableIDOSCredential {
  invariant(encryptorPublicKey, "Missing `encryptorPublicKey`");

  const ephemeralAuthenticationKeyPair = nacl.sign.keyPair();

  const publicNotesSignature = nacl.sign.detached(
    utf8Encode(publicNotes),
    ephemeralAuthenticationKeyPair.secretKey,
  );

  return {
    user_id: userId,
    content,

    public_notes: publicNotes,
    public_notes_signature: base64Encode(publicNotesSignature),

    broader_signature: base64Encode(
      nacl.sign.detached(
        Uint8Array.from([...publicNotesSignature, ...base64Decode(content)]),
        ephemeralAuthenticationKeyPair.secretKey,
      ),
    ),

    issuer_auth_public_key: hexEncode(ephemeralAuthenticationKeyPair.publicKey, true),
    encryptor_public_key: encryptorPublicKey,
  };
}
