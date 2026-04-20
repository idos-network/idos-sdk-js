import type { idOSClientLoggedIn } from "@idos-network/client";

import {
  type Context as SessionContext,
  emptyContext as sessionEmptyContext,
} from "./flows/session";

export interface CoreContext {
  errorMessage?: string | null;
  idOSClient: idOSClientLoggedIn | null;
}

export type Context = CoreContext & SessionContext;

export const emptyContext: Context = {
  errorMessage: null,
  idOSClient: null,

  ...sessionEmptyContext,
};
