import { WALLET_TYPES, type WalletType } from "@idos-network/kwil-infra/actions";
import {
  ChainControllerApi,
  Configuration,
} from "@partisiablockchain/blockchain-api-transaction-client";
import { ethers, type TypedDataDomain } from "ethers";
import { EngineClient } from "./engine-client";
import { deserializeState } from "./generated/IdosContract";
import { getRandomBytes, ShamirFactory } from "./secretsharing/shamir-secret-shares";
import {
  ADD_ADDRESS_TYPES,
  type AddAddressMessageToSign,
  type AddAddressSignatureMessage,
  type Bytes,
  DOWNLOAD_TYPES,
  type DownloadMessageToSign,
  type DownloadSignatureMessage,
  type PbcAddress,
  REMOVE_ADDRESS_TYPES,
  type RemoveAddressMessageToSign,
  type RemoveAddressSignatureMessage,
  type Sharing,
  UPLOAD_TYPES,
  type UploadMessageToSign,
  type UploadSignatureMessage,
} from "./types";
import invariant from "tiny-invariant";

export class Client {
  private readonly baseUrl: string;
  private readonly contractAddress: PbcAddress;
  private engines: EngineClient[] | undefined;
  private walletType!: WalletType;
  private signerAddress!: string;
  private signerPublicKey: string | undefined;
  private factory: ShamirFactory;
  private numNodes: number;
  private numToReconstruct: number;

  constructor(
    baseUrl: string,
    contractAddress: PbcAddress,
    numMalicious: number,
    numNodes: number,
    numToReconstruct: number,
    walletType: WalletType,
    signerAddress: string,
    signerPublicKey?: string,
  ) {
    this.baseUrl = baseUrl;
    this.contractAddress = contractAddress;

    this.reconfigure(walletType, signerAddress, signerPublicKey);
    
    this.numNodes = numNodes;
    this.numToReconstruct = numToReconstruct;
    // TODO: Make these configurable from env variables
    this.factory = new ShamirFactory({ numMalicious, numNodes, numToReconstruct });
  }

