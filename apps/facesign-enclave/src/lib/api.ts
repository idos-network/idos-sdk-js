import axios from "axios";
import { env } from "../env";

const faceSignService = axios.create({
  baseURL: env.VITE_FACESIGN_SERVICE_URL,
  timeout: 10000,
});

const entropyService = axios.create({
  baseURL: env.VITE_ENTROPY_SERVICE_URL,
  timeout: 10000,
});

export interface FaceSignResponse {
  responseBlob: string;
  success: boolean;
  didError?: boolean;
  result: {
    livenessProven: boolean;
    ageV2GroupEnumInt: number;
  };
  error: boolean;
  faceSignUserId: string;
}

export interface LoginResponse extends FaceSignResponse {
  userAttestmentToken: string;
}

export interface NewUserResponse extends FaceSignResponse {
  newUserConfirmationToken: string;
}

export interface ConfirmUserResponse {
  userAttestmentToken: string;
  faceSignUserId: string;
}

export function isLoginResponse(
  response: LoginResponse | NewUserResponse,
): response is LoginResponse {
  return "userAttestmentToken" in response;
}

export function isNewUserResponse(
  response: LoginResponse | NewUserResponse,
): response is NewUserResponse {
  return "newUserConfirmationToken" in response;
}

export async function login(requestBlob: string): Promise<LoginResponse | NewUserResponse> {
  const response = await faceSignService.post<LoginResponse | NewUserResponse>(
    "/facesign",
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
}

export async function confirmNewUser(
  newUserConfirmationToken: string,
): Promise<ConfirmUserResponse> {
  const response = await faceSignService.post<ConfirmUserResponse>(
    "/facesign/confirmation",
    JSON.stringify({
      newUserConfirmationToken,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}

export async function getEntropy(
  token: string,
): Promise<{ entropy: string; faceSignUserId: string }> {
  const response = await entropyService.post<{ entropy: string; faceSignUserId: string }>(
    "/facesign/entropy",
    JSON.stringify({ token }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}
