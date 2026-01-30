"use server";
import type {
  AvailableIssuerType,
  CredentialFields,
  CredentialSubject,
  idOSCredential,
} from "@idos-network/credentials/types";
import { base64Decode, base64Encode, hexDecode, toBytes } from "@idos-network/utils/codecs";
import type { EncryptionPasswordStore } from "@idos-network/utils/enclave";
import countries3to2 from "countries-list/minimal/countries.3to2.min.json";
import jwt from "jsonwebtoken";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";
import { idOSConsumer } from "@/consumer.config";
import { idOSIssuer } from "@/issuer.config";

const generateCredentials = async (
  issuer: Awaited<ReturnType<typeof idOSIssuer>>,
  // biome-ignore lint/suspicious/noExplicitAny: We will use `any` to avoid type errors
  kycData: Record<string, any>,
  idFrontFile: Buffer,
  selfieFile: Buffer,
) => {
  const { info, review, email, phone } = kycData;
  const idDoc = info.idDocs[0];
  const issuerHost = `https://${process.env.VERCEL_URL}`;

  const id = crypto.randomUUID();

  const parseDate = (date: string | undefined) => {
    if (!date) return undefined;
    return new Date(date);
  };

  const credentialSubject: CredentialSubject = {
    id: `urn:uuid:${id}`,
    firstName: info.firstNameEn,
    familyName: info.lastNameEn,
    email: email,
    nationality: info.nationality
      ? countries3to2[info.nationality as keyof typeof countries3to2]
      : undefined,
    phoneNumber: phone,
    dateOfBirth: new Date(info.dob),
    placeOfBirth: info.placeOfBirth,
    idDocumentCountry: countries3to2[idDoc.country as keyof typeof countries3to2],
    idDocumentNumber: idDoc.number,
    idDocumentType: idDoc.idDocType,
    idDocumentDateOfIssue: parseDate(idDoc.issuedDate),
    idDocumentDateOfExpiry: parseDate(idDoc.validUntil),
    idDocumentFrontFile: idFrontFile,
    selfieFile: selfieFile,
  };

  const credentialFields: CredentialFields = {
    id: `${issuerHost}/credentials/${id}`,
    level: review.levelName,
    issued: new Date(),
    approvedAt: new Date(),
  };

  const publicNotes = {
    level: review.levelName,
    type: "kyc",
    status: review.reviewResult.reviewAnswer === "GREEN" ? "approved" : "rejected",
    issuer: "Not-a-bank",
  };

  invariant(
    process.env.ISSUER_ATTESTATION_SECRET_KEY,
    "`ISSUER_ATTESTATION_SECRET_KEY` is not set",
  );
  invariant(
    process.env.ISSUER_ATTESTATION_PUBLIC_KEY,
    "`ISSUER_ATTESTATION_PUBLIC_KEY` is not set",
  );

  const availableIssuer: AvailableIssuerType = {
    id: `${issuerHost}/keys/1`,
    controller: `${issuerHost}/issuers/1`,
    publicKeyMultibase: process.env.ISSUER_ATTESTATION_PUBLIC_KEY,
    privateKeyMultibase: process.env.ISSUER_ATTESTATION_SECRET_KEY,
  };

  const plainSignedContent = await issuer.buildCredential(
    credentialFields,
    credentialSubject,
    availableIssuer,
  );

  return {
    plainSignedContent,
    publicNotes,
  };
};

export async function createIDOSUserProfile({
  userId,
  recipientEncryptionPublicKey,
  wallet,
  encryptionPasswordStore,
}: {
  userId: string;
  recipientEncryptionPublicKey: string;
  wallet: {
    address: string;
    type: "EVM" | "XRPL" | "NEAR" | "Stellar";
    message: string;
    signature: string;
    publicKey: string;
  };
  encryptionPasswordStore: EncryptionPasswordStore;
}) {
  const issuer = await idOSIssuer();

  const user = await issuer.createUser(
    {
      id: userId,
      recipient_encryption_public_key: recipientEncryptionPublicKey,
      encryption_password_store: encryptionPasswordStore,
    },
    {
      address: wallet.address,
      wallet_type: wallet.type,
      message: wallet.message,
      signature: wallet.signature,
      public_key: wallet.publicKey ?? "",
    },
  );

  return user;
}

export async function getKrakenToken(): Promise<string> {
  invariant(process.env.KRAKEN_CLIENT_ID, "`KRAKEN_CLIENT_ID` is not set");
  invariant(process.env.KRAKEN_PRIVATE_KEY, "`KRAKEN_PRIVATE_KEY` is not set");

  const payload = {
    api: true,
    clientId: process.env.KRAKEN_CLIENT_ID,
  };

  return jwt.sign(payload, process.env.KRAKEN_PRIVATE_KEY, {
    algorithm: "ES512",
    expiresIn: "600s",
  });
}

