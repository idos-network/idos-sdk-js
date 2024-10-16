// @ts-nocheck
import { Ed25519VerificationKey2018 } from "@digitalbazaar/ed25519-verification-key-2018";
import { Ed25519Signature2018 } from "@digitalbazaar/ed25519-signature-2018";
import { assertionController } from "./vc/assertionController.js";
import * as vc from "@digitalbazaar/vc";
import { documentLoader, remoteDocuments } from "./vc/doc-loader.js";

export type RevokerKeys = {
  privateKey: string;
  publicKey: string;
};

export class Revoker {
  keys;
  suite;
  constructor({ privateKey, publicKey }: RevokerKeys) {
    this.keys = { privateKey, publicKey };
  }

  async setSuite(keyPair) {
    assertionController.assertionMethod.push(keyPair.id);
    assertionController.authentication.push(keyPair.id);

    remoteDocuments.set("https://example.edu/issuers/565049", assertionController);
    remoteDocuments.set(
      "https://example.edu/issuers/keys/1",
      await keyPair.export({ publicKey: true }),
    );

    const suite = new Ed25519Signature2018({
      verificationMethod: "https://example.edu/issuers/keys/1",
      key: keyPair,
      proofPurpose: "assertionMethod",
    });

    if (!suite) throw new Error("Suite not set");
    this.suite = suite;
  }

  static async init(params: RevokerKeys) {
    const revocationManager = new Revoker(params);

    const keyPair = new Ed25519VerificationKey2018({
      id: "https://example.edu/issuers/keys/1",
      controller: "https://example.edu/issuers/565049",
      privateKeyBase58: params.privateKey,
      publicKeyBase58: params.publicKey,
    });

    await revocationManager.setSuite(keyPair);
    return revocationManager;
  }

  async generateVcProof(credential) {
    const signedCredential = await vc.issue({
      credential,
      suite: this.suite,
      documentLoader: documentLoader,
    });

    return signedCredential;
  }

  verifySignedCred = async (credential) => {
    const verified = await vc.verifyCredential({
      credential,
      suite: this.suite,
      documentLoader,
    });

    return verified.verified;
  };
}

export const createRevokationDoc = (credentialId) => ({
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://example.com/extended-credentials-contexts.json",
  ],
  id: `urn:uuid:${crypto.randomUUID()}`,
  type: ["VerifiableCredential", "RevocationCredential"],
  revokedCredentialId: credentialId,
  newStatus: "revoked",
  issuer: "https://example.edu/issuers/565049",
  issuanceDate: new Date().toISOString(),
  credentialSubject: {
    id: `did:${crypto.randomUUID()}`,
  },
});
