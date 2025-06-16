export interface SessionUser {
  address: string;
  message: string;
  chain: string;
  publicKey: string;
  signature?: string;
  isAuthenticated: boolean;
}
