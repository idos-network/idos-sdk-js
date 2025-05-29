"use server";

import invariant from "tiny-invariant";

import { idOSConsumer } from "@/consumer.config";

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

  invariant(serviceApiKey, "`PASSPORTING_SERVICE_API_KEY` is not set");

  // Call the passporting service to transmit the DAG
  const response = await fetch(url, {
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

  const consumer = await idOSConsumer();
  const credential = await consumer.getReusableCredentialCompliantly(payload.dag_data_id);
  // @todo: handle errors when the prior method fails.

  return credential;
}
