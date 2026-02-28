import { idOSClientConfiguration } from "@idos-network/client";
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

export const initializeIdOS = fromPromise<InitializeIdOSOutput, InitializeIdOSInput>(
  async ({ input }) => {
    const { walletType, walletAddress, walletPublicKey } = input;

    const config = new idOSClientConfiguration({
      nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
      enclaveOptions: {
        container: "#idOS-enclave",
        url: import.meta.env.VITE_IDOS_ENCLAVE_URL,
      },
    });

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
