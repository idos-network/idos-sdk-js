import type { VerifiableCredentialSubject } from "@idos-network/consumer";
import countries2to3 from "countries-list/minimal/countries.2to3.min.json";
import jwt from "jsonwebtoken";
import { type NextRequest, NextResponse } from "next/server";
import invariant from "tiny-invariant";
import { getISORegionCodeFromNominatim } from "@/lib/maps";

interface CreateUserRequest {
  type: "individual" | "business";
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  address: Address;
  signedAgreementId?: string;
}

interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvinceRegion: string;
  postalCode: string;
  country: string; // alpha-3
}

interface UpdateKYCRequest extends Omit<CreateUserRequest, "type"> {
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

interface _OnRampRequest {
  sourceCurrency: string;
  destinationCurrency: string;
  destinationChain: string;
}

interface _OnRampAccountResponse {
  message: string;
  account: Account;
}

interface Account {
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

interface DepositInstructions {
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  bankAddress: string;
}

interface FileUrlData {
  credentialId: string;
  fileType: string;
}

const generateFileUrl = (url: URL, credentialId: string, fileType: string) => {
  const jwtData: FileUrlData = {
    credentialId,
    fileType,
  };

  invariant(process.env.FILES_PRIVATE_KEY, "FILES_PRIVATE_KEY is not set");

  const token = jwt.sign(jwtData, process.env.FILES_PRIVATE_KEY, {
    algorithm: "ES512",
    expiresIn: "30m",
  });

  const fileUrl = new URL(url.toString());
  fileUrl.protocol = "https";
  fileUrl.pathname = "/file";
  fileUrl.searchParams.forEach((_value, key) => {
    fileUrl.searchParams.delete(key);
  });
  fileUrl.searchParams.delete("signedAgreementId");
  fileUrl.searchParams.set("token", token);

  return fileUrl.toString();
};

// TODO: Uncomment this when we have a way to verify the file URL
// const verifyFileUrl = async (token: string) => {
//   invariant(process.env.FILES_PUBLIC_KEY, "FILES_PUBLIC_KEY is not set");

//   const decoded = jwt.verify(token, process.env.FILES_PUBLIC_KEY, {
//     algorithms: ["ES512"],
//   }) as FileUrlData;

//   return decoded;
// };

const createUserAndKYC = async (
  signedAgreementId: string,
  credentialId: string,
  data: VerifiableCredentialSubject,
  url: URL,
) => {
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
    firstName: data.credentialSubject.firstName,
    lastName: data.credentialSubject.familyName,
    email: data.credentialSubject.email ?? "modahmada2018@gmail.com",
    dateOfBirth: data.credentialSubject.dateOfBirth.split("T")[0],
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
  console.log({ user, stateProvinceRegion });

  const createUserResponse = await fetch(`${process.env.HIFI_API_URL}v2/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HIFI_API_KEY}`,
    },
    body: JSON.stringify(user),
  })
    .then((res) => res.json())
    .catch((err) => {
      console.log("-> error", JSON.stringify(err, null, 2));
      throw new Error(`Can't create an user in HIFI because: ${err.message}`);
    });

  // Get the user ID & create KYC

  const userId = createUserResponse.id;
  console.log({ createUserResponse, signedAgreementId, user });

  const updateKYCRequest: UpdateKYCRequest = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    // Remove signedAgreementId from here - it's not valid for KYC updates
    phone: data.credentialSubject.phoneNumber ?? "+420606707808",
    taxIdentificationNumber: "123456789",
    govIdType: (data.credentialSubject.idDocumentType ?? "passport").toUpperCase(),
    govIdNumber: data.credentialSubject.idDocumentNumber ?? "123456789",
    govIdIssuanceDate: data.credentialSubject.idDocumentDateOfIssue?.split("T")[0] ?? "2025-01-01",
    govIdFrontUrl: generateFileUrl(url, credentialId, "idDocumentFrontFile"),
    govIdBackUrl: data.credentialSubject.idDocumentBackFile
      ? generateFileUrl(url, credentialId, "idDocumentBackFile")
      : generateFileUrl(url, credentialId, "idDocumentFrontFile"),
    govIdCountry:
      countries2to3[data.credentialSubject.idDocumentCountry as keyof typeof countries2to3] ??
      "CZE",
    proofOfAddressType: (
      data.credentialSubject.residentialAddressProofCategory ?? "utility_bill"
    ).toUpperCase(),
    proofOfAddressUrl: generateFileUrl(url, credentialId, "residentialAddressProofFile") ?? "",
  };
  console.log({
    updateKYCRequest,
    apiUrl: process.env.HIFI_API_URL,
    hifiApiKey: process.env.HIFI_API_KEY,
  });

  const updateKYCResponse = await fetch(`${process.env.HIFI_API_URL}v2/users/${userId}/kyc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HIFI_API_KEY}`,
    },
    body: JSON.stringify(updateKYCRequest),
  });

  // Check if response is ok before parsing JSON
  if (!updateKYCResponse.ok) {
    const errorText = await updateKYCResponse.text();
    console.log("API Error Response:", {
      status: updateKYCResponse.status,
      statusText: updateKYCResponse.statusText,
      body: errorText,
    });
    throw new Error(`HIFI API returned ${updateKYCResponse.status}: ${errorText}`);
  }

  const result = await updateKYCResponse.json();

  console.log({ result });

  const submitKYCResponse = await fetch(
    `${process.env.HIFI_API_URL}v2/users/${userId}/kyc/submissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HIFI_API_KEY}`,
      },
      body: JSON.stringify({
        rails: "USD_EURO",
      }),
    },
  )
    .then((res) => res.json())
    .catch((err) => {
      console.log("-> error", JSON.stringify(err, null, 2));
      throw new Error(`Can't submit KYC in HIFI because: ${err.message}`);
    });

  console.log({ submitKYCResponse });

  return userId as string;
};

export async function POST(
  request: NextRequest,
): Promise<NextResponse<{ userId: string } | { error: string }>> {
  const { signedAgreementId, credentialId, data, url } = await request.json();

  try {
    const userId = await createUserAndKYC(signedAgreementId, credentialId, data, url);
    return NextResponse.json({ userId });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
