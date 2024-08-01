import { ethers } from "ethers";
import { JsonRpcProvider } from "ethers";
import { KeyPair } from "near-api-js";

import type Grant from "../grants/grant";
import { idOSGrantee } from "../idos-grantee";

export async function idOSNode(
  chainType: "EVM" | "NEAR",
  privateKey: string,
  encryptionSecretKey: string,
  nodeUrl?: string,
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
      break;
    }
    case "NEAR": {
      const signer = KeyPair.fromString(privateKey);
      grantee = await idOSGrantee.init({
        chainType,
        granteeSigner: signer,
        encryptionSecret: privateKey,
      });
      break;
    }
    default:
      throw new Error(`Unexpected chainType: ${chainType}`);
  }

  const listGrants = async (args: Partial<Omit<Grant, "lockedUntil">>) => {
    console.log(args);

    return grantee.grants?.list(args);
  };

  const fetchSharedCredentialFromIdos = async (dataId: string) => {
    return grantee.fetchSharedCredentialFromIdos(dataId);
  };

  return {
    listGrants,
    fetchSharedCredentialFromIdos,
  };
}
