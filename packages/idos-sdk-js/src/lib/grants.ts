import type { KwilWrapper } from "./kwil-wrapper";

export const DEFAULT_RECORDS_PER_PAGE = 7;

export default class idOSGrant {
  id: string;
  ownerUserId: string;
  consumerAddress: string;
  dataId: string;
  lockedUntil: number;

  constructor({ id, ownerUserId, consumerAddress, dataId, lockedUntil }: idOSGrant) {
    this.id = id;
    this.ownerUserId = ownerUserId;
    this.consumerAddress = consumerAddress;
    this.dataId = dataId;
    this.lockedUntil = lockedUntil;
  }
}

export class Grants {
  kwilWrapper: KwilWrapper;

  constructor(params: { kwilWrapper: KwilWrapper }) {
    this.kwilWrapper = params.kwilWrapper;
  }

  async listGrantedGrants(
    page = 1,
    size = DEFAULT_RECORDS_PER_PAGE,
  ): Promise<{ grants: idOSGrant[]; totalCount: number }> {
    return this.getGrantsGranted(page, size);
  }

  async getGrantsGrantedCount(): Promise<number> {
    const response = (await this.kwilWrapper.call(
      "get_access_grants_granted_count",
      null,
    )) as unknown as {
      count: number;
    }[];
    return response[0].count;
  }

  // biome-ignore lint/suspicious/noExplicitAny: TBD
  mapToGrant(grant: any): idOSGrant {
    return new idOSGrant({
      id: grant.id,
      ownerUserId: grant.ag_owner_user_id,
      consumerAddress: grant.ag_grantee_wallet_identifier,
      dataId: grant.data_id,
      lockedUntil: grant.locked_until,
    });
  }

  async getGrantsOwned(): Promise<{ grants: idOSGrant[] }> {
    // biome-ignore lint/suspicious/noExplicitAny: TBD
    const list = (await this.kwilWrapper.call("get_access_grants_owned", null)) as any;
    const grants = list.map(this.mapToGrant);
    return {
      grants,
    };
  }

  async getGrantsGranted(
    page: number,
    size = DEFAULT_RECORDS_PER_PAGE,
  ): Promise<{ grants: idOSGrant[]; totalCount: number }> {
    if (!page) throw new Error("paging starts from 1");
    // biome-ignore lint/suspicious/noExplicitAny: TBD
    const list = (await this.kwilWrapper.call("get_access_grants_granted", { page, size })) as any;
    const totalCount = await this.getGrantsGrantedCount();

    const grants = list.map(this.mapToGrant);
    return {
      grants,
      totalCount,
    };
  }

  async revokeGrant(grantId: string) {
    return this.kwilWrapper.execute("revoke_access_grant", [{ id: grantId }]);
  }

  async hasLockedGrants(credentialId: string) {
    const result = (await this.kwilWrapper.call("has_locked_access_grants", {
      id: credentialId,
    })) as unknown as [{ has: boolean }];
    return result[0]?.has;
  }
}
