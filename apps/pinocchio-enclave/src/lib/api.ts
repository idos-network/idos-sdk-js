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

export interface LoginResponse {
  responseBlob: string;
  success: boolean;
  didError?: boolean;
  result: {
    livenessProven: boolean;
    ageV2GroupEnumInt: number;
  };
  error: boolean;

  faceSignUserId?: string;

  // User match (already onboarded)
  entropyToken?: string;

  // New user - ask in UI to confirm account creation, then call confirmNewUser with the confirmationToken
  confirmationToken?: string;
}

export interface ConfirmUserResponse {
  faceSignUserId: string;
  entropyToken: string;
}

export const login = async (requestBlob: string): Promise<LoginResponse> => {
  const response = await faceSignService.post<LoginResponse>(
    "/facesign-wallet",
    JSON.stringify({
      requestBlob,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

export const confirmNewUser = async (confirmationToken: string): Promise<ConfirmUserResponse> => {
  const response = await faceSignService.post<ConfirmUserResponse>(
    "/facesign-wallet/confirmation",
    JSON.stringify({
      confirmationToken,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

export const getEntropy = async (
  token: string,
): Promise<{ entropy: string; faceSignUserId: string }> => {
  const response = await entropyService.post<{ entropy: string; faceSignUserId: string }>(
    "/facesign-wallet/entropy",
    JSON.stringify({ token }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};
