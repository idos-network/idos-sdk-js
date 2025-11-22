import type { Credential } from "@idos-network/consumer";
import countries2to3 from "countries-list/minimal/countries.2to3.min.json";
import { SERVER_ENV } from "./envFlags.server";
import { generateFileUrl } from "./files.server";
import { getISORegionCodeFromNominatim } from "./maps.server";

export interface KYCStatusResponse {
  USD_EURO: UsdEuro;
}

export interface UsdEuro {
  status: string;
  message: string;
}

export const getKycStatus = async (hifiUserId: string): Promise<UsdEuro> => {
  const response = await fetch(`${SERVER_ENV.HIFI_API_URL}v2/users/${hifiUserId}/kyc/status`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${SERVER_ENV.HIFI_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.log("-> error", JSON.stringify(error, null, 2));
    throw new Error(`Can't get KYC status in HIFI because: ${error.message}`);
  }

  const data = (await response.json()) as KYCStatusResponse;

  return data.USD_EURO;
};

export const fetchTosLink = async (url: URL) => {
  // Cleanup URL
  const returnUrl = new URL(url.toString());
  returnUrl.protocol = "https";
  returnUrl.pathname = "/callbacks/hifi/tos";
  returnUrl.search = "";
  returnUrl.hash = "";

  const idempotencyKey = crypto.randomUUID();

  const response = await fetch(`${SERVER_ENV.HIFI_API_URL}v2/tos-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.HIFI_API_KEY}`,
    },
    body: JSON.stringify({
      idempotencyKey,
      templateId: "2fb2da24-472a-4e5b-b160-038d9dc82a40", // HIFI default template
      redirectUrl: returnUrl.toString(),
    }),
  });

  const data = await response.json();

  return {
    url: data.url,
    idempotencyKey,
  };
};

export interface CreateUserRequest {
  type: "individual" | "business";
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  address: Address;
  signedAgreementId: string;
}

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvinceRegion: string;
  postalCode: string;
  country: string; // alpha-3
}

export interface UpdateKYCRequest extends Omit<CreateUserRequest, "signedAgreementId" | "type"> {
  phone?: string;
  ipAddress?: string;
  taxIdentificationNumber: string;
  govIdType: string;
  govIdNumber: string;
  govIdIssuanceDate: string;
  govIdFrontUrl: string;
  govIdBackUrl?: string;
  govIdCountry: string;
  proofOfAddressType: string;
  proofOfAddressUrl: string;
  idType?: string;
  idNumber?: string;
  additionalIdNumber?: string;
  additionalIdType?: string;
}

