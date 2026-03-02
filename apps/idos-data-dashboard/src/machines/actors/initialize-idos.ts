import { idOSClientConfiguration } from "@idos-network/client";
import type { Wallet } from "@idos-network/kwil-infra";
import { fromPromise } from "xstate";
import { COMMON_ENV } from "@/core/envFlags.common";
import {
  createEvmSigner,
  createFaceSignSigner,
  createNearSigner,
  createStellarSigner,
  createXrplSigner,
} from "@/core/signers";
import type { InitializeIdOSInput, InitializeIdOSOutput } from "../dashboard.machine";

let config: idOSClientConfiguration | null = null;

export const initializeIdOS = fromPromise<InitializeIdOSOutput, InitializeIdOSInput>(
  async ({ input }) => {
    const { walletType, walletAddress, walletPublicKey, nearSelector } = input;

    if (!config) {
      config = new idOSClientConfiguration({
        nodeUrl: COMMON_ENV.IDOS_NODE_URL,
        enclaveOptions: {
          container: "#idOS-enclave",
          url: COMMON_ENV.IDOS_ENCLAVE_URL,
        },
      });
    }

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
        signer = await createStellarSigner(walletPublicKey, walletAddress);
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

    const newClient = await config.createClient();
    const withSigner = await newClient.withUserSigner(signer);

    const profileExists = await withSigner.hasProfile();
    if (profileExists) {
      const loggedIn = await withSigner.logIn();
      return { client: loggedIn, hasProfile: true };
    }

    return { client: withSigner, hasProfile: false };
  },
);
