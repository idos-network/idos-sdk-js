import type { KwilActionClient } from "../kwil-infra";
import {
  type AddWalletInput,
  addWallet,
  type GetGrantsPaginatedInput,
  getGrantsPaginated,
  type idOSGrant,
  removeWallet,
} from "./actions";

export * from "./actions";

export async function addWallets(
  kwilClient: KwilActionClient,
  wallets: AddWalletInput[],
): Promise<void> {
  await Promise.all(wallets.map((wallet) => addWallet(kwilClient, wallet)));
}

export async function removeWallets(kwilClient: KwilActionClient, ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => removeWallet(kwilClient, { id })));
}

export const GET_GRANTS_DEFAULT_RECORDS_PER_PAGE = 10;

export async function getGrants(
  kwilClient: KwilActionClient,
  params: GetGrantsPaginatedInput = {
    page: 1,
    size: GET_GRANTS_DEFAULT_RECORDS_PER_PAGE,
    user_id: null,
  },
): Promise<idOSGrant[]> {
  return getGrantsPaginated(kwilClient, {
    page: params.page ?? 1,
    size: params.size ?? 10,
    user_id: params.user_id ?? null,
  });
}
