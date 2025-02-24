import { base64Decode, hexEncodeSha256Hash } from "@idos-network/core";
import type { IssuerConfig } from "./create-issuer-config";
import { getCredentialIdByContentHash, getSharedCredential } from "./credentials";
import { createActionInput, decryptContent } from "./internal";

interface CreateAccessGrantFromDAGParams {
  dag_data_id: string;
  dag_owner_wallet_identifier: string;
  dag_grantee_wallet_identifier: string;
  dag_signature: string;
  dag_locked_until: number;
  dag_content_hash: string;
}

export async function createAccessGrantFromDAG(
  issuerConfig: IssuerConfig,
  params: CreateAccessGrantFromDAGParams,
) {
  const { dbid, kwilClient, kwilSigner } = issuerConfig;

  const credentialId = await getCredentialIdByContentHash(issuerConfig, params.dag_content_hash);

  if (!credentialId) {
    throw new Error("idOSCredential not found");
  }

  const credential = await getSharedCredential(issuerConfig, credentialId);

  if (!credential) {
    throw new Error("idOSCredential not found");
  }

  const plaintextContent = decryptContent(
    base64Decode(credential.content),
    base64Decode(credential.encryptor_public_key),
    issuerConfig.encryptionSecretKey,
  );

  // Get the content hash from the plaintext content
  const contentHash = hexEncodeSha256Hash(plaintextContent);

  // Check if the content hash matches the content hash in the credential
  if (contentHash !== params.dag_content_hash) {
    throw new Error("Hash mismatch between DAG and idOSCredential content");
  }

  const result = await kwilClient.execute(
    {
      name: "create_ag_by_dag_for_copy",
      dbid,
      inputs: [createActionInput(params)],
    },
    kwilSigner,
    true,
  );

  return result?.data?.tx_hash ?? null;
}
