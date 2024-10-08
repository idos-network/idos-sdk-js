import type { idOSCredential } from "@idos-network/idos-sdk-types";
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
