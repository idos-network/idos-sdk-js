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
): Promise<UpsertWalletParams> {
  await kwilClient.execute({
    name: "upsert_wallet_as_inserter",
    description: "Add a wallet to idOS",
    inputs: params,
  });

  return params;
}

export interface AddWalletParams {
  id: string;
  address: string;
  public_key: string | null;
  message: string;
  signature: string;
}

export async function addWallet(
  kwilClient: KwilActionClient,
  params: AddWalletParams,
): Promise<AddWalletParams> {
  await kwilClient.execute({
    name: "add_wallet",
    description: "Add a wallet to idOS",
    inputs: params,
  });

  return params;
}

export async function addWallets(
  kwilClient: KwilActionClient,
  params: AddWalletParams[],
): Promise<AddWalletParams[]> {
  await Promise.all(
    params.map((param) =>
      kwilClient.execute({
        name: "add_wallet",
        description: "Add a wallet to idOS",
        inputs: param,
      }),
    ),
  );

  return params;
}

export async function getWallets(kwilClient: KwilActionClient): Promise<idOSWallet[]> {
  return kwilClient.call<idOSWallet[]>({
    name: "get_wallets",
    inputs: {},
  });
}

export async function removeWallet(
  kwilClient: KwilActionClient,
  id: string,
): Promise<{ id: string }> {
  await kwilClient.execute({
    name: "remove_wallet",
    description: "Remove a wallet from idOS",
    inputs: { id },
  });

  return { id };
}

export async function removeWallets(
  kwilClient: KwilActionClient,
  ids: string[],
): Promise<string[]> {
  await Promise.all(
    ids.map((id) =>
      kwilClient.execute({
        name: "remove_wallet",
        description: "Remove a wallet from idOS",
        inputs: { id },
      }),
    ),
  );

  return ids;
}
