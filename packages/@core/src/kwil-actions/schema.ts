import { Utils } from "@kwilteam/kwil-js";

const { DataType } = Utils;

interface elem {
  name: string;
  type: typeof DataType.Uuid | typeof DataType.Text | typeof DataType.Int;
}

export const ActionSchema: Record<string, elem[]> = {
  add_user_as_inserter: [
    {
      name: "id",
      type: DataType.Uuid,
    },
    {
      name: "recipient_encryption_public_key",
      type: DataType.Text,
    },
  ],
  update_user_pub_key_as_inserter: [
    {
      name: "id",
      type: DataType.Uuid,
    },
    {
      name: "recipient_encryption_public_key",
      type: DataType.Text,
    },
  ],
  get_user: [],
  get_user_as_inserter: [
    {
      name: "id",
      type: DataType.Uuid,
    },
  ],
  upsert_wallet_as_inserter: [
    {
      name: "id",
      type: DataType.Uuid,
    },
    {
      name: "user_id",
      type: DataType.Uuid,
    },
    {
      name: "address",
      type: DataType.Text,
    },
    {
      name: "public_key",
      type: DataType.Text,
    },
    {
      name: "wallet_type",
      type: DataType.Text,
    },
    {
      name: "message",
      type: DataType.Text,
    },
    {
      name: "signature",
      type: DataType.Text,
    },
  ],
  add_wallet: [
    {
      name: "id",
      type: DataType.Uuid,
    },
    {
      name: "address",
      type: DataType.Text,
    },
    {
      name: "public_key",
      type: DataType.Text,
    },
    {
      name: "message",
      type: DataType.Text,
    },
    {
      name: "signature",
      type: DataType.Text,
    },
  ],
  get_wallets: [],
  remove_wallet: [
    {
      name: "id",
      type: DataType.Uuid,
    },
  ],
  upsert_credential_as_inserter: [
    {
      name: "id",
      type: DataType.Uuid,
    },
    {
      name: "user_id",
      type: DataType.Uuid,
    },
    {
      name: "issuer_auth_public_key",
      type: DataType.Text,
    },
    {
      name: "encryptor_public_key",
      type: DataType.Text,
    },
    {
      name: "content",
      type: DataType.Text,
    },
    {
      name: "public_notes",
      type: DataType.Text,
    },
    {
      name: "public_notes_signature",
      type: DataType.Text,
    },
    {
      name: "broader_signature",
      type: DataType.Text,
    },
  ],
  add_credential: [
    {
      name: "id",
      type: DataType.Uuid,
    },
    {
      name: "issuer_auth_public_key",
      type: DataType.Text,
    },
    {
      name: "encryptor_public_key",
      type: DataType.Text,
    },
    {
      name: "content",
      type: DataType.Text,
    },
    {
      name: "public_notes",
      type: DataType.Text,
    },
    {
      name: "public_notes_signature",
      type: DataType.Text,
    },
    {
      name: "broader_signature",
      type: DataType.Text,
    },
  ],
  get_credentials: [],
  get_credentials_shared_by_user: [
    {
      name: "user_id",
      type: DataType.Uuid,
    },
    {
      name: "encryptor_public_key",
      type: DataType.Text,
    },
  ],
  edit_public_notes_as_issuer: [
    {
      name: "public_notes_id",
      type: DataType.Text,
    },
    {
      name: "public_notes",
      type: DataType.Text,
    },
  ],
  remove_credential: [
    {
      name: "id",
      type: DataType.Uuid,
    },
  ],
  share_credential: [
    {
      name: "id",
      type: DataType.Uuid,
    },
    {
      name: "original_credential_id",
      type: DataType.Uuid,
    },
    {
      name: "public_notes",
      type: DataType.Text,
    },
    {
      name: "public_notes_signature",
      type: DataType.Text,
    },
    {
      name: "broader_signature",
      type: DataType.Text,
    },
    {
      name: "content",
      type: DataType.Text,
    },
    {
      name: "encryptor_public_key",
      type: DataType.Text,
    },
    {
      name: "issuer_auth_public_key",
      type: DataType.Text,
    },
    {
      name: "grantee_wallet_identifier",
      type: DataType.Text,
    },
    {
      name: "locked_until",
      type: DataType.Int,
    },
  ],
  create_credential_copy: [
    {
      name: "id",
      type: DataType.Uuid,
    },
    {
      name: "original_credential_id",
      type: DataType.Uuid,
    },
    {
      name: "public_notes",
      type: DataType.Text,
    },
    {
      name: "public_notes_signature",
      type: DataType.Text,
    },
    {
      name: "broader_signature",
      type: DataType.Text,
    },
    {
      name: "content",
      type: DataType.Text,
    },
    {
      name: "encryptor_public_key",
      type: DataType.Text,
    },
    {
      name: "issuer_auth_public_key",
      type: DataType.Text,
    },
  ],
  share_credential_through_dag: [
    {
      name: "id",
      type: DataType.Uuid,
    },
    {
      name: "user_id",
      type: DataType.Uuid,
    },
    {
      name: "issuer_auth_public_key",
      type: DataType.Text,
    },
    {
      name: "encryptor_public_key",
      type: DataType.Text,
    },
    {
      name: "content",
      type: DataType.Text,
    },
    {
      name: "public_notes",
      type: DataType.Text,
    },
    {
      name: "public_notes_signature",
      type: DataType.Text,
    },
    {
      name: "broader_signature",
      type: DataType.Text,
    },
    {
      name: "original_credential_id",
      type: DataType.Uuid,
    },
    {
      name: "dag_owner_wallet_identifier",
      type: DataType.Text,
    },
    {
      name: "dag_grantee_wallet_identifier",
      type: DataType.Text,
    },
    {
      name: "dag_locked_until",
      type: DataType.Int,
    },
    {
      name: "dag_signature",
      type: DataType.Text,
    },
  ],
  create_credentials_by_dwg: [
    {
      name: "issuer_auth_public_key",
      type: DataType.Text,
    },
    {
      name: "original_encryptor_public_key",
      type: DataType.Text,
    },
    {
      name: "original_credential_id",
      type: DataType.Uuid,
    },
    {
      name: "original_content",
      type: DataType.Text,
    },
    {
      name: "original_public_notes",
      type: DataType.Text,
    },
    {
      name: "original_public_notes_signature",
      type: DataType.Text,
    },
    {
      name: "original_broader_signature",
      type: DataType.Text,
    },
    {
      name: "copy_encryptor_public_key",
      type: DataType.Text,
    },
    {
      name: "copy_credential_id",
      type: DataType.Uuid,
    },
    {
      name: "copy_content",
      type: DataType.Text,
    },
    {
      name: "copy_public_notes_signature",
      type: DataType.Text,
    },
    {
      name: "copy_broader_signature",
      type: DataType.Text,
    },
    {
      name: "content_hash",
      type: DataType.Text,
    },
    {
      name: "dwg_owner",
      type: DataType.Text,
    },
    {
      name: "dwg_grantee",
      type: DataType.Text,
    },
    {
      name: "dwg_issuer_public_key",
      type: DataType.Text,
    },
    {
      name: "dwg_id",
      type: DataType.Uuid,
    },
    {
      name: "dwg_access_grant_timelock",
      type: DataType.Text,
    },
    {
      name: "dwg_not_before",
      type: DataType.Text,
    },
    {
      name: "dwg_not_after",
      type: DataType.Text,
    },
    {
      name: "dwg_signature",
      type: DataType.Text,
    },
  ],
  get_credential_owned: [
    {
      name: "id",
      type: DataType.Uuid,
    },
  ],
  get_credential_shared: [
    {
      name: "id",
      type: DataType.Uuid,
    },
  ],
  get_sibling_credential_id: [
    {
      name: "content_hash",
      type: DataType.Text,
    },
  ],
  add_attribute: [
    {
      name: "id",
      type: DataType.Uuid,
    },
    {
      name: "attribute_key",
      type: DataType.Text,
    },
    {
      name: "value",
      type: DataType.Text,
    },
  ],
  get_attributes: [],
  edit_attribute: [
    {
      name: "id",
      type: DataType.Uuid,
    },
    {
      name: "attribute_key",
      type: DataType.Text,
    },
    {
      name: "value",
      type: DataType.Text,
    },
  ],
  remove_attribute: [
    {
      name: "id",
      type: DataType.Uuid,
    },
  ],
  share_attribute: [
    {
      name: "id",
      type: DataType.Uuid,
    },
    {
      name: "original_attribute_id",
      type: DataType.Uuid,
    },
    {
      name: "attribute_key",
      type: DataType.Text,
    },
    {
      name: "value",
      type: DataType.Text,
    },
  ],
  dwg_message: [
    {
      name: "owner_wallet_identifier",
      type: DataType.Text,
    },
    {
      name: "grantee_wallet_identifier",
      type: DataType.Text,
    },
    {
      name: "issuer_public_key",
      type: DataType.Text,
    },
    {
      name: "id",
      type: DataType.Uuid,
    },
    {
      name: "access_grant_timelock",
      type: DataType.Text,
    },
    {
      name: "not_usable_before",
      type: DataType.Text,
    },
    {
      name: "not_usable_after",
      type: DataType.Text,
    },
  ],
  revoke_access_grant: [
    {
      name: "id",
      type: DataType.Uuid,
    },
  ],
  get_access_grants_owned: [
    {
      name: "id",
      type: DataType.Uuid,
    },
  ],
  get_access_grants_granted: [
    {
      name: "user_id",
      type: DataType.Uuid,
    },
    {
      name: "page",
      type: DataType.Int,
    },
    {
      name: "size",
      type: DataType.Int,
    },
  ],
  get_access_grants_granted_count: [
    {
      name: "user_id",
      type: DataType.Uuid,
    },
  ],
  has_locked_access_grants: [
    {
      name: "id",
      type: DataType.Uuid,
    },
  ],
  dag_message: [
    {
      name: "dag_owner_wallet_identifier",
      type: DataType.Text,
    },
    {
      name: "dag_grantee_wallet_identifier",
      type: DataType.Text,
    },
    {
      name: "dag_data_id",
      type: DataType.Uuid,
    },
    {
      name: "dag_locked_until",
      type: DataType.Int,
    },
    {
      name: "dag_content_hash",
      type: DataType.Text,
    },
  ],
  create_ag_by_dag_for_copy: [
    {
      name: "dag_owner_wallet_identifier",
      type: DataType.Text,
    },
    {
      name: "dag_grantee_wallet_identifier",
      type: DataType.Text,
    },
    {
      name: "dag_data_id",
      type: DataType.Uuid,
    },
    {
      name: "dag_locked_until",
      type: DataType.Int,
    },
    {
      name: "dag_content_hash",
      type: DataType.Text,
    },
    {
      name: "dag_signature",
      type: DataType.Text,
    },
  ],
  get_access_grants_for_credential: [
    {
      name: "credential_id",
      type: DataType.Uuid,
    },
  ],
  has_profile: [
    {
      name: "address",
      type: DataType.Text,
    },
  ],
};
