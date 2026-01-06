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
  token?: string;
}

export const login = async (requestBlob: string): Promise<LoginResponse> => {
  const response = await faceSignService.post<LoginResponse>(
    "/match",
    JSON.stringify({
      requestBlob,
      groupName: "jan-testing",
      externalUserId: "3423d432-96d6-494b-8bd3-4b1ec1c808fb",
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
    "/pinocchio-entropy",
    JSON.stringify({ token }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};
