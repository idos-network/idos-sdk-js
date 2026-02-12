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

type CredentialSubject = {
  id: string;
  residentialAddressStreet: string;
  residentialAddressCity: string;
  residentialAddressState: string;
  residentialAddressPostalCode: string;
  residentialAddressCountry: string;
  firstName: string;
  middleName: string;
  ssn: string;
  gender: string;
  nationality: string;
  familyName: string;
  maidenName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  placeOfBirth: string;
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
  credentialSubject: CredentialSubject,
  stateCode: string,
): TransakUserData => ({
  firstName: credentialSubject.firstName,
  lastName: credentialSubject.familyName,
  email: credentialSubject.email,
  mobileNumber: credentialSubject.phoneNumber,
  dob: formatDateForTransak(credentialSubject.dateOfBirth),
  ssn: credentialSubject.ssn,
  address: {
    addressLine1: credentialSubject.residentialAddressStreet,
    addressLine2: credentialSubject.residentialAddressCity,
    city: credentialSubject.residentialAddressCity,
    postCode: credentialSubject.residentialAddressPostalCode,
    countryCode: credentialSubject.residentialAddressCountry,
    state: stateCode,
  },
});

export async function getTransakAccessToken(): Promise<string> {
  const response = (await fetch(
    `${SERVER_ENV.TRANSAK_API_BASE_URL}/partners/api/v2/refresh-token`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-secret": SERVER_ENV.TRANSAK_API_SECRET,
      },
      body: JSON.stringify({
        apiKey: SERVER_ENV.TRANSAK_API_KEY,
      }),
    },
  ).then((res) => res.json())) as TransakAccessTokenResponse;

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
  // biome-ignore lint/suspicious/noExplicitAny: credential structure varies
  const credentialSubject = (credentialData as any).credentialSubject as CredentialSubject;

  // Resolve state/region code from postal code + country
  let stateCode = "N/A";
  try {
    const address = [
      credentialSubject.residentialAddressPostalCode,
      credentialSubject.residentialAddressCountry,
    ]
      .filter(Boolean)
      .join(", ");
    if (address) {
      stateCode = await getISORegionCodeFromNominatim(address);
    }
  } catch (e) {
    console.warn("[createTransakWidgetUrl] Could not resolve state code:", e);
  }

  const userData = mapCredentialSubjectToTransakUserData(credentialSubject, stateCode);

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

  const response = (await fetch(`${SERVER_ENV.TRANSAK_GATEWAY_BASE_URL}/api/v2/auth/session`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "access-token": transakAccessToken,
    },
    body,
  }).then((res) => res.json())) as CreateTransakWidgetUrlResponse;

  if (!response.data?.widgetUrl) {
    throw new Error(`Failed to create Transak widget URL: ${JSON.stringify(response)}`);
  }

  return response.data.widgetUrl;
}
