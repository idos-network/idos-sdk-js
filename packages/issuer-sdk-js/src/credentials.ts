import type { idOSCredential, idOSRevocationDocument } from "@idos-network/idos-sdk-types";
import * as base64 from "@stablelib/base64";
import * as utf8Codec from "@stablelib/utf8";
import type { CreateIssuerConfig } from "./create-issuer-config";
import { encrypt } from "./crypto";
import { createActionInput } from "./internal";

export interface CreateCredentialReqParams extends Omit<idOSCredential, "id" | "original_id"> {}

const encryptContent = (content: string, secretKey: string, encryptionPublicKey: string) => {
  const endodedContent = utf8Codec.encode(content);
  const decodedEncryptionPublicKey = base64.decode(encryptionPublicKey);
  const decodedSecretKey = base64.decode(secretKey);

  return encrypt(endodedContent, decodedEncryptionPublicKey, decodedSecretKey);
};

export async function upsertCredential(
  { dbid, kwilClient, signer, secretKey }: CreateIssuerConfig,
  params: CreateCredentialReqParams,
) {
  let encryptedContent: string;
  const id = crypto.randomUUID();

  try {
    encryptedContent = await encryptContent(
      params.content,
      secretKey,
      params.encryption_public_key,
    );
  } catch (encryptionError) {
    throw new Error(`Encryption failed: ${(encryptionError as { message: string }).message}`);
  }

  const response = await kwilClient.execute(
    {
      name: "upsert_credential_as_inserter",
      dbid,
      inputs: [
        createActionInput({
          ...params,
          id,
          content: encryptedContent,
        }),
      ],
    },
    signer,
    true,
  );

  return response.data?.tx_hash;
}

/**
 * This is a dummy implementation for now.
 * Once we have defined the revocation document interface, we should update this function accordingly.
 */
export function createRevocationDocument(credentialId: string): idOSRevocationDocument {
  return {
    id: credentialId,
    revokedCredentialId: "",
    newStatus: "revoked",
    verificationMethod: "",
    proof: {},
  };
}

/**
 * This is a dummy implementation for now.
 * Once we have defined the kwil action, we should update this function accordingly.
 * Also, we don't know yet, should we pass the revocation document as a parameter or create it internally.
 */
export async function revokeIssuedCredential(
  { dbid, kwilClient, signer }: CreateIssuerConfig,
  credentialId: string,
  revocationDocument = createRevocationDocument(credentialId),
) {
  const response = await kwilClient.execute(
    {
      // @todo: update the name once we have defined the kwil action.
      name: "insert_revocation_document",
      dbid,
      inputs: [createActionInput(revocationDocument)],
    },
    signer,
    true,
  );

  return response.data?.tx_hash;
}
