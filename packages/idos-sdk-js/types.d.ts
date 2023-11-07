import { WebKwil } from "@kwilteam/kwil-js";
import { ActionBuilder } from "@kwilteam/kwil-js/dist/core/builders";
import { Database } from "@kwilteam/kwil-js/dist/core/database";
import { GenericResponse } from "@kwilteam/kwil-js/dist/core/resreq";
import { JsonRpcSigner, Signer } from "ethers";

declare class Auth {
  idOS: idOS;
  constructor(idOS: idOS);
  setEnclaveSigner(): Promise<void>;
  setEvmSigner(signer: JsonRpcSigner): Promise<void>;
  setNearSigner<Wallet = any>(wallet: Wallet, recipient?: string): Promise<void>;
  currentUser(): Promise<AuthUser>;
}

declare type AuthUser = {
  address: string | undefined;
  humanId: string | undefined;
};

declare class SDKCrypto {
  idOS: idOS;
  private provider;
  constructor(idOS: idOS);
  init(): Promise<Uint8Array>;
  encrypt(message: string | Uint8Array, receiverPublicKey?: string | Uint8Array): Promise<Uint8Array>;
  decrypt(message: string | Uint8Array, receiverPublicKey?: string | Uint8Array): Promise<Uint8Array>;
}

declare class Data {
  idOS: idOS;
  constructor(idOS: idOS);
  singularize(tableName: string): string;

  list<T extends Record<string, unknown>>(tableName: string, filter?: Record<string, string>): Promise<T[]>;
  create(
    tableName: string,
    record: Record<string, string>,
    receiverPublicKey?: Uint8Array
  ): Promise<string | undefined>;
  get<T extends Record<string, string>>(tableName: string, recordId: string): Promise<T>;
  delete(tableName: string, recordId: string): Promise<void>;
  update<T extends Record<string, string>>(tableName: string, record: T): Promise<T>;
}

export declare class idOS {
  auth: Auth;
  container: string;
  crypto: SDKCrypto;
  data: Data;
  kwilWrapper: KwilWrapper;
  grants: Grants;
  setSigner(type: "NEAR" | "EVM", signer: unknown): Promise<AuthUser>;
  static init(options: InitOptions): Promise<idOS>;
  static near: Grants["near"];
}

declare interface InitOptions {
  nodeUrl?: string;
  container: string;
}

declare class KwilWrapper {
  dbId: string;
  client: WebKwil;
  signer: Signer | undefined;
  publicKey: string | Uint8Array | undefined;
  constructor(options: { url: string });
  get schema(): Promise<GenericResponse<Database>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSigner(signer: Signer | any, publicKey?: string | Uint8Array): void;
  buildAction(actionName: string, inputs?: Record<string, string>): Promise<ActionBuilder>;
  call<T = Record<string, string>>(
    actionName: string,
    actionInputs?: Record<string, string> | null,
    description?: string
  ): Promise<T[]>;
  broadcast(
    actionName: string,
    actionInputs: Record<string, string> | null,
    description?: string
  ): Promise<string | undefined>;
}

declare class Grants {
  near: { defaultContractId: string; contractMethods: string[]; defaultNetwork: string };
  init(args: Record<string, unknown>): Promise<void>;
  list({ owner, grantee, dataId }: { owner?: string; grantee?: string; dataId?: string }): Promise<any>;
  create(
    tableName: string,
    recordId: string,
    address: string,
    lockedUntil?: number,
    receiverPublicKey?: string
  ): Promise<Record<string, string>>;
  revoke(tableName: string, recordId: string, grantee: string, dataId: string): Promise<any>;
}

export {};
