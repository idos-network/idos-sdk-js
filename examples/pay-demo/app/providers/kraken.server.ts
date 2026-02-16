import https from "node:https";
import jwt from "jsonwebtoken";
import { COMMON_ENV } from "./envFlags.common";
import { SERVER_ENV } from "./envFlags.server";

export type SharedTokenResponse = {
  id: string;
  kycStatus: string;
  token: string;
  forClientId: string;
};

export const fetchSharedToken = async (
  credentialId: string,
  forClientId: string,
): Promise<SharedTokenResponse> => {
  const response = await fetch(`${SERVER_ENV.KRAKEN_API_URL}/public/kyc/sharedToken`, {
    method: "POST",
    body: JSON.stringify({
      credentialId,
      forClientId,
      skipCheck: false,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await getKrakenToken()}`,
    },
    // @ts-expect-error - Node.js specific option
    agent: new https.Agent({
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `[fetchSharedToken] Error ${response.status} (${response.statusText}):`,
      errorBody,
    );
    throw new Error(
      `Failed to fetch shared token (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as SharedTokenResponse;
  return data;
};

export const fetchCredentialStatus = async (credentialId: string): Promise<SharedTokenResponse> => {
  const response = await fetch(
    `${SERVER_ENV.KRAKEN_API_URL}/public/kyc/sharedToken/${credentialId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${await getKrakenToken()}`,
      },
      // @ts-expect-error - Node.js specific option
      agent: new https.Agent({
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[fetchCredentialStatus] Error ${response.status}:`, errorBody);
    throw new Error(
      `Failed to get credential status (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  return (await response.json()) as SharedTokenResponse;
};

export const generateKrakenUrl = async (type: string, walletAddress: string) => {
  const payload = {
    clientId: SERVER_ENV.KRAKEN_CLIENT_ID,
    kyc: true,
    level: `${COMMON_ENV.KRAKEN_LEVEL}+idos`,
    state: Date.now().toString(),
  };

  const token = jwt.sign(payload, SERVER_ENV.KRAKEN_PRIVATE_KEY, { algorithm: "ES512" });

  return `${SERVER_ENV.KRAKEN_API_URL}/kyc?token=${token}&provider=${type}&walletAddress=${encodeURIComponent(walletAddress)}`;
};

export async function getKrakenToken(): Promise<string> {
  const payload = {
    api: true,
    clientId: SERVER_ENV.KRAKEN_CLIENT_ID,
  };

  return jwt.sign(payload, SERVER_ENV.KRAKEN_PRIVATE_KEY, {
    algorithm: "ES512",
    expiresIn: "600s",
  });
}
