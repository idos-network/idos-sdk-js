export const DEFAULT_RECORDS_PER_PAGE = 7;

export default class idOSGrant {
  id: string;
  ownerUserId: string;
  granteeAddress: string;
  dataId: string;
  lockedUntil: number;

  constructor({ id, ownerUserId, granteeAddress, dataId, lockedUntil }: idOSGrant) {
    this.id = id;
    this.ownerUserId = ownerUserId;
    this.granteeAddress = granteeAddress;
    this.dataId = dataId;
    this.lockedUntil = lockedUntil;
  }
}
