"use server";

import {
  IssuerConfig,
  createCredentialPermissioned,
  createHuman,
  createIssuerConfig,
} from "@idos-network/issuer-sdk-js";
import { User } from "@prisma/client";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import nacl from "tweetnacl";
import { fetchImages, getData } from "../sumSub";
import { contractAbi } from "./abi";

let cachedConfig: IssuerConfig | null = null;
type JsonArg = Parameters<typeof JSON.stringify>[0];
const toBytes = (obj: JsonArg): Uint8Array => Utf8Codec.encode(JSON.stringify(obj));

const getConfig = async () => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const signingKeyPair = nacl.sign.keyPair.fromSecretKey(
    Base64Codec.decode(process.env.NEXT_ISSUER_SIGNING_SECRET_KEY!),
  );
  const encryptionKeyPair = nacl.box.keyPair.fromSecretKey(
    Base64Codec.decode(process.env.NEXT_ISSUER_ENCRYPTION_SECRET_KEY!),
  );

  cachedConfig = await createIssuerConfig({
    nodeUrl: process.env.NEXT_PUBLIC_KWIL_NODE_URL!,
    signingKeyPair,
    encryptionKeyPair,
  });

  return cachedConfig;
};

const createPublicNotes = async (levelName: string) => ({
  credential_level: levelName === "basic+liveness" ? "basic" : "plus",
  credential_type: "kyc",
  credential_status: "approved",
  issuer: "DEMO ISSUER (SUM SUB sandbox)",
});

const makeW3cCredential = (
  idvData: Record<string, string | number | Date>,
  issuerAttestationSecretKey: Uint8Array,
) => {
  const protoW3cVc = {
    id: idvData.id,
    context: [],
    credentialSubject: idvData,
  };

  return {
    ...protoW3cVc,
    proof: Base64Codec.encode(nacl.sign.detached(toBytes(protoW3cVc), issuerAttestationSecretKey)),
  };
};

const issuer_makeUserCredential = (
  idvData: Record<string, string | number | Date>,
  humanId: string,
  levelName: string,
  receiverEncryptionPublicKey: Uint8Array,
  issuerAttestationSecretKey: Uint8Array,
) => {
  const plaintextContent = makeW3cCredential(idvData, issuerAttestationSecretKey);

  return {
    humanId,
    publicNotes: JSON.stringify(createPublicNotes(levelName)),
    plaintextContent: toBytes(plaintextContent),
    receiverEncryptionPublicKey,
  };
};

export const getHumanId = async (user: User) => {
  const config = await getConfig();

  // Check if user already has a human id & wallet id
  // TODO: Hardcoded staging
  const dbid = config.kwilClient.getDBID("2bcf10cd96397961bebb06d6c7c962fa1cda2915", "idos");
  const response = await config.kwilClient.selectQuery(
    dbid,
    `SELECT id, human_id FROM wallets WHERE address = '${user.address}'`,
  );

  if (response && response.data && response.data.length > 0) {
    return {
      // @ts-expect-error Not yet fully typed
      idosHumanId: response.data[0].human_id,
      // @ts-expect-error Not yet fully typed
      idosWalletId: response.data[0].id,
    };
  }

  return null;
};

export const createHumanProfile = async (user: User) => {
  const config = await getConfig();

  if (user.idosHumanId && user.idosWalletId)
    throw new Error("User already has a human id and wallet id");

  // User is not associated in idOS, create a new one
  const [humanResponse, walletResponse] = await createHuman(
    config,
    { id: user.id, current_public_key: user.idosPubKey! },
    {
      wallet_type: "EVM",
      public_key: "",
      address: user.address!,
      message: user.loginMessage!,
      signature: user.loginSignature!,
    },
  );

  return {
    idosHumanId: humanResponse.id,
    idosWalletId: walletResponse.id,
  };
};

export const createCredentials = async (user: User) => {
  const config = await getConfig();

  console.log("Create credentials for user", user.address, " with human id", user.idosHumanId);

  // Fetch data from sum-sub
  const {
    inspectionId,
    id,
    info,
    review: { levelName },
  } = await getData(user.address);

  const idvContent: Record<string, string | number | Date> = {
    // idv data
    id: crypto.randomUUID(),
    gender: info.gender,
    firstName: info.firstNameEn,
    lastName: info.lastNameEn,
    dateOfBirth: info.dob,
    placeOfBirth: info.placeOfBirthEn,
    residentialAddressCountry: info.country,
    ...(await fetchImages(id, inspectionId)),
  };

  const address = info.addresses[0];
  if (address) {
    idvContent.residentialAddressCity = address.townEn;
    idvContent.residentialAddressZip = address.postCode;
    idvContent.residentialAddressCountry = address.country;
    idvContent.residentialAddressStreet = address.streetEn;
    idvContent.residentialAddressHouseNumber = address.buildingNumber;
  }

  const credential = issuer_makeUserCredential(
    idvContent,
    user.idosHumanId!,
    levelName,
    Base64Codec.decode(user.idosPubKey!),
    Base64Codec.decode(process.env.NEXT_ISSUER_ATTESTATION_SECRET_KEY as string),
  );

  const response = await createCredentialPermissioned(config, {
    ...credential,
  });

  return response.id;
};

export async function insertDAG(user: User) {
  const provider = new JsonRpcProvider(process.env.NEXT_DAG_RPC_URL!);
  const signer = new Wallet(process.env.NEXT_DAG_PRIVATE_KEY!, provider);
  const contract = new Contract(process.env.NEXT_DAG_CONTRACT_ADDRESS!, contractAbi, signer);

  const signature = Buffer.from(user.idosGrantSignature!.slice(2), "hex");

  try {
    const transaction = await contract.insertGrantBySignature(
      user.idosGrantOwner,
      user.idosGrantGrantee,
      user.idosGrantDataId,
      user.idosGrantLockedUntil ?? 0,
      signature,
      {
        gasLimit: 600_000, // Copy from ML
      },
    );

    return transaction.hash;
  } catch (error) {
    // @ts-expect-error NOt fully typed
    if (!error.message.includes("Grant already exists")) {
      console.error(error);
      throw error;
    }
  }
}
