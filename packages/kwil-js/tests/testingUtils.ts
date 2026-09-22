import { Contract, JsonRpcProvider, JsonRpcSigner, Wallet } from "ethers";
import scrypt from "scrypt-js";
import nacl from "tweetnacl";

import { NodeKwil } from "../src/index";

require("dotenv").config();

const provider = new JsonRpcProvider(process.env.ETH_PROVIDER);
export const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider);

export const kwil = new NodeKwil({
  kwilProvider: process.env.KWIL_PROVIDER || "SHOULD FAIL",
  chainId: process.env.CHAIN_ID || "SHOULD FAIL",
  timeout: 10000,
  logging: true,
  unconfirmedNonce: true,
});

export const deriveKeyPair64 = async (password: string, humanId: string) => {
  const encoder = new TextEncoder();

  const normalizedPassword = encoder.encode(password.normalize("NFKC"));
  const salt = encoder.encode(humanId);

  const derivedKey = await scrypt.scrypt(normalizedPassword, salt, 1024, 8, 1, 32);

  return nacl.sign.keyPair.fromSeed(derivedKey);
};

export interface ActionObj {
  dbid: string;
  name: string;
  inputs: string[];
}

export interface Escrow {
  contract: Contract;
  provider: Wallet;
  validatorAddress: string;
  tokenAddress: string;
}

export interface Token {
  contract: Contract;
  provider: Wallet | JsonRpcSigner;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: number;
}

export interface FunderObj {
  poolAddress: string;
  signer: Wallet;
  providerAddress: string;
  escrowContract: Escrow;
  erc20Contract: Token;
}

export interface AmntObject {
  count: number;
}

export interface schemaObj {
  owner: string;
  name: string;
  tables: object[];
  actions: object[];
}

export interface ActionObj {
  _name: string;
  _dbid: string;
}

export interface ViewCaller {
  caller: string;
}
