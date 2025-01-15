import { type KwilSigner, NodeKwil } from "@kwilteam/kwil-js";
import invariant from "tiny-invariant";
import type nacl from "tweetnacl";
import { createKwilSigner } from "./create-kwil-signer";

export interface IssuerConfig {
  chainId: string;
  dbid: string;
  kwilClient: NodeKwil;
  kwilSigner: KwilSigner;
  signingKeyPair: nacl.SignKeyPair;
  encryptionSecretKey: Uint8Array;
}

interface CreateIssuerConfigParams {
  chainId?: string;
  dbId?: string;
  nodeUrl: string;
  signingKeyPair: nacl.SignKeyPair;
  encryptionSecretKey: Uint8Array;
}

export async function createIssuerConfig(params: CreateIssuerConfigParams): Promise<IssuerConfig> {
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

  return {
    chainId,
    dbid,
    kwilClient: new NodeKwil({
      kwilProvider: params.nodeUrl,
      chainId,
    }),
    kwilSigner: createKwilSigner(params.signingKeyPair),
    signingKeyPair: params.signingKeyPair,
    encryptionSecretKey: params.encryptionSecretKey,
  };
}
