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

export interface NoahLineItem {
  Description: string;
  Quantity: string;
  UnitAmount: string;
  TotalAmount: string;
}

export interface NoahPayinFiatRequest {
  PaymentMethodCategory: "Card" | "Bank";
  FiatCurrency: string;
  CryptoCurrency: string;
  FiatAmount: string;
  ReturnURL: string;
  ExternalID: string;
  CustomerID: string;
  Customer: NoahCustomer;
  Nonce: string;
  LineItems: NoahLineItem[];
}

export interface NoahCheckoutSession {
  CheckoutSessionID: string;
  PaymentMethodCategory: string;
  SourceCurrency: string;
  DestinationCurrency: string;
  Status: "pending" | "failed" | "settled";
  Type: "PayinCrypto" | "PayinFiat" | "PayoutFiat";
}

export interface NoahResponse {
  HostedURL: string;
  CheckoutSession: NoahCheckoutSession;
}

export async function createNoahCustomer(address: string, credentials: Credentials, url: URL) {
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

  // Cleanup URL
  const returnUrl = new URL(url.toString());
  returnUrl.protocol = "https";
  returnUrl.pathname = "/callbacks/noah";
  returnUrl.search = "";
  returnUrl.hash = "";

  const subject: NoahPayinFiatRequest = {
    Customer: customer,
    PaymentMethodCategory: "Card",
    FiatCurrency: "USD",
    CryptoCurrency: "BTC_TEST",
    FiatAmount: "100",
    ReturnURL: returnUrl.toString(),
    ExternalID: crypto.randomUUID(),
    CustomerID: address,
    Nonce: crypto.randomUUID(),
    LineItems: [
      {
        Description: "Book #1",
        Quantity: "1",
        UnitAmount: "50",
        TotalAmount: "50",
      },
      {
        Description: "Book #2",
        Quantity: "10",
        UnitAmount: "5",
        TotalAmount: "50",
      },
    ],
  };

  const response = await fetch(`${SERVER_ENV.NOAH_API_URL}v1/checkout/payin/fiat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": SERVER_ENV.NOAH_API_KEY,
    },
    body: JSON.stringify(subject),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Noah error:", text);
    console.error(JSON.stringify(subject, null, 2));
    throw new Error(`Failed to create Noah customer: ${text}`);
  }

  const data = (await response.json()) as NoahResponse;

  return data;
}
