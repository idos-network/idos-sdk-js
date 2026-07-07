import type { VerifiableCredentialKycV2 } from "@idos-network/credentials/schemas";

import { SERVER_ENV } from "./envFlags.server";
import { getCredentialShared } from "./idos.server";
import { getISORegionCodeFromNominatim } from "./maps.server";

type TransakAccessTokenResponse = {
  data: {
    accessToken: string;
    expiresAt: string;
  };
  error?: string;
};

type TransakAddress = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postCode: string;
  countryCode: string;
};

type TransakUserData = {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  dob: string;
  ssn: string;
  address: TransakAddress;
};

type CreateTransakWidgetUrlResponse = {
  data: {
    widgetUrl: string;
  };
};

const formatDateForTransak = (date: string) => {
  return date.split("T")[0];
};

const mapCredentialSubjectToTransakUserData = (
  vc: VerifiableCredentialKycV2,
  stateCode: string,
): TransakUserData => ({
  firstName: vc.subject.firstName!,
  lastName: vc.subject.familyName!,
  email: vc.subject.email!,
  mobileNumber: vc.subject.phoneNumber!,
  dob: formatDateForTransak(vc.subject.dateOfBirth?.toISOString() ?? ""),
  ssn: vc.subject.ssn!,
  address: {
    addressLine1: vc.subject.residentialAddress?.street ?? "",
    addressLine2: vc.subject.residentialAddress?.houseNumber ?? "",
    city: vc.subject.residentialAddress?.city ?? "",
    postCode: vc.subject.residentialAddress?.postalCode ?? "",
    countryCode: vc.subject.residentialAddress?.country ?? "",
    state: stateCode,
  },
});

export async function getTransakAccessToken(): Promise<string> {
  const tokenRes = await fetch(`${SERVER_ENV.TRANSAK_API_BASE_URL}/partners/api/v2/refresh-token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-secret": SERVER_ENV.TRANSAK_API_SECRET,
    },
    body: JSON.stringify({
      apiKey: SERVER_ENV.TRANSAK_API_KEY,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(
      `Transak token request failed with status ${tokenRes.status}: ${text.slice(0, 200)}`,
    );
  }

  const response = (await tokenRes.json()) as TransakAccessTokenResponse;

  if (response.error || !response.data?.accessToken) {
    throw new Error(
      `Failed to get Transak access token: ${response.error ?? "No access token returned"}`,
    );
  }

  return response.data.accessToken;
}

export async function createTransakWidgetUrl({
  walletAddress,
  fiatAmount,
  kycShareToken,
  credentialId,
  referrerDomain,
}: {
  walletAddress: string;
  fiatAmount: string;
  kycShareToken: string;
  credentialId: string;
  referrerDomain: string;
}): Promise<string> {
  const transakAccessToken = await getTransakAccessToken();

  // Decrypt the credential to extract user data for prefilling
  const credentialData = await getCredentialShared(credentialId);

  // Resolve state/region code from postal code + country
  let stateCode = "N/A";
  try {
    const address = [
      credentialData.subject.residentialAddress?.postalCode,
      credentialData.subject.residentialAddress?.country,
    ]
      .filter(Boolean)
      .join(", ");
    if (address) {
      stateCode = await getISORegionCodeFromNominatim(address);
    }
  } catch (e) {
    console.warn("[createTransakWidgetUrl] Could not resolve state code:", e);
  }

  const userData = mapCredentialSubjectToTransakUserData(credentialData, stateCode);

  const payload = {
    walletAddress,
    network: "polygon",
    defaultNetwork: "polygon",
    fiatCurrency: "USD",
    fiatAmount,
    kycShareTokenProvider: "SUMSUB",
    kycShareToken,
    userData,
  };

  const body = JSON.stringify({
    widgetParams: {
      apiKey: SERVER_ENV.TRANSAK_API_KEY,
      referrerDomain,
      ...payload,
    },
    landingPage: "HomePage",
  });

  const widgetRes = await fetch(`${SERVER_ENV.TRANSAK_GATEWAY_BASE_URL}/api/v2/auth/session`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "access-token": transakAccessToken,
    },
    body,
  });

  if (!widgetRes.ok) {
    const text = await widgetRes.text();
    throw new Error(
      `Transak widget request failed with status ${widgetRes.status}: ${text.slice(0, 200)}`,
    );
  }

  const response = (await widgetRes.json()) as CreateTransakWidgetUrlResponse;

  if (!response.data?.widgetUrl) {
    throw new Error(`Failed to create Transak widget URL: ${JSON.stringify(response)}`);
  }

  return response.data.widgetUrl;
}
