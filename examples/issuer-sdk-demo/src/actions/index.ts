"use server";

import {
  type CreateWalletReqParams,
  createCredentialByGrant,
  createCredentialPermissioned,
  createHuman,
} from "@idos-network/issuer-sdk-js";
import invariant from "tiny-invariant";

import { getIssuerConfig } from "@/issuer.config";

export async function createProfile(
  publicKey: string,
  humanId: string,
  wallet: CreateWalletReqParams,
) {
  const issuer = await getIssuerConfig();
  await createHuman(issuer, { id: humanId, current_public_key: publicKey }, wallet);
}

export async function createCredentialViaGrantedIssuer(
  humanId: string,
  userEncryptionPublicKey: string,
) {
  const issuer = await getIssuerConfig();

  const ISSUER_PUBLIC_KEY = process.env.NEXT_ISSUER_PUBLIC_KEY;
  invariant(ISSUER_PUBLIC_KEY, "`NEXT_ISSUER_PUBLIC_KEY` is not set");

  await createCredentialByGrant(issuer, {
    content: JSON.stringify({
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
    credential_level: "human",
    credential_type: "human",
    credential_status: "pending",
    encryption_public_key: ISSUER_PUBLIC_KEY,
    human_id: humanId,
    issuer: "DEMO ISSUER",
    userEncryptionPublicKey,
  });
}

export async function createCredentialViaSuperIssuer(
  humanId: string,
  userEncryptionPublicKey: string,
) {
  const issuer = await getIssuerConfig();

  const ISSUER_PUBLIC_KEY = process.env.NEXT_ISSUER_PUBLIC_KEY;
  invariant(ISSUER_PUBLIC_KEY, "`NEXT_ISSUER_PUBLIC_KEY` is not set");

  await createCredentialPermissioned(issuer, {
    content: JSON.stringify({
      firstName: "John",
      lastName: "Doe",
    }),
    userEncryptionPublicKey,
    credential_level: "human",
    credential_type: "human",
    credential_status: "pending",
    encryption_public_key: ISSUER_PUBLIC_KEY,
    human_id: humanId,
    issuer: "DEMO ISSUER",
  });
}
