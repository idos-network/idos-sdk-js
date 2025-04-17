import { createNodeKwilClient, createServerKwilSigner } from "@idos-network/core";
import type { idOSCredential, idOSUser, idOSWallet } from "@idos-network/core/types";
import type { SignKeyPair } from "tweetnacl";
import {
  CredentialService,
  type DelegatedWriteGrantBaseParams,
  type DelegatedWriteGrantParams,
} from "./services/credential.service";
import {
  type CredentialFields,
  type CredentialSubject,
  CredentialsBuilderService,
  type CredentialsIssuerConfig,
} from "./services/credentials-builder.service";
import { type CreateAccessGrantFromDAGParams, GrantService } from "./services/grant.service";
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
  private readonly credentialService: CredentialService;
  private readonly grantService: GrantService;
  private readonly userService: UserService;
  private readonly credentialsBuilderService: CredentialsBuilderService;

  static async init(params: CreateIssuerParams) {
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
    const credentialsBuilderService = new CredentialsBuilderService();

    return new idOSIssuer(credentialService, grantService, userService, credentialsBuilderService);
  }

  private constructor(
    credentialService: CredentialService,
    grantService: GrantService,
    userService: UserService,
    credentialsBuilderService: CredentialsBuilderService,
  ) {
    this.credentialService = credentialService;
    this.grantService = grantService;
    this.userService = userService;
    this.credentialsBuilderService = credentialsBuilderService;
  }

  // User Service facade methods
  async hasProfile(userAddress: string): Promise<boolean> {
    return this.userService.hasProfile(userAddress);
  }

  async createUserProfile(params: CreateProfileReqParams): Promise<idOSUser> {
    return this.userService.createUserProfile(params);
  }

  async upsertWalletAsInserter(params: UpsertWalletReqParams): Promise<idOSWallet> {
    return this.userService.upsertWalletAsInserter(params);
  }

  async createUser(
    user: CreateProfileReqParams,
    wallet: CreateWalletReqParams,
  ): Promise<[idOSUser, idOSWallet]> {
    return this.userService.createUser(user, wallet);
  }

  // Credential Service facade methods
  async createCredentialByDelegatedWriteGrant(
    credentialParams: DelegatedWriteGrantBaseParams,
    delegatedWriteGrant: DelegatedWriteGrantParams,
    consumerEncryptionPublicKey?: Uint8Array,
  ) {
    return this.credentialService.createCredentialByDelegatedWriteGrant(
      credentialParams,
      delegatedWriteGrant,
      consumerEncryptionPublicKey,
    );
  }

  async editCredentialAsIssuer(publicNotesId: string, publicNotes: string) {
    return this.credentialService.editCredentialAsIssuer(publicNotesId, publicNotes);
  }

  async getCredentialIdByContentHash(contentHash: string): Promise<string | null> {
    return this.credentialService.getCredentialIdByContentHash(contentHash);
  }

  async getSharedCredential(id: string): Promise<idOSCredential | null> {
    return this.credentialService.getSharedCredential(id);
  }

  // Grant Service facade methods
  async createAccessGrantFromDAG(params: CreateAccessGrantFromDAGParams) {
    return this.grantService.createAccessGrantFromDAG(
      params,
      (contentHash: string) => this.getCredentialIdByContentHash(contentHash),
      (id: string) => this.getSharedCredential(id),
    );
  }

  // Credentials Builder facade methods
  async buildCredentials(
    fields: CredentialFields,
    subject: CredentialSubject,
    issuer: CredentialsIssuerConfig,
  ) {
    return this.credentialsBuilderService.buildCredentials(fields, subject, issuer);
  }

  buildDocumentLoader() {
    return this.credentialsBuilderService.buildDocumentLoader();
  }
}
