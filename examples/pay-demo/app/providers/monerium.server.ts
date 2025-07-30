import type { Credentials } from "@idos-network/consumer";
// @ts-expect-error
import ascii85 from "ascii85";
import { SERVER_ENV } from "./envFlags.server";
import { generateCodeChallenge } from "./utils";

export const getClientToken = async () => {
  const params = new URLSearchParams();
  params.set("grant_type", "client_credentials");
  params.set("client_id", SERVER_ENV.MONERIUM_CLIENT_ID);
  params.set("client_secret", SERVER_ENV.MONERIUM_CLIENT_SECRET);

  const response = await fetch(`${SERVER_ENV.MONERIUM_API_URL}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    console.error(response);
    throw new Error("Failed to get client token");
  }

  return await response.json().then((data) => data.access_token);
};

export const createUser = async (data: Credentials) => {
  if (!data.credentialSubject.email) {
    // Email is required, so you have to go to the auth page
    throw new Error("Email is required");
  }

  const clientToken = await getClientToken();

  const response = await fetch(`${SERVER_ENV.MONERIUM_API_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.monerium.api-v2+json",
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      email: data.credentialSubject.email,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create user, user already exists. Continue to auth page.");
  }

  const userData = await response.json();

  return userData.profile;
};

export const getTokenFromCode = async (code: string, codeVerifier: string, url: URL) => {
  // Cleanup URL
  const returnUrl = new URL(SERVER_ENV.MONERIUM_FORCE_BACK_URL ?? url.toString());
  returnUrl.pathname = "/callbacks/monerium";
  returnUrl.search = "";
  returnUrl.hash = "";

  const params = new URLSearchParams();
  params.set("client_id", SERVER_ENV.MONERIUM_AUTH_CODE_FLOW);
  params.set("code", code);
  params.set("redirect_uri", returnUrl.toString());
  params.set("grant_type", "authorization_code");
  params.set("code_verifier", codeVerifier);

  const response = await fetch(`${SERVER_ENV.MONERIUM_API_URL}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Response error: ", response, text);
    throw new Error("Failed to get client token");
  }

  return await response.json().then((data) => ({
    token: data.access_token,
    profileId: data.profile,
  }));
};

export interface CreateProfileRequest {
  personal: Personal;
}

export interface Personal {
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  countryState: string;
  nationality: string;
  birthday: string;
  idDocument: IdDocument;
}

export interface IdDocument {
  number: string;
  kind: string;
}

export const createProfile = async (profileId: string, data: Credentials) => {
  const apiToken = await getClientToken();

  const personal: Personal = {
    firstName: data.credentialSubject.firstName,
    lastName: data.credentialSubject.familyName,
    // biome-ignore lint/style/noNonNullAssertion: This is ok, we are choosing plus+liveness
    address: data.credentialSubject.residentialAddressStreet!,
    // biome-ignore lint/style/noNonNullAssertion: This is ok, we are choosing plus+liveness
    postalCode: data.credentialSubject.residentialAddressPostalCode!,
    // biome-ignore lint/style/noNonNullAssertion: This is ok, we are choosing plus+liveness
    city: data.credentialSubject.residentialAddressCity!,
    // biome-ignore lint/style/noNonNullAssertion: This is ok, we are choosing plus+liveness
    country: data.credentialSubject.residentialAddressCountry!,
    // biome-ignore lint/style/noNonNullAssertion: This is ok, we are choosing plus+liveness
    countryState: data.credentialSubject.residentialAddressState!,
    nationality: data.credentialSubject.nationality ?? "DE", // TODO: Check this out
    birthday: data.credentialSubject.dateOfBirth?.split("T")[0],
    idDocument: {
      number: data.credentialSubject.idDocumentNumber,
      kind: data.credentialSubject.idDocumentType.toLowerCase(),
    },
  };

  const response = await fetch(`${SERVER_ENV.MONERIUM_API_URL}/profiles/${profileId}/details`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.monerium.api-v2+json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ personal }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Response error: ", response, text);

    // This is ok, we are creating the profile
    if (!text.includes("already exists")) {
      throw new Error("Failed to create profile");
    }
  }

  await Promise.all([
    uploadFile(
      profileId,
      apiToken,
      data.credentialSubject.idDocumentFrontFile,
      "idDocument",
      "front",
    ),
    uploadFile(
      profileId,
      apiToken,
      data.credentialSubject.idDocumentBackFile,
      "idDocument",
      "back",
    ),
    uploadFile(profileId, apiToken, data.credentialSubject.selfieFile, "facialSimilarity"),
    uploadFile(
      profileId,
      apiToken,
      data.credentialSubject.proofOfResidencyFile,
      "proofOfResidency",
    ),
  ]);

  return true;
};

export const uploadFile = async (
  profileId: string,
  apiToken: string,
  base85file: string,
  kind: "idDocument" | "facialSimilarity" | "proofOfResidency",
  side: "front" | "back" = "front",
) => {
  if (!base85file) return;

  // Decode base85 file and get the type
  const decodedFile = ascii85.decode(base85file);
  if (!decodedFile) {
    throw new Error("Failed to decode file");
  }

  const formData = new FormData();
  formData.append("file", new Blob([decodedFile]));

  const response = await fetch(`${SERVER_ENV.MONERIUM_API_URL}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Response error: ", response, text);
    throw new Error("Failed to upload file");
  }

  const file = await response.json();
  const fileId = file.id;

  if (!fileId) {
    throw new Error(`Failed to get file id for ${profileId}, ${kind}, ${side}`);
  }

  const verificationResponse = await fetch(
    `${SERVER_ENV.MONERIUM_API_URL}/profiles/${profileId}/verifications`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        personal: [
          {
            kind,
            documents: [
              {
                fileId,
                side,
                name: `${kind}-${side}`,
              },
            ],
          },
        ],
      }),
    },
  );

  if (!verificationResponse.ok) {
    const text = await verificationResponse.text();

    // This is ok for sandbox
    if (
      !text.includes("Submitting verifications is not required") &&
      SERVER_ENV.MONERIUM_API_URL.includes("dev")
    ) {
      console.error("Response error: ", verificationResponse, text);
      throw new Error("Failed to create verification");
    }
  }

  return true;
};

