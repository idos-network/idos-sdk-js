"use server";

import {
  type IssuerConfig,
  createCredentialPermissioned,
  createHuman,
  createIssuerConfig,
} from "@idos-network/issuer-sdk-js";
import type { User } from "@prisma/client";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { fetchImages, getData } from "../sumSub";
import { contractAbi } from "./abi";

let cachedConfig: IssuerConfig | null = null;

const getConfig = async () => {
  if (cachedConfig) {
    return cachedConfig;
  }

  // biome-ignore lint: lint/style/noNonNullAssertion
  const signer = new Wallet(process.env.NEXT_ISSUER_PRIVATE_KEY!);

  cachedConfig = await createIssuerConfig({
    // biome-ignore lint: lint/style/noNonNullAssertion
    nodeUrl: process.env.NEXT_PUBLIC_KWIL_NODE_URL!,
    signer,
    // biome-ignore lint: style/noNonNullAssertion
    encryptionSecret: process.env.NEXT_ISSUER_SECRET_KEY!,
  });

  return cachedConfig;
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

  if (response?.data && response.data.length > 0) {
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
    // biome-ignore lint: style/noNonNullAssertion
    { id: user.id, current_public_key: user.idosPubKey! },
    {
      wallet_type: "EVM",
      public_key: "",
      // biome-ignore lint: style/noNonNullAssertion
      address: user.address!,
      // biome-ignore lint: style/noNonNullAssertion
      message: user.loginMessage!,
      // biome-ignore lint: style/noNonNullAssertion
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

  const content: Record<string, string | number | Date> = {
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
    content.residentialAddressCity = address.townEn;
    content.residentialAddressZip = address.postCode;
    content.residentialAddressCountry = address.country;
    content.residentialAddressStreet = address.streetEn;
    content.residentialAddressHouseNumber = address.buildingNumber;
  }

  const response = await createCredentialPermissioned(config, {
    content: JSON.stringify(content),
    credential_level: levelName === "basic+liveness" ? "basic" : "plus",
    credential_type: "kyc",
    credential_status: "approved",
    // biome-ignore lint: style/noNonNullAssertion
    human_id: user.idosHumanId!,
    issuer: "DEMO ISSUER (SUM SUB sandbox)",
    // biome-ignore lint: style/noNonNullAssertion
    userEncryptionPublicKey: user.idosPubKey!,
  });

  return response.id;
};

export async function insertDAG(user: User) {
  // This is not tested yet, it's just a test.
  // biome-ignore lint: style/noNonNullAssertion
  const provider = new JsonRpcProvider(process.env.NEXT_DAG_RPC_URL!);
  // biome-ignore lint: style/noNonNullAssertion
  const signer = new Wallet(process.env.NEXT_DAG_PRIVATE_KEY!, provider);
  // biome-ignore lint: style/noNonNullAssertion
  const contract = new Contract(process.env.NEXT_DAG_CONTRACT_ADDRESS!, contractAbi, signer);

  const signature = Buffer.from(user.idosGrantSignature?.slice(2), "hex");

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
