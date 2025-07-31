import type {
  idOSClientLoggedIn,
  idOSClientWithUserSigner,
  idOSCredential,
} from "@idos-network/client";

export type Provider = "transak" | "noah" | "custom" | "hifi" | "monerium" | null;

export interface MoneriumIban {
  profile: string;
  address: string;
  iban: string;
  bic: string;
  chain: string;
  state: string;
  emailNotifications: boolean;
}

export interface Context {
  errorMessage?: string | null;
  walletAddress: string | null;
  provider: Provider;
  findCredentialAttempts: number;
  kycType: "sumsub" | "persona" | null;
  kycUrl: string | null;
  profile: boolean | null;
  sharableToken: string | null;
  credential: idOSCredential | null;
  sharedCredential: idOSCredential | null;
  krakenDAG: idOSCredential | null;
  client: idOSClientWithUserSigner | null;
  loggedInClient: idOSClientLoggedIn | null;
  noahUrl: string | null;
  moneriumAuthUrl: string | null;
  hifiTosUrl: string | null;
  hifiTosId: string | null;
  hifiUrl: string | null;
  getHifiKycStatusAttempts: number;
  // biome-ignore lint/suspicious/noExplicitAny: false positive
  hifiKycStatus: "ACTIVE" | any;
  // biome-ignore lint/suspicious/noExplicitAny: false positive
  onRampAccount: any | null;
  moneriumCode: string | null;
  moneriumProfileStatus: string | null;
  moneriumProfileIbans: MoneriumIban[] | null;
}

export interface UserData {
  // Add your user data type here
  [key: string]: unknown;
}
