export const DEFAULT_RECORDS_PER_PAGE = 7;

export default class Grant {
  ownerUserId?: string;
  id?: string;
  ownerAddress: string; // @todo: remove this when internal grants are ready
  granteeAddress: string;
  dataId: string;
  lockedUntil: number;

  constructor({ ownerAddress, id, ownerUserId, granteeAddress, dataId, lockedUntil }: Grant) {
    this.id = id;
    this.ownerUserId = ownerUserId;
    this.ownerAddress = ownerAddress;
    this.granteeAddress = granteeAddress;
    this.dataId = dataId;
    this.lockedUntil = lockedUntil;
  }
}
