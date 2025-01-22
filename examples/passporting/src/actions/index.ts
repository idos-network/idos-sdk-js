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
  let credential = null;

  const serviceUrl = process.env.PASSPORTING_SERVICE_URL;
  const serviceApiKey = process.env.PASSPORTING_SERVICE_API_KEY;

  invariant(serviceUrl, "PASSPORTING_SERVICE_URL is not set");
  invariant(serviceApiKey, "PASSPORTING_SERVICE_API_KEY is not set");

  // check if there's an existing credential id for the intended DAG
  const credentialId = await getCredentialIdByHash(payload.dag_content_hash);

  // get credential by it's id
  credential = await getCredentialByGrant(credentialId!);
  const isValidCred = await validateCredentialByAG(credentialId!);
  if (credential) return { credential, isValidCred };

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
  credential = getCredentialByGrant(response.dag_data_id);

  const isValid = await validateCredentialByAG(payload.dag_data_id);
  if (!isValid) throw new Error("Credential is not valid");

  return credential;
}

const getCredentialByGrant = async (dataId: string) => {
  const granteeSdk = await createGranteeSdkInstance();
  return await granteeSdk.getSharedCredentialFromIDOS(dataId);
};

const getCredentialIdByHash = async (contentHash: string) => {
  const granteeSdk = await createGranteeSdkInstance();
  return await granteeSdk.getCredentialIdByContentHash(contentHash);
};

const validateCredentialByAG = async (dataId: string) => {
  const granteeSdk = await createGranteeSdkInstance();
  return await granteeSdk.validateCredentialByAG(dataId);
};
