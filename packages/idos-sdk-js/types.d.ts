import { WebKwil } from "@kwilteam/kwil-js";
import { ActionBuilder } from "@kwilteam/kwil-js/dist/core/builders";
import { Database } from "@kwilteam/kwil-js/dist/core/database";
import { GenericResponse } from "@kwilteam/kwil-js/dist/core/resreq";
import { Signer } from "ethers";

declare class Auth {
  #private;
  idOS: idOS;
  constructor(idOS: idOS);
  setEnclaveSigner(): Promise<void>;
  setEvmSigner(signer: Signer): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setNearSigner(wallet: any, recipient?: string): Promise<void>;
  currentUser(): Promise<AuthUser>;
}

declare type AuthUser = {
  address: string | undefined;
  humanId: string | undefined;
};

declare class SDKCrypto {
  idOS: idOS;
  private provider;
  publicKeys: CryptoKeys | undefined;
  constructor(idOS: idOS);
  init(): Promise<CryptoKeys>;
  sign(message: Uint8Array): Promise<Uint8Array | null>;
  verifySig(message: Uint8Array, signature: Uint8Array, signerPublicKey: Uint8Array): Promise<boolean>;
  encrypt(message: string, receiverPublicKey?: Uint8Array): Promise<string>;
  decrypt(message: string, receiverPublicKey?: Uint8Array): Promise<string>;
}

declare type CryptoKeys = {
  encryption: {
    base64: string;
    raw: Uint8Array;
  };
  sig: {
    base64: string;
    raw: Uint8Array;
  };
};

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
  static init(options: InitOptions): Promise<idOS>;
}

declare interface InitOptions {
  nodeUrl: string;
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
  setSigner(signer: Signer | any, publicKey?: string | Uint8Array): Promise<void>;
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
  near: { defaultContractId: string; contractMethods: string[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  init(args: any): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list(args): Promise<any>;
  create(tableName: string, recordId: string, address: string, receiverPublicKey: string): Promise<any>;
  revoke(tableName: string, recordId: string, grantee: string, dataId: string): Promise<any>;
}

export {};
