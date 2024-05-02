export default {
  "@context": [
    "https://w3id.org/security/suites/ed25519-2020/v1",
    {
      assertionMethod: {
        "@id": "https://w3id.org/security#assertionMethod",
        "@type": "@id",
        "@container": "@set",
      },
    },
  ],
  id: "https://clients.vc-issuers.fractal.id/idos",
  assertionMethod: [
    {
      id: "https://clients.vc-issuers.fractal.id/idos#z6Mkqm5JuLvBcHkbQogDXz5p5ppTY4DF5FLhoRd2VM9NaKp5",
      type: "Ed25519VerificationKey2020",
      controller: "https://clients.vc-issuers.fractal.id/idos",
      publicKeyMultibase: "z6Mkqm5JuLvBcHkbQogDXz5p5ppTY4DF5FLhoRd2VM9NaKp5",
    },
  ],
};
