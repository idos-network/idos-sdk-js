import { ethers } from "ethers";
import { JsonRpcProvider } from "ethers";
import { KeyPair } from "near-api-js";

import { idOSGrantee } from "./idOS-grantee.ts";

export class idOS {
  constructor(private readonly grantee: idOSGrantee) {}

  static async init(
    chainType: "EVM" | "NEAR",
    authPrivateKey: string,
    recipientEncryptionPrivateKey: string,
    nodeUrl: string,
    dbId: string,
  ) {
    let grantee: idOSGrantee;

    switch (chainType) {
      case "EVM": {
        const signer = new ethers.Wallet(authPrivateKey, new JsonRpcProvider(nodeUrl));
        grantee = await idOSGrantee.init({
          chainType,
          granteeSigner: signer,
          recipientEncryptionPrivateKey,
          nodeUrl,
          dbId,
        });
        return new idOS(grantee);
      }
      case "NEAR": {
        const signer = KeyPair.fromString(authPrivateKey);
        grantee = await idOSGrantee.init({
          chainType,
          granteeSigner: signer,
          nodeUrl,
          recipientEncryptionPrivateKey,
          dbId,
        });
        return new idOS(grantee);
      }
      default:
        throw new Error(`Unexpected chainType: ${chainType}`);
    }
  }

  async listGrants(page: number, size?: number) {
    return this.grantee.getGrantsGranted(page, size);
  }

  async fetchSharedCredential(dataId: string) {
    return this.grantee.fetchSharedCredentialFromIdos(dataId);
  }

  async getSharedCredentialContentDecrypted(dataId: string) {
    return this.grantee.getSharedCredentialContentDecrypted(dataId);
  }
}
