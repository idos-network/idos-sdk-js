import {
  createUser as _createUser,
  upsertWalletAsInserter as _upsertWalletAsInserter,
  type idOSUser,
  type idOSWallet,
} from "@idos-network/core";
import type { IssuerConfig } from "./create-issuer-config";
import { ensureEntityId } from "./internal";

export interface CreateProfileReqParams extends Omit<idOSUser, "id"> {
  id?: string;
}

export async function createUserProfile(
  { kwilClient }: IssuerConfig,
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
  { kwilClient }: IssuerConfig,
  params: UpsertWalletReqParams,
): Promise<idOSWallet> {
  const payload = ensureEntityId(params);
  await _upsertWalletAsInserter(kwilClient, payload);

  return payload;
}

export interface CreateWalletReqParams extends Omit<UpsertWalletReqParams, "user_id"> {}

export async function createUser(
  config: IssuerConfig,
  user: CreateProfileReqParams,
  wallet: CreateWalletReqParams,
) {
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
