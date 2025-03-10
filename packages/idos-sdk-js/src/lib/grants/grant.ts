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
