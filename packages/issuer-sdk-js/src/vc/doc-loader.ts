// @ts-nocheck
import { validContexts } from "../cachedSchemas/schema.js";
import jsigs from "jsonld-signatures";
import * as vc from "@digitalbazaar/vc";
import { MultiLoader } from "./MultiLoader.js";

export const remoteDocuments = new Map();

for (const [url, document] of validContexts) {
  remoteDocuments.set(url, document);
}

remoteDocuments.set("https://example.com/extended-credentials-contexts.json", {
  "@context": {
    RevocationCredential: "https://example.com/vocab#RevocationCredential",
    revokedCredentialId: "https://example.com/vocab#revokedCredentialId",
    newStatus: {
      "@id": "https://example.com/vocab#newStatus",
      "@type": "https://schema.org/Text",
    },
  },
});

const { defaultDocumentLoader } = vc;
const { extendContextLoader } = jsigs;

const testDocumentLoader = extendContextLoader(async (url) => {
  const doc = remoteDocuments.get(url);
  if (doc) {
    return {
      contextUrl: null,
      document: doc,
      documentUrl: url,
    };
  }
  return defaultDocumentLoader(url);
});

// documents are added to this documentLoader incrementally
export const testLoader = new MultiLoader({
  documentLoader: [testDocumentLoader],
});
export const documentLoader = testLoader.documentLoader.bind(testLoader);
