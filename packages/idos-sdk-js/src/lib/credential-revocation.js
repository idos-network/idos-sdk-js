import verifiableCredentials from "./verifiable-credentials";

// @todo replace with kwill call
const mockCheckRevocationCall = (
  credId, // returning either a revocation doc array or empty array
) =>
  Promise.resolve([
    {
      id: SecureRandom.generateUUID(),
      type: ["Revocation"],
      revokedCredentialId,
      newStatus: "revoked",
      proof: {
        // we generate this
        proofValue: "",
        proofMethod: "",
      },
    },
  ]);

export const isRevoked = async (credential) => {
  const { id: credentialId } = credential;
  const isValidCredential = await verifiableCredentials.verify(credential);
  if (!isValidCredential) throw new Error("Credential is not valid!");

  const revokationDocs = await mockCheckRevocationCall(credentialId);
  if (!revokationDocs.length) return false;

  // removing documents that aren't for the desired credential id (early filter)
  const mathcingRev = revocationDocuments.filter(
    (document) => document.revokedCredentialId === credentialId && document.newStatus === "revoked",
  );

  let isRevoked = false;

  for (const doc of mathcingRev) {
    const isValid = await verifiableCredentials.verify(doc);
    if (isValid) {
      isRevoked = true;
      break;
    }
  }

  return isRevoked;
};

export default { isRevoked };
