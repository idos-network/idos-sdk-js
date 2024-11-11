import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import { flow } from "es-toolkit";
import nacl from "tweetnacl";

// utils
type JsonArg = Parameters<typeof JSON.stringify>[0];
const toBytes = (obj: JsonArg): Uint8Array => Utf8Codec.encode(JSON.stringify(obj));

const flowValue = (value, ...funcs) => flow(...funcs)(value);

const decrypt = (
  fullMessage: Uint8Array,
  senderPublicKey: Uint8Array,
  receiverSecretKey: Uint8Array,
): Uint8Array => {
  const nonce = fullMessage.slice(0, nacl.box.nonceLength);
  const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);
  const decrypted = nacl.box.open(message, nonce, senderPublicKey, receiverSecretKey);

  if (decrypted === null) throw Error(`Couldn't decrypt.`);

  return decrypted;
};

// # issuer backend, idOS independent
interface IdvDataResult {
  pii: {
    numberOfLimbs: string;
  };
  verificationStatus: string;
}

export const getIdvData = (): IdvDataResult => {
  return {
    pii: {
      numberOfLimbs: "4",
    },
    verificationStatus: "approved",
  };
};

const makeW3cCredential = (idvData: object, issuerAttestationSecretKey: Uint8Array) => {
  const protoW3cVc = {
    id: "something that makes sense for a VC",
    context: ["etc"],
    credentialSubject: idvData,
  };

  return {
    ...protoW3cVc,
    // nacl.sign is not the right thing to call, but it's enough for us to show that
    // the wires add up.
    proof: Base64Codec.encode(nacl.sign.detached(toBytes(protoW3cVc), issuerAttestationSecretKey)),
  };
};

const makePublicNotes = (plaintextW3cVc: ReturnType<typeof makeW3cCredential>): object => {
  return { credentialId: plaintextW3cVc.id, riskScore: 4 };
};

export const issuer_makeUserCredential = (
  idvData: IdvDataResult,
  humanId: string,
  receiverEncryptionPublicKey: Uint8Array,
  issuerAttestationSecretKey: Uint8Array,
) => {
  const plaintextContent = makeW3cCredential(idvData, issuerAttestationSecretKey);
  const publicNotes = makePublicNotes(plaintextContent);

  return {
    humanId,
    publicNotes: JSON.stringify(publicNotes),
    plaintextContent: toBytes(plaintextContent),
    receiverEncryptionPublicKey,
  };
};

export const issuer_makeUserCredentialForSharing = (
  idvData: IdvDataResult,
  humanId: string,
  receiverEncryptionPublicKey: Uint8Array,
  issuerAttestationSecretKey: Uint8Array,
  originalCredentialId: string,
  grantee: string,
  lockedUntil: number,
) => {
  const plaintextContent = makeW3cCredential(idvData, issuerAttestationSecretKey);

  return {
    humanId,
    publicNotes: "",
    plaintextContent: toBytes(plaintextContent),
    receiverEncryptionPublicKey,
    originalCredentialId,
    grantee,
    lockedUntil,
  };
};

// # issuer backend, idOS aware
import {
  type IssuerConfig2,
  createIssuerConfig2,
} from "@idos-network/issuer-sdk-js/create-issuer-config";
import {
  createCredentialByGrant2,
  createCredentialPermissioned2,
  shareCredentialByGrant2,
} from "@idos-network/issuer-sdk-js/credentials";

const humanId = "bf8709ce-9dfc-11ef-a188-047c16570806";
const userEncryptionSecretKey = Base64Codec.decode("nIvx0jPbA8d83rL+I7Vs1B/Fp6pndGtXOX4GDmlEkSQ=");
const userEncryptionPublicKey = nacl.box.keyPair.fromSecretKey(userEncryptionSecretKey).publicKey;
const _thirdPartyEncryptionSecretKey = Base64Codec.decode(
  "2u5dLWF8nDLTAt7bgeVUsRw7h4IazpLMYLVN5nmARHc=",
);
const thirdPartyEncryptionPublicKey = nacl.box.keyPair.fromSecretKey(
  _thirdPartyEncryptionSecretKey,
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

const issuerConfigBuild = async (): Promise<IssuerConfig2> => {
  process.env.IDOS_NODE_URL ??= "http://localhost:8484";

  return createIssuerConfig2({
    nodeUrl: process.env.IDOS_NODE_URL,
    signer: nacl.sign.keyPair.fromSecretKey(issuerAuthenticationSecretKey),
    encrypter: nacl.box.keyPair.fromSecretKey(issuerEncryptionSecretKey),
  });
};

const assertCredentialDecryptedContent = (
  expectedCredentialSubject: unknown,
  actualContentEncrypted: string,
  receiverEncryptionSecretKey: Uint8Array,
) => {
  const content = flowValue(
    actualContentEncrypted,
    Base64Codec.decode,
    (_) => decrypt(_, issuerEncryptionPublicKey, receiverEncryptionSecretKey),
    Utf8Codec.decode,
    JSON.parse,
  );

  if (JSON.stringify(content.credentialSubject) !== JSON.stringify(expectedCredentialSubject))
    throw new Error("didn't get back the same");
};

await (async () => {
  const issuerConfig = await issuerConfigBuild();
  const credential = issuer_makeUserCredential(
    getIdvData(),
    humanId,
    userEncryptionPublicKey,
    issuerAttestationSecretKey,
  );

  const result = await createCredentialPermissioned2(issuerConfig, credential);

  assertCredentialDecryptedContent(getIdvData(), result.content, userEncryptionSecretKey);

  console.log("✅ createCredentialPermissioned2");
})();

await (async () => {
  const issuerConfig = await issuerConfigBuild();
  const credential = issuer_makeUserCredential(
    getIdvData(),
    humanId,
    userEncryptionPublicKey,
    issuerAttestationSecretKey,
  );

  const result = await createCredentialByGrant2(issuerConfig, credential);

  assertCredentialDecryptedContent(getIdvData(), result.content, userEncryptionSecretKey);

  console.log("✅ createCredentialByGrant2");
})();

await (async () => {
  const issuerConfig = await issuerConfigBuild();
  const insertedCredential = await createCredentialByGrant2(
    issuerConfig,
    issuer_makeUserCredential(
      getIdvData(),
      humanId,
      userEncryptionPublicKey,
      issuerAttestationSecretKey,
    ),
  );
  const sharedCredential = issuer_makeUserCredentialForSharing(
    getIdvData(),
    humanId,
    thirdPartyEncryptionPublicKey,
    issuerAttestationSecretKey,
    insertedCredential.id,
    Base64Codec.encode(thirdPartyAuthenticationPublicKey),
    0,
  );

  const result = await shareCredentialByGrant2(issuerConfig, sharedCredential);

  assertCredentialDecryptedContent(getIdvData(), result.content, _thirdPartyEncryptionSecretKey);

  console.log("✅ shareCredentialByGrant2");
})();
