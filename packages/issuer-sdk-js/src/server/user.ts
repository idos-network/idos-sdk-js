import type { idOSUser, idOSWallet } from "@idos-network/core/types";
import type { IssuerConfig } from "./create-issuer-config";
import { createActionInput, ensureEntityId } from "./internal";

export interface CreateProfileReqParams extends Omit<idOSUser, "id"> {
  id?: string;
}

async function createUserProfile(
  { kwilClient, kwilSigner }: IssuerConfig,
  params: CreateProfileReqParams,
): Promise<idOSUser> {
  const payload = ensureEntityId(params);
  await kwilClient.execute(
    {
      name: "add_user_as_inserter",
      inputs: [createActionInput(payload)],
    },
    kwilSigner,
    true,
  );

  return payload;
}

export interface UpsertWalletReqParams extends Omit<idOSWallet, "id"> {
  id?: string;
}

async function upsertWallet(
  { kwilClient, kwilSigner }: IssuerConfig,
  params: UpsertWalletReqParams,
): Promise<idOSWallet> {
  const payload = ensureEntityId(params);
  await kwilClient.execute(
    {
      name: "upsert_wallet_as_inserter",
      inputs: [createActionInput(payload)],
    },
    kwilSigner,
    true,
  );

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
