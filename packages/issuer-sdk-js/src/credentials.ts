import {
  base64Decode,
  base64Encode,
  hexEncode,
  hexEncodeSha256Hash,
  utf8Encode,
} from "@idos-network/codecs";
import type { idOSCredential } from "@idos-network/idos-sdk-types";
import nacl from "tweetnacl";
import type { IssuerConfig } from "./create-issuer-config";
import {
  createActionInput,
  createActionInputWithoutId,
  encryptContent,
  ensureEntityId,
} from "./internal";

type UpdateablePublicNotes = {
  publicNotes: string;
};
const buildUpdateablePublicNotes = (
  issuerConfig: IssuerConfig,
  { publicNotes }: UpdateablePublicNotes,
) => {
  const publicNotesSignature = nacl.sign.detached(
    utf8Encode(publicNotes),
    issuerConfig.signingKeyPair.secretKey,
  );

  return {
    public_notes: publicNotes,
    public_notes_signature: base64Encode(publicNotesSignature),
  };
};

type InsertableIDOSCredential = Omit<idOSCredential, "id" | "original_id"> & {
  id?: idOSCredential["id"];
  content_hash?: string;
  public_notes_signature: string;
  broader_signature: string;
};
const buildInsertableIDOSCredential = (
  issuerConfig: IssuerConfig,
  {
    userId,
    publicNotes,
    plaintextContent,
    recipientEncryptionPublicKey,
  }: {
    userId: string;
    publicNotes: string;
    plaintextContent: Uint8Array;
    recipientEncryptionPublicKey: Uint8Array;
  },
): InsertableIDOSCredential => {
  const ephemeralKeyPair = nacl.box.keyPair();
  const content = encryptContent(
    plaintextContent,
    recipientEncryptionPublicKey,
    ephemeralKeyPair.secretKey,
  );

  const { public_notes, public_notes_signature } = buildUpdateablePublicNotes(issuerConfig, {
    publicNotes,
  });

  return {
    user_id: userId,
    content: base64Encode(content),
    public_notes,
    public_notes_signature,

    broader_signature: base64Encode(
      nacl.sign.detached(
        Uint8Array.from([...base64Decode(public_notes_signature), ...content]),
        issuerConfig.signingKeyPair.secretKey,
      ),
    ),

    issuer_auth_public_key: hexEncode(issuerConfig.signingKeyPair.publicKey, true),
    encryptor_public_key: base64Encode(ephemeralKeyPair.publicKey),
  };
};

interface BaseCredentialParams {
  id?: string;
  userId: string;
  publicNotes: string;
  plaintextContent: Uint8Array;
  recipientEncryptionPublicKey: Uint8Array;
}

export async function createCredentialPermissioned(
  issuerConfig: IssuerConfig,
  params: BaseCredentialParams,
): Promise<idOSCredential> {
  const { dbid, kwilClient, kwilSigner } = issuerConfig;
  const payload = ensureEntityId(buildInsertableIDOSCredential(issuerConfig, params));

  await kwilClient.execute(
    {
      name: "upsert_credential_as_inserter",
      dbid,
      inputs: [createActionInput(payload)],
    },
    kwilSigner,
    true,
  );

  return {
    ...payload,
    original_id: "",
  };
}

type DelegatedWriteGrantParams = {
  ownerWalletIdentifier: string;
  granteeWalletIdentifier: string;
  id: string;
  accessGrantTimelock: string;
  notUsableBefore: string;
  notUsableAfter: string;
  signature: string;
};

export async function createCredentialsByDelegatedWriteGrant(
  issuerConfig: IssuerConfig,
  credentialParams: BaseCredentialParams,
  delegatedWriteGrant: DelegatedWriteGrantParams,
): Promise<{ originalCredential: idOSCredential; copyCredential: idOSCredential }> {
  const { dbid, kwilClient, kwilSigner, encryptionSecretKey } = issuerConfig;
  // Derive the recipient encryption public key from the issuer's encryption secret key to use it as the recipient encryption public key.
  const issuerEncPublicKey = nacl.box.keyPair.fromSecretKey(encryptionSecretKey).publicKey;
  const originalCredential = ensureEntityId(
    buildInsertableIDOSCredential(issuerConfig, credentialParams),
  );
  const contentHash = hexEncodeSha256Hash(credentialParams.plaintextContent);
  const copyCredential = ensureEntityId(
    buildInsertableIDOSCredential(issuerConfig, {
      userId: credentialParams.userId,
      publicNotes: "",
      plaintextContent: credentialParams.plaintextContent,
      recipientEncryptionPublicKey: issuerEncPublicKey,
    }),
  );
  const payload = {
    issuer_auth_public_key: originalCredential.issuer_auth_public_key,
    original_encryptor_public_key: originalCredential.encryptor_public_key,
    original_credential_id: originalCredential.id,
    original_content: originalCredential.content,
    original_public_notes: originalCredential.public_notes,
    original_public_notes_signature: originalCredential.public_notes_signature,
    original_broader_signature: originalCredential.broader_signature,
    copy_encryptor_public_key: copyCredential.encryptor_public_key,
    copy_credential_id: copyCredential.id,
    copy_content: copyCredential.content,
    copy_public_notes_signature: copyCredential.public_notes_signature,
    copy_broader_signature: copyCredential.broader_signature,
    content_hash: contentHash,
    dwg_owner: delegatedWriteGrant.ownerWalletIdentifier,
    dwg_grantee: delegatedWriteGrant.granteeWalletIdentifier,
    dwg_id: delegatedWriteGrant.id,
    dwg_access_grant_timelock: delegatedWriteGrant.accessGrantTimelock,
    dwg_not_before: delegatedWriteGrant.notUsableBefore,
    dwg_not_after: delegatedWriteGrant.notUsableAfter,
    dwg_signature: delegatedWriteGrant.signature,
  };

  await kwilClient.execute(
    {
      name: "create_credentials_by_dwg",
      dbid,
      inputs: [createActionInputWithoutId(payload)],
    },
    kwilSigner,
    true,
  );

  return { originalCredential, copyCredential };
}

interface EditCredentialAsIssuerParams {
  publicNotesId: string;
  publicNotes: string;
}
export async function editCredential(
  issuerConfig: IssuerConfig,
  { publicNotesId, publicNotes }: EditCredentialAsIssuerParams,
) {
  const { dbid, kwilClient, kwilSigner } = issuerConfig;
  const payload = {
    public_notes_id: publicNotesId,
    public_notes: publicNotes,
  };

  const result = await kwilClient.execute(
    {
      name: "edit_public_notes_as_issuer",
      dbid,
      inputs: [createActionInput(payload)],
    },
    kwilSigner,
    true,
  );

  return result;
}

export async function getCredentialIdByContentHash(
  issuerConfig: IssuerConfig,
  contentHash: string,
): Promise<string | null> {
  const { dbid, kwilClient, kwilSigner } = issuerConfig;

  const response = (await kwilClient.call(
    {
      name: "get_sibling_credential_id",
      dbid,
      inputs: [createActionInput({ content_hash: contentHash })],
    },
    kwilSigner,
  )) as unknown as { data: { result: [{ id: string }] } };

  return response.data?.result?.[0]?.id ?? null;
}

export async function getSharedCredential(issuerConfig: IssuerConfig, id: string) {
  const { dbid, kwilClient, kwilSigner } = issuerConfig;

  const response = await kwilClient.call(
    {
      name: "get_credential_shared",
      dbid,
      inputs: [createActionInput({ id })],
    },
    kwilSigner,
  );

  return response?.data?.result?.[0] as unknown as idOSCredential | null;
}
