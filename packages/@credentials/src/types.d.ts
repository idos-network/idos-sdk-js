// Those are the types for the digitalbazaar libraries.
// There are missing a bunch of types, it's just what we need.
declare module "@digitalbazaar/ed25519-signature-2020" {
  export interface Ed25519Signature2020Options {
    key: Ed25519VerificationKey2020;
    verificationMethod?: string;
  }

  export declare class Ed25519Signature2020 {
    constructor(options: Ed25519Signature2020Options);
  }
}

declare module "@digitalbazaar/ed25519-verification-key-2020" {
  export interface Ed25519VerificationKey2020Options {
    id?: string;
    controller: string;
    publicKeyMultibase: string;
    privateKeyMultibase?: string;
    type: "Ed25519VerificationKey2020";
  }

  export interface Ed25519VerificationKey2020GenerateOptions {
    id?: string;
    controller?: string;
  }

  export declare class Ed25519VerificationKey2020 {
    public static from(
      options: Ed25519VerificationKey2020Options,
    ): Promise<Ed25519VerificationKey2020>;
    public static generate(
      options: Ed25519VerificationKey2020GenerateOptions,
    ): Promise<Ed25519VerificationKey2020>;
    public controller: string;
    public id: string;
    public publicKeyMultibase: string;
    public privateKeyMultibase?: string;
  }
}

declare module "@digitalbazaar/vc" {
  export interface IssueOptions {
    credential: object;
    suite: Ed25519Signature2020;
    documentLoader: JsonLDDocumentLoaderInstance;
  }

  export interface VerifiedCredentialsProof {
    type: string;
    created: string;
    verificationMethod: string;
    proofValue: string;
    proofPurpose: string;
  }

  export interface VerifiedCredentials<K> {
    "@context": string[];
    type: string[];
    issuer: string;
    id: string;
    level: string;
    issued: string;
    approvedAt: string;
    expirationDate: string;
    credentialSubject: K;
    issuanceDate: string;
    proof: VerifiedCredentialsProof;
  }

  // biome-ignore lint/suspicious/noExplicitAny: I don't know the right type
  export declare function issue<K = any>(options: IssueOptions): Promise<VerifiedCredentials<K>>;

  export interface VerifyCredentialOptions<K> {
    credential: VerifiedCredentials<K>;
    suite: Ed25519Signature2020;
    controller: object;
    documentLoader: JsonLDDocumentLoaderInstance;
  }

  export declare function verifyCredential<K>(options: VerifyCredentialOptions<K>): Promise<{
    verified: boolean;
    error?: Error;
    results: {
      proof: VerifiedCredentialsProof;
    }[];
    purposeResult: {
      valid: boolean;
    };
  }>;
}

declare module "jsonld-document-loader" {
  export interface JsonLdDocument {
    contextUrl?: string | null;
    // biome-ignore lint/suspicious/noExplicitAny: I don't know the right type
    document: any;
    documentUrl: string;
    tag?: string;
  }

  export type JsonLDDocumentLoaderInstance = (url: string) => Promise<JsonLdDocument>;

  export class JsonLdDocumentLoader {
    constructor();

    addStatic(url: string, document: object): void;

    build(): JsonLDDocumentLoaderInstance;
  }
}
