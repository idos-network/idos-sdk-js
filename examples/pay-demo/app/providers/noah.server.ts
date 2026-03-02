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
  let bodyHash: string;

  if (body) {
    bodyHash = crypto.createHash("sha256").update(body).digest("hex");
  } else {
    // SHA-256 of empty string — must match idos-app's create-noah-jwt.ts
    bodyHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  }

  // Ensure path includes /v1 prefix
  const normalizedPath = path.includes("/v1") ? path : `/v1${path}`;

  const payload = {
    bodyHash,
    method,
    path: normalizedPath,
    queryParams,
  };

  // Replace literal \n with real newlines (PEM keys in .env lose their newlines)
  const privateKey = SERVER_ENV.NOAH_PRIVATE_KEY.replace(/\\n/g, "\n");

  const token = jwt.sign(payload, privateKey, {
    algorithm: "ES384",
    audience: "https://api.noah.com",
    expiresIn: "5m",
  });

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

export interface PreparePayoutResponse {
  CryptoAmountEstimate: string;
  CryptoAuthorizedAmount: string;
  FormSessionID: string;
  TotalFee: string;
}

export interface SubmitPayoutResponse {
  Transaction: {
    ID: string;
    Status: "Pending" | "Settled" | "Failed";
    Created: string;
    CryptoCurrency: string;
    FiatPayment: {
      Amount: string;
      FeeAmount: string;
      FiatCurrency: string;
    };
    FiatPaymentMethod?: {
      ID?: string;
      Country: string;
      PaymentMethodCategory: string;
      PaymentMethodType: string;
      DisplayDetails?: Record<string, any>;
    };
    ExternalID?: string;
  };
}

export interface NoahAccountsResponse {
  Items: Array<{
    AccountType: "Current" | "Available";
    Available: string;
    CryptoCurrency: "USDC" | "USDT" | "MATIC";
    Total: string;
  }>;
}

/**
 * Transform form data to match Noah's expected structure
 * This handles different payment method form structures dynamically
 */
function transformFormDataForNoah(
  form: Record<string, any>,
  paymentMethod?: string,
): Record<string, any> {
  let cleanedForm = { ...form };

  // Remove countryCode if present (it's only for UI, not for Noah)
  if ("countryCode" in cleanedForm) {
    delete cleanedForm.countryCode;
  }

  // Apply payment method-specific transformations
  switch (paymentMethod) {
    case "BankSepa":
      // SEPA: AccountNumber and AccountType should be nested under BankDetails
      if (
        "AccountNumber" in cleanedForm &&
        "AccountType" in cleanedForm &&
        !("BankDetails" in cleanedForm)
      ) {
        const { AccountNumber, AccountType, ...rest } = cleanedForm;
        cleanedForm = {
          ...rest,
          BankDetails: {
            AccountNumber,
            AccountType,
          },
        };
      }
      break;

    case "BankLocal":
    case "BankFedwire":
    case "BankAch":
      // These already have BankDetails nested correctly from form components
      // Just ensure structure is valid
      break;

    case "IdentifierPix":
      // PIX form structure should already be correct
      // It has: AccountHolderAddress, TaxID, PhoneNumber, PaymentPurpose, IdentifierDetails
      break;

    default:
      // For unknown payment methods, try to detect and transform common patterns
      // If AccountNumber and AccountType are at top level but BankDetails is missing, nest them
      if (
        "AccountNumber" in cleanedForm &&
        "AccountType" in cleanedForm &&
        !("BankDetails" in cleanedForm)
      ) {
        const { AccountNumber, AccountType, ...rest } = cleanedForm;
        cleanedForm = {
          ...rest,
          BankDetails: {
            AccountNumber,
            AccountType,
          },
        };
      }
      break;
  }

  return cleanedForm;
}

/**
 * Get Noah channels for selling crypto
 */
