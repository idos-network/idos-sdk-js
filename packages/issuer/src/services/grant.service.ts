import type { idOSCredentialRecord } from "@idos-network/credentials/types";
import type { KwilActionClient } from "@idos-network/kwil-infra";

import { createAgByDagForCopy as _createAgByDagForCopy } from "@idos-network/kwil-infra/actions";
import { BlobGateway, resolveCredentialEncryptedContent } from "@idos-network/utils/blob-gateway";
import { base64Encode, hexEncodeSha256Hash, utf8Encode } from "@idos-network/utils/codecs";
import { NoncedBox } from "@idos-network/utils/cryptography";
import invariant from "tiny-invariant";

export type CreateAccessGrantFromDAGParams = {
  dag_data_id: string;
  dag_owner_wallet_identifier: string;
  dag_grantee_wallet_identifier: string;
  dag_signature: string;
  dag_locked_until: number;
  dag_content_hash: string;
};

export class GrantService {
  readonly #kwilClient: KwilActionClient;
  readonly #encryptionSecretKey: Uint8Array;
  readonly #blobGateway?: BlobGateway;

  constructor(
    kwilClient: KwilActionClient,
    encryptionSecretKey: Uint8Array,
    blobGateway?: BlobGateway,
  ) {
    this.#kwilClient = kwilClient;
    this.#encryptionSecretKey = encryptionSecretKey;
    this.#blobGateway = blobGateway;
  }

  async createAccessGrantFromDAG(
    params: CreateAccessGrantFromDAGParams,
    getCredentialIdByContentHash: (contentHash: string) => Promise<string | null>,
    getCredentialShared: (id: string) => Promise<idOSCredentialRecord | null>,
  ): Promise<CreateAccessGrantFromDAGParams | null> {
    const credentialId = await getCredentialIdByContentHash(params.dag_content_hash);

    invariant(credentialId, "Missing `idOSCredential` id");

    const credential = await getCredentialShared(credentialId);

    invariant(credential, `idOSCredential with id ${credentialId} not found`);

    const plaintextContent = await NoncedBox.nonceFromBase64SecretKey(
      base64Encode(this.#encryptionSecretKey),
    ).decrypt(
      await this.#getCredentialEncryptedContent(credential),
      credential.encryptor_public_key,
    );

    // Get the content hash from the plaintext content
    const contentHash = hexEncodeSha256Hash(utf8Encode(plaintextContent));

    // Check if the content hash matches the content hash in the credential
    if (contentHash !== params.dag_content_hash) {
      throw new Error("Hash mismatch between `DAG` and `idOSCredential` content");
    }

    const result = await _createAgByDagForCopy(this.#kwilClient, params);

    return result ?? null;
  }

  async #getCredentialEncryptedContent(credential: idOSCredentialRecord): Promise<string> {
    return base64Encode(await resolveCredentialEncryptedContent(credential, this.#blobGateway));
  }
}
