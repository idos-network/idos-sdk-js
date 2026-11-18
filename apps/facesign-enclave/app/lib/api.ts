import axios, { type AxiosInstance } from "axios";

import { getConfig } from "@/config";

let clients: { faceSign: AxiosInstance; entropy: AxiosInstance } | undefined;

// Created on first use, in the browser, from the page's own configuration (see config.ts).
function services() {
  if (!clients) {
    const config = getConfig();
    clients = {
      faceSign: axios.create({ baseURL: config.facesignServiceUrl, timeout: 10000 }),
      entropy: axios.create({ baseURL: config.entropyServiceUrl, timeout: 10000 }),
    };
  }
  return clients;
}

export interface FaceSignResponse {
  responseBlob: string;
  success: boolean;
  didError?: boolean;
  result: {
    livenessProven: boolean;
    ageV2GroupEnumInt: number;
  };
  error: boolean;
  userId: string;
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
  const response = await services().faceSign.post<LoginResponse | NewUserResponse>(
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

  // Store the userId in local storage
  localStorage.setItem("faceSignUserId", response.data.userId);

  return response.data;
}

export async function confirmNewUser(
  newUserConfirmationToken: string,
): Promise<ConfirmUserResponse> {
  const response = await services().faceSign.post<ConfirmUserResponse>(
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

export async function getEntropy(token: string): Promise<{ entropy: string }> {
  const response = await services().entropy.post<{ entropy: string }>(
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
