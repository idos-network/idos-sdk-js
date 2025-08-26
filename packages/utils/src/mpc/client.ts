import {
  ChainControllerApi,
  Configuration,
} from "@partisiablockchain/blockchain-api-transaction-client";
import { ethers, type TypedDataDomain } from "ethers";
import { EngineClient } from "./engine-client";
import { deserializeState } from "./generated/IdosContract";
import { BinarySecretShares, getRandomBytes } from "./secretsharing/binary-secret-shares";
import {
  type Bytes,
  DOWNLOAD_TYPES,
  type DownloadMessageToSign,
  type DownloadSignatureMessage,
  type PbcAddress,
  type Sharing,
  UPLOAD_TYPES,
  ADD_ADDRESS_TYPES,
  type UploadMessageToSign,
  type UploadSignatureMessage,
  type AddAddressSignatureMessage,
  type AddAddressMessageToSign,
} from "./types";

export class Client {
  private readonly baseUrl: string;
  private readonly contractAddress: PbcAddress;
  private engines: EngineClient[] | undefined;

  constructor(baseUrl: string, contractAddress: PbcAddress) {
    this.baseUrl = baseUrl;
    this.contractAddress = contractAddress;
  }

  public async uploadSecret(
    id: string,
    uploadSignature: UploadSignatureMessage,
    signature: Bytes,
    blindedShares: Buffer[],
  ): Promise<{ status: string }> {
    const engineClients = await this.getEngines();
    console.log(engineClients);
    const promises = [];
    for (let i = 0; i < engineClients.length; i++) {
      const engineClient = engineClients[i];
      const uploadRequest: Sharing = {
        ...uploadSignature,
        share_data: ethers.hexlify(blindedShares[i]),
      };
      promises.push(engineClient.sendUpload(id, uploadRequest, signature));
    }
    const statuses = await Promise.all(promises);

    if (statuses.every((item) => item === "201")) {
      return { status: "success" };
    }

    if (statuses.filter((item) => item === "201").length > 0) {
      return { status: "partial-success" };
    }

    return { status: "failure" };
  }

  public getBlindedShares(secret: Buffer): Buffer[] {
    const shares = BinarySecretShares.create(secret).getShares();
    return shares.map((b) => Client.blindShare(b));
  }

  public uploadMessageToSign(uploadRequest: UploadSignatureMessage): UploadMessageToSign {
    return {
      domain: this.getTypedDomain(),
      types: UPLOAD_TYPES,
      value: uploadRequest,
    };
  }

  public uploadRequest(
    blindedShares: Buffer[],
    signerAddress: string,
    additionalRecoveringAddresses: string[] = [],
  ): UploadSignatureMessage {
    const recoveringAddresses = [signerAddress, ...additionalRecoveringAddresses];
    return {
      share_commitments: blindedShares.map((b) => ethers.keccak256(b)),
      recovering_addresses: recoveringAddresses,
    };
  }

  public downloadMessageToSign(downloadRequest: DownloadSignatureMessage): DownloadMessageToSign {
    return {
      domain: this.getTypedDomain(),
      types: DOWNLOAD_TYPES,
      value: downloadRequest,
    };
  }

  public downloadRequest(signerAddress: string, publicKey: Uint8Array): DownloadSignatureMessage {
    return {
      recovering_address: signerAddress,
      timestamp: Date.now(),
      public_key: ethers.hexlify(publicKey),
    };
  }

  public async downloadSecret(
    id: string,
    downloadRequest: DownloadSignatureMessage,
    signature: Bytes,
    secretKey: Uint8Array,
  ): Promise<{ status: string; secret: Buffer | undefined }> {
    const shares = [];
    const engineClients = await this.getEngines();
    for (let i = 0; i < engineClients.length; i++) {
      const engineClient = engineClients[i];
      shares.push(engineClient.downloadAndDecrypt(id, downloadRequest, signature, secretKey));
    }
    const secretShares = await Promise.all(shares);
    console.log({ secretSharesDownloadStatuses: secretShares.map((item) => item.status) });

    if (secretShares.every((item) => item.status === "404")) {
      return { status: "not-stored", secret: undefined };
    }
    var secret: Buffer;
    try {
      secret = BinarySecretShares.read(secretShares.map((item) => item.share)).reconstructSecret();
      return { status: "ok", secret };
    } catch (_e) {
      return { status: "error", secret: undefined };
    }
  }

  public addAddressMessageToSign(addressToAdd: string): AddAddressMessageToSign {
    return {
      domain: this.getTypedDomain(),
      types: ADD_ADDRESS_TYPES,
      value: {
        address_to_add: addressToAdd,
        timestamp: new Date().getTime(),
      }
    };
  }

  public async addAddress(userId: string, message: AddAddressSignatureMessage, signature: string): Promise<string> {
    const engineClients = await this.getEngines();
    const promises = [];
    for (let i = 0; i < engineClients.length; i++) {
      const engineClient = engineClients[i];
      promises.push(engineClient.sendAddAddress(userId, message, signature));
    }
    const statuses = await Promise.all(promises);

    if (statuses.every((item) => item === "200")) {
      return "success";
    }

    return "failure";
  }

  // public async updateWallets(id: string, additionalRecoveringAddresses: string[]) {
  //   const updateRequest: UpdateWalletsSignatureMessage = {
  //     recovering_addresses: [await this.signer.getAddress(), ...additionalRecoveringAddresses],
  //     timestamp: new Date().getTime(),
  //   };
  //   const signature = await this.signer.signTypedData(
  //     this.getTypedDomain(),
  //     UPDATE_TYPES,
  //     updateRequest
  //   );
  //   const engineClients = await this.getEngines();
  //   const promises = [];
  //   for (let i = 0; i < engineClients.length; i++) {
  //     const engineClient = engineClients[i];
  //     promises.push(engineClient.sendUpdate(id, updateRequest, signature));
  //   }
  //   await Promise.all(promises);
  // }

  private getTypedDomain(): TypedDataDomain {
    return {
      name: "idOS secret store contract",
      version: "1",
      verifyingContract: `0x${this.contractAddress.substring(2)}`,
    };
  }

  private async getEngines(): Promise<EngineClient[]> {
    if (this.engines === undefined) {
      const chainController = new ChainControllerApi(new Configuration({ basePath: this.baseUrl }));
      const rawState = await chainController.getContract({ address: this.contractAddress });
      // biome-ignore lint/style/noNonNullAssertion: we know serializedContract is present here
      const state = deserializeState(Buffer.from(rawState.serializedContract!, "base64"));
      this.engines = state.nodes.map(
        (value) => new EngineClient(value.endpoint, this.contractAddress),
      );
    }
    return this.engines;
  }

  private static blindShare(share: Buffer): Buffer {
    return Buffer.concat([getRandomBytes(32), share]);
  }
}
