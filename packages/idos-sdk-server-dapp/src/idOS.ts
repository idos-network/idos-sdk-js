import { ethers } from "ethers";
import { JsonRpcProvider } from "ethers";
import { KeyPair } from "near-api-js";

import type { Grant } from "../../idos-sdk-js";
import { idOSGrantee } from "./idOS-grantee.ts";

export class idOS {
  constructor(private readonly grantee: idOSGrantee) {}

  static async init(
    chainType: "EVM" | "NEAR",
    privateKey: string,
    encryptionSecretKey: string,
    nodeUrl: string,
  ) {
    let grantee: idOSGrantee;

    switch (chainType) {
      case "EVM": {
        const signer = new ethers.Wallet(privateKey, new JsonRpcProvider(nodeUrl));
        grantee = await idOSGrantee.init({
          chainType,
          granteeSigner: signer,
          encryptionSecret: encryptionSecretKey,
        });
        return new idOS(grantee);
      }
      case "NEAR": {
        const signer = KeyPair.fromString(privateKey);
        grantee = await idOSGrantee.init({
          chainType,
          granteeSigner: signer,
          encryptionSecret: privateKey,
        });
        return new idOS(grantee);
      }
      default:
        throw new Error(`Unexpected chainType: ${chainType}`);
    }
  }

  async listGrants(args: Partial<Omit<Grant, "lockedUntil">>) {
    return this.grantee.grants?.list(args);
  }

  async fetchSharedCredential(dataId: string) {
    return this.grantee.fetchSharedCredentialFromIdos(dataId);
  }
}
