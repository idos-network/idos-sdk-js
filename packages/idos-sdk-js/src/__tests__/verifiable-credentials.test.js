import { expect, test } from "vitest";

import { documentLoader } from "./cachedSchemas";

import * as verifiableCredentials from "../lib/verifiable-credentials";

const credential = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://raw.githubusercontent.com/trustfractal/claim-schemas/master/verifiable_credential/fractal_id.json-ld",
    "https://w3id.org/security/suites/ed25519-2020/v1",
  ],
  id: "uuid:ddedb27a-0a7f-48ac-baa7-848631918d6e",
  type: ["VerifiableCredential"],
  issuer: "https://vc-issuers.fractal.id/idos",
  issuanceDate: "2023-10-05T12:37:35Z",
  level: "basic",
  status: "approved",
  approved_at: "2023-10-05T12:37:35Z",
  credentialSubject: {
    id: "uuid:f149f600-418b-4481-9efb-01c0ef72d8ba",
    wallets: [
      { currency: "near", verified: true, address: "example.testnet" },
      {
        currency: "eth",
        verified: true,
        address: "0x05a56f2d52c817161883f50c441c3228cfe54d9f",
      },
    ],
    emails: ["email@example.com"],
  },
  proof: {
    type: "Ed25519Signature2020",
    created: "2023-10-20T18:02:40Z",
    verificationMethod:
      "https://vc-issuers.fractal.id/idos#z6MkrJVnaZkeFzdQyMZu1cgjg7k1pZZ6pvBQ7XJPt4swbTQ2",
    proofPurpose: "assertionMethod",
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    proofValue:
      "z4ucudi8ihgid5aUPotF7M5wHCH5C6ZGQJwkvjWMvjSYL5kYqkHEF9WZ1nZBDcJzkTh7zmL2HEtLzmEAiveW28wsT",
  },
};

test("verifies an example credential", async () => {
  expect(
    await verifiableCredentials.verify(credential, {
      documentLoader: verifiableCredentials.documentLoaderWithFallbackCompose(
        documentLoader,
        verifiableCredentials.staticLoader(
          "https://vc-issuers.fractal.id/idos",
          "z6MkrJVnaZkeFzdQyMZu1cgjg7k1pZZ6pvBQ7XJPt4swbTQ2",
        ),
      ),
    }),
  ).toBe(true);
});

test("needs the multibase key to exist", async () => {
  // Note how we're not adding a static loader for z6MkrJVnaZkeFzdQyMZu1cgjg7k1pZZ6pvBQ7XJPt4swbTQ2, which is what's
  // being used in `credential`.
  expect(
    await verifiableCredentials.verify(credential, { documentLoader }).catch((e) => e),
  ).toMatchObject({
    verified: false,
    error: {
      message: "Verification error(s).",
      errors: [
        {
          message:
            "Did not verify any proofs; insufficient proofs matched the acceptable suite(s) and required purpose(s).",
        },
      ],
    },
  });
});
