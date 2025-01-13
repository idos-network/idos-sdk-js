import {
  type KwilActionClient,
  createNodeKwilClient,
} from "@idos-network/kwil-actions/create-kwil-client";
import { type KwilSigner, NodeKwil } from "@kwilteam/kwil-js";
import { ethers } from "ethers";
import invariant from "tiny-invariant";
import type nacl from "tweetnacl";
import { createKwilSigner } from "./create-kwil-signer";

export interface IssuerConfig {
  chainId: string;
  dbid: string;
  kwilClient: NodeKwil;
  kwilSigner: KwilSigner;
  signingKeyPair: nacl.SignKeyPair;
  kwilActions: KwilActionClient;
  issuerWalletPrivateKey: string;
  issuerEncryptionSecretKey: string;
}

interface CreateIssuerConfigParams {
  chainId?: string;
  dbId?: string;
  nodeUrl: string;
  signingKeyPair: nacl.SignKeyPair;
  issuerWalletPrivateKey: string;
  issuerEncryptionSecretKey: string;
}

const initializeNodeKwil = async (params: CreateIssuerConfigParams) => {
  const kwilAction = await createNodeKwilClient({
    nodeUrl: params.nodeUrl,
    dbId: params.dbId,
  });
  const signer = createKwilSigner(new ethers.Wallet(params.issuerWalletPrivateKey));
  kwilAction.setSigner(signer);
  return kwilAction;
};

export async function createIssuerConfig(params: CreateIssuerConfigParams): Promise<IssuerConfig> {
  const _kwil = new NodeKwil({
    kwilProvider: params.nodeUrl,
    chainId: "",
  });

  const chainId = params.chainId || (await _kwil.chainInfo()).data?.chain_id;
  const dbid =
    params.dbId ||
    (await _kwil.listDatabases()).data?.filter(({ name }) => name === "idos")[0].dbid;

  const kwilActions = await initializeNodeKwil(params);

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
    kwilActions,
    issuerEncryptionSecretKey: params.issuerEncryptionSecretKey,
    issuerWalletPrivateKey: params.issuerWalletPrivateKey,
  };
}
