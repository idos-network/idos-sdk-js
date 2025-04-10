import type { idOSUser, idOSWallet } from "@idos-network/core";
import {
  createUser as _createUser,
  hasProfile as _hasProfile,
  upsertWalletAsInserter as _upsertWalletAsInserter,
} from "@idos-network/core/kwil-actions";
import { ensureEntityId } from "../utils";
import type { IssuerServerConfig } from "./create-issuer-server-config";

export async function hasProfile(
  { kwilClient }: IssuerServerConfig,
  userAddress: string,
): Promise<boolean> {
  return _hasProfile(kwilClient, userAddress);
}

export interface CreateProfileReqParams extends Omit<idOSUser, "id"> {
  id?: string;
}

export async function createUserProfile(
  { kwilClient }: IssuerServerConfig,
  params: CreateProfileReqParams,
): Promise<idOSUser> {
  const payload = ensureEntityId(params);
  await _createUser(kwilClient, payload);

  return payload;
}

export interface UpsertWalletReqParams extends Omit<idOSWallet, "id"> {
  id?: string;
}

export async function upsertWalletAsInserter(
  { kwilClient }: IssuerServerConfig,
  params: UpsertWalletReqParams,
): Promise<idOSWallet> {
  const payload = ensureEntityId(params);
  await _upsertWalletAsInserter(kwilClient, payload);

  return payload;
}

export interface CreateWalletReqParams extends Omit<UpsertWalletReqParams, "user_id"> {}

export async function createUser(
  config: IssuerServerConfig,
  user: CreateProfileReqParams,
  wallet: CreateWalletReqParams,
): Promise<[idOSUser, idOSWallet]> {
  const user_id = user.id ?? crypto.randomUUID();
  const wallet_id = wallet.id ?? crypto.randomUUID();

  const userReqParams = {
    ...user,
    id: user_id,
  };

  const userResponse = await createUserProfile(config, userReqParams);

  const walletReqParams = {
    ...wallet,
    user_id,
    id: wallet_id,
  };

  const walletResponse = await upsertWalletAsInserter(config, walletReqParams);

  // @todo: I am not sure if this is the best way to return the response. Need to think about it.
  return [userResponse, walletResponse];
}
