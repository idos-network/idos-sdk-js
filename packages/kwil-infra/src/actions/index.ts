import type { KwilActionClient } from "..";
import {
  type AddPassportingClubAsOwnerInput,
  type AddPassportingPeerAsOwnerInput,
  type AddUserAsInserterInput,
  type AddWalletInput,
  addWallet,
  type DwgMessageInput,
  type GetAccessGrantsGrantedInput,
  type GetAccessGrantsGrantedOutput,
  type GetAttributesOutput,
  type GetCredentialSharedOutput,
  type GetCredentialsOutput,
  getAccessGrantsGranted,
  removeWallet,
  type UpsertWalletAsInserterInput,
} from "./actions";

export * from "./actions";

// Name aliases for a better developer experience
export type idOSUser = AddUserAsInserterInput;
export type idOSGrant = GetAccessGrantsGrantedOutput;
export type idOSCredential = GetCredentialSharedOutput;
export type idOSCredentialListItem = GetCredentialsOutput;
export type idOSUserAttribute = GetAttributesOutput;
export type idOSWallet = UpsertWalletAsInserterInput;
export type idOSDelegatedWriteGrant = DwgMessageInput;
export type idOSPassportingPeer = AddPassportingPeerAsOwnerInput;
export type idOSPassportingClub = AddPassportingClubAsOwnerInput;

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
  params: Partial<GetAccessGrantsGrantedInput> = {
    page: 1,
    size: GET_GRANTS_DEFAULT_RECORDS_PER_PAGE,
    user_id: null,
  },
): Promise<idOSGrant[]> {
  return getAccessGrantsGranted(kwilClient, {
    page: params.page ?? 1,
    size: params.size ?? 10,
    user_id: params.user_id ?? null,
  });
}
