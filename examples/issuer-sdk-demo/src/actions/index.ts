"use server";

import { getIssuerConfig } from "@/issuer.config";
import {
  type CreateWalletReqParams,
  createCredentialsByDelegatedWriteGrant as _createCredentialsByDelegatedWriteGrant,
  createCredentialPermissioned,
  createUser,
  editCredential,
} from "@idos-network/issuer-sdk-js";
import * as Base64 from "@stablelib/base64";
import * as Utf8 from "@stablelib/utf8";
import { ethers } from "ethers";

import nacl from "tweetnacl";

type JsonArg = Parameters<typeof JSON.stringify>[0];
const toBytes = (obj: JsonArg): Uint8Array => Utf8.encode(JSON.stringify(obj));

const issuerAttestationSecretKey = Base64.decode(
  "EDCS5ZjMAfLXHu2KDkmnNt6GMYRppQRboXUZO0+mIuLw9vnMMzDinxfhfrKpbixDIKpmcwEqBpiNPucSa3mHyA==",
);

const vcTemplate = (email: string, address: string) => ({
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://raw.githubusercontent.com/trustfractal/claim-schemas/686bd9c0b44f8af03831f7dc31f7d6a9b6b5ff5b/verifiable_credential/fractal_id.json-ld",
    "https://w3id.org/security/suites/ed25519-2020/v1",
  ],
  id: crypto.randomUUID(),
  type: ["VerifiableCredential"],
  issuer: "https://vc-issuers.fractal.id/idos",
  level: "human",
  credentialSubject: {
    id: crypto.randomUUID(),
    wallets: [
      {
        currency: "eth",
        verified: true,
        address,
      },
    ],
    emails: [
      {
        verified: false,
        address: email,
      },
    ],
  },
  status: "approved",
  issuanceDate: new Date().toISOString(),
  approved_at: new Date().toISOString(),
});

const appendProof = (vc: Record<string, unknown>) => ({
  ...vc,
  proof: {
    type: "Ed25519Signature2020",
    created: new Date().toISOString(),
    verificationMethod:
      "https://vc-issuers.fractal.id/idos#z6MkrkEJxkk6wYAzv6s1LCcXXeiSL1ukhGSBE2wUGQvv6f7V",
    proofPurpose: "assertionMethod",
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    proofValue: Base64.encode(nacl.sign.detached(toBytes(vc), issuerAttestationSecretKey)),
  },
});

const generateCredential = (email: string, address: string): Uint8Array => {
  const vc = appendProof(vcTemplate(email, address));
  return toBytes(vc);
};

const publicNotes = {
  id: crypto.randomUUID(),
  level: "human",
  type: "human",
  status: "pending",
  issuer: "DEMO ISSUER",
};

export async function createProfile(
  publicKey: string,
  userId: string,
  wallet: CreateWalletReqParams,
) {
  const issuer = await getIssuerConfig();
  await createUser(issuer, { id: userId, recipient_encryption_public_key: publicKey }, wallet);
}

export async function createCredentialsByDelegatedWriteGrant(
  userId: string,
  userEncryptionPublicKey: string,
  ownerWalletIdentifier: string,
  granteeWalletIdentifier: string,
  issuerPublicKey: string,
  id: string,
  accessGrantTimelock: string,
  notUsableBefore: string,
  notUsableAfter: string,
  signature: string,
) {
  const issuer = await getIssuerConfig();
  const vcContent = generateCredential("demo@idos.network", ethers.Wallet.createRandom().address);

  await _createCredentialsByDelegatedWriteGrant(
    issuer,
    {
      userId,
      plaintextContent: vcContent,
      publicNotes: JSON.stringify({
        ...publicNotes,
        id: crypto.randomUUID(),
        type: "PASSPORTING_DEMO", // @todo: remove this once we figure out better way than using type
      }),
      recipientEncryptionPublicKey: Base64.decode(userEncryptionPublicKey),
    },
    {
      ownerWalletIdentifier,
      granteeWalletIdentifier,
      issuerPublicKey,
      id,
      accessGrantTimelock,
      notUsableBefore,
      notUsableAfter,
      signature,
    },
  );
}

export async function createCredentialByPermissionedIssuer(
  userId: string,
  userEncryptionPublicKey: string,
) {
  const issuer = await getIssuerConfig();

  await createCredentialPermissioned(issuer, {
    userId,
    plaintextContent: generateCredential("demo@idos.network", ethers.Wallet.createRandom().address),
    publicNotes: JSON.stringify({ ...publicNotes, id: crypto.randomUUID() }),
    recipientEncryptionPublicKey: Base64.decode(userEncryptionPublicKey),
  });
}

export async function revokeCredentialById(id: string) {
  const issuer = await getIssuerConfig();

  await editCredential(issuer, {
    publicNotesId: id,
    publicNotes: JSON.stringify({
      ...publicNotes,
      status: "revoked",
    }),
  });
}
