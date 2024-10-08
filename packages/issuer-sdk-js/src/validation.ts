import invariant from "tiny-invariant";
import type { CreateCredentialReqParams } from "./credentials";

export const inputValidation = (params: CreateCredentialReqParams, secretKey: string) => {
  invariant(params.content, "Content is required to create a credential.");
  invariant(params.encryption_public_key, "Encryption public key is required.");
  invariant(secretKey, "Secret key is required.");
};
