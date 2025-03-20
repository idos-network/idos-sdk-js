"use server";
import { getIssuerConfig } from "@/issuer.config";
import { base64Decode, base64Encode, utf8Encode } from "@idos-network/core";
import {
  createCredentialByDelegatedWriteGrant,
  createUser,
} from "@idos-network/issuer-sdk-js/server";
import invariant from "tiny-invariant";

import nacl from "tweetnacl";

type JsonArg = Parameters<typeof JSON.stringify>[0];
const toBytes = (obj: JsonArg): Uint8Array => utf8Encode(JSON.stringify(obj));

// biome-ignore lint/suspicious/noExplicitAny: We will use `any` to avoid type errors
const vcTemplate = (kycData: Record<string, any>) => {
  const { info, review, agreement } = kycData;
  const document = info.idDocs[0];

  const body = {
    xsd: "http://www.w3.org/2001/XMLSchema#",
    aux: "https://raw.githubusercontent.com/trustfractal/claim-schemas/master/aux.xml",
    level: review.levelName,
    status: review.reviewResult.reviewAnswer,
    approved_at: agreement.acceptedAt,
    phones: "",
    residential_address: info.placeOfBirth,
    residential_address_country: info.country,
    residential_address_proof_category: "",
    residential_address_proof_date_of_issue: document.issuedDate,
    date_of_birth: info.dob,
    full_name: `${info.firstName} ${info.lastName}`,
    identification_document_country: document.country,
    identification_document_number: document.number,
    identification_document_type: document.idDocType,
    place_of_birth: info.placeOfBirth,
    identification_document_date_of_issue: document.issuedDate,
    identification_document_date_of_expiry: document.validUntil,

    identification_document_front_file: "",
    identification_document_back_file: "",
    identification_document_selfie_file: "",
    residential_address_proof_file: "",
  };

  return {
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
      ...body,
    },
    status: "approved",
    issuanceDate: new Date().toISOString(),
    approved_at: new Date().toISOString(),
  };
};

const appendProof = (vc: Record<string, unknown>) => {
  invariant(
    process.env.NEXT_ISSUER_ATTESTATION_SECRET_KEY,
    "`NEXT_ISSUER_ATTESTATION_SECRET_KEY` is not set",
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
        nacl.sign.detached(
          toBytes(vc),
          base64Decode(process.env.NEXT_ISSUER_ATTESTATION_SECRET_KEY ?? ""),
        ),
      ),
    },
  };
};

// biome-ignore lint/suspicious/noExplicitAny: We will use `any` to avoid type errors
const generateCredential = (kycData: Record<string, any>): Uint8Array => {
  const vc = appendProof(vcTemplate(kycData));
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

async function getKYCData(userId: string) {
  const response = await fetch(
    `https://kraken.staging.sandbox.fractal.id/public/kyc/${userId}/data`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.KRAKEN_API_KEY}`,
      },
    },
  );
  const json = await response.json();

  return json;
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
  const kycData = await getKYCData(userId);
  const vcContent = generateCredential(kycData);

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

/**
 * Get the user id from the token
 */
export async function getUserIdFromToken(token: string, idOSUserId: string) {
  const response = await fetch(
    `https://kraken.staging.sandbox.fractal.id/public/kyc/token/${token}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.KRAKEN_API_KEY}`,
      },
    },
  );
  const json = await response.json();

  return {
    idvUserId: json.userId,
    signature: base64Encode(
      nacl.sign.detached(
        toBytes(`${json.userId}${idOSUserId}`),
        base64Decode(process.env.NEXT_ISSUER_SIGNING_SECRET_KEY ?? ""),
      ),
    ),
  };
}
