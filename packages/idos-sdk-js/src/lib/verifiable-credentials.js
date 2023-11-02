import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";
import * as vc from "@digitalbazaar/vc";
import * as jsonld from "jsonld";
import { JsonLdDocumentLoader } from "jsonld-document-loader";

const FRACTAL_ISSUER = "https://vc-issuers.fractal.id/idos";
const FRACTAL_PUBLIC_KEY_MULTIBASE = import.meta.env.VITE_FRACTAL_ID_ISSUER_CREDENTIAL_PUBLIC_KEY_MULTIBASE;

const issuerDoc = (id, publicKeyMultibase) => ({
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
  id,
  assertionMethod: [
    {
      id: `${id}#${publicKeyMultibase}`,
      type: "Ed25519VerificationKey2020",
      controller: id,
      publicKeyMultibase,
    },
  ],
});

const staticLoader = (() => {
  const loader = new JsonLdDocumentLoader();
  loader.addStatic(FRACTAL_ISSUER, issuerDoc(FRACTAL_ISSUER, FRACTAL_PUBLIC_KEY_MULTIBASE));
  return loader.build();
})();


const xhrLoader = (jsonld.documentLoaders.xhr ?? jsonld.documentLoaders.node)();

export const documentLoaderWithStaticFractal = documentLoader => async (url, options={}) => {
  try {
    return await staticLoader(url, options);
  } catch (e) {}

  return await documentLoader(url, options);
};

const knownSignatureBuilders = {
  Ed25519VerificationKey2020: async (m) =>
    new Ed25519Signature2020({
      key: await Ed25519VerificationKey2020.from(m),
    }),
};

const buildSignatures = async (methods, signatureBuilders) => {
  const result = (
    await Promise.all(methods.map(async (method) => await signatureBuilders[method.type]?.call(null, method)))
  ).filter((o) => !!o);

  if (!result.length) throw new Error("Didn't find any supported keys.");

  return result;
};

/**
 * Verify the given `credential` has a valid proof.
 *
 * @param {object} credential - The credential to verify.
 *
 * Optional parameters:
 * @typedef {jsigs.suites.LinkedDataSignature} Signer
 * @param {Signer|Signer[]} [options.allowedSigners] - Define the set of accepted signing keys. If omitted,
 * this will be calculated from whatever is on the document that `credential.issuer` resolves to.
 * @param {string[]} [options.allowedIssuers] - List of acceptable values for `credential.issuer`. If omitted, this will
 * include only the current Fractal issuer.
 * @param {Object.<string, (any) => PromiseLike<Signer>>} [options.signatureBuilders] - Object that provides builder
 * functions for each signature type. If omitted, we use `knownSignatureBuilders` as defined in this file.
 * @param {jsonld.DocumentLoader} [options.documentLoader] - The document loader to be used by jsonld. If omitted, it
 * uses `jsonld.documentLoaders.xhr` or, if that's not available, `jsonld.documentLoaders.node`.
 *
 * @returns {true} `true` on success. Otherwise, throws an Error describing the problem.
 */
const verify = async (credential, options = {}) => {
  let {allowedSigners, allowedIssuers, signatureBuilders, documentLoader} = options
  if(!signatureBuilders) signatureBuilders = knownSignatureBuilders;
  if(!allowedIssuers) allowedIssuers = [FRACTAL_ISSUER];
  if(!documentLoader) documentLoader = xhrLoader

  documentLoader = documentLoaderWithStaticFractal(documentLoader)

  if(typeof credential === "string" || credential instanceof String) {
    credential = JSON.parse(credential);
  }

  const proof = credential.proof;
  if(!proof) throw new Error("This function is only supports embedded proofs.")

  const proofPurpose = proof.proofPurpose;
  if(!proofPurpose) throw new Error("Invalid proof: missing proofPurpose.")

  const issuer = credential.issuer;
  if(!issuer) throw new Error("Invalid credential: missing issuer.")

  if(!allowedIssuers.includes(issuer)) throw new Error("Unfit credential: issuer is not allowed.")

  const suite = allowedSigners ?? await (async () => {
    const issuerDoc = (await documentLoader(issuer))?.document;
    if(!issuerDoc) throw new Error("Couldn't fetch document for the issuer.")

    const methods = issuerDoc[proofPurpose];
    if (!methods || !methods.length) throw new Error(`Empty or absent "${proofPurpose}" in issuer.`);

    return buildSignatures(methods, signatureBuilders);
  })();

  const result = await vc.verifyCredential({ credential, suite, documentLoader });
  if(!result.verified) throw result?.results?.[0]?.error || result;
  return true;
}

export default {verify}
