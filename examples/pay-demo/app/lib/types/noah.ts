import type { JsonSchema } from "./shared";

/**
 * Countries response from Noah API
 * @see https://docs.noah.com/api-reference/countries
 */
export type CountriesResponse = {
  // key is the country code
  // value is an array of fiat currency codes
  [key: string]: string[];
};

/**
 * Payment method limits from Noah API
 * @see https://docs.noah.com/api-reference/channels/
 */
export type Limits = {
  MinLimit: string;
  MaxLimit: string;
};

/**
 * Payment method from Noah API
 * @see https://docs.noah.com/api-reference/channels/
 */
export type PaymentMethod = "BankLocal" | "IdentifierPix" | "BankSepa" | "BankFedwire" | "BankAch";

/**
 * Channel item from Noah API
 * @see https://docs.noah.com/api-reference/channels/
 */
export type ChannelItem = {
  Calculated: {
    TotalFee: string;
  };
  Country: string;
  FiatCurrency: string;
  FormSchema: JsonSchema;
  ID: string;
  Limits: Limits;
  PaymentMethodCategory: string;
  PaymentMethodType: PaymentMethod;
  ProcessingSeconds: number;
  Rate: string;
};

/**
 * Payment methods response from Noah API
 * @see https://docs.noah.com/api-reference/channels/
 */
export type ChannelsResponse = {
  Items: ChannelItem[];
};
