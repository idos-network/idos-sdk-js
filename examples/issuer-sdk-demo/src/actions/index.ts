"use server";

import {
  type CreateWalletReqParams,
  createCredentialByGrant,
  createCredentialPermissioned,
  createUser,
  editCredential,
} from "@idos-network/issuer-sdk-js";
import * as Base64 from "@stablelib/base64";
import * as Utf8 from "@stablelib/utf8";

import { getIssuerConfig } from "@/issuer.config";

const vcContent = Utf8.encode(
  JSON.stringify({
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://raw.githubusercontent.com/trustfractal/claim-schemas/686bd9c0b44f8af03831f7dc31f7d6a9b6b5ff5b/verifiable_credential/fractal_id.json-ld",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: "uuid:087b9cf0-a968-471d-a4e8-a805a05357ed",
    type: ["VerifiableCredential"],
    issuer: "https://vc-issuers.fractal.id/idos",
    level: "human",
    credentialSubject: {
      id: "uuid:33ce045b-19f8-4f5a-89d9-4575f66f4d40",
      wallets: [
        {
          currency: "eth",
          verified: true,
          address: "0x32012817befd5af5121bdd9ebb2b0df786adae2e",
        },
      ],
      emails: [
        {
          verified: false,
          address: "user@idos.network",
        },
      ],
    },
    status: "approved",
    issuanceDate: "2024-07-10T11:11:27Z",
    approved_at: "2024-07-10T11:11:27Z",
    proof: {
      type: "Ed25519Signature2020",
      created: "2024-07-10T11:11:28Z",
      verificationMethod:
        "https://vc-issuers.fractal.id/idos#z6MkrkEJxkk6wYAzv6s1LCcXXeiSL1ukhGSBE2wUGQvv6f7V",
      proofPurpose: "assertionMethod",
      "@context": ["https://www.w3.org/ns/credentials/v2"],
      proofValue:
        "z4Ud9HMzXu2pFbx8MnFrmxx1aFfRNXE5CVtmVhuHwsdp15MsQGLxvfMrVoUc3FCVbbxKnLwBxd4et8X4ew8qxrcUd",
    },
  }),
);

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

export async function createCredentialByWriteGrant(
  userId: string,
  userEncryptionPublicKey: string,
) {
  const issuer = await getIssuerConfig();

  await createCredentialByGrant(issuer, {
    userId,
    plaintextContent: vcContent,
    publicNotes: JSON.stringify({ ...publicNotes, id: crypto.randomUUID() }),
    receiverEncryptionPublicKey: Base64.decode(userEncryptionPublicKey),
  });
}

export async function createCredentialByPermissionedIssuer(
  userId: string,
  userEncryptionPublicKey: string,
) {
  const issuer = await getIssuerConfig();

  await createCredentialPermissioned(issuer, {
    userId,
    plaintextContent: vcContent,
    publicNotes: JSON.stringify({ ...publicNotes, id: crypto.randomUUID() }),
    receiverEncryptionPublicKey: Base64.decode(userEncryptionPublicKey),
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
