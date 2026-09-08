import type { idOSClientWithUserSigner } from "@idos-network/client";

import { idOSClientConfiguration } from "@idos-network/client";
import { fromPromise } from "xstate";

import { COMMON_ENV } from "@/core/envFlags.common";
import {
  createEvmSigner,
  createFaceSignSigner,
  createNearSigner,
  createStellarSigner,
  createXrplSigner,
} from "@/core/signers";

import type { InitializeIdOSInput, InitializeIdOSOutput } from "../dashboard/machine";

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

    const newClient = await config.createClient();

    let withSigner: idOSClientWithUserSigner;
    switch (walletType) {
      case "EVM":
        withSigner = await newClient.withEvmSigner(await createEvmSigner());
        break;
      case "NEAR":
        if (!nearSelector) {
          throw new Error("NEAR selector not available");
        }
        withSigner = await newClient.withNearWallet(await createNearSigner(nearSelector));
        break;
      case "Stellar":
        withSigner = await newClient.withKwilSigner(
          await createStellarSigner(walletPublicKey),
          walletAddress,
          walletPublicKey,
          "Stellar",
        );
        break;
      case "XRPL":
        withSigner = await newClient.withXrpWallet(await createXrplSigner());
        break;
      case "FaceSign":
        withSigner = await newClient.withFaceSignSigner(createFaceSignSigner());
        break;
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }

    const profileExists = await withSigner.hasProfile();
    if (profileExists) {
      const loggedIn = await withSigner.logIn();
      return { client: loggedIn, hasProfile: true };
    }

    return { client: withSigner, hasProfile: false };
  },
);