  public reconfigure(
    walletType: WalletType,
    signerAddress: string,
    signerPublicKey?: string,
  ): void {
    // @deprecated
    // Remove this method after a while
    if (["evm", "xrpl", "near", "facesign", "stellar"].includes(walletType as string)) {
      console.warn("Deprecated wallet type", walletType, ", please upgrade to latest SDK version");
      switch (walletType as string) {
        case "evm":
          walletType = "EVM";
          break;
        case "xrpl":
          walletType = "XRPL";
          break;
        case "near":
          walletType = "NEAR";
          break;
        case "stellar":
          walletType = "Stellar";
          break;
        case "facesign":
          walletType = "FaceSign";
          break;
      }
    }
    
    invariant(WALLET_TYPES.includes(walletType), `Invalid signer type: ${walletType}`);
    invariant(
      // XRPL, NEAR, Stellar and FaceSign require a public key, EVM does not
      (["XRPL", "NEAR", "Stellar", "FaceSign"].includes(walletType) && signerPublicKey) ||
        walletType === "EVM",
      "Signer public key is required for XRPL, NEAR, Stellar and FaceSign",
    );

    this.walletType = walletType;
    // Reset engines to force re-creation of them since they are using old signer information
    this.engines = undefined;
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
    
    const successCount = statuses.filter((item) => item === "200" || item === "201").length;
    
    if (successCount == this.numNodes) {
      return { status: "success" };
    }
    
    if (successCount >= this.numToReconstruct) {
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
    const address = this.formatAddress(this.walletType, this.signerAddress, this.signerPublicKey);
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
  private formatAddress(signerType: string, signerAddress: string, signerPublicKey?: string): string {
    switch (signerType.toLowerCase()) {
      case "evm":
        return `eip712:${signerAddress}`;
      case "xrpl":
        return `XRPL:${signerPublicKey}`;
      case "near":
        return `NEAR:${signerPublicKey?.replace('ed25519:', '')}`;
      case "stellar":
        return `STELLAR:${signerAddress}`;
      case "facesign":
        return `FACESIGN:${signerPublicKey}`;
      default:
        throw new Error("Invalid signer type");
    }
  }

  public downloadRequest(publicKey: Uint8Array): DownloadSignatureMessage {
    const address = this.formatAddress(this.walletType, this.signerAddress, this.signerPublicKey);
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
      secret = this.factory
        .fromSharesBytes(secretShares.map((item) => item.share))
        .reconstructPlainText();
      return { status: "ok", secret };
    } catch (_e) {
      return { status: "error", secret: undefined };
    }
  }

  public addAddressMessageToSign(
    addressToAdd: string,
    publicKey: string | undefined,
    addressToAddType: string,
  ): AddAddressMessageToSign {
    const address = this.formatAddress(this.walletType, this.signerAddress, this.signerPublicKey);

    var addressToAddFormatted = "";
    // @deprecated toLowerCase remove when we have updated the SDK
    switch (addressToAddType.toLowerCase()) {
      case "evm":
        addressToAddFormatted = `eip712:${addressToAdd}`;
        break;
      case "xrpl":
        addressToAddFormatted = `XRPL:${publicKey}`;
        break;
      case "near":
        addressToAddFormatted = `NEAR:${publicKey?.replace("ed25519:", "")}`;
        break;
      case "stellar":
        addressToAddFormatted = `STELLAR:${addressToAdd}`;
        break;
      case "facesign":
        addressToAddFormatted = `FACESIGN:${publicKey}`;
        break;
      default:
        throw new Error("Invalid address to add type");
    }

    const value = {
      recovering_address: address,
      address_to_add: addressToAddFormatted,
      timestamp: Date.now(),
    };

    return {
      domain: this.getTypedDomain(),
      types: ADD_ADDRESS_TYPES,
      value,
    };
  }

  public removeAddressMessageToSign(
    addressToRemove: string,
    publicKey: string | undefined,
    addressToRemoveType: string,
  ): RemoveAddressMessageToSign {
    const address = this.formatAddress(this.walletType, this.signerAddress, this.signerPublicKey);

    var addressToRemoveFormatted = "";
    // @deprecated toLowerCase remove when we have updated the SDK
    switch (addressToRemoveType.toLowerCase()) {
      case "evm":
        addressToRemoveFormatted = `eip712:${addressToRemove}`;
        break;
      case "xrpl":
        addressToRemoveFormatted = `XRPL:${publicKey}`;
        break;
      case "near":
        addressToRemoveFormatted = `NEAR:${publicKey?.replace("ed25519:", "")}`;
        break;
      case "stellar":
        addressToRemoveFormatted = `STELLAR:${addressToRemove}`;
        break;
      case "facesign":
        addressToRemoveFormatted = `FACESIGN:${publicKey}`;
        break;
      default:
        throw new Error("Invalid address to remove type");
    }

    const value = {
      recovering_address: address,
      address_to_remove: addressToRemoveFormatted,
      timestamp: Date.now(),
    };
    return {
      domain: this.getTypedDomain(),
      types: REMOVE_ADDRESS_TYPES,
      value,
    };
  }

  public async addAddress(
    userId: string,
    message: AddAddressSignatureMessage,
    signature: string,
  ): Promise<string> {
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

  public async removeAddress(
    userId: string,
    message: RemoveAddressSignatureMessage,
    signature: string,
  ): Promise<string> {
    const engineClients = await this.getEngines();
    const promises = [];
    for (let i = 0; i < engineClients.length; i++) {
      const engineClient = engineClients[i];
      promises.push(engineClient.sendRemoveAddress(userId, message, signature));
    }
    const statuses = await Promise.all(promises);
    const successCount = statuses.filter((item: string) => item == "200").length;
    if (successCount == this.numNodes) {
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
        (value) => new EngineClient(value.endpoint, this.contractAddress, this.walletType),
      );
    }
    return this.engines;
  }

  private static blindShare(share: Buffer): Buffer {
    return Buffer.concat([getRandomBytes(32), share]);
  }
}
