export default class Grant {
  owner: string;
  grantee: string;
  dataId: string;
  lockedUntil: number;

  constructor({ owner, grantee, dataId, lockedUntil }: Grant) {
    this.owner = owner;
    this.grantee = grantee;
    this.dataId = dataId;
    this.lockedUntil = lockedUntil;
  }
}
