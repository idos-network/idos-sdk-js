import type { Credentials, IDDocumentType } from "@idos-network/consumer";
import { goTry } from "go-try";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import invariant from "tiny-invariant";

function formatDate(dateString?: string | Date): string | undefined {
  if (!dateString) return undefined;

  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

type NoahCustomer = {
  Type: "Individual";
  FullName: FullName;
  DateOfBirth?: string;
  Email?: string;
  PhoneNumber?: string;
  Identities: Identity[];
  PrimaryResidence: PrimaryResidence;
};

type FullName = {
  FirstName: string;
  LastName: string;
  MiddleName?: string;
};

type NoahIDDocumentType =
  | "AddressProof"
  | "DrivingLicense"
  | "ForeignerID"
  | "NationalIDCard"
  | "Passport"
  | "ResidencePermit"
  | "TaxID";

type Identity = {
  IssuingCountry: string;
  IDNumber: string;
  IssuedDate?: string;
  ExpiryDate?: string;
  IDType: NoahIDDocumentType;
};

type PrimaryResidence = {
  Street: string;
  Street2?: string;
  City: string;
  PostCode: string;
  State?: string;
  Country: string;
};

type NoahLineItem = {
  Description: string;
  Quantity: string;
  UnitAmount: string;
  TotalAmount: string;
};

type NoahPayInFiatRequest = {
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
};

type NoahCheckoutSession = {
  CheckoutSessionID: string;
  PaymentMethodCategory: string;
  SourceCurrency: string;
  DestinationCurrency: string;
  Status: "pending" | "failed" | "settled";
  Type: "PayinCrypto" | "PayinFiat" | "PayoutFiat";
};

type NoahResponse = {
  HostedURL: string;
  CheckoutSession: NoahCheckoutSession;
};

async function createNoahCustomer(address: string, credentials: Credentials, url: URL) {
  const cs = credentials.credentialSubject;

  const noahApiKey = process.env.NOAH_API_KEY;
  const noahAPiUrl = process.env.NOAH_API_URL;

  invariant(noahApiKey, "`NOAH_API_KEY` is not set");
  invariant(noahAPiUrl, "`NOAH_API_URL` is not set");

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
      // biome-ignore lint/style/noNonNullAssertion: false positive
      Street: cs.residentialAddressStreet!,
      // biome-ignore lint/style/noNonNullAssertion: false positive
      City: cs.residentialAddressCity!,
      // biome-ignore lint/style/noNonNullAssertion: false positive
      PostCode: cs.residentialAddressPostalCode!,
      // biome-ignore lint/style/noNonNullAssertion: false positive
      State: cs.residentialAddressCountry!,
      // biome-ignore lint/style/noNonNullAssertion: false positive
      Country: cs.residentialAddressCountry!,
    },
  };

  // Cleanup URL
  const returnUrl = new URL(url.toString());
  returnUrl.protocol = "https";
  returnUrl.pathname = "/callbacks/noah";
  returnUrl.search = "";
  returnUrl.hash = "";

  const subject: NoahPayInFiatRequest = {
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

  const response = await fetch(`${noahAPiUrl}v1/checkout/payin/fiat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": noahApiKey,
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const credentialId = searchParams.get("credentialId");
  const inserterId = searchParams.get("inserterId");

  if (!credentialId) {
    return Response.json({ error: "`credentialId` search param is required" }, { status: 400 });
  }

  if (!inserterId) {
    return Response.json({ error: "`inserterId` search param is not supported" }, { status: 400 });
  }

  const [credentialError, credential] = await goTry<Credentials>(async () => {
    const url = new URL("/api/shared-credential", request.url);
    url.searchParams.set("credentialId", credentialId);
    url.searchParams.set("inserterId", inserterId);
    const data = await fetch(url);
    return data.json();
  });

  if (credentialError) {
    return Response.json({ error: credentialError.message }, { status: 400 });
  }

  const [customerError, customer] = await goTry<NoahResponse>(async () => {
    return createNoahCustomer(inserterId, credential, new URL(request.url));
  });

  if (customerError) {
    return Response.json({ error: customerError.message }, { status: 400 });
  }

  const cookieStore = await cookies();

  cookieStore.set("noahCheckoutSessionID", customer.CheckoutSession.CheckoutSessionID, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });

  return Response.json({
    url: customer.HostedURL,
    currentUrl: request.url,
  });
}
