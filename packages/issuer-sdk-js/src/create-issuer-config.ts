import { KwilSigner, NodeKwil } from "@kwilteam/kwil-js";
import { Wallet } from "ethers";
import { KeyPair } from "near-api-js";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";
import { implicitAddressFromPublicKey, kwilNep413Signer } from "../../kwil-nep413-signer/src";

type SignerType = Wallet | KeyPair | nacl.SignKeyPair;

export interface CreateIssuerConfigParams {
  nodeUrl: string;
  encryptionSecret: string;
  signer: SignerType;
  chainId?: string;
  dbId?: string;
}

// biome-ignore lint/suspicious/noExplicitAny: How am I expect to do type narrowing without `any`s? :x
const isNaclSignKeyPair = (o: any): o is nacl.SignKeyPair =>
  o.publicKey instanceof Uint8Array &&
  o.publicKey.length === nacl.sign.publicKeyLength &&
  o.secretKey instanceof Uint8Array &&
  o.secretKey.length === nacl.sign.secretKeyLength;

function createKwilSigner(signer: SignerType): KwilSigner {
  if (isNaclSignKeyPair(signer)) {
    return new KwilSigner(
      async (msg: Uint8Array) => nacl.sign.detached(msg, signer.secretKey),
      signer.publicKey,
      "ed25519",
    );
  }

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

  return { chainId, dbid, kwilClient, signer, encryptionSecret: params.encryptionSecret };
}

export type IssuerConfig = Awaited<ReturnType<typeof createIssuerConfig>>;

export interface CreateIssuerConfigParams2 {
  nodeUrl: string;
  signer: SignerType;
  chainId?: string;
  dbId?: string;
}
export async function createIssuerConfig2(params: CreateIssuerConfigParams2) {
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

  return { chainId, dbid, kwilClient, signer };
}

export type IssuerConfig2 = Awaited<ReturnType<typeof createIssuerConfig2>>;
