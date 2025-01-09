import type { idOSGrant } from "@idos-network/idos-sdk-types";
import { ethers } from "ethers";
import { JsonRpcProvider } from "ethers";
import { KeyPair } from "near-api-js";
import { idOSGrantee } from "./idOS-grantee.ts";

export class idOSGranteeSDK {
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
        return new idOSGranteeSDK(grantee);
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
        return new idOSGranteeSDK(grantee);
      }
      default:
        throw new Error(`Unexpected chainType: ${chainType}`);
    }
  }

  async listGrants(page: number, size?: number) {
    return this.grantee.getGrants(page, size);
  }

  async getSharedCredential(dataId: string) {
    return this.grantee.getSharedCredentialFromIDOS(dataId);
  }

  async getSharedCredentialContentDecrypted(dataId: string) {
    return this.grantee.getSharedCredentialContentDecrypted(dataId);
  }

  async checkCredentialValidity(grant: idOSGrant) {
    return this.grantee.checkCredentialValidity(grant);
  }
}

export { idOSGrantee } from "./idOS-grantee";