export async function getNoahChannels(
  countryCode: string,
  token: string,
  fiatCurrency: string,
  fiatAmount?: number,
) {
  // Convert token to Noah format (production uses USDC, USDT, MATIC not _TEST)
  const tokenMap: Record<string, string> = {
    USDT0: "USDT",
    USDC0: "USDC",
    POL: "MATIC",
  };
  const cryptoCurrency = token in tokenMap ? tokenMap[token] : token;

  // Build URL with search parameters
  const apiUrl = new URL(`${SERVER_ENV.NOAH_API_URL}/v1/channels/sell`);
  apiUrl.searchParams.set("Country", countryCode);
  apiUrl.searchParams.set("CryptoCurrency", cryptoCurrency);
  apiUrl.searchParams.set("FiatCurrency", fiatCurrency);

  // Add FiatAmount if provided
  if (fiatAmount) {
    apiUrl.searchParams.set("FiatAmount", fiatAmount.toString());
  }

  // Create object from searchParams
  const queryParams = Object.fromEntries(apiUrl.searchParams);

  const signature = await createJwt({
    body: undefined,
    method: "GET",
    path: "/v1/channels/sell",
    queryParams,
  });

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "X-Api-Key": SERVER_ENV.NOAH_API_KEY,
      "Api-Signature": signature,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get Noah channels: ${text}`);
  }

  return await response.json();
}

/**
 * Get supported countries from Noah
 */
export async function getNoahCountries() {
  const path = "/v1/channels/sell/countries";

  const apiUrl = new URL(`${SERVER_ENV.NOAH_API_URL}${path}`);

  const signature = await createJwt({
    body: undefined,
    method: "GET",
    path,
    queryParams: undefined,
  });

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "X-Api-Key": SERVER_ENV.NOAH_API_KEY,
      "Api-Signature": signature,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get Noah countries: ${text}`);
  }

  return await response.json();
}

/**
 * Get Noah account balances
 */
export async function getNoahAccounts(): Promise<NoahAccountsResponse> {
  const path = "/v1/balances";

  const signature = await createJwt({
    body: undefined,
    method: "GET",
    path,
    queryParams: undefined,
  });

  const response = await fetch(`${SERVER_ENV.NOAH_API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "X-Api-Key": SERVER_ENV.NOAH_API_KEY,
      "Api-Signature": signature,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get Noah accounts: ${text}`);
  }

  return await response.json();
}

/**
 * Prepare a payout transaction with Noah
 */
export async function prepareNoahPayout(
  customerId: string,
  channelId: string,
  cryptoCurrency: string,
  fiatAmount: string,
  form: Record<string, any>,
  paymentMethod?: string,
): Promise<PreparePayoutResponse> {
  const path = "/v1/transactions/sell/prepare";

  // Transform form data dynamically based on payment method
  const cleanedForm = transformFormDataForNoah(form, paymentMethod);

  const requestPayload = {
    ChannelID: channelId,
    CryptoCurrency: cryptoCurrency,
    FiatAmount: fiatAmount.toString(),
    Form: cleanedForm,
    DelayedSell: true,
  };

  const body = Buffer.from(JSON.stringify(requestPayload));

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
      Accept: "application/json",
      "X-Api-Key": SERVER_ENV.NOAH_API_KEY,
      "Api-Signature": signature,
    },
    body,
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Noah API error:", JSON.stringify(errorData, null, 2));

    // Format error message from validation errors
    const validationErrors = errorData.RequestExtension?.Body;
    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      const errorMessages = validationErrors
        .map((err: any) => `${err.Field}: ${err.Description}`)
        .join(", ");
      throw new Error(`Validation error: ${errorMessages}`);
    }

    throw new Error(
      errorData.message || errorData.Detail || `Noah API error: ${response.statusText}`,
    );
  }

  return await response.json();
}

/**
 * Submit a payout transaction with Noah
 */
export async function submitNoahPayout(
  customerId: string,
  cryptoCurrency: string,
  fiatAmount: string,
  cryptoAuthorizedAmount: string,
  formSessionId: string,
  externalId?: string,
): Promise<SubmitPayoutResponse> {
  const path = "/v1/transactions/sell";

  const body = Buffer.from(
    JSON.stringify({
      CryptoCurrency: cryptoCurrency,
      FiatAmount: fiatAmount.toString(),
      CryptoAuthorizedAmount: cryptoAuthorizedAmount.toString(),
      FormSessionID: formSessionId,
      Nonce: crypto.randomUUID(), // Generate unique nonce for idempotency
      ExternalID: externalId || crypto.randomUUID(), // Optional external reference
    }),
  );

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
      Accept: "application/json",
      "X-Api-Key": SERVER_ENV.NOAH_API_KEY,
      "Api-Signature": signature,
    },
    body,
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Noah API error:", errorData);
    throw new Error(errorData.message || `Noah API error: ${response.statusText}`);
  }

  return await response.json();
}
