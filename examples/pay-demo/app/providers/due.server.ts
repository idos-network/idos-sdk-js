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
  status: "pending" | "approved" | "rejected" | "passed";
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

  await response.json();
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
    console.error(`[Due#shareToken] Error ${response.status} (${response.statusText}):`, errorBody);

    throw new Error(
      `Failed to share token with due (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as ShareTokenResponse;
  return data;
};

export const getResubmissionInfo = async (
  submissionId: string,
  accountId: string,
): Promise<void> => {
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

export interface GetKycStatusResponse {
  externalLink: string;
  status: "pending" | "resubmission_required" | "passed" | "failed";
}

export const getKycStatus = async (accountId: string): Promise<GetKycStatusResponse> => {
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

// FX Quote interfaces and functions
export interface CreateFxQuoteRequest {
  currencyIn: string;
  currencyOut: string;
  amountIn?: number;
  amountOut?: number;
}

export interface FxQuoteResponse {
  quoteToken: string;
  source: {
    rail: string;
    currency: string;
    amount: string;
  };
  destination: {
    rail: string;
    currency: string;
    amount: string;
  };
  rate: string;
  expiresAt: string;
}

export const createFxQuote = async (
  accountId: string,
  request: CreateFxQuoteRequest,
): Promise<FxQuoteResponse> => {
  const EUR_CURRENCIES = ["EUR", "EURC"];
  const destinationRail = EUR_CURRENCIES.includes(request.currencyOut.toUpperCase())
    ? "sepa"
    : "ach";

  const response = await fetch(`${SERVER_ENV.DUE_API_URL}transfers/quote`, {
    method: "POST",
    headers: {
      "Due-Account-Id": accountId,
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.DUE_API_KEY}`,
    },
    body: JSON.stringify({
      source: {
        rail: "arbitrum",
        currency: request.currencyIn,
        amount: request.amountIn?.toString() ?? "0",
      },
      destination: {
        rail: destinationRail,
        currency: request.currencyOut,
        amount: request.amountOut?.toString() ?? "0",
      },
    }),
    // @ts-expect-error - Node.js specific option
    agent: new https.Agent({
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `[Due#createFxQuote] Error ${response.status} (${response.statusText}):`,
      errorBody,
    );

    throw new Error(
      `Failed to create FX quote (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as FxQuoteResponse;
  return data;
};

// Recipient interfaces and functions
export type CreateRecipientRequest =
  | {
      name: string;
      email?: string;
      country?: string;
      details: {
        schema: "bank_us";
        accountType: "individual" | "business";
        bankName: string; // Required per Due API documentation
        accountName?: string; // Optional per Due API documentation
        accountNumber: string;
        routingNumber: string;
        firstName?: string; // Required if accountType is "individual"
        lastName?: string; // Required if accountType is "individual"
        companyName?: string; // Required if accountType is "business"
        bankAddress?: string; // Optional per Due API documentation
        routingNumberACH?: string; // Optional per Due API documentation
        routingNumberWire?: string; // Optional per Due API documentation
        routingNumberRTP?: string; // Optional per Due API documentation
        beneficiaryAddress: {
          street_line_1: string;
          street_line_2?: string;
          city: string;
          state?: string; // Optional per Due API documentation, ISO3166-2 format: "US-XX"
          postal_code: string;
          country: string; // ISO3166-1 alpha-3: "USA"
        };
      };
      isExternal: boolean;
    }
  | {
      name: string;
      details: {
        schema: "bank_sepa";
        accountType: "individual" | "business";
        firstName?: string; // Required if accountType is "individual"
        lastName?: string; // Required if accountType is "individual"
        companyName?: string; // Required if accountType is "business"
        IBAN: string; // Uppercase IBAN per Due API documentation
      };
      isExternal: boolean;
    };

export interface RecipientResponse {
  id: string;
  name?: string;
  details: CreateRecipientRequest["details"];
  isExternal: boolean;
  createdAt: string;
}

export const createRecipient = async (
  accountId: string,
  request: CreateRecipientRequest,
): Promise<RecipientResponse> => {
  const response = await fetch(`${SERVER_ENV.DUE_API_URL}recipients`, {
    method: "POST",
    headers: {
      "Due-Account-Id": accountId,
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.DUE_API_KEY}`,
    },
    body: JSON.stringify(request),
    // @ts-expect-error - Node.js specific option
    agent: new https.Agent({
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `[Due#createRecipient] Error ${response.status} (${response.statusText}):`,
      errorBody,
    );

    throw new Error(
      `Failed to create recipient (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as RecipientResponse;
  return data;
};

// Transfer interfaces and functions
export interface CreateTransferRequest {
  quote: string;
  recipient: string;
  memo?: string;
}

export interface TransferResponse {
  id: string;
  status: string;
  source: {
    rail: string;
    currency: string;
    amount: string;
  };
  destination: {
    rail: string;
    currency: string;
    amount: string;
  };
  recipient: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const createTransfer = async (
  accountId: string,
  request: CreateTransferRequest,
): Promise<TransferResponse> => {
  const response = await fetch(`${SERVER_ENV.DUE_API_URL}transfers`, {
    method: "POST",
    headers: {
      "Due-Account-Id": accountId,
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.DUE_API_KEY}`,
    },
    body: JSON.stringify(request),
    // @ts-expect-error - Node.js specific option
    agent: new https.Agent({
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `[Due#createTransfer] Error ${response.status} (${response.statusText}):`,
      errorBody,
    );

    throw new Error(
      `Failed to create transfer (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as TransferResponse;
  return data;
};

export const getTransfer = async (
  accountId: string,
  transferId: string,
): Promise<TransferResponse> => {
  const response = await fetch(`${SERVER_ENV.DUE_API_URL}transfers/${transferId}`, {
    method: "GET",
    headers: {
      "Due-Account-Id": accountId,
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
      `[Due#getTransfer] Error ${response.status} (${response.statusText}):`,
      errorBody,
    );

    throw new Error(
      `Failed to get transfer (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as TransferResponse;
  return data;
};

// Funding address interfaces and functions
export interface CreateFundingAddressRequest {
  transfer: string;
}

export interface FundingAddressResponse {
  address: string;
  chain: string;
  currency: string;
  transfer: {
    id: string;
  };
}

export const createFundingAddress = async (
  accountId: string,
  request: CreateFundingAddressRequest,
): Promise<FundingAddressResponse> => {
  const response = await fetch(`${SERVER_ENV.DUE_API_URL}transfers/funding-address`, {
    method: "POST",
    headers: {
      "Due-Account-Id": accountId,
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.DUE_API_KEY}`,
    },
    body: JSON.stringify(request),
    // @ts-expect-error - Node.js specific option
    agent: new https.Agent({
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `[Due#createFundingAddress] Error ${response.status} (${response.statusText}):`,
      errorBody,
    );

    throw new Error(
      `Failed to create funding address (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as FundingAddressResponse;
  return data;
};
