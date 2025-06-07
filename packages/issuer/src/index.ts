import {
  type EditCredentialAsIssuerParams,
  createNodeKwilClient,
  createServerKwilSigner,
} from "@idos-network/core";
import type {
  PassportingPeer,
  idOSCredential,
  idOSGrant,
  idOSUser,
  idOSUserAttribute,
  idOSWallet,
} from "@idos-network/core/types";
import {
  type AvailableIssuerType,
  type CredentialFields,
  type CredentialSubject,
  type Credentials,
  buildCredentials,
} from "@idos-network/credentials";
import type { SignKeyPair } from "tweetnacl";
import {
  CredentialService,
  type DelegatedWriteGrantBaseParams,
  type DelegatedWriteGrantParams,
} from "./services/credential.service";
import { type CreateAccessGrantFromDAGParams, GrantService } from "./services/grant.service";
import { PassportingService } from "./services/passporting.service";
import {
  type CreateProfileReqParams,
  type CreateWalletReqParams,
  type UpsertWalletReqParams,
  UserService,
} from "./services/user.service";

type CreateIssuerParams = {
  chainId?: string;
  nodeUrl: string;
  signingKeyPair: SignKeyPair;
  encryptionSecretKey: Uint8Array;
};

export class idOSIssuer {
  readonly #credentialService: CredentialService;
  readonly #grantService: GrantService;
  readonly #userService: UserService;
  readonly #passportingService: PassportingService;

  static async init(params: CreateIssuerParams): Promise<idOSIssuer> {
    const kwilClient = await createNodeKwilClient({
      nodeUrl: params.nodeUrl,
      chainId: params.chainId,
    });

    const [signer] = createServerKwilSigner(params.signingKeyPair);
    kwilClient.setSigner(signer);

    const credentialService = new CredentialService(
      kwilClient,
      params.signingKeyPair,
      params.encryptionSecretKey,
    );

    const grantService = new GrantService(kwilClient, params.encryptionSecretKey);
    const userService = new UserService(kwilClient);
    const passportingService = new PassportingService(kwilClient);

    return new idOSIssuer(credentialService, grantService, userService, passportingService);
  }

  private constructor(
    credentialService: CredentialService,
    grantService: GrantService,
    userService: UserService,
    passportingService: PassportingService,
  ) {
    this.#credentialService = credentialService;
    this.#grantService = grantService;
    this.#userService = userService;
    this.#passportingService = passportingService;
  }

  // User Service facade methods
  async hasProfile(userAddress: string): Promise<boolean> {
    return this.#userService.hasProfile(userAddress);
  }

  async createUserProfile(params: CreateProfileReqParams): Promise<idOSUser> {
    return this.#userService.createUserProfile(params);
  }

  async upsertWalletAsInserter(params: UpsertWalletReqParams): Promise<idOSWallet> {
    return this.#userService.upsertWalletAsInserter(params);
  }

  async createUser(
    user: CreateProfileReqParams,
    wallet: CreateWalletReqParams,
  ): Promise<[idOSUser, idOSWallet]> {
    return this.#userService.createUser(user, wallet);
  }

  async createCredentialByDelegatedWriteGrant(
    credentialParams: DelegatedWriteGrantBaseParams,
    delegatedWriteGrant: DelegatedWriteGrantParams,
    consumerEncryptionPublicKey?: Uint8Array,
  ): Promise<{
    originalCredential: Omit<idOSCredential, "user_id">;
    copyCredential: Omit<idOSCredential, "user_id">;
  }> {
    return this.#credentialService.createCredentialByDelegatedWriteGrant(
      credentialParams,
      delegatedWriteGrant,
      consumerEncryptionPublicKey,
    );
  }

  async editCredentialAsIssuer(
    publicNotesId: string,
    publicNotes: string,
  ): Promise<EditCredentialAsIssuerParams | null> {
    return this.#credentialService.editCredentialAsIssuer(publicNotesId, publicNotes);
  }

  async getCredentialIdByContentHash(contentHash: string): Promise<string | null> {
    return this.#credentialService.getCredentialIdByContentHash(contentHash);
  }

  async getSharedCredential(id: string): Promise<idOSCredential | null> {
    return this.#credentialService.getSharedCredential(id);
  }

  async createAccessGrantFromDAG(
    params: CreateAccessGrantFromDAGParams,
  ): Promise<CreateAccessGrantFromDAGParams | null> {
    return this.#grantService.createAccessGrantFromDAG(
      params,
      (contentHash: string) => this.getCredentialIdByContentHash(contentHash),
      (id: string) => this.getSharedCredential(id),
    );
  }

  async buildCredentials(
    fields: CredentialFields,
    subject: CredentialSubject,
    issuer: AvailableIssuerType,
  ): Promise<Credentials> {
    return buildCredentials(fields, subject, issuer);
  }

  async getPassportingPeers(): Promise<PassportingPeer[]> {
    return this.#passportingService.getPassportingPeers();
  }
}

export type {
  idOSCredential,
  idOSGrant,
  idOSUser,
  idOSUserAttribute,
  idOSWallet,
  CredentialFields,
  CredentialSubject,
  AvailableIssuerType,
  Credentials,
};
