import type { GetGrantsParams } from "@idos-network/core/kwil-actions";
import type { ChainType, idOSCredential, idOSGrant } from "@idos-network/core/types";
import { idOSConsumer } from "./idOS-consumer.ts";

export class idOSConsumerSDK {
  private readonly consumer: idOSConsumer;

  constructor(consumer: idOSConsumer) {
    this.consumer = consumer;
  }

  static async init(
    // @todo: not 100% sure if we want to keep this
    // perhaps it is better to pass the signer directly from the outside
    chainType: ChainType,
    authPrivateKey: string,
    recipientEncryptionPrivateKey: string,
    nodeUrl: string,
  ) {
    let consumer: idOSConsumer;

    switch (chainType) {
      case "EVM": {
        const { Wallet, JsonRpcProvider } = await import("ethers");
        const signer = new Wallet(authPrivateKey, new JsonRpcProvider(nodeUrl));

        consumer = await idOSConsumer.init({
          consumerSigner: signer,
          recipientEncryptionPrivateKey,
          nodeUrl,
        });

        return new idOSConsumerSDK(consumer);
      }
      case "NEAR": {
        const { KeyPair } = await import("near-api-js");
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

  get address(): string {
    return this.consumer.address;
  }

  get encryptionPublicKey(): string {
    return this.consumer.encryptionPublicKey;
  }

  async getGrants(params: GetGrantsParams) {
    return this.consumer.getGrants(params);
  }

  async getGrantsCount(): Promise<number> {
    return this.consumer.getGrantsCount();
  }

  async getSharedCredential(dataId: string): Promise<idOSCredential> {
    return this.consumer.getSharedCredentialFromIDOS(dataId);
  }

  async getSharedCredentialContentDecrypted(dataId: string): Promise<string> {
    return this.consumer.getSharedCredentialContentDecrypted(dataId);
  }

  async getCredentialAccessGrant(credentialId: string): Promise<idOSGrant> {
    return this.consumer.getCredentialAccessGrant(credentialId);
  }

  async getCredentialsSharedByUser(userId: string): Promise<idOSCredential[]> {
    return this.consumer.getCredentialsSharedByUser(userId);
  }

  async getReusableCredentialCompliantly(credentialId: string): Promise<idOSCredential> {
    return this.consumer.getReusableCredentialCompliantly(credentialId);
  }
}

// Leaving this here for now to avoid breaking changes
export { idOSConsumer } from "./idOS-consumer";
