import { createUser as kwilCreateUser } from "@idos-network/kwil-actions/user";
import { upsertWalletAsInserter as kwilUpsertWalletAsInserter } from "@idos-network/kwil-actions/wallets";
import type { idOSUser, idOSWallet } from "./../../types";
import type { IssuerConfig } from "./create-issuer-config";
import { ensureEntityId } from "./internal";

export interface CreateProfileReqParams extends Omit<idOSUser, "id"> {
  id?: string;
}

async function createUserProfile(
  { kwilClient }: IssuerConfig,
  params: CreateProfileReqParams,
): Promise<idOSUser> {
  const payload = ensureEntityId(params);
  await kwilCreateUser(kwilClient, payload);

  return payload;
}

export interface UpsertWalletReqParams extends Omit<idOSWallet, "id"> {
  id?: string;
}

async function upsertWallet(
  { kwilClient }: IssuerConfig,
  params: UpsertWalletReqParams,
): Promise<idOSWallet> {
  const payload = ensureEntityId(params);
  await kwilUpsertWalletAsInserter(kwilClient, payload);

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

  const walletResponse = await upsertWallet(config, walletReqParams);

  // @todo: I am not sure if this is the best way to return the response. Need to think about it.
  return [userResponse, walletResponse];
}
