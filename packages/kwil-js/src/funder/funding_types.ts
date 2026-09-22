/**
 * `TransferBody` is the body of a transfer request.
 *
 * @param to The address / identifier to transfer to. Can be a hex string or a Uint8Array.
 * @param keyType The key type of the address. Defaults to 'secp256k1'.
 * @param amount The amount to transfer.
 * @param description A description of the transfer. Optional.
 */
export interface TransferBody {
  to: string | Uint8Array;
  keyType?: string;
  amount: bigint;
  description?: string;
}
