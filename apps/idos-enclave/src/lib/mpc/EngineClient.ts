import { ethers } from "ethers";
import nacl from "tweetnacl";
import { patchRequest, postRequest, putRequest } from "./Api";
import type {
  Bytes,
  DownloadRequest,
  EncryptedShare,
  PbcAddress,
  Sharing,
  UpdateWalletsRequest,
} from "./Types";

export class EngineClient {
  private readonly baseUrl: string;
  private readonly contractAddress: PbcAddress;

  constructor(baseUrl: string, contractAddress: PbcAddress) {
    this.contractAddress = contractAddress;
    this.baseUrl = baseUrl;
  }

  public async sendUpload(id: string, uploadRequest: Sharing, signature: Bytes): Promise<string> {
    const authHeader: HeadersInit = {
      Authorization: `eip712 ${signature}`,
    };
    // TODO: remove this once the baseUrl is updated to https
    const url =
      this.baseUrl.replace(/^http:\/\//, "https://") +
      "/offchain/" +
      this.contractAddress +
      "/shares/" +
      id;
    const status = await putRequest(url, uploadRequest, authHeader);
    if (status !== "201") {
      throw new Error(`Error uploading share to ${this.contractAddress} at ${url}`);
    }
    return status;
  }

  public async sendDownload(
    id: string,
    downloadRequest: DownloadRequest,
    signature: Bytes,
  ): Promise<{ status: string; body: EncryptedShare | undefined }> {
    const authHeader: HeadersInit = {
      Authorization: `eip712 ${signature}`,
    };
    // TODO: remove this once the baseUrl is updated to https
    const url =
      this.baseUrl.replace(/^http:\/\//, "https://") +
      "/offchain/" +
      this.contractAddress +
      "/shares/" +
      id;
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

  public async sendUpdate(id: string, updateRequest: UpdateWalletsRequest, signature: string) {
    const authHeader: HeadersInit = {
      Authorization: `eip712 ${signature}`,
    };
    const url = `${this.baseUrl}/offchain/${this.contractAddress}/shares/${id}`;
    const ok = await patchRequest(url, updateRequest, authHeader);
    if (!ok) {
      throw new Error(`Error updating wallets to ${this.contractAddress} at ${url}`);
    }
  }
}
