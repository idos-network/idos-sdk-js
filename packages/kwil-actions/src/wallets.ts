import type { KwilActionClient } from "./create-kwil-client";

interface UpsertWalletParams {
  id: string;
  user_id: string;
  address: string;
  wallet_type: string;
  message: string;
  public_key: string;
  signature: string;
}

/**
 * Upserts a wallet as an `inserter`.
 */
export async function upsertWalletAsInserter(
  kwilClient: KwilActionClient,
  params: UpsertWalletParams,
) {
  return kwilClient.execute({
    name: "upsert_wallet_as_inserter",
    inputs: params,
  });
}
