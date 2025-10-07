import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { SERVER_ENV } from "./envFlags.server";

// https://docs.noah.com/api-concepts/authentication/signing#why-exact-bytes-matter

/**
 * Creates a JWT token for authenticating API requests.
 *
 * @param opts - Options for JWT creation.
 * @param opts.body - A buffer made from the body of the request. Important to use the exact same body buffer in the request.
 * @param opts.method - The HTTP method of the request, e.g., GET, POST, PUT, DELETE.
 * @param opts.path - The path of the request, e.g., /api/v1/customers.
 * @param opts.privateKey - The private key used to sign the JWT, in PEM format.
 * @param opts.queryParams - The query parameters of the request.
 * @returns A signed JWT token as a string.
 */
export async function createJwt(opts: {
  body: Buffer | undefined;
  method: string;
  path: string;
  queryParams: object | undefined;
}): Promise<string> {
  const { body, method, path, queryParams } = opts;
  let bodyHash: string | undefined;

  if (body) {
    bodyHash = crypto.createHash("sha256").update(body).digest("hex");
  }

  const payload = {
    bodyHash,
    method,
    path,
    queryParams,
  };

  const token = jwt.sign(payload, SERVER_ENV.NOAH_PRIVATE_KEY, {
    algorithm: "ES384",
    audience: "https://api.noah.com",
    expiresIn: "5m",
  });

  console.log(token);

  return token;
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

export async function createNoahCustomer(customerId: string) {
  const request = {
    Type: "Individual",
  };

  const body = Buffer.from(JSON.stringify(request));
  const path = `/v1/customers/${customerId}`;

  const signature = await createJwt({
    body,
    method: "PUT",
    path,
    queryParams: undefined,
  });

  const response = await fetch(`${SERVER_ENV.NOAH_API_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": SERVER_ENV.NOAH_API_KEY,
      "Api-Signature": signature,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Noah error:", text);
    throw new Error(`Failed to create Noah customer: ${text}`);
  }

  // No body
  return true;
}

export async function prefillNoahUser(customerId: string, token: string) {
  const path = `/v1/onboarding/${customerId}/prefill`;

  const request = {
    Type: "SumSubToken",
    Token: token,
  };

  const body = Buffer.from(JSON.stringify(request));

  const signature = await createJwt({
    body,
    method: "POST",
    path,
    queryParams: undefined,
  });

  const response = await fetch(`${SERVER_ENV.NOAH_API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": SERVER_ENV.NOAH_API_KEY,
      "Api-Signature": signature,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Noah error:", text);
    throw new Error(`Failed to set a sumsub token for noah customer: ${text}`);
  }

  // No body
  return true;
}

export async function createOnboardingSession(customerId: string, url: URL) {
  const returnUrl = new URL(url.toString());
  returnUrl.protocol = "https";
  returnUrl.pathname = "/callbacks/noah";
  returnUrl.search = "";
  returnUrl.hash = "";

  const request = {
    ReturnURL: returnUrl.toString(),
  };

  const path = `/v1/onboarding/${customerId}`;

  const body = Buffer.from(JSON.stringify(request));

  const signature = await createJwt({
    body,
    method: "POST",
    path,
    queryParams: undefined,
  });

  const response = await fetch(`${SERVER_ENV.NOAH_API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": SERVER_ENV.NOAH_API_KEY,
      "Api-Signature": signature,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Noah payin error:", text);
    throw new Error(`Failed to create Noah payin: ${text}`);
  }

  const data = (await response.json()) as NoahResponse;

  return data;
}

export async function createPayInRequest(customerId: string, url: URL) {
  // Cleanup URL
  const returnUrl = new URL(url.toString());
  returnUrl.protocol = "https";
  returnUrl.pathname = "/callbacks/noah";
  returnUrl.search = "";
  returnUrl.hash = "";

  const request: NoahPayinFiatRequest = {
    CustomerID: customerId,
    PaymentMethodCategory: "Card",
    FiatCurrency: "USD",
    CryptoCurrency: "BTC_TEST",
    FiatAmount: "100",
    ReturnURL: returnUrl.toString(),
    ExternalID: crypto.randomUUID(),
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

  const path = "/v1/checkout/payin/fiat";

  const body = Buffer.from(JSON.stringify(request));

  const signature = await createJwt({
    body,
    method: "POST",
    path,
    queryParams: undefined,
  });

  const response = await fetch(`${SERVER_ENV.NOAH_API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": SERVER_ENV.NOAH_API_KEY,
      "Api-Signature": signature,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Noah payin error:", text);
    throw new Error(`Failed to create Noah payin: ${text}`);
  }

  const data = (await response.json()) as NoahResponse;

  return data;
}
