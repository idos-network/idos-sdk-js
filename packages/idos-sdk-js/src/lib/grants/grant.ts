export default class Grant {
  ownerAddress: string; // @todo: remove this prop once we clean up grants class.
  ownerHumanId?: string; // @todo: make this required once we clean up grants class.
  granteeAddress: string;
  dataId: string;
  lockedUntil: number;

  constructor({ ownerAddress, ownerHumanId, granteeAddress, dataId, lockedUntil }: Grant) {
    this.ownerAddress = ownerAddress;
    this.ownerHumanId = ownerHumanId;
    this.granteeAddress = granteeAddress;
    this.dataId = dataId;
    this.lockedUntil = lockedUntil;
  }
}
