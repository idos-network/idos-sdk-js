import type { WalletType } from "@idos-network/kwil-infra/actions";
import { ethers } from "ethers";
import nacl from "tweetnacl";
import { type HeadersInit, patchRequest, postRequest, putRequest } from "./api";
import type {
  AddAddressRequest,
  Bytes,
  DownloadRequest,
  EncryptedShare,
  PbcAddress,
  RemoveAddressRequest,
  Sharing,
  UpdateWalletsRequest,
} from "./types";

export class EngineClient {
  private readonly baseUrl: string;
  private readonly contractAddress: PbcAddress;
  private readonly walletType: WalletType;

  constructor(baseUrl: string, contractAddress: PbcAddress, walletType: WalletType) {
    this.contractAddress = contractAddress;
    this.baseUrl = baseUrl;
    this.walletType = walletType;
  }

  private getAuthHeader(signature: string): Record<string, string> {
    let prefix: string;
    switch (this.walletType) {
      case "EVM":
        prefix = "eip712";
        break;
      case "NEAR":
        prefix = "NEAR";
        break;
      case "XRPL":
        prefix = "XRPL";
        break;
      case "Stellar":
        prefix = "STELLAR";
        break;
      case "FaceSign":
        prefix = "FACESIGN";
        break;
      default:
        prefix = "eip712"; // fallback to eip712 for unknown types
    }

    return {
      Authorization: `${prefix} ${signature}`,
    };
  }

  public async sendUpload(id: string, uploadRequest: Sharing, signature: Bytes): Promise<string> {
    const authHeader = this.getAuthHeader(signature);
    const url = `${this.baseUrl}/offchain/${this.contractAddress}/shares/${id}`;
    const status = await putRequest(url, uploadRequest, authHeader);
    if (status !== "200" && status !== "201") {
      throw new Error(`Error uploading share to ${this.contractAddress} at ${url}, got status: ${status}`);
    }
    return status;
  }

  public async sendDownload(
    id: string,
    downloadRequest: DownloadRequest,
    signature: Bytes,
  ): Promise<{ status: string; body: EncryptedShare | undefined }> {
    const authHeader = this.getAuthHeader(signature);
    const url = `${this.baseUrl}/offchain/${this.contractAddress}/shares/${id}`;
    return await postRequest(url, downloadRequest, authHeader);
  }

  public async downloadAndDecrypt(
    id: string,
    downloadRequest: DownloadRequest,
    signature: Bytes,
    secretKey: Uint8Array,
  ): Promise<{ share: Buffer | undefined; status: string }> {
    const { status, body: encryptedShare } = await this.sendDownload(
      id,
      downloadRequest,
      signature,
    );
    if (encryptedShare === undefined) {
      return { share: undefined, status };
    }
    const encryptedBuffer = ethers.getBytes(encryptedShare.encrypted_share);
    const publicKeyBuffer = ethers.getBytes(encryptedShare.public_key);
    const nonceBuffer = ethers.getBytes(encryptedShare.nonce);
    const open = nacl.box.open(encryptedBuffer, nonceBuffer, publicKeyBuffer, secretKey);
    if (open == null) {
      return { share: undefined, status: "box-open-error" };
    }
    // Remove blinding
    return { share: Buffer.from(open.subarray(32)), status };
  }

  public async sendUpdate(
    id: string,
    updateRequest: UpdateWalletsRequest,
    signature: string,
  ): Promise<string> {
    const authHeader: HeadersInit = {
      Authorization: `eip712 ${signature}`,
    };

    const url = `${this.baseUrl}/offchain/${this.contractAddress}/shares/${id}`;
    const ok = await patchRequest(url, updateRequest, authHeader);

    if (!ok) {
      throw new Error(`Error updating wallets to ${this.contractAddress} at ${url}`);
    }

    return ok;
  }

  public async sendAddAddress(
    id: string,
    addRequest: AddAddressRequest,
    signature: string,
  ): Promise<string> {
    const authHeader = this.getAuthHeader(signature);
    const url = `${this.baseUrl}/offchain/${this.contractAddress}/shares/${id}/add_address`;
    const status = await patchRequest(url, addRequest, authHeader);
    if (status !== "200") {
      throw new Error(`Error adding a wallet to ${id} at ${url}`);
    }

    return status;
  }

  public async sendRemoveAddress(
    id: string,
    removeRequest: RemoveAddressRequest,
    signature: string,
  ): Promise<string> {
    const authHeader = this.getAuthHeader(signature);
    const url = `${this.baseUrl}/offchain/${this.contractAddress}/shares/${id}/remove_address`;
    const status = await patchRequest(url, removeRequest, authHeader);
    if (status !== "200") {
      throw new Error(`Error removing address from ${id} at ${url}`);
    }

    return status;
  }
}
