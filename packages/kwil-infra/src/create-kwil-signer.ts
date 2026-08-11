import type { Keypair as StellarKeypair } from "@stellar/stellar-sdk";
import type { Wallet as EthersWallet } from "ethers";
import type { KeyPair as NearKeyPair } from "near-api-js";
import type { KeyPair as XrpKeyPair } from "ripple-keypairs/src/types";

import { KwilSigner } from "@idos-network/kwil-js";
import { bs58Encode, hexDecode, hexEncode } from "@idos-network/utils/codecs";
import nacl from "tweetnacl";

import type { WalletType } from "./actions";

import { implicitAddressFromPublicKey } from "./near/create-near-wallet-kwil-signer";
import { kwilNep413Signer } from "./near/nep413";

export { KwilSigner } from "@idos-network/kwil-js";

export type SignerAddress = string;
export type SignerPublicKey = string | undefined;

/**
 * Shape every browser-side signer adapter returns, so `idOSClientWithUserSigner`
 * can be built the same way regardless of which wallet backend produced it.
 */
export interface ClientKwilSignerResult {
  kwilSigner: KwilSigner;
  walletIdentifier: SignerAddress;
  walletPublicKey: SignerPublicKey;
  walletType: WalletType;
}

/**
 * Creates a `KwilSigner` from a raw nacl (ed25519) key pair.
 *
 * This function is explicitly marked as being for backend use only because it doesn't reset
 * the KGW cookie when logging out and re-logging in with a different wallet.
 */
export async function createNaclKwilSigner(
  keypair: nacl.SignKeyPair,
): Promise<[KwilSigner, SignerAddress]> {
  return [
    new KwilSigner(
      async (msg: Uint8Array) => nacl.sign.detached(msg, keypair.secretKey),
      keypair.publicKey,
      "ed25519",
    ),
    implicitAddressFromPublicKey(bs58Encode(keypair.publicKey)),
  ];
}

/** Backend use only, see {@link createNaclKwilSigner}. */
export async function createNearKeyPairKwilSigner(
  keypair: NearKeyPair,
): Promise<[KwilSigner, SignerAddress]> {
  const publicKey = implicitAddressFromPublicKey(keypair.getPublicKey().toString());
  return [new KwilSigner(kwilNep413Signer("idos-issuer")(keypair), publicKey, "nep413"), publicKey];
}

/** Backend use only, see {@link createNaclKwilSigner}. */
export async function createStellarKwilSigner(
  keypair: StellarKeypair,
): Promise<[KwilSigner, SignerAddress]> {
  const publicKeyString = keypair.publicKey();
  const rawPublicKey = keypair.rawPublicKey();
  return [
    new KwilSigner(
      async (msg: Uint8Array) => keypair.sign(Buffer.from(msg)),
      rawPublicKey,
      "ed25519",
    ),
    publicKeyString,
  ];
}

/** Backend use only, see {@link createNaclKwilSigner}. */
export async function createXrplKeyPairKwilSigner(
  keypair: XrpKeyPair,
): Promise<[KwilSigner, SignerAddress]> {
  let xrpKeypair: typeof import("ripple-keypairs");

  try {
    xrpKeypair = await import("ripple-keypairs");
  } catch (e) {
    throw new Error("Can't load ripple-keypairs", { cause: e });
  }

  return [
    new KwilSigner(
      async (msg: Uint8Array) => hexDecode(xrpKeypair.sign(hexEncode(msg), keypair.privateKey)),
      keypair.publicKey,
      "xrpl",
    ),
    keypair.publicKey,
  ];
}

/** Backend use only, see {@link createNaclKwilSigner}. */
export async function createEthersWalletKwilSigner(
  wallet: EthersWallet,
): Promise<[KwilSigner, SignerAddress]> {
  return [new KwilSigner(wallet, wallet.address), wallet.address];
}
