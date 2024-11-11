import * as Base64Codec from "@stablelib/base64";
import * as HexCodec from "@stablelib/hex";
import * as Utf8Codec from "@stablelib/utf8";
import nacl from "tweetnacl";

// ---

interface IdvDataResult {
  pii: {
    numberOfLimbs: string;
  };
  verificationStatus: string;
}

export const idvData = (): IdvDataResult => {
  return {
    pii: {
      numberOfLimbs: "4",
    },
    verificationStatus: "approved",
  };
};

// ---

type JsonArg = Parameters<typeof JSON.stringify>[0];
const toBytes = (obj: JsonArg): Uint8Array => Utf8Codec.encode(JSON.stringify(obj));

const encrypt = (
  message: Uint8Array,
  senderSecretKey: Uint8Array,
  receiverPublicKey: Uint8Array,
) => {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encrypted = nacl.box(message, nonce, receiverPublicKey, senderSecretKey);

  if (encrypted === null) throw Error(`Couldn't encrypt.`);

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce, 0);
  fullMessage.set(encrypted, nonce.length);

  return fullMessage;
};

const decrypt = (
  fullMessage: Uint8Array,
  senderPublicKey: Uint8Array,
  receiverSecretKey: Uint8Array,
) => {
  const nonce = fullMessage.slice(0, nacl.box.nonceLength);
  const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);
  const decrypted = nacl.box.open(message, nonce, senderPublicKey, receiverSecretKey);

  if (decrypted === null) throw Error(`Couldn't decrypt.`);

  return decrypted;
};

const fakeProof = (payload: object, issuerAttestationSecretKey: Uint8Array) => {
  // nacl.sign is not the right thing to call, but it's enough for us to show that
  // the wires add up.
  return Base64Codec.encode(nacl.sign.detached(toBytes(payload), issuerAttestationSecretKey));
};

const attestW3cProof = <T extends object>(payload: T, issuerAttestationSecretKey: Uint8Array) => {
  return {
    ...payload,
    proof: fakeProof(payload, issuerAttestationSecretKey),
  };
};

const makeW3cCredential = (idvData: object, issuerAttestationSecretKey: Uint8Array) => {
  const protoW3cVc = {
    id: "something that makes sense for a VC",
    context: ["etc"],
    credentialSubject: idvData,
  };

  return attestW3cProof(protoW3cVc, issuerAttestationSecretKey);
};

const makePublicNotes = (plaintextW3cVc: ReturnType<typeof makeW3cCredential>): object => {
  return { credentialId: plaintextW3cVc.id, riskScore: 4 };
};

export const issuer = (
  idvData: IdvDataResult,
  humanId: string,
  receiverEncryptionPublicKey: Uint8Array,
  issuerEncryptionSecretKey: Uint8Array,
  issuerAttestationSecretKey: Uint8Array,
  issuerAuthenticationSecretKey: Uint8Array,
): InsertableIdosCredential2 => {
  const plaintextContent = makeW3cCredential(idvData, issuerAttestationSecretKey);
  const publicNotes = makePublicNotes(plaintextContent);

  return buildInsertableIdosCredential2(
    issuerEncryptionSecretKey,
    issuerAuthenticationSecretKey,
    humanId,
    JSON.stringify(publicNotes),
    toBytes(plaintextContent),
    receiverEncryptionPublicKey,
  );
};

// TODO: creds2: I should move this to inside the issuer SDK.
type InsertableIdosCredential2 = Omit<idOSCredential2, "id" | "original_id">;
export const buildInsertableIdosCredential2 = (
  issuerEncryptionSecretKey: Uint8Array,
  issuerAuthenticationSecretKey: Uint8Array,
  humanId: string,
  publicNotes: string,
  plaintextContent: Uint8Array,
  receiverEncryptionPublicKey: Uint8Array,
): InsertableIdosCredential2 => {
  const content = encrypt(plaintextContent, issuerEncryptionSecretKey, receiverEncryptionPublicKey);
  const publicNotesSignature = nacl.sign.detached(
    Utf8Codec.encode(publicNotes),
    issuerAuthenticationSecretKey,
  );

  return {
    human_id: humanId,
    content: Base64Codec.encode(content),

    public_notes: publicNotes,
    public_notes_signature: Base64Codec.encode(publicNotesSignature),

    broader_signature: Base64Codec.encode(
      nacl.sign.detached(
        Uint8Array.from([...publicNotesSignature, ...content]),
        issuerAuthenticationSecretKey,
      ),
    ),

    issuer: Base64Codec.encode(
      nacl.sign.keyPair.fromSecretKey(issuerAuthenticationSecretKey).publicKey,
    ),
    encryption_public_key: Base64Codec.encode(
      nacl.box.keyPair.fromSecretKey(issuerEncryptionSecretKey).publicKey,
    ),
  };
};

