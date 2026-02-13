import https from "node:https";
import { SERVER_ENV } from "./envFlags.server";

export interface CreateAccountRequest {
  type: string;
  category: string;
  name: string;
  email: string;
  country: string;
}

export interface StatusLogEntry {
  status: string;
  timestamp: string;
  reason: string;
}

export interface KycInfo {
  status: "pending" | "approved" | "rejected";
  link: string;
}

export interface TosDocumentLinks {
  tos: string;
  privacyPolicy: string;
}

export interface TosInfo {
  id: string;
  entityName: string;
  status: "accepted" | "pending" | "rejected";
  link: string;
  documentLinks: TosDocumentLinks;
  acceptedAt: string;
  token: string;
}

export interface CreateAccountResponse {
  id: string;
  type: string;
  name: string;
  email: string;
  country: string;
  category: string;
  status: string;
  statusLog: StatusLogEntry[];
  kyc: KycInfo;
  tos: TosInfo;
}

export const createAccount = async (
  request: CreateAccountRequest,
): Promise<CreateAccountResponse> => {
  const response = await fetch(`${SERVER_ENV.DUE_API_URL}accounts`, {
    method: "POST",
    body: JSON.stringify(request),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.DUE_API_KEY}`,
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
      `[Due#createAccount] Error ${response.status} (${response.statusText}):`,
      errorBody,
    );

    throw new Error(
      `Failed to create account (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as CreateAccountResponse;
  return data;
};

export const getAccount = async (accountId: string): Promise<CreateAccountResponse> => {
  const response = await fetch(`${SERVER_ENV.DUE_API_URL}accounts/${accountId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.DUE_API_KEY}`,
    },
    // @ts-expect-error - Node.js specific option
    agent: new https.Agent({
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[Due#getAccount] Error ${response.status} (${response.statusText}):`, errorBody);

    throw new Error(
      `Failed to get account (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as CreateAccountResponse;
  return data;
};

export const confirmTos = async (token: string, ipAddress: string): Promise<void> => {
  const response = await fetch(`${SERVER_ENV.DUE_API_URL}tos/${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.DUE_API_KEY}`,
    },
    body: JSON.stringify({
      ipAddress,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[Due#confirmTos] Error ${response.status} (${response.statusText}):`, errorBody);

    throw new Error(
      `Failed to confirm TOS (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as any;
  return data;
};

export interface ShareTokenResponse {
  status: string;
  submissionId: string;
}

export const shareToken = async (
  accountId: string,
  shareToken: string,
): Promise<ShareTokenResponse> => {
  const response = await fetch(`${SERVER_ENV.DUE_API_URL}kyc/sharing/sumsub`, {
    method: "POST",
    headers: {
      "Due-Account-Id": accountId,
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.DUE_API_KEY}`,
    },
    body: JSON.stringify({
      shareToken,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[Due#confirmTos] Error ${response.status} (${response.statusText}):`, errorBody);

    throw new Error(
      `Failed to confirm TOS (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as ShareTokenResponse;
  return data;
};

export const getResubmissionInfo = async (
  submissionId: string,
  accountId: string,
): Promise<void> => {
  console.log(`[Due#getResubmissionInfo] Getting resubmission info for submission ${submissionId}`);

  const response = await fetch(`${SERVER_ENV.DUE_API_URL}kyc/submissions/${submissionId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Due-Account-Id": accountId,
      Authorization: `Bearer ${SERVER_ENV.DUE_API_KEY}`,
    },
  });

  return response.json();
};

export interface GetLinkResponse {
  externalLink: string;
}

export const getLink = async (accountId: string): Promise<GetLinkResponse> => {
  const response = await fetch(`${SERVER_ENV.DUE_API_URL}kyc`, {
    method: "GET",
    headers: {
      "Due-Account-Id": accountId,
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.DUE_API_KEY}`,
    },
  });

  return response.json();
};
