import { KwilSigner, NodeKwil } from "@kwilteam/kwil-js";
import * as Base64Codec from "@stablelib/base64";
import { Wallet } from "ethers";
import { KeyPair } from "near-api-js";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";
import { implicitAddressFromPublicKey, kwilNep413Signer } from "../../kwil-nep413-signer/src";

export interface CreateIssuerConfigParams {
  nodeUrl: string;
  encryptionSecret: string;
  signer: Wallet | KeyPair;
  chainId?: string;
  dbId?: string;
}

function createKwilSigner(signer: Wallet | KeyPair): KwilSigner {
  if (signer instanceof Wallet) {
    return new KwilSigner(signer, signer.address);
  }

  if (signer instanceof KeyPair) {
    return new KwilSigner(
      kwilNep413Signer("idos-issuer")(signer),
      implicitAddressFromPublicKey(signer.getPublicKey().toString()),
      "nep413",
    );
  }

  throw new Error("Invalid signer type");
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

  const signer = createKwilSigner(params.signer);
  const encryptionSecretKey = Base64Codec.decode(params.encryptionSecret);
  const encryptionKeyPair = nacl.box.keyPair.fromSecretKey(encryptionSecretKey);

  return { chainId, dbid, kwilClient, signer, encryptionKeyPair };
}

export type IssuerConfig = Awaited<ReturnType<typeof createIssuerConfig>>;
