"use server";

import { idOSGrantee } from "@/grantee.config";

import invariant from "tiny-invariant";

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

  const grantee = await idOSGrantee();
  const credential = await grantee.getReusableCredentialCompliantly(payload.dag_data_id);
  // @todo: handle errors when the prior method fails.

  return credential;
}
