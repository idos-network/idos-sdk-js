import type { idOSHuman, idOSWallet } from "@idos-network/idos-sdk-types";
import type { CreateIssuerConfig } from "./create-issuer-config";
import { createActionInput, ensureEntityId } from "./internal";

interface CreateProfileReqParams extends Omit<idOSHuman, "id"> {
  id?: string;
}

async function createHumanProfile(
  { dbid, kwilClient, signer }: CreateIssuerConfig,
  params: CreateProfileReqParams,
) {
  const response = await kwilClient.execute(
    {
      name: "add_human_as_inserter",
      dbid,
      inputs: [createActionInput(ensureEntityId(params))],
    },
    signer,
    true,
  );

  return response.data?.tx_hash;
}

interface UpsertWalletReqParams extends Omit<idOSWallet, "id"> {
  id?: string;
}

async function upsertWallet(
  { dbid, kwilClient, signer }: CreateIssuerConfig,
  params: UpsertWalletReqParams,
) {
  const response = await kwilClient.execute(
    {
      name: "upsert_wallet_as_inserter",
      dbid,
      inputs: [createActionInput(ensureEntityId(params))],
    },
    signer,
    true,
  );

  return response.data?.tx_hash;
}

export async function createHuman(
  config: CreateIssuerConfig,
  human: CreateProfileReqParams,
  wallet: Omit<UpsertWalletReqParams, "human_id">,
) {
  const human_id = human.id ?? crypto.randomUUID();
  const wallet_id = wallet.id ?? crypto.randomUUID();

  const humanReqParams = {
    ...human,
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
