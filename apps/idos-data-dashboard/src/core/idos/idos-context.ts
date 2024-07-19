import type { idOS } from "@idos-network/idos-sdk";
import { createContext } from "react";

export const idOSContext = createContext<idOSContextValue | null>(null);

export type idOSContextValue = {
  sdk: idOS;
  address: string | undefined;
  hasProfile: boolean;
  publicKey: string | undefined;
  reset: () => Promise<void>;
};
