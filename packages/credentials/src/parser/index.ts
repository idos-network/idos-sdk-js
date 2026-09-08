import type { VerifiableCredential } from "../types";

import {
  VerifiableCredentialEddV1,
  VerifiableCredentialFaceIdV1,
  VerifiableCredentialKycV1,
  VerifiableCredentialKycV2,
  VerifiableCredentialKycV3,
} from "../schemas";

type CredentialWithContext = VerifiableCredential<unknown>;

/** Every version `parseCredential` can return. */
export type ParsedCredential =
  | VerifiableCredentialEddV1
  | VerifiableCredentialFaceIdV1
  | VerifiableCredentialKycV1
  | VerifiableCredentialKycV2
  | VerifiableCredentialKycV3;

/*
 * Matched on the subject `@context`, which is unique per version — several versions share an
 * envelope context, so that one cannot tell them apart.
 */
const VERSIONS: { readonly subjectContext: string; new (): ParsedCredential }[] = [
  VerifiableCredentialEddV1,
  VerifiableCredentialFaceIdV1,
  VerifiableCredentialKycV1,
  VerifiableCredentialKycV2,
  VerifiableCredentialKycV3,
];

function hasContext(input: CredentialWithContext, context: string): boolean {
  if (
    typeof input.credentialSubject !== "object" ||
    input.credentialSubject === null ||
    Array.isArray(input.credentialSubject)
  ) {
    return false;
  }

  const value = (input.credentialSubject as Record<string, unknown>)["@context"];
  return Array.isArray(value) ? value.includes(context) : value === context;
}

/**
 * Deserializes a credential into its typed version by matching the subject `@context`, then
 * validates it. A credential that does not match the context it claims is rejected here rather
 * than at the first property access: a subject field the context does not define throws, and one
 * it promises but the credential omits fails with `CredentialValidationError`.
 *
 * SECURITY: this does NOT verify the credential's signature. The returned version reflects
 * whatever was in `input`, signed or forged. For untrusted input, call `verifyCredential()`
 * (from `@idos-network/credentials/verifier`) first and only parse once it reports verified.
 */
export async function parseCredential(input: CredentialWithContext): Promise<ParsedCredential> {
  for (const Version of VERSIONS) {
    if (!hasContext(input, Version.subjectContext)) continue;

    const credential = new Version();

    await credential.deserialize(input);
    credential.checkValidity();

    return credential;
  }

  throw new Error("Unknown credential");
}
