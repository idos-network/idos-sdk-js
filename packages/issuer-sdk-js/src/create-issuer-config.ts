import {
  type KwilActionClient,
  createNodeKwilClient,
} from "@idos-network/kwil-actions/create-kwil-client";
import { createKwilSigner } from "@idos-network/kwil-actions/create-kwil-signer";
import { NodeKwil } from "@kwilteam/kwil-js";
import invariant from "tiny-invariant";
import type nacl from "tweetnacl";

export interface IssuerConfig {
  chainId: string;
  dbid: string;
  kwilClient: KwilActionClient;
  signingKeyPair: nacl.SignKeyPair;
  encryptionSecretKey: Uint8Array;
}

type CreateIssuerConfigParams = {
  chainId?: string;
  dbId?: string;
  nodeUrl: string;
  signingKeyPair: nacl.SignKeyPair;
  encryptionSecretKey: Uint8Array;
};

export async function createIssuerConfig(params: CreateIssuerConfigParams): Promise<IssuerConfig> {
  const _kwil = new NodeKwil({
    kwilProvider: params.nodeUrl,
    chainId: "",
  });

  const chainId = params.chainId || (await _kwil.chainInfo()).data?.chain_id;
  const dbId =
    params.dbId ||
    (await _kwil.listDatabases()).data?.filter(({ name }) => name === "idos")[0].dbid;

  invariant(chainId, "Can't discover `chainId`. You must pass it explicitly.");
  invariant(dbId, "Can't discover `dbId`. You must pass it explicitly.");

  const kwilClient = await createNodeKwilClient({
    nodeUrl: params.nodeUrl,
    chainId,
    dbId,
  });

  const [kwilSigner] = createKwilSigner(params.signingKeyPair);
  kwilClient.setSigner(kwilSigner);

  return {
    chainId,
    dbid: dbId,
    kwilClient,
    signingKeyPair: params.signingKeyPair,
    encryptionSecretKey: params.encryptionSecretKey,
  };
}
