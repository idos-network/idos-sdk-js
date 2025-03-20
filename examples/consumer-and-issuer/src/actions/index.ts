"use server";
import { getConsumerConfig } from "@/consumer.config";
import { getIssuerConfig } from "@/issuer.config";
import { base64Decode, base64Encode, utf8Encode } from "@idos-network/core";
import {
  createCredentialByDelegatedWriteGrant,
  createUser,
} from "@idos-network/issuer-sdk-js/server";
import { ethers } from "ethers";
import invariant from "tiny-invariant";

import nacl from "tweetnacl";

type JsonArg = Parameters<typeof JSON.stringify>[0];
const toBytes = (obj: JsonArg): Uint8Array => utf8Encode(JSON.stringify(obj));

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

const appendProof = (vc: Record<string, unknown>) => {
  invariant(
    process.env.NEXT_ISSUER_ATTENTION_SECRET_KEY,
    "`NEXT_ISSUER_ATTENTION_SECRET_KEY` is not set",
  );
  return {
    ...vc,
    proof: {
      type: "Ed25519Signature2020",
      created: new Date().toISOString(),
      verificationMethod:
        "https://vc-issuers.fractal.id/idos#z6MkrkEJxkk6wYAzv6s1LCcXXeiSL1ukhGSBE2wUGQvv6f7V",
      proofPurpose: "assertionMethod",
      "@context": ["https://www.w3.org/ns/credentials/v2"],
      proofValue: base64Encode(
        nacl.sign.detached(toBytes(vc), base64Decode(process.env.NEXT_ISSUER_ATTENTION_SECRET_KEY)),
      ),
    },
  };
};

const generateCredential = (email: string, address: string): Uint8Array => {
  const vc = appendProof(vcTemplate(email, address));
  return toBytes(vc);
};

const publicNotes = {
  id: crypto.randomUUID(),
  level: "human",
  type: "human",
  status: "approved",
  issuer: "NeoBank",
};

export async function createIDOSUserProfile({
  userId,
  recipientEncryptionPublicKey,
  wallet,
}: {
  userId: string;
  recipientEncryptionPublicKey: string;
  wallet: {
    address: string;
    type: "EVM";
    message: string;
    signature: string;
    publicKey: string;
  };
}) {
  const config = await getIssuerConfig();

  const user = await createUser(
    config,
    {
      id: userId,
      recipient_encryption_public_key: recipientEncryptionPublicKey,
    },
    {
      address: wallet.address,
      wallet_type: wallet.type,
      message: wallet.message,
      signature: wallet.signature,
      public_key: "",
    },
  );

  return user;
}

export async function createCredential(
  userId: string,
  userEncryptionPublicKey: string,
  ownerWalletIdentifier: string,
  consumerWalletIdentifier: string,
  issuerPublicKey: string,
  id: string,
  accessGrantTimelock: string,
  notUsableBefore: string,
  notUsableAfter: string,
  signature: string,
) {
  const issuer = await getIssuerConfig();
  const vcContent = generateCredential("demo@idos.network", ethers.Wallet.createRandom().address);

  await createCredentialByDelegatedWriteGrant(
    issuer,
    {
      plaintextContent: vcContent,
      publicNotes: JSON.stringify({
        ...publicNotes,
        id: crypto.randomUUID(),
        type: "KYC DATA",
      }),
      recipientEncryptionPublicKey: base64Decode(userEncryptionPublicKey),
    },
    {
      ownerWalletIdentifier,
      consumerWalletIdentifier,
      issuerPublicKey,
      id,
      accessGrantTimelock,
      notUsableBefore,
      notUsableAfter,
      signature,
    },
  );
}

export const getCredentialCompliantly = async (credentialId: string) => {
  const consumer = await getConsumerConfig();
  const credential = await consumer.getReusableCredentialCompliantly(credentialId);
  return credential;
};
