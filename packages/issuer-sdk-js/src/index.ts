import { KwilSigner, NodeKwil, Utils } from "@kwilteam/kwil-js";
import type { Wallet } from "ethers";
import invariant from "tiny-invariant";

interface CreateIssuerConfigParams {
  nodeUrl: string;
  privateKey: string;
  signer: Wallet;
  chainId?: string;
  dbId?: string;
}

export async function createIssuerConfig(params: CreateIssuerConfigParams) {
  const _kwil = new NodeKwil({
    kwilProvider: params.nodeUrl,
    chainId: "",
  });

  const chainId = params.chainId || (await _kwil.chainInfo()).data?.chain_id;
  const dbid =
    params.dbId ||
    (await _kwil.listDatabases()).data?.filter(({ name }) => name === "idos")[0].dbid;

  invariant(chainId, "Can't discover `chainId`. You must pass it explicitly.");
  invariant(dbid, "Can't discover `dbId`. You must pass it explicitly.");

  const kwilClient = new NodeKwil({
    kwilProvider: params.nodeUrl,
    chainId,
  });

  const signer = new KwilSigner(params.signer, params.signer.address);

  return { chainId, dbid, kwilClient, signer };
}

type CreateIssuerConfig = Awaited<ReturnType<typeof createIssuerConfig>>;

interface CreateProfileReqParams {
  id: string;
  current_public_key: string;
}

export async function createHumanProfile(
  { dbid, kwilClient, signer }: CreateIssuerConfig,
  params: CreateProfileReqParams,
) {
  const response = await kwilClient.execute(
    {
      name: "add_human_as_inserter",
      dbid,
      inputs: [
        Utils.ActionInput.fromObject(
          Object.fromEntries(Object.entries(params).map(([key, value]) => [`$${key}`, value])),
        ),
      ],
    },
    signer,
    true,
  );

  return response.data?.tx_hash;
}