export const statusAndIban = async (profileId: string) => {
  const apiToken = await getClientToken();

  const response = await fetch(`${SERVER_ENV.MONERIUM_API_URL}/profiles/${profileId}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/vnd.monerium.api-v2+json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Response error: ", response, text);
    throw new Error("Failed to get profile status");
  }

  const state = await response.json().then((data) => data.state);

  if (state !== "approved") {
    return {
      state,
      ibans: [],
    };
  }

  const ibanResponse = await fetch(`${SERVER_ENV.MONERIUM_API_URL}/ibans?profile=${profileId}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/vnd.monerium.api-v2+json",
    },
  });

  if (!ibanResponse.ok) {
    console.error("Response error: ", ibanResponse);
    throw new Error("Failed to get ibans");
  }

  const ibans = await ibanResponse.json().then((data) => data.ibans);

  return {
    state,
    ibans,
  };
};

export const auth = async (data: Credentials, url: URL) => {
  // Generate PKCE code verifier and challenge
  const { codeChallenge, codeVerifier } = await generateCodeChallenge();

  // Cleanup URL
  const returnUrl = new URL(SERVER_ENV.MONERIUM_FORCE_BACK_URL ?? url.toString());
  returnUrl.pathname = "/callbacks/monerium";
  returnUrl.search = "";
  returnUrl.hash = "";

  const params = new URLSearchParams();
  params.set("client_id", SERVER_ENV.MONERIUM_AUTH_CODE_FLOW);
  params.set("code_challenge", codeChallenge);
  params.set("code_challenge_method", "S256");
  params.set("email", data.credentialSubject.email);
  params.set("redirect_uri", returnUrl.toString());

  const authUrl = new URL(`${SERVER_ENV.MONERIUM_API_URL}/auth?${params.toString()}`);

  return {
    url: authUrl.toString(),
    codeVerifier, // Store this securely for the token exchange
  };
};

export const createOrder = async (profileId: string, address: string, amount: number) => {
  const apiToken = await getClientToken();

  const body = {
    id: crypto.randomUUID(),
    address: "0x3fd946751a38C5430b73c1dcfF418bA6d38502B3",
    currency: "eur",
    chain: "Arbitrum Sepolia",
    kind: "redeem",
    amount: "1000",
    counterpart: {
      identifier: {
        standard: "iban",
        iban: "ME74476888197384741897",
      },
      details: {
        firstName: "Satoshi",
        lastName: "Nakamoto",
        country: "FR",
      },
    },
    message: "Send EUR 1 to CZ6508000000192000145399 at 2024-07-12T12:02:49Z",
    signature:
      "0x5rc0b4cb4efbb577cb0c19d1cb23c7cc4912d2138b3267ee4799c88a68e203a5d568bec12f5da2b3a416f9bb03257b472a1605bf489bcdb805c2c029c212d3a5120505f52546da16217f630339cd332d6049f11cf15a1a82939663a58b02d129c40607c0c290ace726c89c35228b6485f5d3796d6c10df5b8a0de196092797bfe7e1f",
    memo: "Powered by Monerium",
    supportingDocumentId: "a78d8ff2-e51f-11ed-9e13-cacb9390199c",
  };

  const response = await fetch(`${SERVER_ENV.MONERIUM_API_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/vnd.monerium.api-v2+json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.json();
    return text;
    // console.error("Response error: ", response, text);
    // throw new Error("Failed to create order");
  }

  return await response.json();
};
