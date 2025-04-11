import type { KwilActionClient } from "../kwil-infra";
import type { idOSWallet } from "../types";

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

export interface AddWalletParams {
  id: string;
  address: string;
  public_key: string | null;
  message: string;
  signature: string;
}
export async function addWallet(kwilClient: KwilActionClient, params: AddWalletParams) {
  return kwilClient.execute({
    name: "add_wallet",
    description: "Add a wallet to idOS",
    inputs: params,
  });
}
export async function addWallets(kwilClient: KwilActionClient, params: AddWalletParams[]) {
  return Promise.all(
    params.map((param) =>
      kwilClient.execute({
        name: "add_wallet",
        description: "Add a wallet to idOS",
        inputs: param,
      }),
    ),
  );
}

export function getWallets(kwilClient: KwilActionClient) {
  return kwilClient.call<idOSWallet[]>({
    name: "get_wallets",
    inputs: {},
  });
}

export function removeWallet(kwilClient: KwilActionClient, id: string) {
  return kwilClient.execute({
    name: "remove_wallet",
    description: "Remove a wallet from idOS",
    inputs: { id },
  });
}

export function removeWallets(kwilClient: KwilActionClient, ids: string[]) {
  return Promise.all(
    ids.map((id) =>
      kwilClient.execute({
        name: "remove_wallet",
        description: "Remove a wallet from idOS",
        inputs: { id },
      }),
    ),
  );
}
