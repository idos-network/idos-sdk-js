import type { KwilActionClient } from "@idos-network/core";
import {
  hasProfile as _hasProfile,
  upsertWalletAsInserter as _upsertWalletAsInserter,
  addUserAsInserter,
  type idOSUser,
  type idOSWallet,
} from "@idos-network/core/kwil-actions";

export type CreateProfileReqParams = Omit<idOSUser, "id"> & {
  id?: string;
};

export type UpsertWalletReqParams = Omit<idOSWallet, "id"> & {
  id?: string;
};

export type CreateWalletReqParams = Omit<UpsertWalletReqParams, "user_id"> & {
  id?: string;
};

export class UserService {
  readonly #kwilClient: KwilActionClient;

  constructor(kwilClient: KwilActionClient) {
    this.#kwilClient = kwilClient;
  }

  #ensureEntityId<T extends { id?: string }>(entity: T): T & { id: string } {
    if (!entity.id) {
      (entity as T & { id: string }).id = crypto.randomUUID();
    }
    return entity as T & { id: string };
  }

  async hasProfile(address: string): Promise<boolean> {
    return _hasProfile(this.#kwilClient, { address }).then((res) => res.has_profile);
  }

  async createUserProfile(params: CreateProfileReqParams): Promise<idOSUser> {
    const payload = this.#ensureEntityId(params);
    await addUserAsInserter(this.#kwilClient, payload);
    return payload;
  }

  async upsertWalletAsInserter(params: UpsertWalletReqParams): Promise<idOSWallet> {
    const payload = this.#ensureEntityId(params);
    await _upsertWalletAsInserter(this.#kwilClient, payload);
    return payload;
  }

  /// Useful to understand if a user id already exists.
  async getUser(params: GetUserAsInserterInput): Promise<idOSUser> {
    return _getUserAsInserter(this.#kwilClient, this.#ensureEntityId(params));
  }

  async createUser(
    user: CreateProfileReqParams,
    wallet: CreateWalletReqParams,
  ): Promise<[idOSUser, idOSWallet]> {
    const user_id = user.id ?? crypto.randomUUID();
    const wallet_id = wallet.id ?? crypto.randomUUID();

    const userReqParams = {
      ...user,
      id: user_id,
    };

    const userResponse = await this.createUserProfile(userReqParams);

    const walletReqParams = {
      ...wallet,
      user_id,
      id: wallet_id,
    };

    const walletResponse = await this.upsertWalletAsInserter(walletReqParams);

    return [userResponse, walletResponse];
  }
}
