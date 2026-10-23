import type { KwilActionClient } from "@idos-network/kwil-infra";

import {
  hasProfile as _hasProfile,
  upsertWalletAsInserter as _upsertWalletAsInserter,
  addUserAsInserter,
  addWalletMessage as _addWalletMessage,
  type AddWalletMessageInput,
  type GetUserAsInserterInput,
  getUserAsInserter,
  type idOSUser,
  type idOSWallet,
} from "@idos-network/kwil-infra/actions";

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
    return _hasProfile(this.#kwilClient, { address }).then((res) => {
      if (!res) throw new Error("has_profile returned no rows");
      return res.has_profile;
    });
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

  async addWalletMessage(params: AddWalletMessageInput): Promise<string> {
    const result = await _addWalletMessage(this.#kwilClient, params);
    return result.message;
  }

  /// Useful to understand if a user id already exists.
  async getUser(params: GetUserAsInserterInput): Promise<idOSUser> {
    const user = await getUserAsInserter(this.#kwilClient, this.#ensureEntityId(params));
    if (!user) throw new Error("get_user_as_inserter returned no rows");
    return user;
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
