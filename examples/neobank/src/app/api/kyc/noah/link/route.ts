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

async function createNoahCustomer(
  userAddress: string,
  credentialSubject: Credentials["credentialSubject"],
  origin: string,
) {
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
      FirstName: credentialSubject.firstName,
      LastName: credentialSubject.familyName,
      MiddleName: credentialSubject.maidenName,
    },
    DateOfBirth: formatDate(credentialSubject.dateOfBirth),
    Email: credentialSubject.email,
    PhoneNumber: credentialSubject.phoneNumber,
    Identities: [
      {
        IssuingCountry: credentialSubject.idDocumentCountry,
        IDNumber: credentialSubject.idDocumentNumber,
        IssuedDate: formatDate(credentialSubject.idDocumentDateOfIssue),
        ExpiryDate: formatDate(credentialSubject.idDocumentDateOfExpiry),
        IDType: documentTypeMapper[credentialSubject.idDocumentType] ?? "Passport",
      },
    ],
    PrimaryResidence: {
      Street: credentialSubject.residentialAddressStreet ?? "",
      City: credentialSubject.residentialAddressCity ?? "",
      PostCode: credentialSubject.residentialAddressPostalCode ?? "",
      State: "CA",
      Country: credentialSubject.residentialAddressCountry ?? "",
    },
  };

  // Cleanup URL
  // @todo: remove this once in production and use server url
  const returnUrl = new URL(origin);
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
    CustomerID: userAddress,
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
  const origin = request.nextUrl.origin;
  const { searchParams } = new URL(request.url);
  const credentialId = searchParams.get("credentialId");
  const userId = searchParams.get("userId");
  const address = searchParams.get("address");

  if (!credentialId) {
    return Response.json({ error: "`credentialId` search param is required" }, { status: 400 });
  }

  if (!address) {
    return Response.json({ error: "`address` search param is not supported" }, { status: 400 });
  }

  const [credentialError, credential] = await goTry<Credentials["credentialSubject"]>(async () => {
    return await fetch(`${origin}/api/shared-credential?userId=${userId}`)
      .then((res) => res.json())
      .then((res) => res.credentialContent);
  });

  if (credentialError) {
    return Response.json({ error: credentialError.message }, { status: 400 });
  }

  const [customerError, customer] = await goTry<NoahResponse>(async () => {
    return createNoahCustomer(address, credential, origin);
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
