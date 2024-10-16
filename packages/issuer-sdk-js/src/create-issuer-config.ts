import { KwilSigner, NodeKwil } from "@kwilteam/kwil-js";
import type { Wallet } from "ethers";
import invariant from "tiny-invariant";
import { RevokerKeys } from "./revoker";

export interface CreateIssuerConfigParams {
  nodeUrl: string;
  secretKey: string;
  signer: Wallet;
  chainId?: string;
  dbId?: string;
  revokationSigningKeys: RevokerKeys;
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

  return {
    chainId,
    dbid,
    kwilClient,
    signer,
    secretKey: params.secretKey,
    revokationSigningKeys: params.revokationSigningKeys,
  };
}

export type CreateIssuerConfig = Awaited<ReturnType<typeof createIssuerConfig>>;
