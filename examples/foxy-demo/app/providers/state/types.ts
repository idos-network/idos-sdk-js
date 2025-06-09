import type {
  idOSClientLoggedIn,
  idOSClientWithUserSigner,
  idOSCredential,
} from "@idos-network/client";

export type Provider = "transak" | "banxa" | "custom" | null;

export interface Context {
  errorMessage?: string | null;
  walletAddress: string | null;
  provider: Provider;
  findCredentialsAttempts: number;
  kycUrl: string | null;
  profile: boolean | null;
  sharableToken: string | null;
  credential: idOSCredential | null;
  client: idOSClientWithUserSigner | null;
  loggedInClient: idOSClientLoggedIn | null;
  accessGrant: boolean;
  data: unknown | null;
}

export interface UserData {
  // Add your user data type here
  [key: string]: unknown;
}
