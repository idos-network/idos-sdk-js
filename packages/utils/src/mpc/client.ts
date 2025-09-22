import {
  ChainControllerApi,
  Configuration,
} from "@partisiablockchain/blockchain-api-transaction-client";
import { ethers, type TypedDataDomain } from "ethers";
import { EngineClient } from "./engine-client";
import { deserializeState } from "./generated/IdosContract";
import { ShamirFactory, getRandomBytes } from "./secretsharing/shamir-secret-shares";
import {
  type Bytes,
  DOWNLOAD_TYPES,
  type DownloadMessageToSign,
  type DownloadSignatureMessage,
  type PbcAddress,
  type Sharing,
  UPLOAD_TYPES,
  ADD_ADDRESS_TYPES,
  REMOVE_ADDRESS_TYPES,
  type UploadMessageToSign,
  type UploadSignatureMessage,
  type AddAddressSignatureMessage,
  type AddAddressMessageToSign,
  type RemoveAddressMessageToSign,
  type RemoveAddressSignatureMessage,
} from "./types";

export class Client {
  private readonly baseUrl: string;
  private readonly contractAddress: PbcAddress;
  private engines: EngineClient[] | undefined;
  private signerType: string;
  private signerAddress: string;
  private signerPublicKey: string | undefined;
  private factory: ShamirFactory;
  private numNodes: number;

  constructor(
    baseUrl: string,
    contractAddress: PbcAddress,
    numMalicious: number,
    numNodes: number,
    numToReconstruct: number,
    signerType: string,
    signerAddress: string,
    signerPublicKey?: string,
  ) {
    this.baseUrl = baseUrl;
    this.contractAddress = contractAddress;
    this.signerType = signerType;
    this.signerAddress = signerAddress;
    this.signerPublicKey = signerPublicKey;
    this.numNodes = numNodes;
    // TODO: Make these configurable from env variables
    this.factory = new ShamirFactory({ numMalicious, numNodes, numToReconstruct });
  }

  public reconfigure(signerType: string, signerAddress: string, signerPublicKey?: string): void {
    if (!["evm", "xrpl", "near", "stellar"].includes(signerType)) {
      throw new Error("Invalid signer type");
    }
    this.signerType = signerType;
    this.signerAddress = signerAddress;
    if (signerPublicKey) this.signerPublicKey = signerPublicKey;
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
    // TODO: Make the number of nodes configurable from env variables
    const secretShares = this.factory.fromPlainText(this.numNodes, secret);
    var blindedShares: Buffer[] = [];
    for (let i = 0; i < secretShares.numShares(); i++) {
      blindedShares.push(Client.blindShare(secretShares.getShareBytes(i)));
    }
    return blindedShares;
  }

  public uploadMessageToSign(uploadRequest: UploadSignatureMessage): UploadMessageToSign {
    return {
      domain: this.getTypedDomain(),
      types: UPLOAD_TYPES,
      value: uploadRequest,
    };
  }

  public uploadRequest(blindedShares: Buffer[]): UploadSignatureMessage {
    console.log("UPLOADING TO MPC");
    var address = "";
    switch (this.signerType) {
      case "evm":
        address = `eip712:${this.signerAddress}`;
        break;
      case "xrpl":
        address = `XRPL:${this.signerPublicKey}`;
        break;
      case "near":
        address = `NEAR:${this.signerPublicKey?.replace('ed25519:', '')}`;
        break;
      default:
        throw new Error("Invalid signer type");
    }
    return {
      share_commitments: blindedShares.map((b) => ethers.keccak256(b)),
      recovering_addresses: [address],
    };
  }

  public downloadMessageToSign(downloadRequest: DownloadSignatureMessage): DownloadMessageToSign {
    return {
      domain: this.getTypedDomain(),
      types: DOWNLOAD_TYPES,
      value: downloadRequest,
    };
  }

