import { SERVER_ENV } from "./envFlags.server";
import { createJwt } from "./noah.server";

type Provider = "noah" | "transak";

type TransakQuoteResponse = {
  response: {
    quoteId: string;
    conversionPrice: number;
    marketConversionPrice: number;
    slippage: number;
    fiatCurrency: string;
    cryptoCurrency: string;
    paymentMethod: string;
    fiatAmount: number;
    cryptoAmount: number;
    isBuyOrSell: string;
    network: string;
    feeDecimal: number;
    totalFee: number;
    feeBreakdown: {
      name: string;
      value: number;
      id: string;
      ids: string[];
    }[];
  };
};

export type QuoteRateResponse = {
  name: Provider;
  rate: string;
};

interface CurrencyArgs {
  sourceCurrency: string;
  destinationCurrency: string;
  amount: string;
}

export async function getTransakQuote({
  sourceCurrency,
  destinationCurrency = "USDC",
  amount,
}: CurrencyArgs): Promise<QuoteRateResponse> {
  const url = `${SERVER_ENV.TRANSAK_API_BASE_URL}/api/v1/pricing/public/quotes?partnerApiKey=${SERVER_ENV.TRANSAK_API_KEY}&fiatCurrency=${sourceCurrency}&cryptoCurrency=${destinationCurrency}&isBuyOrSell=BUY&network=ethereum&paymentMethod=credit_debit_card&fiatAmount=${amount}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Transak quote request failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as TransakQuoteResponse;
  const { conversionPrice, fiatAmount, cryptoAmount } = data.response;
  const rate = (conversionPrice / fiatAmount) * cryptoAmount;

  return { name: "transak", rate: rate.toString() };
}

export async function getNoahQuote({
  sourceCurrency,
  destinationCurrency,
  amount,
}: CurrencyArgs): Promise<QuoteRateResponse> {
  // For a sell channel (selling crypto for fiat):
  //   sourceCurrency  = the crypto being sold  → CryptoCurrency  (e.g. USDC / USDC_TEST)
  //   destinationCurrency = the fiat being received → FiatCurrency (e.g. EUR)
  // In sandbox, Noah requires the _TEST suffix for crypto (e.g. USDC_TEST).
  const cryptoCurrency = sourceCurrency;
  const fiatCurrency = destinationCurrency;

  const queryParams = {
    CryptoCurrency: cryptoCurrency,
    FiatCurrency: fiatCurrency,
    FiatAmount: amount,
  };

  const apiUrl = new URL(`${SERVER_ENV.NOAH_API_URL}/v1/channels/sell`);
  apiUrl.searchParams.set("CryptoCurrency", cryptoCurrency);
  apiUrl.searchParams.set("FiatCurrency", fiatCurrency);
  apiUrl.searchParams.set("FiatAmount", amount);

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
    throw new Error(`Noah quote request failed (${response.status}): ${text.slice(0, 200)}`);
  }

  // biome-ignore lint/suspicious/noExplicitAny: Noah API response shape
  const channels = (await response.json()) as any;

  if (!channels.Items?.length) {
    throw new Error("No channels found for the requested currency pair.");
  }

  return { name: "noah", rate: channels.Items[0].Rate };
}

export async function getProviderQuote(
  provider: Provider,
  args: CurrencyArgs,
): Promise<QuoteRateResponse> {
  switch (provider) {
    case "transak":
      return getTransakQuote(args);
    case "noah":
      return getNoahQuote(args);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
