import {
  createAccessGrantByDag as _createAccessGrantByDag,
  base64Decode,
  hexEncodeSha256Hash,
} from "@idos-network/core";
import type { IssuerConfig } from "./create-issuer-config";
import { getCredentialIdByContentHash, getSharedCredential } from "./credentials";
import { decryptContent } from "./internal";

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
  const { kwilClient } = issuerConfig;

  const credentialId = await getCredentialIdByContentHash(issuerConfig, params.dag_content_hash);

  if (!credentialId) {
    throw new Error("idOSCredential not found");
  }

  const [credential] = await getSharedCredential(issuerConfig, credentialId);

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

  const result = await _createAccessGrantByDag(kwilClient, params);

  return result ?? null;
}
