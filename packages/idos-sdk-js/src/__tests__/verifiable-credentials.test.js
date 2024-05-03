import { expect, test } from "vitest";

import * as verifiableCredentials from "../lib/verifiable-credentials";

const playgroundCredential = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://raw.githubusercontent.com/trustfractal/claim-schemas/686bd9c0b44f8af03831f7dc31f7d6a9b6b5ff5b/verifiable_credential/fractal_id.json-ld",
    "https://w3id.org/security/suites/ed25519-2020/v1",
  ],
  id: "uuid:909225d0-6af3-416d-a770-fd6c15bb06da",
  type: ["VerifiableCredential"],
  issuer: "https://vc-issuers.next.fractal.id/idos",
  level: "human",
  credentialSubject: {
    id: "uuid:fc7af2fd-4b37-48c6-96a6-ea09ec257282",
    wallets: [
      { currency: "eth", verified: true, address: "0x2591f18f0a7339c167b2ddf813fbf50b9970e8c2" },
    ],
    emails: [{ verified: false, address: "derp@derp.dep" }],
  },
  status: "approved",
  issuanceDate: "2024-05-03T14:02:06Z",
  approved_at: "2024-05-03T14:02:06Z",
  proof: {
    type: "Ed25519Signature2020",
    created: "2024-05-03T14:45:13Z",
    verificationMethod:
      "https://vc-issuers.next.fractal.id/idos#z6Mkqm5JuLvBcHkbQogDXz5p5ppTY4DF5FLhoRd2VM9NaKp5",
    proofPurpose: "assertionMethod",
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    proofValue:
      "z5QRnxqqXMZ7dyB5Sd7RLPLhpUdA99UXRzJd93ekr1Q8BL2KAStkNoqFwkq5DVveUXULA5qWGm9JMDfuytBi6aVP4",
  },
};

test("verifies an playground credential", async () => {
  expect(
    await verifiableCredentials.verify(playgroundCredential, {
      allowedIssuers: [verifiableCredentials.PLAYGROUND_FRACTAL_ISSUER],
    }),
  ).toBe(true);
});

test("doesn't validate a playground credential with the default settings", async () => {
  // Note how we're not overriding `allowedIssuers`, which only accept production credentials.
  expect(await verifiableCredentials.verify(playgroundCredential).catch((e) => e)).toMatchObject({
    message: "Unfit credential: issuer is not allowed.",
  });
});
