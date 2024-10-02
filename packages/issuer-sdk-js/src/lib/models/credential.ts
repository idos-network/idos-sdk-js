export class Credential {
  id: string;
  humanId: string;
  credentialType: string;
  credentialLevel: string;
  credentialStatus: string;
  content: string;
  encryptionPublicKey: string;
  issuer: string;

  constructor(
    id: string,
    humanId: string,
    credentialType: string,
    credentialLevel: string,
    credentialStatus: string,
    content: string,
    encryptionPublicKey: string,
    issuer: string,
  ) {
    this.id = id; // UUID
    this.humanId = humanId; // UUID
    this.credentialType = credentialType; // Text
    this.credentialLevel = credentialLevel; // Text
    this.credentialStatus = credentialStatus; // Text
    this.content = content; // Text
    this.encryptionPublicKey = encryptionPublicKey; // Text
    this.issuer = issuer; // Text
  }
}
