import type { KwilActionClient } from "../kwil-infra";

export interface UpsertWalletParams {
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
    description: "Add a wallet to idOS",
    inputs: params,
  });
}
