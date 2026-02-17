// Import context types from all flows

import type { idOSClientLoggedIn } from "@idos-network/client";
import {
  type CredentialContext,
  emptyContext as credentialEmptyContext,
} from "./flows/credentials";
import { type DueContext, emptyContext as dueEmptyContext } from "./flows/due";
import { type HifiContext, emptyContext as hifiEmptyContext } from "./flows/hifi";
import { type idOSContext, emptyContext as idOsEmptyContext } from "./flows/idos";
import { type KycContext, emptyContext as kycEmptyContext } from "./flows/kyc";
import {
  type MoneriumContext,
  type MoneriumIban,
  emptyContext as moneriumEmptyContext,
} from "./flows/monerium";
import { type NoahContext, emptyContext as noahEmptyContext } from "./flows/noah";
import { type TransakContext, emptyContext as transakEmptyContext } from "./flows/transack";

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
