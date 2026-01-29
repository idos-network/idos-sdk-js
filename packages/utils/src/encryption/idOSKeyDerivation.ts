import { scrypt } from "scrypt-js";
import { utf8Encode } from "../codecs";

/*
 * normalizePassword
 *    Unicode normalization of input strings
 *    NFKC: compatibility decomposition followed by canonical composition
 * validateSalt
 *    UUID v4 format (idOS user IDs)
 * n, r, p
 *    CPU/RAM cost (higher = costlier)
 *    n: iteration count
 *    r: block size
 *    p: parallelism factor
 * dkLen
 *    length of derived key (bytes)
 */

const latestVersion = 0.1;
const allowedVersions = [0, 0.1];

// cspell:words uuidv4Regex
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
  salt,
  version = latestVersion,
}: IdOSKeyDerivationParams): Promise<Uint8Array> => {
  const { validateSalt, normalizePassword, n, r, p, dkLen } = kdfConfig(version);

  if (!validateSalt(salt)) throw new Error("Invalid salt");

  password = normalizePassword(password);
  const passwordBytes = utf8Encode(password);
  const saltBytes = utf8Encode(salt);

  return scrypt(passwordBytes, saltBytes, n, r, p, dkLen);
};
