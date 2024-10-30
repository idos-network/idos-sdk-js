import * as Base64Codec from "@stablelib/base64";
import * as HexCodec from "@stablelib/hex";
import * as Utf8Codec from "@stablelib/utf8";
import nacl from "tweetnacl";

// ---

interface IdvDataResult {
  pii: {
    numberOfLimbs: string;
  };
  verificationStatus: string;
}

export const idvData = (): IdvDataResult => {
  return {
    pii: {
      numberOfLimbs: "4",
    },
    verificationStatus: "approved",
  };
};

// ---

type JsonArg = Parameters<typeof JSON.stringify>[0];
const toBytes = (obj: JsonArg): Uint8Array => Utf8Codec.encode(JSON.stringify(obj));

const encrypt = (
  message: Uint8Array,
  senderSecretKey: Uint8Array,
  receiverPublicKey: Uint8Array,
) => {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encrypted = nacl.box(message, nonce, receiverPublicKey, senderSecretKey);

  if (encrypted === null) throw Error(`Couldn't encrypt.`);

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce, 0);
  fullMessage.set(encrypted, nonce.length);

  return fullMessage;
};

const fakeProof = (payload: object, issuerAttestationSecretKey: Uint8Array) => {
  // nacl.sign is not the right thing to call, but it's enough for us to show that
  // the wires add up.
  return nacl.sign(toBytes(payload), issuerAttestationSecretKey);
};

const attestW3cProof = <T extends object>(payload: T, issuerAttestationSecretKey: Uint8Array) => {
  return {
    ...payload,
    proof: fakeProof(payload, issuerAttestationSecretKey),
  };
};

const makeW3cCredential = (idvData: object, issuerAttestationSecretKey: Uint8Array) => {
  const protoW3cVc = {
    id: "something that makes sense for a VC",
    context: ["etc"],
    credentialSubject: idvData,
  };

  return attestW3cProof(protoW3cVc, issuerAttestationSecretKey);
};

const makePublicNotes = (plaintextW3cVc: ReturnType<typeof makeW3cCredential>): object => {
  return { credentialId: plaintextW3cVc.id, riskScore: 4 };
};

interface IssuerResult {
  w3cVc: Uint8Array;

  publicNotes: object;
  publicNotesSignature: Uint8Array;

  broaderSignature: Uint8Array;

  issuerAuthenticationPublicKey: Uint8Array;
  issuerEncryptionPublicKey: Uint8Array;

  humanId: string;
}

export const issuer = (
  idvData: IdvDataResult,
  humanId: string,
  userEncryptionPublicKey: Uint8Array,
  issuerEncryptionSecretKey: Uint8Array,
  issuerAttestationSecretKey: Uint8Array,
  issuerAuthenticationSecretKey: Uint8Array,
): IssuerResult => {
  const plaintextW3cVc = makeW3cCredential(idvData, issuerAttestationSecretKey);

  const w3cVc = encrypt(
    toBytes(plaintextW3cVc),
    issuerEncryptionSecretKey,
    userEncryptionPublicKey,
  );

  const publicNotes = makePublicNotes(plaintextW3cVc);
  const publicNotesSignature = nacl.sign(toBytes(publicNotes), issuerAuthenticationSecretKey);

  return {
    humanId,

    w3cVc,

    publicNotes,
    publicNotesSignature,

    broaderSignature: nacl.sign(
      Uint8Array.from([...publicNotesSignature, ...w3cVc]),
      issuerAuthenticationSecretKey,
    ),

    issuerAuthenticationPublicKey: nacl.sign.keyPair.fromSecretKey(issuerAuthenticationSecretKey)
      .publicKey,
    issuerEncryptionPublicKey: nacl.sign.keyPair.fromSecretKey(issuerEncryptionSecretKey).publicKey,
  };
};

// ---
import { createIssuerConfig2 } from "@idos-network/issuer-sdk-js/create-issuer-config";
import {
  createCredentialByGrant2,
  createCredentialPermissioned2,
} from "@idos-network/issuer-sdk-js/credentials";
import { Wallet } from "ethers";