async function getKYCData(userId: string) {
  const response = await fetch(
    `https://kraken.staging.sandbox.fractal.id/public/kyc/${userId}/data`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getKrakenToken()}`,
      },
    },
  );
  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to fetch KYC data ${JSON.stringify(json)}`);
  }

  return json;
}

async function getKYCDataFile(
  userId: string,
  fileType: "idFront" | "idBack" | "selfie" | "proofOfResidence",
) {
  const response = await fetch(
    `https://kraken.staging.sandbox.fractal.id/public/kyc/${userId}/file/${fileType}`,
    {
      headers: {
        Authorization: `Bearer ${await getKrakenToken()}`,
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch KYC file data: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
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
  const issuer = await idOSIssuer();
  const [kycData, idFrontFile, selfieFile] = await Promise.all([
    getKYCData(userId),
    getKYCDataFile(userId, "idFront"),
    getKYCDataFile(userId, "selfie"),
  ]);

  const { plainSignedContent, publicNotes } = await generateCredentials(
    issuer,
    kycData,
    idFrontFile,
    selfieFile,
  );

  await issuer.createCredentialByDelegatedWriteGrant(
    {
      plaintextContent: toBytes(plainSignedContent),
      publicNotes: JSON.stringify(publicNotes),
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
        Authorization: `Bearer ${await getKrakenToken()}`,
      },
    },
  );
  const json = await response.json();
  if (!response.ok) return { ok: false, error: json };

  const issuerSigningSecretKey = process.env.ISSUER_SIGNING_SECRET_KEY;
  invariant(issuerSigningSecretKey, "`ISSUER_SIGNING_SECRET_KEY` is not set");

  return {
    ok: true,
    data: {
      idOSUserId: idOSUserId,
      idvUserId: json.userId,
      signature: base64Encode(
        nacl.sign.detached(
          toBytes(`${json.userId}${idOSUserId}`),
          base64Decode(issuerSigningSecretKey),
        ),
      ),
    },
  };
}

export const getCredentialCompliantly = async (credentialId: string) => {
  const consumer = await idOSConsumer();
  const credential = await consumer.getReusableCredentialCompliantly(credentialId);
  return credential;
};

type PassportingServiceResponse =
  | { success: true; data: idOSCredential }
  | {
      success: false;
      error: {
        cause?: unknown;
        message: string;
      };
    };

export const invokePassportingService = async (
  url: string,
  payload: {
    dag_owner_wallet_identifier: string;
    dag_grantee_wallet_identifier: string;
    dag_data_id: string;
    dag_locked_until: number;
    dag_content_hash: string;
    dag_signature: string;
  },
): Promise<PassportingServiceResponse> => {
  const consumerSigningSecretKey = process.env.CONSUMER_SIGNING_SECRET_KEY;
  invariant(consumerSigningSecretKey, "`CONSUMER_SIGNING_SECRET_KEY` is not set");

  // sign a message using the consumer's signing key
  const message = JSON.stringify(payload);
  const messageBytes = new TextEncoder().encode(message);
  const consumer = await idOSConsumer();

  const signer = consumer.signer;
  const signature =
    typeof signer.signer === "function"
      ? await signer.signer(messageBytes)
      : nacl.sign.detached(messageBytes, hexDecode(consumerSigningSecretKey));

  // deriving signing public key does not follow the same process on different type of signer
  const consumerSigningPublicKey = process.env.NEXT_PUBLIC_OTHER_CONSUMER_SIGNING_PUBLIC_KEY;
  invariant(consumerSigningPublicKey, "`NEXT_PUBLIC_OTHER_CONSUMER_SIGNING_PUBLIC_KEY` is not set");

  // Call the passporting service to transmit the DAG
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      signature: base64Encode(signature),
      message: base64Encode(messageBytes),
    }),
    headers: {
      Authorization: `Bearer ${consumerSigningPublicKey}`,
      "Content-Type": "application/json",
    },
  });

  const result = await response.json();

  if (result.error) {
    console.dir(result.error, { depth: null });
    throw new Error(result.error);
  }

  const credential = await consumer.getReusableCredentialCompliantly(payload.dag_data_id);
  // @todo: handle errors when the prior method fails.

  return {
    success: true,
    data: credential,
  };
};

export const generateKrakenUrlToken = async (isE2E: boolean) => {
  invariant(process.env.KRAKEN_CLIENT_ID, "`KRAKEN_CLIENT_ID` is not set");
  const level = isE2E ? "basic" : "basic+liveness";

  const payload = {
    clientId: process.env.KRAKEN_CLIENT_ID,
    kyc: true,
    level,
    state: Date.now().toString(),
  };

  invariant(process.env.KRAKEN_PRIVATE_KEY, "`KRAKEN_PRIVATE_KEY` is not set");
  return jwt.sign(payload, process.env.KRAKEN_PRIVATE_KEY, { algorithm: "ES512" });
};
