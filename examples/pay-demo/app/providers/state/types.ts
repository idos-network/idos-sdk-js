// Import context types from all flows
import { emptyContext as idOsEmptyContext, type idOSContext } from "./flows/idos";
import {
  emptyContext as credentialEmptyContext,
  type CredentialContext,
} from "./flows/credentials";
import { emptyContext as kycEmptyContext, type KycContext } from "./flows/kyc";
import { emptyContext as dueEmptyContext, type DueContext } from "./flows/due";
import { emptyContext as transakEmptyContext, type TransakContext } from "./flows/transack";
import { emptyContext as hifiEmptyContext, type HifiContext } from "./flows/hifi";
import {
  emptyContext as moneriumEmptyContext,
  type MoneriumContext,
  type MoneriumIban,
} from "./flows/monerium";
import { emptyContext as noahEmptyContext, type NoahContext } from "./flows/noah";
import type { idOSClientLoggedIn } from "@idos-network/client";

// Re-export types from flows
export type { MoneriumIban };

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
  TransakContext &
  HifiContext &
  MoneriumContext &
  NoahContext;

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
  ...hifiEmptyContext,
  ...moneriumEmptyContext,
  ...noahEmptyContext,
};