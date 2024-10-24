import * as Base64Codec from "@stablelib/base64";
import nacl from "tweetnacl";
import type { idOSHuman, idOSWallet } from "../../types";
import type { IssuerConfig } from "./create-issuer-config";
import { createActionInput, ensureEntityId, idOSKeyDerivation } from "./internal";

interface CreateProfileReqParams extends Omit<idOSHuman, "id"> {
  id?: string;
}

export async function derivePublicKeyFromPassword({
  password,
  humanId,
}: { password: string; humanId: string }): Promise<string> {
  const secretKey = await idOSKeyDerivation({ password, salt: humanId });
  const keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
  return Base64Codec.encode(keyPair.publicKey);
}

async function createHumanProfile(
  { dbid, kwilClient, signer }: IssuerConfig,
  params: CreateProfileReqParams,
): Promise<idOSHuman> {
  const payload = ensureEntityId(params);
  await kwilClient.execute(
    {
      name: "add_human_as_inserter",
      dbid,
      inputs: [createActionInput(payload)],
    },
    signer,
    true,
  );

  return payload;
}

interface UpsertWalletReqParams extends Omit<idOSWallet, "id"> {
  id?: string;
}

async function upsertWallet(
  { dbid, kwilClient, signer }: IssuerConfig,
  params: UpsertWalletReqParams,
): Promise<idOSWallet> {
  const payload = ensureEntityId(params);
  await kwilClient.execute(
    {
      name: "upsert_wallet_as_inserter",
      dbid,
      inputs: [createActionInput(payload)],
    },
    signer,
    true,
  );

  return payload;
}

export async function createHuman(
  config: IssuerConfig,
  human: CreateProfileReqParams,
  wallet: Omit<UpsertWalletReqParams, "human_id">,
) {
  const human_id = human.id ?? crypto.randomUUID();
  const wallet_id = wallet.id ?? crypto.randomUUID();

  const humanReqParams = {
    ...human,
    id: human_id,
  };

  const humanResponse = await createHumanProfile(config, humanReqParams);

  const walletReqParams = {
    ...wallet,
    human_id,
    id: wallet_id,
  };

  const walletResponse = await upsertWallet(config, walletReqParams);

  // @todo: I am not sure if this is the best way to return the response. Need to think about it.
  return [humanResponse, walletResponse];
}
