"use server";

import { base64Decode, hexDecode } from "@idos-network/codecs";
import { idOSGrantee } from "@idos-network/grantee-sdk-js";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

export async function invokePassportingService(payload: {
  dag_owner_wallet_identifier: string;
  dag_grantee_wallet_identifier: string;
  dag_data_id: string;
  dag_locked_until: number;
  dag_content_hash: string;
  dag_signature: string;
}) {
  const serviceUrl = process.env.PASSPORTING_SERVICE_URL;
  const serviceApiKey = process.env.PASSPORTING_SERVICE_API_KEY;

  invariant(serviceUrl, "PASSPORTING_SERVICE_URL is not set");
  invariant(serviceApiKey, "PASSPORTING_SERVICE_API_KEY is not set");

  // Call the passporting service to transmit the DAG
  const response = await fetch(serviceUrl, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${serviceApiKey}`,
      "Content-Type": "application/json",
    },
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  // Initialize the idOS Grantee SDK
  const NODE_URL = process.env.NEXT_PUBLIC_KWIL_NODE_URL;
  const ENCRYPTION_SECRET_KEY = process.env.GRANTEE_ENCRYPTION_SECRET_KEY;
  const SIGNING_SECRET_KEY = process.env.GRANTEE_SIGNING_SECRET_KEY;

  invariant(NODE_URL, "NEXT_PUBLIC_KWIL_NODE_URL is not set");
  invariant(ENCRYPTION_SECRET_KEY, "GRANTEE_ENCRYPTION_SECRET_KEY is not set");
  invariant(SIGNING_SECRET_KEY, "GRANTEE_SIGNING_SECRET_KEY is not set");

  const grantee = await idOSGrantee.init({
    nodeUrl: NODE_URL,
    granteeSigner: nacl.sign.keyPair.fromSecretKey(hexDecode(SIGNING_SECRET_KEY)),
    recipientEncryptionPrivateKey: ENCRYPTION_SECRET_KEY,
  });

  // @todo: handle errors.

  const credential = await grantee.getReusableCredentialCompliantly(payload.dag_data_id);

  return credential;
}
