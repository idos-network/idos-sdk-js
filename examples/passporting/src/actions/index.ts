"use server";

import { idOSConsumer } from "@/consumer.config";
import { base64Encode, hexDecode, hexEncode } from "@idos-network/core";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

export async function invokePassportingService(
  url: string,
  payload: {
    dag_owner_wallet_identifier: string;
    dag_grantee_wallet_identifier: string;
    dag_data_id: string;
    dag_locked_until: number;
    dag_content_hash: string;
    dag_signature: string;
  },
) {
  const serviceApiKey = process.env.PASSPORTING_SERVICE_API_KEY;
  const consumerSigningSecretKey = process.env.CONSUMER_SIGNING_SECRET_KEY;

  invariant(serviceApiKey, "`PASSPORTING_SERVICE_API_KEY` is not set");
  invariant(consumerSigningSecretKey, "`CONSUMER_SIGNING_SECRET_KEY` is not set");

  // sign a message using the consumer's signing key
  const message = JSON.stringify(payload);
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, hexDecode(consumerSigningSecretKey));

  const consumerSigningPublicKey = hexEncode(
    nacl.sign.keyPair.fromSecretKey(hexDecode(consumerSigningSecretKey)).publicKey,
  );

  // Call the passporting service to transmit the DAG
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      signature: base64Encode(signature),
      message: base64Encode(messageBytes),
    }),
    headers: {
      Authorization: `Bearer ${consumerSigningPublicKey}`,
      "Content-Type": "application/json",
    },
  });

  const result = await response.json();

  if (result.error) {
    console.dir(result.error, { depth: null });
    throw new Error(result.error);
  }

  const consumer = await idOSConsumer();

  const credential = await consumer.getReusableCredentialCompliantly(payload.dag_data_id);
  // @todo: handle errors when the prior method fails.

  return credential;
}
