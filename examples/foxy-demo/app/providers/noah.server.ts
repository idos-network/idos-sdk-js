import type { Credentials, IDDocumentType } from "@idos-network/consumer";
import { SERVER_ENV } from "./envFlags.server";

function formatDate(dateString?: string | Date): string | undefined {
  if (!dateString) return undefined;

  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

export interface NoahCustomer {
  Type: "Individual";
  FullName: FullName;
  DateOfBirth?: string;
  Email?: string;
  PhoneNumber?: string;
  Identities: Identity[];
  PrimaryResidence: PrimaryResidence;
}

export interface FullName {
  FirstName: string;
  LastName: string;
  MiddleName?: string;
}

type NoahIDDocumentType =
  | "AddressProof"
  | "DrivingLicense"
  | "ForeignerID"
  | "NationalIDCard"
  | "Passport"
  | "ResidencePermit"
  | "TaxID";

export interface Identity {
  IssuingCountry: string;
  IDNumber: string;
  IssuedDate?: string;
  ExpiryDate?: string;
  IDType: NoahIDDocumentType;
}

export interface PrimaryResidence {
  Street: string;
  Street2?: string;
  City: string;
  PostCode: string;
  State?: string;
  Country: string;
}

export interface NoahSubject {
  customer: NoahCustomer;
  CustomerID: string;
}

export interface NoahResponse {
  HostedURL: string;
}

export async function createNoahCustomer(address: string, credentials: Credentials) {
  const cs = credentials.credentialSubject;

  const documentTypeMapper: Record<IDDocumentType, NoahIDDocumentType> = {
    PASSPORT: "Passport",
    DRIVERS: "DrivingLicense",
    ID_CARD: "NationalIDCard",
  };

  const customer: NoahCustomer = {
    Type: "Individual",
    FullName: {
      FirstName: cs.firstName,
      LastName: cs.familyName,
      MiddleName: cs.maidenName,
    },
    DateOfBirth: formatDate(cs.dateOfBirth),
    Email: cs.email,
    PhoneNumber: cs.phoneNumber,
    Identities: [
      {
        IssuingCountry: cs.idDocumentCountry,
        IDNumber: cs.idDocumentNumber,
        IssuedDate: formatDate(cs.idDocumentDateOfIssue),
        ExpiryDate: formatDate(cs.idDocumentDateOfExpiry),
        IDType: documentTypeMapper[cs.idDocumentType] ?? "Passport",
      },
    ],
    PrimaryResidence: {
      // biome-ignore lint/style/noNonNullAssertion: We know that the address is present
      Street: cs.residentialAddressStreet!,
      // biome-ignore lint/style/noNonNullAssertion: We know that the address is present
      City: cs.residentialAddressCity!,
      // biome-ignore lint/style/noNonNullAssertion: We know that the address is present
      PostCode: cs.residentialAddressPostalCode!,
      // biome-ignore lint/style/noNonNullAssertion: We know that the address is present
      State: cs.residentialAddressCountry!,
      // biome-ignore lint/style/noNonNullAssertion: We know that the address is present
      Country: cs.residentialAddressCountry!,
    },
  };

  const subject: NoahSubject = {
    customer,
    CustomerID: address,
  };

  const response = await fetch(`${SERVER_ENV.NOAH_API_URL}v1/checkout/manage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": SERVER_ENV.NOAH_API_KEY,
    },
    body: JSON.stringify(subject),
  });

  if (!response.ok) {
    throw new Error("Failed to create Noah customer");
  }

  const data = (await response.json()) as NoahResponse;

  return data.HostedURL;
}