// ---
import {
  type IssuerConfig2,
  createIssuerConfig2,
} from "@idos-network/issuer-sdk-js/create-issuer-config";
import {
  createCredentialByGrant2,
  createCredentialPermissioned2,
  shareCredentialByGrant2,
} from "@idos-network/issuer-sdk-js/credentials";

const issuerConfigBuild = (inserterAuthenticationSecretKey: Uint8Array): Promise<IssuerConfig2> => {
  const issuerAuthenticationKeypair = nacl.sign.keyPair.fromSecretKey(
    inserterAuthenticationSecretKey,
  );

  if (!process.env.IDOS_NODE_URL) throw new Error("Missing IDOS_NODE_URL");
  return createIssuerConfig2({
    nodeUrl: process.env.IDOS_NODE_URL,
    signer: issuerAuthenticationKeypair,
  });
};

const humanId = "bf8709ce-9dfc-11ef-a188-047c16570806";
const userEncryptionSecretKey = Base64Codec.decode("nIvx0jPbA8d83rL+I7Vs1B/Fp6pndGtXOX4GDmlEkSQ=");
const userEncryptionPublicKey = nacl.box.keyPair.fromSecretKey(userEncryptionSecretKey).publicKey;
const thirdPartyEncryptionSecretKey = Base64Codec.decode(
  "2u5dLWF8nDLTAt7bgeVUsRw7h4IazpLMYLVN5nmARHc=",
);
const thirdPartyEncryptionPublicKey = nacl.box.keyPair.fromSecretKey(
  thirdPartyEncryptionSecretKey,
).publicKey;
const _thirdPartyAuthenticationSecretKey = Base64Codec.decode(
  "USuwbCHE3W6fjXjCbO2nhVy9FzGxu50eb8WjX0/WkE53GwJHyqL0FJ2RlLj1R/dGU6C3kEHb42IGAE90h/V3nQ==",
);
const thirdPartyAuthenticationPublicKey = nacl.sign.keyPair.fromSecretKey(
  _thirdPartyAuthenticationSecretKey,
).publicKey;
const issuerEncryptionSecretKey = Base64Codec.decode(
  "an+BxujIwAkhxZeakZ+xYkATzBzBo3LMlPDfuuOZ7UU=",
);
const issuerEncryptionPublicKey =
  nacl.box.keyPair.fromSecretKey(issuerEncryptionSecretKey).publicKey;
const issuerAttestationSecretKey = Base64Codec.decode(
  "EDCS5ZjMAfLXHu2KDkmnNt6GMYRppQRboXUZO0+mIuLw9vnMMzDinxfhfrKpbixDIKpmcwEqBpiNPucSa3mHyA==",
);
const issuerAuthenticationSecretKey = Base64Codec.decode(
  "61TOYtmsLHxDqLNRuDsMFJdo4j9FFESkWFIFfBlxZPFzyPPuLS9svU3RX5JsYL18oHzomPKpNuKCsvXrPzc1Ow==",
);

export const inserter_Issuer_Permissioned = async (
  credential: InsertableIdosCredential2,
  inserterAuthenticationSecretKey: Uint8Array,
) => {
  const issuerConfig = await issuerConfigBuild(inserterAuthenticationSecretKey);

  return createCredentialPermissioned2(issuerConfig, credential);
};

const test__inserter_Issuer_Permissioned = async () => {
  process.env.IDOS_NODE_URL = "http://localhost:8484";

  const result = await inserter_Issuer_Permissioned(
    issuer(
      idvData(),
      humanId,
      userEncryptionPublicKey,
      issuerEncryptionSecretKey,
      issuerAttestationSecretKey,
      issuerAuthenticationSecretKey,
    ),
    issuerAuthenticationSecretKey,
  );
  const content = JSON.parse(
    Utf8Codec.decode(
      decrypt(
        Base64Codec.decode(result.content),
        issuerEncryptionPublicKey,
        userEncryptionSecretKey,
      ),
    ),
  );

  if (JSON.stringify(content.credentialSubject) !== JSON.stringify(idvData()))
    throw new Error("didn't get back the same");
};
//await test__inserter_Issuer_Permissioned()