export const inserterIssuerPermissioned = async (
  issuer: IssuerResult,
  inserterAuthenticationSecretKey: Uint8Array,
) => {
  // TODO: creds2: This is not an EVM wallet, it's an ed25519 key. How do I tell that to Kwill?
  const issuerAuthenticationWallet = new Wallet(HexCodec.encode(inserterAuthenticationSecretKey));

  if (!process.env.IDOS_NODE_URL) throw new Error("Missing IDOS_NODE_URL");
  const issuerConfig = await createIssuerConfig2({
    nodeUrl: process.env.IDOS_NODE_URL,
    signer: issuerAuthenticationWallet,
  });

  // Here's how it looked like in the old model
  //
  // const createdCredential = createCredentialPermissioned(issuerConfig, {
  //   issuer: Base64Codec.encode(issuer.issuerAuthenticationPublicKey),
  //   encryption_public_key: Base64Codec.encode(issuer.issuerEncryptionPublicKey),
  //
  //   human_id: issuer.humanId,
  //
  //   credential_type: "derp", // Extra
  //   credential_level: "derp", // Extra
  //   credential_status: "approved", // Extra
  //
  //   content: Base64Codec.encode(issuer.w3cVc), // THIS IS WRONG because it'll be tried to be encrypted again.
  //
  //   publicNotes: issuer.publicNotes, // Missing
  //   publicNotesSignature: issuer.publicNotesSignature, // Missing
  //   broaderSignature: issuer.broaderSignature, // Missing
  // });

  return createCredentialPermissioned2(issuerConfig, {
    issuer: Base64Codec.encode(issuer.issuerAuthenticationPublicKey),
    encryption_public_key: Base64Codec.encode(issuer.issuerEncryptionPublicKey),
    human_id: issuer.humanId,
    content: Base64Codec.encode(issuer.w3cVc),
    public_notes: JSON.stringify(issuer.publicNotes),
    public_notes_signature: Base64Codec.encode(issuer.publicNotesSignature),
    broader_signature: Base64Codec.encode(issuer.broaderSignature),
  });
};

export const inserterIssuerWriteGrant = async (
  issuer: IssuerResult,
  inserterAuthenticationSecretKey: Uint8Array,
) => {
  // TODO: creds2: This is not an EVM wallet, it's an ed25519 key. How do I tell that to Kwill?
  const issuerAuthenticationWallet = new Wallet(HexCodec.encode(inserterAuthenticationSecretKey));

  if (!process.env.IDOS_NODE_URL) throw new Error("Missing IDOS_NODE_URL");
  const issuerConfig = await createIssuerConfig2({
    nodeUrl: process.env.IDOS_NODE_URL,
    signer: issuerAuthenticationWallet,
  });

  return createCredentialByGrant2(issuerConfig, {
    issuer: Base64Codec.encode(issuer.issuerAuthenticationPublicKey),
    encryption_public_key: Base64Codec.encode(issuer.issuerEncryptionPublicKey),
    human_id: issuer.humanId,
    content: Base64Codec.encode(issuer.w3cVc),
    public_notes: JSON.stringify(issuer.publicNotes),
    public_notes_signature: Base64Codec.encode(issuer.publicNotesSignature),
    broader_signature: Base64Codec.encode(issuer.broaderSignature),
  });
};

import { idOS } from "@idos-network/idos-sdk";
export const inserterHuman = async (issuer: IssuerResult) => {
  const idos = await idOS.init({});
  // biome-ignore lint/suspicious/noExplicitAny: Let's pretend this was correctly initialized
  const { humanId } = await idos.setSigner("EVM", {} as any);

  if (humanId !== issuer.humanId) throw new Error("This credential is not for me!");

  return idos.data.create("credential2s", {
    issuer: Base64Codec.encode(issuer.issuerAuthenticationPublicKey),
    encryption_public_key: Base64Codec.encode(issuer.issuerEncryptionPublicKey),
    human_id: issuer.humanId,
    content: Base64Codec.encode(issuer.w3cVc),
    public_notes: JSON.stringify(issuer.publicNotes),
    public_notes_signature: Base64Codec.encode(issuer.publicNotesSignature),
    broader_signature: Base64Codec.encode(issuer.broaderSignature),
  });
};
