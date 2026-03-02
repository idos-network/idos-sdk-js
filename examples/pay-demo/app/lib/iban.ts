const EU_IBAN_COUNTRIES = [
  "AT",
  "BE",
  "BG",
  "CH",
  "HR",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
] as const;

const IBAN_MIN_LENGTH = 15;
const IBAN_MAX_LENGTH = 34;
const MOD_97_DIVISOR = 97;
const MOD_97_REMAINDER = 1;
const CHAR_CODE_OFFSET = 55;
const CHUNK_SIZE = 7;
const IBAN_REARRANGE_OFFSET = 4;

const IBAN_PATTERNS: Record<string, { length: number; pattern: RegExp; example: string }> = {
  AT: {
    length: 20,
    pattern: /^AT[0-9]{2}[A-Z0-9]{16}$/,
    example: "AT61 1904 3002 3457 3201",
  },
  BE: {
    length: 16,
    pattern: /^BE\d{2}\d{12}$/,
    example: "BE68 5390 0754 7034",
  },
  CH: {
    length: 21,
    pattern: /^CH\d{2}\d{5}[A-Z0-9]{12}$/,
    example: "CH93 0076 2011 6238 5295 7",
  },
  BG: {
    length: 22,
    pattern: /^BG\d{2}[A-Z]{4}\d{4}\d{2}[A-Z0-9]{8}$/,
    example: "BG80 BNBG 9661 1020 3456 78",
  },
  HR: {
    length: 21,
    pattern: /^HR\d{2}\d{17}$/,
    example: "HR12 1001 0051 8630 0016 0",
  },
  CY: {
    length: 28,
    pattern: /^CY\d{2}\d{3}\d{5}[A-Z0-9]{16}$/,
    example: "CY17 002 00128 0000001200527600",
  },
  CZ: {
    length: 24,
    pattern: /^CZ\d{2}\d{20}$/,
    example: "CZ65 0800 0000 1920 0014 5399",
  },
  DE: {
    length: 22,
    pattern: /^DE\d{2}\d{18}$/,
    example: "DE89 3704 0044 0532 0130 00",
  },
  DK: {
    length: 18,
    pattern: /^DK\d{2}\d{14}$/,
    example: "DK50 0040 0440 1162 43",
  },
  EE: {
    length: 20,
    pattern: /^EE\d{2}\d{16}$/,
    example: "EE38 2200 2210 2014 5685",
  },
  ES: {
    length: 24,
    pattern: /^ES\d{2}\d{20}$/,
    example: "ES91 2100 0418 4502 0005 1332",
  },
  FI: {
    length: 18,
    pattern: /^FI\d{2}\d{14}$/,
    example: "FI21 1234 5600 0007 85",
  },
  FR: {
    length: 27,
    pattern: /^FR\d{2}\d{10}[A-Z0-9]{11}\d{2}$/,
    example: "FR14 2004 1010 0505 0001 3M02 606",
  },
  GR: {
    length: 27,
    pattern: /^GR\d{2}\d{3}\d{4}[A-Z0-9]{16}$/,
    example: "GR16 0110 1250 0000 0001 2300 695",
  },
  HU: {
    length: 28,
    pattern: /^HU\d{2}\d{24}$/,
    example: "HU42 1177 3016 1111 1018 0000 0000",
  },
  IE: {
    length: 22,
    pattern: /^IE\d{2}[A-Z]{4}\d{14}$/,
    example: "IE29 AIBK 9311 5212 3456 78",
  },
  IT: {
    length: 27,
    pattern: /^IT\d{2}[A-Z]\d{10}[A-Z0-9]{12}$/,
    example: "IT60 X054 2811 1010 0000 0123 456",
  },
  LT: {
    length: 20,
    pattern: /^LT\d{2}\d{16}$/,
    example: "LT12 1000 0111 0100 1000",
  },
  LU: {
    length: 20,
    pattern: /^LU\d{2}\d{3}[A-Z0-9]{13}$/,
    example: "LU28 001 9400644750000",
  },
  LV: {
    length: 21,
    pattern: /^LV\d{2}[A-Z]{4}[A-Z0-9]{13}$/,
    example: "LV80 BANK 0000 4351 9500 1",
  },
  MT: {
    length: 31,
    pattern: /^MT\d{2}[A-Z]{4}\d{5}[A-Z0-9]{18}$/,
    example: "MT84 MALT 0110 0001 2345 MTLC AST0 01S",
  },
  NL: {
    length: 18,
    pattern: /^NL\d{2}[A-Z]{4}\d{10}$/,
    example: "NL91 ABNA 0417 1643 00",
  },
  PL: {
    length: 28,
    pattern: /^PL\d{2}\d{24}$/,
    example: "PL61 1090 1014 0000 0712 1981 2874",
  },
  PT: {
    length: 25,
    pattern: /^PT\d{2}\d{21}$/,
    example: "PT50 0002 0123 1234 5678 9015 4",
  },
  RO: {
    length: 24,
    pattern: /^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$/,
    example: "RO49 AAAA 1B31 0075 9384 0000",
  },
  SE: {
    length: 24,
    pattern: /^SE\d{2}\d{20}$/,
    example: "SE45 5000 0000 0583 9825 7466",
  },
  SI: {
    length: 19,
    pattern: /^SI\d{2}\d{15}$/,
    example: "SI56 1910 0000 0123 438",
  },
  SK: {
    length: 24,
    pattern: /^SK\d{2}\d{20}$/,
    example: "SK31 1200 0000 1987 4263 7541",
  },
};

