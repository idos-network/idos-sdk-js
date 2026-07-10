import {
  VerifiableCredentialFaceIdV1,
  VerifiableCredentialKycV1,
  VerifiableCredentialKycV2,
  VerifiableCredentialKycV3,
  type VerifiableCredential,
} from "../types";

export async function parseCredential(input: VerifiableCredential<{
  "@context": string;
}>): Promise<VerifiableCredentialFaceIdV1 | VerifiableCredentialKycV1 | VerifiableCredentialKycV2 | VerifiableCredentialKycV3> {
  // Check one by one for context
  const v1 = new VerifiableCredentialFaceIdV1();

  if (input.credentialSubject["@context"] === v1.subjectContext) {
    v1.deserialize(input as any);
    return v1;
  }

  const kycV1 = new VerifiableCredentialKycV1();

  if (input.credentialSubject["@context"] === kycV1.subjectContext) {
    kycV1.deserialize(input as any);
    return kycV1;
  }

  const v2 = new VerifiableCredentialKycV2();

  if (input.credentialSubject["@context"] === v2.subjectContext) {
    v2.deserialize(input as any);
    return v2;
  }

  const v3 = new VerifiableCredentialKycV3();

  if (input.credentialSubject["@context"] === v3.subjectContext) {
    v3.deserialize(input as any);
    return v3;
  }

  throw new Error("Unknown credential");
}
