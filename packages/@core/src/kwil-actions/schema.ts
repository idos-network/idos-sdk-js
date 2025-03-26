export const actionSchema: Record<string, string[]> = {
  add_user_as_inserter: ["id", "recipient_encryption_public_key"],
  update_user_pub_key_as_inserter: ["id", "recipient_encryption_public_key"],
  get_user: [],
  get_user_as_inserter: ["id"],

  upsert_wallet_as_inserter: [
    "id",
    "user_id",
    "address",
    "public_key",
    "wallet_type",
    "message",
    "signature",
  ],
  add_wallet: ["id", "address", "public_key", "message", "signature"],
  get_wallets: [],
  remove_wallet: ["id"],
  upsert_credential_as_inserter: [
    "id",
    "user_id",
    "issuer_auth_public_key",
    "encryptor_public_key",
    "content",
    "public_notes",
    "public_notes_signature",
    "broader_signature",
  ],
  add_credential: [
    "id",
    "issuer_auth_public_key",
    "encryptor_public_key",
    "content",
    "public_notes",
    "public_notes_signature",
    "broader_signature",
  ],
  get_credentials: [],
  get_credentials_shared_by_user: ["user_id", "encryptor_public_key"],
  edit_public_notes_as_issuer: ["public_notes_id"],
  remove_credential: ["id"],
  share_credential: [
    "id",
    "original_credential_id",
    "public_notes",
    "public_notes_signature",
    "broader_signature",
    "content",
    "encryptor_public_key",
    "issuer_auth_public_key",
    "grantee_wallet_identifier",
    "locked_until",
  ],
  create_credential_copy: [
    "id",
    "original_credential_id",
    "public_notes",
    "public_notes_signature",
    "broader_signature",
    "content",
    "encryptor_public_key",
    "issuer_auth_public_key",
  ],
  share_credential_through_dag: [
    "id",
    "user_id",
    "issuer_auth_public_key",
    "encryptor_public_key",
    "content",
    "public_notes",
    "public_notes_signature",
    "broader_signature",
    "original_credential_id",
    "dag_owner_wallet_identifier",
    "dag_grantee_wallet_identifier",
    "dag_locked_until",
    "dag_signature",
  ],
  create_credentials_by_dwg: [
    "issuer_auth_public_key",
    "original_encryptor_public_key",
    "original_credential_id",
    "original_content",
    "original_public_notes",
    "original_public_notes_signature",
    "original_broader_signature",
    "copy_encryptor_public_key",
    "copy_credential_id",
    "copy_content",
    "copy_public_notes_signature",
    "copy_broader_signature",
    "content_hash",
    "dwg_owner",
    "dwg_grantee",
    "dwg_issuer_public_key",
    "dwg_id",
    "dwg_access_grant_timelock",
    "dwg_not_before",
    "dwg_not_after",
    "dwg_signature",
  ],
  get_credential_owned: ["id"],

  get_credential_shared: ["id"],
  get_sibling_credential_id: ["content_hash"],
  add_attribute: ["id", "attribute_key", "value"],
  get_attributes: [],
  edit_attribute: ["id", "attribute_key", "value"],
  remove_attribute: ["id"],
  share_attribute: ["id", "original_attribute_id", "attribute_key", "value"],
  dwg_message: [
    "owner_wallet_identifier",
    "grantee_wallet_identifier",
    "issuer_public_key",
    "id",
    "access_grant_timelock",
    "not_usable_before",
    "not_usable_after",
  ],
  revoke_access_grant: ["id"],
  get_access_grants_owned: ["id"],
  get_access_grants_granted: ["user_id", "page", "size"],
  get_access_grants_granted_count: ["user_id"],
  has_locked_access_grants: ["id"],
  dag_message: [
    "dag_owner_wallet_identifier",
    "dag_grantee_wallet_identifier",
    "dag_data_id",
    "dag_locked_until",
    "dag_content_hash",
  ],
  create_ag_by_dag_for_copy: [
    "dag_owner_wallet_identifier",
    "dag_grantee_wallet_identifier",
    "dag_data_id",
    "dag_locked_until",
    "dag_content_hash",
    "dag_signature",
  ],
  get_access_grants_for_credential: ["credential_id"],

  has_profile: ["address"],
};
