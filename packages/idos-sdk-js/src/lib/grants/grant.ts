export default class Grant {
  ownerAddress: string;
  granteeAddress: string;
  dataId: string;
  lockedUntil: number;

  constructor({ ownerAddress, granteeAddress, dataId, lockedUntil }: Grant) {
    this.ownerAddress = ownerAddress;
    this.granteeAddress = granteeAddress;
    this.dataId = dataId;
    this.lockedUntil = lockedUntil;
  }
}
