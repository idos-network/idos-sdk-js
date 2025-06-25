import type {
  idOSClientLoggedIn,
  idOSClientWithUserSigner,
  idOSCredential,
} from "@idos-network/client";

export type Provider = "transak" | "noah" | "custom" | "hifi" | null;

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
  client: idOSClientWithUserSigner | null;
  loggedInClient: idOSClientLoggedIn | null;
  data: unknown | null;
  noahUrl: string | null;
  hifiTosUrl: string | null;
  hifiTosId: string | null;
  hifiUrl: string | null;
  getHifiKycStatusAttempts: number;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  hifiKycStatus: "ACTIVE" | any;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  onRampAccount: any | null;
}

export interface UserData {
  // Add your user data type here
  [key: string]: unknown;
}
