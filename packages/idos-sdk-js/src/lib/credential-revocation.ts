import { type RevokationDoc, Revoker, type RevokerKeys } from "@idos-network/issuer-sdk-js";

export const isValidRevokationDoc = async (credential: RevokationDoc, sigingKeys: RevokerKeys) => {
  const revoker = await Revoker.init({
    ...sigingKeys,
  });
  return revoker.verifySignedCred(credential);
};

export default { isValidRevokationDoc };
