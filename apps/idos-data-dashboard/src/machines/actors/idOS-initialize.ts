import type { Wallet } from "@idos-network/kwil-infra";
import { fromPromise } from "xstate";
import {
  createEvmSigner,
  createNearSigner,
  createStellarSigner,
  createXrplSigner,
} from "@/core/signers";
import type { InitializeIdOSInput, InitializeIdOSOutput } from "../dashboard.machine";
import { idOSConfig } from "../dashboard.machine";

export const initializeIdOS = fromPromise<InitializeIdOSOutput, InitializeIdOSInput>(
  async ({ input }) => {
    const { walletType, walletAddress, walletPublicKey } = input;

    let signer: Wallet;
    switch (walletType) {
      case "EVM":
        signer = await createEvmSigner();
        break;
      case "NEAR":
        signer = await createNearSigner();
        break;
      case "Stellar":
        signer = await createStellarSigner(walletPublicKey, walletAddress);
        break;
      case "XRPL":
        signer = await createXrplSigner();
        break;
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }

    const newClient = await idOSConfig.createClient();
    const withSigner = await newClient.withUserSigner(signer);

    const profileExists = await withSigner.hasProfile();
    if (profileExists) {
      const loggedIn = await withSigner.logIn();
      return { client: loggedIn, hasProfile: true };
    }

    return { client: withSigner, hasProfile: false };
  },
);
