import type { CreateCredentialReqParams } from "./credentilas";

export const inputValidation = (params: CreateCredentialReqParams, secretKey: string) => {
  if (!params.content) {
    throw new Error("Content is required to create a credential.");
  }
  if (!params.encryption_public_key) {
    throw new Error("Encryption public key is required.");
  }
  if (!secretKey) {
    throw new Error("Secret key is required.");
  }
};
