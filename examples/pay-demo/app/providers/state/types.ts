// Import context types from all flows

import type { idOSClientLoggedIn } from "@idos-network/client";
import {
  type CredentialContext,
  emptyContext as credentialEmptyContext,
} from "./flows/credentials";
import { type DueContext, emptyContext as dueEmptyContext } from "./flows/due";
import { type idOSContext, emptyContext as idOsEmptyContext } from "./flows/idos";
import { type KycContext, emptyContext as kycEmptyContext } from "./flows/kyc";
import { type TransakContext, emptyContext as transakEmptyContext } from "./flows/transak";

export type Provider = "transak" | "due" | "noah" | "custom" | "hifi" | "monerium" | null;

export interface SharedTokenData {
  id: string;
  kycStatus: string;
  token: string;
  forClientId: string;
}

// Compose Context from all flow contexts
export type Context = CoreContext &
  idOSContext &
  CredentialContext &
  KycContext &
  DueContext &
  TransakContext;

// Core context that doesn't belong to any specific flow
export interface CoreContext {
  // Generic context stuff
  errorMessage?: string | null;

  // Withdrawal or add funds provider
  provider: Provider;

  // Relay access grant
  relayAG: Awaited<ReturnType<idOSClientLoggedIn["requestAccessGrant"]>> | null;
}

export interface UserData {
  // Add your user data type here
  [key: string]: unknown;
}

export const emptyContext: Context = {
  // Core context
  errorMessage: null,
  provider: null,

  // Relay access grant
  relayAG: null,

  // Flow-specific contexts
  ...idOsEmptyContext,
  ...credentialEmptyContext,
  ...kycEmptyContext,
  ...dueEmptyContext,
  ...transakEmptyContext,
};
