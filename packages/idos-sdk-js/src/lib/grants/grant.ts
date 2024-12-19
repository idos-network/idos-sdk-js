export default class Grant {
  ownerHumanId?: string;
  ownerAddress: string; // @todo: remove this when internal grants are ready
  granteeAddress: string;
  dataId: string;
  lockedUntil: number;

  constructor({ ownerAddress, ownerHumanId, granteeAddress, dataId, lockedUntil }: Grant) {
    this.ownerHumanId = ownerHumanId;
    this.ownerAddress = ownerAddress;
    this.granteeAddress = granteeAddress;
    this.dataId = dataId;
    this.lockedUntil = lockedUntil;
  }
}
