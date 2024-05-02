import { expect, test } from "vitest";

import * as verifiableCredentials from "../lib/verifiable-credentials";

// @todo: once deployed, update the credential with a staging one.
const credential = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://raw.githubusercontent.com/trustfractal/claim-schemas/686bd9c0b44f8af03831f7dc31f7d6a9b6b5ff5b/verifiable_credential/fractal_id.json-ld",
    "https://w3id.org/security/suites/ed25519-2020/v1",
  ],
  id: "uuid:af2574c3-070a-4f17-b963-b83c96ba2829",
  type: ["VerifiableCredential"],
  issuer: "https://vc-issuers.fractal.id/idos",
  level: "human",
  credentialSubject: {
    id: "uuid:f80a6d5c-e894-49f5-8594-81fe8a588036",
    wallets: [
      {
        currency: "eth",
        verified: true,
        address: "0xa9f289873253035549d4df543b7918dde060fad0",
      },
    ],
    emails: [
      {
        verified: false,
        address: "alex.sapience+images1@gmail.com",
      },
    ],
  },
  status: "approved",
  issuanceDate: "2024-02-21T09:22:27Z",
  approved_at: "2024-02-21T09:22:27Z",
  proof: {
    type: "Ed25519Signature2020",
    created: "2024-04-30T14:11:03Z",
    verificationMethod:
      "https://vc-issuers.fractal.id/idos#z6Mkqm5JuLvBcHkbQogDXz5p5ppTY4DF5FLhoRd2VM9NaKp5",
    proofPurpose: "assertionMethod",
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    proofValue:
      "z4YsdyhV3P7nsrBaxyqyHRxcczsPCxrkaDJyx696NoCQVxGx95cnkFYjNKiScz6SogStLjXhZPE5Xyy3Na8DF2KpC",
  },
};

test("verifies an example credential", async () => {
  expect(
    await verifiableCredentials.verify(credential, {
      allowedIssuers: [verifiableCredentials.STAGING_FRACTAL_ISSUER],
    }),
  ).toBe(true);
});

test("needs the multibase key to exist", async () => {
  const { proof, ...rest } = credential;
  const withoutProof = {
    ...rest,
    proof: { ...proof, verificationMethod: proof.verificationMethod.split("#")[0] },
  };

  // Note how we're not overriding `allowedIssuers`, which only accept production credentials.
  expect(await verifiableCredentials.verify(withoutProof).catch((e) => e)).toMatchObject({
    verified: false,
    error: {
      message: "Verification error(s).",
      errors: [
        {
          message:
            // TODO this might not be the right error.
            "Did not verify any proofs; insufficient proofs matched the acceptable suite(s) and required purpose(s).",
        },
      ],
    },
  });
});
