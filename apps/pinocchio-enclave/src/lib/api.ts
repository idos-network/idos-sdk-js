import axios from "axios";
import { env } from "../env.js";

const faceSignService = axios.create({
  // biome-ignore lint/style/noNonNullAssertion: This is fine
  baseURL: env.VITE_FACESIGN_SERVICE_URL!,
  timeout: 10000,
});

const entropyService = axios.create({
  // biome-ignore lint/style/noNonNullAssertion: This is fine
  baseURL: env.VITE_ENTROPY_SERVICE_URL!,
  timeout: 10000,
});

export const getSessionToken = async (deviceIdentifier: string): Promise<string> => {
  const response = await faceSignService.post<{ sessionToken: string }>(
    "/session-token",
    JSON.stringify({
      key: env.VITE_FACETEC_DEVICE_KEY_IDENTIFIER,
      deviceIdentifier,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.sessionToken;
};

export const getPublicKey = async (): Promise<string> => {
  const response = await faceSignService.get<string>("/sdk/public-key");
  return response.data;
};

export const getEntropy = async (
  token: string,
): Promise<{ entropy: string; faceSignUserId: string }> => {
  const response = await entropyService.post<{ entropy: string; faceSignUserId: string }>(
    "/entropy",
    JSON.stringify({ token }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};
