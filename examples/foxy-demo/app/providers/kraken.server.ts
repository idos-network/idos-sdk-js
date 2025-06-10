import https from "node:https";
import jwt from "jsonwebtoken";
import { COMMON_ENV } from "./envFlags.common";
import { SERVER_ENV } from "./envFlags.server";

export const fetchSharedToken = async (applicantId: string) => {
  const response = await fetch(
    `${SERVER_ENV.KRAKEN_API_URL}/public/kyc/${applicantId}/sharedToken?forClientId=transak`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${await getKrakenToken()}`,
      },
      // @ts-ignore - Node.js specific option
      agent: new https.Agent({
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined, // This will bypass the certificate chain verification
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch shared token (${response.statusText}).`);
  }

  const data = await response.json();
  return data.token;
};

export const generateKrakenUrl = async () => {
  const payload = {
    clientId: SERVER_ENV.KRAKEN_CLIENT_ID,
    kyc: true,
    level: COMMON_ENV.KRAKEN_LEVEL,
    state: Date.now().toString(),
  };

  const token = jwt.sign(payload, SERVER_ENV.KRAKEN_PRIVATE_KEY, { algorithm: "ES512" });

  return `${SERVER_ENV.KRAKEN_API_URL}/kyc?token=${token}`;
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
