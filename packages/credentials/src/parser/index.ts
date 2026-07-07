import {
  VerifiableCredentialFaceIdV1,
  VerifiableCredentialKycV1,
  VerifiableCredentialKycV2,
  VerifiableCredentialKycV3,
  type VerifiableCredential,
} from "../types";

type CredentialWithContext = VerifiableCredential<unknown>;

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
 * Deserializes a credential into its typed container by matching the subject `@context`.
 *
 * SECURITY: This does NOT verify the credential's signature. The returned container
 * reflects whatever was in `input`, signed or forged. For untrusted input, call
 * `verifyCredential()` (from `@idos-network/credentials/verifier`) first and only
 * parse once it reports verified.
 */
export async function parseCredential(
  input: CredentialWithContext,
): Promise<
  | VerifiableCredentialFaceIdV1
  | VerifiableCredentialKycV1
  | VerifiableCredentialKycV2
  | VerifiableCredentialKycV3
> {
  const containers = [
    VerifiableCredentialFaceIdV1,
    VerifiableCredentialKycV1,
    VerifiableCredentialKycV2,
    VerifiableCredentialKycV3,
  ];

  for (const Container of containers) {
    const container = new Container();

    if (hasContext(input, container.subjectContext)) {
      await container.deserialize(input);
      return container;
    }
  }

  throw new Error("Unknown credential");
}
