export class Human {
  id: string;
  currentPublicKey: string;
  inserter: string;

  constructor(id: string, currentPublicKey: string, inserter: string) {
    this.id = id;
    this.currentPublicKey = currentPublicKey;
    this.inserter = inserter;
  }
}
