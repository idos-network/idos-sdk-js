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
  id: "https://vc-issuers.fractal.id/idos",
  assertionMethod: [
    {
      id: "https://vc-issuers.fractal.id/idos#z6MkrkEJxkk6wYAzv6s1LCcXXeiSL1ukhGSBE2wUGQvv6f7V",
      type: "Ed25519VerificationKey2020",
      controller: "https://vc-issuers.fractal.id/idos",
      publicKeyMultibase: "z6MkrkEJxkk6wYAzv6s1LCcXXeiSL1ukhGSBE2wUGQvv6f7V",
    },
  ],
};
