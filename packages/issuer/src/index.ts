import type {
  AvailableIssuerType,
  idOSCredential,
  idOSCredentialRecord,
} from "@idos-network/credentials/types";
import type {
  EditPublicNotesAsIssuerInput,
  idOSDelegatedWriteGrant,
  idOSGrant,
  idOSUser,
  idOSUserAttribute,
  idOSWallet,
} from "@idos-network/kwil-infra/actions";
import type { SignKeyPair } from "tweetnacl";

import {
  createKgwAuthenticatedBlobGateway,
  createNaclKwilSigner,
  createNodeKwilClient,
} from "@idos-network/kwil-infra";

import {
  CredentialService,
  type CredentialByDelegatedWriteGrantBaseParams,
  type DelegatedWriteGrantParams,
} from "./services/credential.service";
import {
  type CreateProfileReqParams,
  type CreateWalletReqParams,
  type UpsertWalletReqParams,
  UserService,
} from "./services/user.service";

type CreateIssuerParams = {
  chainId?: string;
  nodeUrl: string;
  blobGatewayUrl?: string;
  signingKeyPair: SignKeyPair;
};

export class idOSIssuer {
  readonly #credentialService: CredentialService;
  readonly #userService: UserService;

  static async init(params: CreateIssuerParams): Promise<idOSIssuer> {
    const kwilClient = await createNodeKwilClient({
      nodeUrl: params.nodeUrl,
      chainId: params.chainId,
    });

    const [signer] = await createNaclKwilSigner(params.signingKeyPair);
    kwilClient.setSigner(signer);

    const blobGateway = createKgwAuthenticatedBlobGateway({
      url: params.blobGatewayUrl ?? params.nodeUrl,
      kwilClient,
      signer,
    });

    const credentialService = new CredentialService(kwilClient, params.signingKeyPair, blobGateway);
    const userService = new UserService(kwilClient);

    return new idOSIssuer(credentialService, userService);
  }

  private constructor(credentialService: CredentialService, userService: UserService) {
    this.#credentialService = credentialService;
    this.#userService = userService;
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
    credentialParams: CredentialByDelegatedWriteGrantBaseParams,
    delegatedWriteGrant: DelegatedWriteGrantParams,
    consumerEncryptionPublicKey: Uint8Array,
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

  async getCredentialShared(id: string): Promise<idOSCredentialRecord | null> {
    return this.#credentialService.getCredentialShared(id);
  }
}

export type {
  idOSCredential,
  idOSGrant,
  idOSUser,
  idOSUserAttribute,
  idOSDelegatedWriteGrant,
  idOSWallet,
  AvailableIssuerType,
  CredentialByDelegatedWriteGrantBaseParams,
};
