import type { idOSHuman, idOSWallet } from "@idos-network/idos-sdk-types";
import type { CreateIssuerConfig } from "./create-issuer-config";
import { createActionInput } from "./internal";

interface CreateProfileReqParams extends Omit<idOSHuman, "id"> {}

export async function createHumanProfile(
  { dbid, kwilClient, signer }: CreateIssuerConfig,
  params: CreateProfileReqParams,
) {
  const id = crypto.randomUUID();
  const response = await kwilClient.execute(
    {
      name: "add_human_as_inserter",
      dbid,
      inputs: [createActionInput({ ...params, id })],
    },
    signer,
    true,
  );

  return response.data?.tx_hash;
}

interface CreateWalletReqParams extends Omit<idOSWallet, "id"> {}

export async function createWallet(
  { dbid, kwilClient, signer }: CreateIssuerConfig,
  params: CreateWalletReqParams,
) {
  const id = crypto.randomUUID();
  const response = await kwilClient.execute(
    {
      name: "upsert_wallet_as_inserter",
      dbid,
      inputs: [createActionInput({ ...params, id })],
    },
    signer,
    true,
  );

  return response.data?.tx_hash;
}