export const inserter_Issuer_WriteGrant = async (
  credential: InsertableIdosCredential2,
  inserterAuthenticationSecretKey: Uint8Array,
) => {
  const issuerConfig = await issuerConfigBuild(inserterAuthenticationSecretKey);

  return createCredentialByGrant2(issuerConfig, credential);
};

const test__inserter_Issuer_WriteGrant = async () => {
  process.env.IDOS_NODE_URL = "http://localhost:8484";

  const result = await inserter_Issuer_WriteGrant(
    issuer(
      idvData(),
      humanId,
      userEncryptionPublicKey,
      issuerEncryptionSecretKey,
      issuerAttestationSecretKey,
      issuerAuthenticationSecretKey,
    ),
    issuerAuthenticationSecretKey,
  );
  const content = JSON.parse(
    Utf8Codec.decode(
      decrypt(
        Base64Codec.decode(result.content),
        issuerEncryptionPublicKey,
        userEncryptionSecretKey,
      ),
    ),
  );

  if (JSON.stringify(content.credentialSubject) !== JSON.stringify(idvData()))
    throw new Error("didn't get back the same");
};
//await test__inserter_Issuer_WriteGrant()

export const inserter_Issuer_WriteGrant_Share = async (
  idvData: IdvDataResult,
  humanId: string,
  inserterAuthenticationSecretKey: Uint8Array,
  locked_until: number,
  grantee: string,
  userEncryptionPublicKey: Uint8Array,
  granteeEncryptionPublicKey: Uint8Array,
  issuerEncryptionSecretKey: Uint8Array,
  issuerAttestationSecretKey: Uint8Array,
  issuerAuthenticationSecretKey: Uint8Array,
) => {
  const issuerConfig = await issuerConfigBuild(inserterAuthenticationSecretKey);

  const plaintextContent = makeW3cCredential(idvData, issuerAttestationSecretKey);
  const publicNotes = makePublicNotes(plaintextContent);

  const credential: idOSCredential2 = await createCredentialByGrant2(
    issuerConfig,
    buildInsertableIdosCredential2(
      issuerEncryptionSecretKey,
      issuerAuthenticationSecretKey,
      humanId,
      JSON.stringify(publicNotes),
      toBytes(plaintextContent),
      userEncryptionPublicKey, // Notice this is for the user.
    ),
  );

  return shareCredentialByGrant2(issuerConfig, {
    ...buildInsertableIdosCredential2(
      issuerEncryptionSecretKey,
      issuerAuthenticationSecretKey,
      humanId,
      "", // No public notes: they must be empty for shares.
      toBytes(plaintextContent), // Same content as before.
      granteeEncryptionPublicKey, // Notice this is for the grantee, not the user.
    ),
    original_credential_id: credential.id,
    grantee,
    locked_until,
  });
};

const test__inserter_Issuer_WriteGrant_Share = async () => {
  process.env.IDOS_NODE_URL = "http://localhost:8484";

  const result = await inserter_Issuer_WriteGrant_Share(
    idvData(),
    humanId,
    issuerAuthenticationSecretKey,
    0, //locked_until,
    HexCodec.encode(thirdPartyAuthenticationPublicKey, true), // grantee,
    userEncryptionPublicKey,
    thirdPartyEncryptionPublicKey,
    issuerEncryptionSecretKey,
    issuerAttestationSecretKey,
    issuerAuthenticationSecretKey,
  );

  const content = JSON.parse(
    Utf8Codec.decode(
      decrypt(
        Base64Codec.decode(result.content),
        issuerEncryptionPublicKey,
        thirdPartyEncryptionSecretKey,
      ),
    ),
  );

  if (JSON.stringify(content.credentialSubject) !== JSON.stringify(idvData()))
    throw new Error("didn't get back the same");
};
// await test__inserter_Issuer_WriteGrant_Share()

import { idOS } from "@idos-network/idos-sdk";
import type { idOSCredential2 } from "@idos-network/idos-sdk-types";

export const inserter_Human = async (credential: InsertableIdosCredential2) => {
  const idos = await idOS.init({ enclaveOptions: { container: "" } });
  // biome-ignore lint/suspicious/noExplicitAny: Let's pretend this was correctly initialized
  await idos.setSigner("EVM", {} as any);

  return idos.data.create<idOSCredential2>("credential2s", credential);
};
