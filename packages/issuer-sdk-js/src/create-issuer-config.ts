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

const isNaclSignKeyPair = (o: unknown): o is nacl.SignKeyPair =>
  o !== null &&
  typeof o === "object" &&
  "publicKey" in o &&
  o.publicKey instanceof Uint8Array &&
  o.publicKey.length === nacl.sign.publicKeyLength &&
  "secretKey" in o &&
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

  // Force the check that signer is never.
  // If these lines start complaining, that means we're missing an `if` above.
  return ((_: never) => {
    throw new Error("Invalid signer type");
  })(signer);
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

export type CreateIssuerConfigParams2 = {
  nodeUrl: string;
  signer: nacl.SignKeyPair;
  encrypter: nacl.BoxKeyPair;
  chainId?: string;
  dbId?: string;
};
export async function createIssuerConfig2(
  params: CreateIssuerConfigParams2,
): Promise<IssuerConfig2> {
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
    kwilSigner: createKwilSigner(params.signer),
    signer: params.signer,
    encrypter: params.encrypter,
  };
}

export interface IssuerConfig2 {
  chainId: string;
  dbid: string;
  kwilClient: NodeKwil;
  signer: nacl.SignKeyPair;
  kwilSigner: KwilSigner;
  encrypter: nacl.SignKeyPair;
}