  public downloadRequest(publicKey: Uint8Array): DownloadSignatureMessage {
    var address = "";
    switch (this.signerType) {
      case "evm":
        address = `eip712:${this.signerAddress}`;
        break;
      case "xrpl":
        address = `XRPL:${this.signerPublicKey}`;
        break;
      case "near":
        address = `NEAR:${this.signerPublicKey?.replace('ed25519:', '')}`;
        break;
      default:
        throw new Error("Invalid signer type");
    }
    return {
      recovering_address: address,
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
      secret = this.factory.fromSharesBytes(secretShares.map((item) => item.share)).reconstructPlainText();
      return { status: "ok", secret };
    } catch (_e) {
      return { status: "error", secret: undefined };
    }
  }

  public addAddressMessageToSign(addressToAdd: string, publicKey: string | undefined, addressToAddType: string): AddAddressMessageToSign {
    var address = "";
    switch (this.signerType) {
      case "evm":
        address = `eip712:${this.signerAddress}`;
        break;
      case "xrpl":
        address = `XRPL:${this.signerPublicKey}`;
        break;
      case "near":
        address = `NEAR:${this.signerPublicKey?.replace('ed25519:', '')}`;
        break;
      default:
        throw new Error("Invalid signer type");
    }

    var addressToAddFormatted = "";
    switch (addressToAddType.toLowerCase()) {
      case "evm":
        addressToAddFormatted = `eip712:${addressToAdd}`;
        break;
      case "xrpl":
        addressToAddFormatted = `XRPL:${publicKey}`;
        break;
      case "near":
        addressToAddFormatted = `NEAR:${publicKey?.replace('ed25519:', '')}`;
        break;
      default:
        throw new Error("Invalid address to add type");
    }

    const value = {
      recovering_address: address,
      address_to_add: addressToAddFormatted,
      timestamp: new Date().getTime(),
    };
    return {
      domain: this.getTypedDomain(),
      types: ADD_ADDRESS_TYPES,
      value,
    };
  }

  public removeAddressMessageToSign(addressToRemove: string, publicKey: string | undefined, addressToRemoveType: string): RemoveAddressMessageToSign {
    var address = "";
    switch (this.signerType) {
      case "evm":
        address = `eip712:${this.signerAddress}`;
        break;
      case "xrpl":
        address = `XRPL:${this.signerPublicKey}`;
        break;
      case "near":
        address = `NEAR:${this.signerPublicKey?.replace('ed25519:', '')}`;
        break;
      default:
        throw new Error("Invalid signer type");
    }

    var addressToRemoveFormatted = "";
    switch (addressToRemoveType.toLowerCase()) {
      case "evm":
        addressToRemoveFormatted = `eip712:${addressToRemove}`;
        break;
      case "xrpl":
        addressToRemoveFormatted = `XRPL:${publicKey}`;
        break;
      case "near":
        addressToRemoveFormatted = `NEAR:${publicKey?.replace('ed25519:', '')}`;
        break;
      default:
        throw new Error("Invalid address to remove type");
    }

    const value = {
      recovering_address: address,
      address_to_remove: addressToRemoveFormatted,
      timestamp: new Date().getTime(),
    };
    return {
      domain: this.getTypedDomain(),
      types: REMOVE_ADDRESS_TYPES,
      value,
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

  public async removeAddress(userId: string, message: RemoveAddressSignatureMessage, signature: string): Promise<string> {
    const engineClients = await this.getEngines();
    const promises = [];
    for (let i = 0; i < engineClients.length; i++) {
      const engineClient = engineClients[i];
      promises.push(engineClient.sendRemoveAddress(userId, message, signature));
    }
    const statuses = await Promise.all(promises);

    if (statuses.every((item) => item === "200")) {
      return "success";
    }

    return "failure";
  }

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
        (value) => new EngineClient(value.endpoint, this.contractAddress, this.signerType),
      );
    }
    return this.engines;
  }

  private static blindShare(share: Buffer): Buffer {
    return Buffer.concat([getRandomBytes(32), share]);
  }
}
