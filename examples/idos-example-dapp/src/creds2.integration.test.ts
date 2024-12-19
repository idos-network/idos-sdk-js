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

const issuerCredentialId = "something that makes sense for a VC";

const makeW3cCredential = (idvData: object, issuerAttestationSecretKey: Uint8Array) => {
  const protoW3cVc = {
    id: issuerCredentialId,
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
  return { id: plaintextW3cVc.id, riskScore: 4 };
};

export const issuer_makeUserCredential = (
  idvData: IdvDataResult,
  userId: string,
  receiverEncryptionPublicKey: Uint8Array,
  issuerAttestationSecretKey: Uint8Array,
) => {
  const plaintextContent = makeW3cCredential(idvData, issuerAttestationSecretKey);

  // TODO: creds2: revocations: the issuer shouldn't have to care about building public notes.
  // They might decide they want control over this, but that's not the common case we're gonna support.
  const publicNotes = makePublicNotes(plaintextContent);

  return {
    userId,
    publicNotes: JSON.stringify(publicNotes),
    plaintextContent: toBytes(plaintextContent),
    receiverEncryptionPublicKey,
  };
};

export const issuer_makeUserCredentialForSharing = (
  idvData: IdvDataResult,
  userId: string,
  receiverEncryptionPublicKey: Uint8Array,
  issuerAttestationSecretKey: Uint8Array,
  originalCredentialId: string,
  grantee: string,
  lockedUntil: number,
) => {
  const plaintextContent = makeW3cCredential(idvData, issuerAttestationSecretKey);

  return {
    userId,
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
  type IssuerConfig,
  createIssuerConfig,
} from "@idos-network/issuer-sdk-js/create-issuer-config";
import {
  createCredentialByGrant,
  createCredentialPermissioned,
  editCredential,
  shareCredentialByGrant,
} from "@idos-network/issuer-sdk-js/credentials";

const userId = "bf8709ce-9dfc-11ef-a188-047c16570806";
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

const issuerConfigBuild = async (): Promise<IssuerConfig> => {
  process.env.IDOS_NODE_URL ??= "http://localhost:8484";

  return createIssuerConfig({
    nodeUrl: process.env.IDOS_NODE_URL,
    signingKeyPair: nacl.sign.keyPair.fromSecretKey(issuerAuthenticationSecretKey),
    encryptionKeyPair: nacl.box.keyPair.fromSecretKey(issuerEncryptionSecretKey),
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
    userId,
    userEncryptionPublicKey,
    issuerAttestationSecretKey,
  );

  const result = await createCredentialPermissioned(issuerConfig, credential);

  assertCredentialDecryptedContent(getIdvData(), result.content, userEncryptionSecretKey);

  console.log("✅ createCredentialPermissioned");
})();

await (async () => {
  const issuerConfig = await issuerConfigBuild();
  const credential = issuer_makeUserCredential(
    getIdvData(),
    userId,
    userEncryptionPublicKey,
    issuerAttestationSecretKey,
  );

  const result = await createCredentialByGrant(issuerConfig, credential);

  assertCredentialDecryptedContent(getIdvData(), result.content, userEncryptionSecretKey);

  console.log("✅ createCredentialByGrant");
})();

await (async () => {
  const issuerConfig = await issuerConfigBuild();
  const insertedCredential = await createCredentialByGrant(
    issuerConfig,
    issuer_makeUserCredential(
      getIdvData(),
      userId,
      userEncryptionPublicKey,
      issuerAttestationSecretKey,
    ),
  );
  const sharedCredential = issuer_makeUserCredentialForSharing(
    getIdvData(),
    userId,
    thirdPartyEncryptionPublicKey,
    issuerAttestationSecretKey,
    insertedCredential.id,
    Base64Codec.encode(thirdPartyAuthenticationPublicKey),
    0,
  );

  const result = await shareCredentialByGrant(issuerConfig, sharedCredential);

  assertCredentialDecryptedContent(getIdvData(), result.content, _thirdPartyEncryptionSecretKey);

  console.log("✅ shareCredentialByGrant");
})();

await (async () => {
  const issuerConfig = await issuerConfigBuild();
  const credential = issuer_makeUserCredential(
    getIdvData(),
    userId,
    userEncryptionPublicKey,
    issuerAttestationSecretKey,
  );

  await createCredentialPermissioned(issuerConfig, credential);

  await editCredential(issuerConfig, {
    publicNotesId: issuerCredentialId,
    publicNotes: '{"herp": "derp"}',
  });

  console.log("✅ editCredential");
})();
