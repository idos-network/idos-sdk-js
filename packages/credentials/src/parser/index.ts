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

export async function parseCredential(
  input: CredentialWithContext,
): Promise<
  | VerifiableCredentialFaceIdV1
  | VerifiableCredentialKycV1
  | VerifiableCredentialKycV2
  | VerifiableCredentialKycV3
> {
  // Check one by one for context
  const v1 = new VerifiableCredentialFaceIdV1();

  if (hasContext(input, v1.subjectContext)) {
    await v1.deserialize(input);
    return v1;
  }

  const kycV1 = new VerifiableCredentialKycV1();

  if (hasContext(input, kycV1.subjectContext)) {
    await kycV1.deserialize(input);
    return kycV1;
  }

  const v2 = new VerifiableCredentialKycV2();

  if (hasContext(input, v2.subjectContext)) {
    await v2.deserialize(input);
    return v2;
  }

  const v3 = new VerifiableCredentialKycV3();

  if (hasContext(input, v3.subjectContext)) {
    await v3.deserialize(input);
    return v3;
  }

  throw new Error("Unknown credential");
}
