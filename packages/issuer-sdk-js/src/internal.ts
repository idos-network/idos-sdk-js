import { Utils } from "@kwilteam/kwil-js";
import * as base64 from "@stablelib/base64";
import { encode } from "@stablelib/utf8";
import { scrypt } from "scrypt-js";
import nacl from "tweetnacl";

export function ensureEntityId<T extends { id?: string }>(entity: T): { id: string } & T {
  return {
    ...entity,
    id: entity.id ?? crypto.randomUUID(),
  };
}

// biome-ignore lint/suspicious/noExplicitAny: Using `any` is fine over here as we don't need to be strict about types being passed in.
export function createActionInput(params: Record<string, any>): Utils.ActionInput {
  const payload = ensureEntityId(params);
  const prefixedEntries = Object.entries(payload).map(([key, value]) => [`$${key}`, value]);
  const prefixedObject = Object.fromEntries(prefixedEntries);
  return Utils.ActionInput.fromObject(prefixedObject);
}

export async function encrypt(
  message: Uint8Array,
  encryptionPublicKey: Uint8Array,
  secretKey: Uint8Array,
) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const encrypted = nacl.box(message, nonce, encryptionPublicKey, secretKey);

  if (encrypted === null)
    throw Error(
      `Couldn't encrypt. ${JSON.stringify(
        {
          message: base64.encode(message),
          nonce: base64.encode(nonce),
          receiverPublicKey: base64.encode(encryptionPublicKey),
        },
        null,
        2,
      )}`,
    );

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce, 0);
  fullMessage.set(encrypted, nonce.length);
  return base64.encode(fullMessage);
}

const latestVersion = 0.1;
const allowedVersions = [0, 0.1];

const uuidv4Regex = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

interface KDFConfig {
  normalizePassword: (password: string) => string;
  validateSalt: (salt: string) => boolean;
  n: number;
  r: number;
  p: number;
  dkLen: number;
}

const kdfConfig = (version: number = latestVersion): KDFConfig => {
  if (!allowedVersions.includes(version)) throw new Error("Wrong KDF");

  const versions: { [key: number]: KDFConfig } = {
    0: {
      normalizePassword: (password: string) => password.normalize("NFKC"),
      validateSalt: (salt: string) => uuidv4Regex.test(salt),
      n: 128,
      r: 8,
      p: 1,
      dkLen: 32,
    },
    0.1: {
      normalizePassword: (password: string) => password.normalize("NFKC"),
      validateSalt: (salt: string) => uuidv4Regex.test(salt),
      n: 16384,
      r: 8,
      p: 1,
      dkLen: 32,
    },
  };

  return versions[version];
};

interface IdOSKeyDerivationParams {
  password: string;
  salt: string;
  version?: number;
}

export const idOSKeyDerivation = async ({
  password,
  salt = crypto.randomUUID(),
  version = latestVersion,
}: IdOSKeyDerivationParams): Promise<Uint8Array> => {
  const { validateSalt, normalizePassword, n, r, p, dkLen } = kdfConfig(version);

  if (!validateSalt(salt)) throw new Error("Invalid salt");

  password = normalizePassword(password);
  const passwordBytes = encode(password);
  const saltBytes = encode(salt);

  return scrypt(passwordBytes, saltBytes, n, r, p, dkLen);
};
