import { Wallet } from "ethers";
import { JsonRpcProvider } from "ethers";
import { KeyPair } from "near-api-js";

import { idOSConsumer } from "./idOS-consumer.ts";

export class idOSConsumerSDK {
  constructor(private readonly consumer: idOSConsumer) {}

  static async init(
    // @todo: not 100% sure if we want to keep this
    // perhaps it is better to pass the signer directly from the outside
    chainType: "EVM" | "NEAR",
    authPrivateKey: string,
    recipientEncryptionPrivateKey: string,
    nodeUrl: string,
  ) {
    let consumer: idOSConsumer;

    switch (chainType) {
      case "EVM": {
        const signer = new Wallet(authPrivateKey, new JsonRpcProvider(nodeUrl));

        consumer = await idOSConsumer.init({
          consumerSigner: signer,
          recipientEncryptionPrivateKey,
          nodeUrl,
        });

        return new idOSConsumerSDK(consumer);
      }
      case "NEAR": {
        const signer = KeyPair.fromString(authPrivateKey);
        consumer = await idOSConsumer.init({
          consumerSigner: signer,
          nodeUrl,
          recipientEncryptionPrivateKey,
        });
        return new idOSConsumerSDK(consumer);
      }
      default:
        throw new Error(`Unexpected chainType: ${chainType}`);
    }
  }

  async listGrants(page: number, size?: number) {
    return this.consumer.getGrants(page, size);
  }

  async getSharedCredential(dataId: string) {
    return this.consumer.getSharedCredentialFromIDOS(dataId);
  }
}

export { idOSConsumer } from "./idOS-consumer";
