import { idOS } from "@idos-network/grantee-sdk-js";
import { KwilSigner, NodeKwil } from "@kwilteam/kwil-js";
import { KeyPair } from "near-api-js";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";
import { implicitAddressFromPublicKey, kwilNep413Signer } from "../../kwil-nep413-signer/src";

function isNaclSignKeyPair(object: unknown): object is nacl.SignKeyPair {
  return (
    object !== null &&
    typeof object === "object" &&
    "publicKey" in object &&
    object.publicKey instanceof Uint8Array &&
    object.publicKey.length === nacl.sign.publicKeyLength &&
    "secretKey" in object &&
    object.secretKey instanceof Uint8Array &&
    object.secretKey.length === nacl.sign.secretKeyLength
  );
}

type SignerType = KeyPair | nacl.SignKeyPair;

function createKwilSigner(signer: SignerType): KwilSigner {
  if (isNaclSignKeyPair(signer)) {
    return new KwilSigner(
      async (msg: Uint8Array) => nacl.sign.detached(msg, signer.secretKey),
      signer.publicKey,
      "ed25519",
    );
  }

  if (signer instanceof KeyPair) {
    return new KwilSigner(
      kwilNep413Signer("idos-issuer")(signer),
      implicitAddressFromPublicKey(signer.getPublicKey().toString()),
      "nep413",
    );
  }

  // Force the check that `signer` is never.
  // If these lines start complaining, that means we're missing an `if` above.
  return ((_: never) => {
    throw new Error("Invalid signer type");
  })(signer);
}

interface IssuerSecrets {
  issuerWalletPrivateKey: string;
  issuerEncryptionSecretKey: string;
}

export interface IssuerConfig extends IssuerSecrets {
  chainId: string;
  dbid: string;
  kwilClient: NodeKwil;
  kwilSigner: KwilSigner;
  signingKeyPair: nacl.SignKeyPair;
  sdk: idOS;
}

interface CreateIssuerConfigParams extends IssuerSecrets {
  chainId?: string;
  dbId?: string;
  nodeUrl: string;
  signingKeyPair: nacl.SignKeyPair;
}

export async function createIssuerConfig(params: CreateIssuerConfigParams): Promise<IssuerConfig> {
  const _kwil = new NodeKwil({
    kwilProvider: params.nodeUrl,
    chainId: "",
  });

  const sdk = await idOS.init(
    "EVM",
    params.issuerWalletPrivateKey,
    params.issuerEncryptionSecretKey,
    params.nodeUrl,
    params.dbId!,
  );

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
    issuerEncryptionSecretKey: params.issuerEncryptionSecretKey,
    issuerWalletPrivateKey: params.issuerWalletPrivateKey,
    sdk,
  };
}
