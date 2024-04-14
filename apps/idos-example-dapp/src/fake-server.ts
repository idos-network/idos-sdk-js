/*
  This should be in a remote server, since it has secrets.
  However, for the sake of simplicity, we're just using local async calls.

  WARNING
  The code in this file is still very raw. The intent is to package it neatly into a server-side SDK.
*/

import { idOSGrantee } from "@idos-network/idos-sdk";
import { ethers } from "ethers";
import * as nearAPI from "near-api-js";

const ENCRYPTION_SECRET_KEY = "2bu7SyMToRAuFn01/oqU3fx9ZHo9GKugQhQYmDuBXzg=";

const EVM_GRANTEE_PRIVATE_KEY =
  "0x515c2fed89c22eaa9d41cfce6e6e454fa0a39353e711d6a99f34b4ecab4b4859";
const EVM_NODE_URL = "https://ethereum-sepolia.publicnode.com";
const evmGrantee = new ethers.Wallet(
  EVM_GRANTEE_PRIVATE_KEY,
  new ethers.JsonRpcProvider(EVM_NODE_URL)
);

const NEAR_GRANTEE_PRIVATE_KEY =
  "ed25519:35pK192Az9znHcMtHK2bGExuZV3QLRk5Ln1EpXpq4bf6FtU5twG4hneMqkzrGhARKdq54LavCFy9sprqemC72ZLs";
const nearGrantee = nearAPI.KeyPair.fromString(NEAR_GRANTEE_PRIVATE_KEY);

export const fakeServer = {
  EVM: await idOSGrantee.init({
    chainType: "EVM",
    grantee: evmGrantee,
    encryptionSecret: ENCRYPTION_SECRET_KEY
  }),
  NEAR: await idOSGrantee.init({
    chainType: "NEAR",
    grantee: nearGrantee,
    encryptionSecret: ENCRYPTION_SECRET_KEY
  }),
  lockTimeSpanSeconds: 3600 // one hour
};
