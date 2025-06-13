import type {
  idOSClientLoggedIn,
  idOSClientWithUserSigner,
  idOSCredential,
} from "@idos-network/client";

export type Provider = "transak" | "noah" | "custom" | null;

export interface Context {
  errorMessage?: string | null;
  walletAddress: string | null;
  provider: Provider;
  findCredentialAttempts: number;
  kycUrl: string | null;
  profile: boolean | null;
  sharableToken: string | null;
  credential: idOSCredential | null;
  sharedCredential: idOSCredential | null;
  client: idOSClientWithUserSigner | null;
  loggedInClient: idOSClientLoggedIn | null;
  data: unknown | null;
  noahUrl: string | null;
}

export interface UserData {
  // Add your user data type here
  [key: string]: unknown;
}
