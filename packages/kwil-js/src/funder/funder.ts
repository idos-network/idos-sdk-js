import { Kwil } from "../client/kwil";
import { AccountKeyType, BroadcastSyncType, EnvironmentType, PayloadType } from "../core/enums";
import { KwilSigner } from "../core/kwilSigner";
import { TransferPayload } from "../core/payload";
import { GenericResponse } from "../core/resreq";
import { Transaction, TxReceipt } from "../core/tx";
import { PayloadTx } from "../transaction/payloadTx";
import { bytesToHex } from "../utils/serial";
import { TransferBody } from "./funding_types";

interface FunderClient {
  broadcastClient(
    tx: Transaction,
    broadcastSync?: BroadcastSyncType,
  ): Promise<GenericResponse<TxReceipt>>;
}

export class Funder<T extends EnvironmentType> {
  private kwil: Kwil<T>;
  private funderClient: FunderClient;
  private chainId: string;

  constructor(kwil: Kwil<T>, funderClient: FunderClient, chainId: string) {
    this.kwil = kwil;
    this.funderClient = funderClient;
    this.chainId = chainId;
  }

  public async transfer(
    payload: TransferBody,
    signer: KwilSigner,
    synchronous?: boolean,
  ): Promise<GenericResponse<TxReceipt>> {
    if (!payload.keyType) {
      payload.keyType = AccountKeyType.SECP256K1;
    }

    if (payload.to instanceof Uint8Array) {
      payload.to = bytesToHex(payload.to);
    }

    const txPayload: TransferPayload = {
      to: {
        identifier: payload.to,
        key_type: payload.keyType,
      },
      amount: payload.amount.toString(),
    };

    const transaction = await PayloadTx.createTx(this.kwil, {
      chainId: this.chainId,
      description: payload.description || "",
      payload: txPayload,
      payloadType: PayloadType.TRANSFER,
      identifier: signer.identifier,
      signer: signer.signer,
      signatureType: signer.signatureType,
    }).buildTx();

    return await this.funderClient.broadcastClient(
      transaction,
      synchronous ? BroadcastSyncType.COMMIT : BroadcastSyncType.SYNC,
    );
  }
}
