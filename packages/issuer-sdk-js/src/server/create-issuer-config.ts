import { implicitAddressFromPublicKey, kwilNep413Signer } from "@idos-network/core";
import { KwilSigner, NodeKwil } from "@kwilteam/kwil-js";
import { KeyPair } from "near-api-js";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

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

export interface IssuerConfig {
  chainId: string;
  kwilClient: NodeKwil;
  kwilSigner: KwilSigner;
  signingKeyPair: nacl.SignKeyPair;
  encryptionSecretKey: Uint8Array;
}

type CreateIssuerConfigParams = {
  chainId?: string;
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

  invariant(chainId, "Can't discover `chainId`. You must pass it explicitly.");

  return {
    chainId,
    kwilClient: new NodeKwil({
      kwilProvider: params.nodeUrl,
      chainId,
    }),
    kwilSigner: createKwilSigner(params.signingKeyPair),
    signingKeyPair: params.signingKeyPair,
    encryptionSecretKey: params.encryptionSecretKey,
  };
}
