"use server";
import { createGranteeSdkInstance } from "@/grantee.config";
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
  }).then((res) => res.json());
  // POST DAG creation
  if (response.success === false) throw new Error(response.error.message);
}

export const hasReusableCredential = async (credentialHash: string) => {
  const granteeSdk = await createGranteeSdkInstance();
  return granteeSdk.getReusableCredentialCompliantly(credentialHash);
};
