// @ts-nocheck
import { contexts as credentialsContexts } from "@digitalbazaar/credentials-context";

credentialsContexts.set("https://example.com/extended-credentials-contexts.json", {
  "@context": {
    "@version": 1.1,
    id: "@id",
    type: "@type",
    revokedCredentialId: {
      "@id": "https://example.com/vocab#revokedCredentialId",
      "@type": "@id",
    },
    newStatus: {
      "@id": "https://example.com/vocab#newStatus",
      "@type": "https://schema.org/Text",
    },
  },
});

export const validContexts = new Map([...credentialsContexts]);