/**
 * Normalizes IBAN input by removing all non-alphanumeric characters and converting to uppercase
 */
export const normalizeIban = (input: string) => input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

/**
 * Formats IBAN with spaces in groups of 4 for display purposes
 */
export const formatIbanGroups = (iban: string) =>
  normalizeIban(iban)
    .replace(/(.{4})/g, "$1 ")
    .trim();

/**
 * Gets the IBAN pattern for a specific country
 */
export const getIbanPattern = (countryCode: string) => {
  const pattern = IBAN_PATTERNS[countryCode.toUpperCase()];
  if (!pattern) {
    throw new Error(`Unsupported country code: ${countryCode}`);
  }
  return pattern;
};

/**
 * Converts alphabetic characters to numeric values for mod-97 calculation
 */
const toNumeric = (s: string) =>
  s.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - CHAR_CODE_OFFSET));

/**
 * Validates IBAN using the ISO 13616 mod-97 algorithm
 */
const isValidIbanChecksum = (iban: string) => {
  const normalized = normalizeIban(iban);
  if (normalized.length < IBAN_MIN_LENGTH || normalized.length > IBAN_MAX_LENGTH) {
    return false;
  }

  const rearranged =
    normalized.slice(IBAN_REARRANGE_OFFSET) + normalized.slice(0, IBAN_REARRANGE_OFFSET);
  const num = toNumeric(rearranged);

  let remainder = 0;
  for (let i = 0; i < num.length; i += CHUNK_SIZE) {
    remainder = Number(String(remainder) + num.slice(i, i + CHUNK_SIZE)) % MOD_97_DIVISOR;
  }

  return remainder === MOD_97_REMAINDER;
};

/**
 * Validates IBAN format for a specific country
 */
export const isValidIbanForCountry = (iban: string, countryCode: string) => {
  const normalized = normalizeIban(iban);
  const pattern = getIbanPattern(countryCode);

  // First check format
  const hasValidFormat = normalized.length === pattern.length && pattern.pattern.test(normalized);

  // Then check checksum
  const hasValidChecksum = isValidIbanChecksum(normalized);

  return hasValidFormat && hasValidChecksum;
};

/**
 * Gets example IBAN for a country
 */
export const getExampleIban = (countryCode: string) => {
  const pattern = getIbanPattern(countryCode);
  return pattern.example;
};

/**
 * Checks if a country code is supported for IBAN validation
 */
export const isSupportedCountry = (countryCode: string) => {
  if (!countryCode || typeof countryCode !== "string") {
    throw new Error(`Invalid country code: ${countryCode}`);
  }
  const upperCountryCode = countryCode.toUpperCase();
  return (EU_IBAN_COUNTRIES as readonly string[]).includes(upperCountryCode);
};

/**
 * Gets all supported country codes
 */
export const getSupportedCountries = () => {
  return [...EU_IBAN_COUNTRIES];
};
