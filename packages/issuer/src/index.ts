import {
  buildCredential,
  buildFaceIdCredential,
  type Credential,
  type FaceIdCredential,
} from "@idos-network/credentials/builder";
import type {
  AvailableIssuerType,
  CredentialFields,
  CredentialSubject,
  CredentialSubjectFaceId,
  idOSCredential,
} from "@idos-network/credentials/types";
import { deriveLevel } from "@idos-network/credentials/utils";
import { createNodeKwilClient, createServerKwilSigner } from "@idos-network/kwil-infra";
import type {
  EditPublicNotesAsIssuerInput,
  idOSDelegatedWriteGrant,
  idOSGrant,
  idOSPassportingPeer,
  idOSUser,
  idOSUserAttribute,
  idOSWallet,
} from "@idos-network/kwil-infra/actions";
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

    const [signer] = await createServerKwilSigner(params.signingKeyPair);
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

  async getUser(id: string): Promise<idOSUser> {
    return this.#userService.getUser({ id });
  }

  async requestDelegatedWriteGrantMessage(params: idOSDelegatedWriteGrant): Promise<string> {
    return this.#credentialService.requestDelegatedWriteGrantMessage(params);
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
  ): Promise<EditPublicNotesAsIssuerInput | null> {
    return this.#credentialService.editCredentialAsIssuer(publicNotesId, publicNotes);
  }

  async getCredentialIdByContentHash(contentHash: string): Promise<string | null> {
    return this.#credentialService.getCredentialIdByContentHash(contentHash);
  }

  async getCredentialShared(id: string): Promise<idOSCredential | null> {
    return this.#credentialService.getCredentialShared(id);
  }

  async createAccessGrantFromDAG(
    params: CreateAccessGrantFromDAGParams,
  ): Promise<CreateAccessGrantFromDAGParams | null> {
    return this.#grantService.createAccessGrantFromDAG(
      params,
      (contentHash: string) => this.getCredentialIdByContentHash(contentHash),
      (id: string) => this.getCredentialShared(id),
    );
  }

  async buildCredential(
    fields: CredentialFields,
    subject: CredentialSubject,
    issuer: AvailableIssuerType,
    validate = true,
  ): Promise<Credential> {
    return buildCredential(fields, subject, issuer, validate);
  }

  deriveCredentialLevel(subject: CredentialSubject): string {
    return deriveLevel(subject);
  }

  async buildFaceIdCredential(
    fields: CredentialFields,
    subject: CredentialSubjectFaceId,
    issuer: AvailableIssuerType,
    validate = true,
  ): Promise<FaceIdCredential> {
    return buildFaceIdCredential(fields, subject, issuer, validate);
  }

  async getPassportingPeers(): Promise<idOSPassportingPeer[]> {
    return this.#passportingService.getPassportingPeers();
  }
}

export type {
  idOSCredential,
  idOSGrant,
  idOSUser,
  idOSUserAttribute,
  idOSDelegatedWriteGrant,
  idOSWallet,
  CredentialFields,
  CredentialSubject,
  AvailableIssuerType,
  Credential,
  CredentialSubjectFaceId,
  FaceIdCredential,
};