export const createUserAndKYC = async (
  signedAgreementId: string,
  credentialId: string,
  data: Credential,
  url: URL,
) => {
  // stateProvinceRegion is required but we don't have it in the data
  // so we need to get it from the address
  const stateProvinceRegion = await getISORegionCodeFromNominatim(
    [
      [
        data.credentialSubject.residentialAddressStreet,
        data.credentialSubject.residentialAddressHouseNumber,
      ]
        .filter((x) => x)
        .join(" "),
      data.credentialSubject.residentialAddressCity,
      data.credentialSubject.residentialAddressPostalCode,
      data.credentialSubject.residentialAddressCountry,
      data.credentialSubject.residentialAddressAdditionalAddressInfo,
    ]
      .filter((x) => x)
      .join(", "),
  );

  const user: CreateUserRequest = {
    type: "individual",
    // @ts-expect-error Demo
    firstName: data.credentialSubject.firstName,
    // @ts-expect-error Demo
    lastName: data.credentialSubject.familyName,
    // @ts-expect-error Demo
    email: data.credentialSubject.email,
    // @ts-expect-error Demo
    dateOfBirth: data.credentialSubject.dateOfBirth?.split("T")[0],
    address: {
      // biome-ignore lint/style/noNonNullAssertion: false positive
      addressLine1: data.credentialSubject.residentialAddressStreet!,
      addressLine2: data.credentialSubject.residentialAddressHouseNumber ?? "",
      // biome-ignore lint/style/noNonNullAssertion: false positive
      city: data.credentialSubject.residentialAddressCity!,
      // biome-ignore lint/style/noNonNullAssertion: false positive
      postalCode: data.credentialSubject.residentialAddressPostalCode!,
      stateProvinceRegion: stateProvinceRegion.slice(0, 2),
      country:
        countries2to3[
          // biome-ignore lint/style/noNonNullAssertion: false positive
          data.credentialSubject.residentialAddressCountry! as keyof typeof countries2to3
        ],
    },
    signedAgreementId,
  };

  const createUserResponse = await fetch(`${SERVER_ENV.HIFI_API_URL}v2/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.HIFI_API_KEY}`,
    },
    body: JSON.stringify(user),
  });

  if (!createUserResponse.ok) {
    const error = await createUserResponse.json();
    console.log("-> error", JSON.stringify(error, null, 2));
    throw new Error(`Can't create an user in HIFI because: ${error.message}`);
  }

  // Get the user ID & create KYC
  const createUserResponseJson = await createUserResponse.json();
  const userId = createUserResponseJson.id;

  const updateKYCRequest: UpdateKYCRequest = {
    ...user,
    signedAgreementId: undefined,
    phone: data.credentialSubject.phoneNumber ?? "+420606707808",
    // TODO: Get this from the data
    taxIdentificationNumber: "123456789",
    govIdType: data.credentialSubject.idDocumentType.toUpperCase(),
    govIdNumber: data.credentialSubject.idDocumentNumber,
    // @ts-expect-error Demo
    govIdIssuanceDate: data.credentialSubject.idDocumentDateOfIssue?.toString()?.split("T")[0],
    govIdFrontUrl: generateFileUrl(url, credentialId, "idDocumentFrontFile"),
    govIdBackUrl: data.credentialSubject.idDocumentBackFile
      ? generateFileUrl(url, credentialId, "idDocumentBackFile")
      : generateFileUrl(url, credentialId, "idDocumentFrontFile"), // Send front file if back is not provided
    govIdCountry:
      countries2to3[data.credentialSubject.idDocumentCountry as keyof typeof countries2to3],
    proofOfAddressType: data.credentialSubject.residentialAddressProofCategory?.toUpperCase() ?? "",
    proofOfAddressUrl: generateFileUrl(url, credentialId, "residentialAddressProofFile"),
  };

  const updateKYCResponse = await fetch(`${SERVER_ENV.HIFI_API_URL}v2/users/${userId}/kyc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.HIFI_API_KEY}`,
    },
    body: JSON.stringify(updateKYCRequest),
  });

  if (!updateKYCResponse.ok) {
    const error = await updateKYCResponse.json();
    console.log("-> error", JSON.stringify(error, null, 2));
    throw new Error(`Can't update KYC in HIFI because: ${error.message}`);
  }

  const submitKYCResponse = await fetch(
    `${SERVER_ENV.HIFI_API_URL}v2/users/${userId}/kyc/submissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVER_ENV.HIFI_API_KEY}`,
      },
      body: JSON.stringify({
        rails: "USD_EURO",
      }),
    },
  );

  if (!submitKYCResponse.ok) {
    const error = await submitKYCResponse.json();
    console.log("-> error", JSON.stringify(error, null, 2));
    throw new Error(`Can't submit KYC in HIFI because: ${error.message}`);
  }

  return userId as string;
};

export interface OnRampRequest {
  sourceCurrency: string;
  destinationCurrency: string;
  destinationChain: string;
}

export interface OnRampAccountResponse {
  message: string;
  account: Account;
}

export interface Account {
  virtualAccountId: string;
  userId: string;
  paymentRails: string[];
  sourceCurrency: string;
  destinationChain: string;
  destinationCurrency: string;
  destinationWalletAddress: string;
  railStatus: string;
  depositInstructions: DepositInstructions;
}

export interface DepositInstructions {
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  bankAddress: string;
}

export const createOnRampAccount = async (userId: string, request: OnRampRequest) => {
  const response = await fetch(`${SERVER_ENV.HIFI_API_URL}v2/users/${userId}/virtual-accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.HIFI_API_KEY}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    console.log("-> error", JSON.stringify(error, null, 2));
    throw new Error(`Can't create an on-ramp account in HIFI because: ${error.message}`);
  }

  return response.json() as Promise<OnRampAccountResponse>;
};
