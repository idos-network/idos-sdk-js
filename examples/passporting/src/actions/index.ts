"use server";

import type { idOSCredential } from "@idos-network/core";
import invariant from "tiny-invariant";

// Configuration helper
const getConfig = () => {
  const serviceUrl = process.env.PASSPORTING_SERVICE_URL;
  const serviceApiKey = process.env.PASSPORTING_SERVICE_API_KEY;

  invariant(serviceUrl, "PASSPORTING_SERVICE_URL is not set");
  invariant(serviceApiKey, "PASSPORTING_SERVICE_API_KEY is not set");

  return { serviceUrl, serviceApiKey };
};

// Reusable fetch helper
async function fetchFromService<T>(url: string, options: RequestInit): Promise<T> {
  const { serviceApiKey } = getConfig();

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${serviceApiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const result = await response.json();

  if (result.error) {
    throw new Error(result.error || "Unknown error occurred");
  }

  return result;
}

export async function invokePassportingService(payload: {
  dag_owner_wallet_identifier: string;
  dag_grantee_wallet_identifier: string;
  dag_data_id: string;
  dag_locked_until: number;
  dag_content_hash: string;
  dag_signature: string;
}) {
  const { serviceUrl } = getConfig();

  // Transmit DAG
  const result = await fetchFromService<{ dag_data_id: string }>(serviceUrl, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // Get credential
  const { credential } = await fetchFromService<{ credential: idOSCredential }>(
    `${serviceUrl}/mos-endpoint`,
    {
      method: "POST",
      body: JSON.stringify({ dag_data_id: result.dag_data_id }),
    },
  );

  return credential;
}
