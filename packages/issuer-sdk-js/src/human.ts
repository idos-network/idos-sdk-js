import type { idOSHuman, idOSWallet } from "@idos-network/idos-sdk-types";
import type { CreateIssuerConfig } from "./create-issuer-config";
import { createActionInput } from "./internal";

interface CreateProfileReqParams extends idOSHuman {}

async function createHumanProfile(
  { dbid, kwilClient, signer }: CreateIssuerConfig,
  params: CreateProfileReqParams,
) {
  const response = await kwilClient.execute(
    {
      name: "add_human_as_inserter",
      dbid,
      inputs: [createActionInput(params)],
    },
    signer,
    true,
  );

  return response.data?.tx_hash;
}

interface UpsertWalletReqParams extends idOSWallet {}

async function upsertWallet(
  { dbid, kwilClient, signer }: CreateIssuerConfig,
  params: UpsertWalletReqParams,
) {
  const response = await kwilClient.execute(
    {
      name: "upsert_wallet_as_inserter",
      dbid,
      inputs: [createActionInput(params)],
    },
    signer,
    true,
  );

  return response.data?.tx_hash;
}

export async function createHuman(
  config: CreateIssuerConfig,
  current_public_key: string,
  wallet: Omit<UpsertWalletReqParams, "id" | "human_id">,
) {
  const human_id = crypto.randomUUID();
  const wallet_id = crypto.randomUUID();

  const humanReqParams = {
    current_public_key,
    id: human_id,
  };

  const human_tx_hash = await createHumanProfile(config, humanReqParams);

  const walletReqParams = {
    ...wallet,
    human_id,
    id: wallet_id,
  };

  const wallet_tx_hash = await upsertWallet(config, walletReqParams);

  return [
    {
      tx_hash: human_tx_hash,
      data: {
        ...humanReqParams,
      },
    },
    {
      tx_hash: wallet_tx_hash,
      data: {
        ...walletReqParams,
      },
    },
  ];
}
