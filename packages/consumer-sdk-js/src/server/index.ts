import { idOSGrantee } from "./idOS-grantee.ts";

export class idOSGranteeSDK {
  constructor(private readonly grantee: idOSGrantee) { }

  static async init(
    // @todo: not 100% sure if we want to keep this
    // perhaps it is better to pass the signer directly from the outside
    chainType: "EVM" | "NEAR",
    authPrivateKey: string,
    recipientEncryptionPrivateKey: string,
    nodeUrl: string,
    dbId: string,
  ) {
    let grantee: idOSGrantee;

    switch (chainType) {
      case "EVM": {
        const { Wallet, JsonRpcProvider } = await import("ethers");
        const signer = new Wallet(authPrivateKey, new JsonRpcProvider(nodeUrl));

        grantee = await idOSGrantee.init({
          granteeSigner: signer,
          recipientEncryptionPrivateKey,
          nodeUrl,
          dbId,
        });

        return new idOSGranteeSDK(grantee);
      }
      case "NEAR": {
        const { KeyPair } = await import("near-api-js");
        const signer = KeyPair.fromString(authPrivateKey);
        grantee = await idOSGrantee.init({
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
}

export { idOSGrantee } from "./idOS-grantee";
