import {
  type KwilActionClient,
  NoncedBox,
  base64Encode,
  hexEncodeSha256Hash,
  utf8Encode,
} from "@idos-network/core";
import { createAccessGrantByDag as _createAccessGrantByDag } from "@idos-network/core/kwil-actions";
import type { idOSCredential } from "@idos-network/core/types";

export interface CreateAccessGrantFromDAGParams {
  dag_data_id: string;
  dag_owner_wallet_identifier: string;
  dag_grantee_wallet_identifier: string;
  dag_signature: string;
  dag_locked_until: number;
  dag_content_hash: string;
}

export class GrantService {
  constructor(
    private readonly kwilClient: KwilActionClient,
    private readonly encryptionSecretKey: Uint8Array,
  ) {}

  async createAccessGrantFromDAG(
    params: CreateAccessGrantFromDAGParams,
    getCredentialIdByContentHash: (contentHash: string) => Promise<string | null>,
    getSharedCredential: (id: string) => Promise<idOSCredential | null>,
  ) {
    const credentialId = await getCredentialIdByContentHash(params.dag_content_hash);

    if (!credentialId) {
      throw new Error("`idOSCredential` not found");
    }

    const credential = await getSharedCredential(credentialId);

    if (!credential) {
      throw new Error("`idOSCredential` not found");
    }

    const plaintextContent = await NoncedBox.nonceFromBase64SecretKey(
      base64Encode(this.encryptionSecretKey),
    ).decrypt(credential.content, credential.encryptor_public_key);

    // Get the content hash from the plaintext content
    const contentHash = hexEncodeSha256Hash(utf8Encode(plaintextContent));

    // Check if the content hash matches the content hash in the credential
    if (contentHash !== params.dag_content_hash) {
      throw new Error("Hash mismatch between `DAG` and `idOSCredential` content");
    }

    const result = await _createAccessGrantByDag(this.kwilClient, params);

    return result ?? null;
  }
}
