import type { Wallet } from "@idos-network/kwil-infra";
import { fromPromise } from "xstate";
import {
  createEvmSigner,
  createFaceSignSigner,
  createNearSigner,
  createStellarSigner,
  createXrplSigner,
} from "@/core/signers";
import type { InitializeIdOSInput, InitializeIdOSOutput } from "../dashboard.machine";
import { idOSConfig } from "../dashboard.machine";

export const initializeIdOS = fromPromise<InitializeIdOSOutput, InitializeIdOSInput>(
  async ({ input }: { input: InitializeIdOSInput }) => {
    const { walletType, nearSelector } = input;

    let signer: Wallet;
    switch (walletType) {
      case "EVM":
        signer = await createEvmSigner();
        break;
      case "NEAR":
        if (!nearSelector) {
          throw new Error("NEAR selector not available");
        }
        signer = await createNearSigner(nearSelector);
        break;
      case "Stellar":
        signer = await createStellarSigner();
        break;
      case "XRPL":
        signer = await createXrplSigner();
        break;
      case "FaceSign":
        signer = createFaceSignSigner();
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
