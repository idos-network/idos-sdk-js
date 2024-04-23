import * as Utf8Codec from "@stablelib/utf8";
import scrypt from "scrypt-js";

/*
 * normalizePassword
 *    Unicode normalization of input strigs
 *    NFKC: compatibility decomposition followed by canonical composition
 * validateSalt
 *    UUID v4 format (idOS human IDs)
 * n, r, p
 *    CPU/RAM cost (higher = costlier)
 *    n: iteration count
 *    r: block size
 *    p: parallelistm factor
 * dkLen
 *    length of derived key (bytes)
 */

const latestVersion = 0.1;
const allowedVersions = [0, 0.1];

const uuidv4Regex = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const kdfConfig = (version = latestVersion) => {
  if (!allowedVersions.includes(version)) throw new Error("Wrong KDF");

  const versions = {};

  versions[0] = {
    normalizePassword: (password) => password.normalize("NFKC"),
    validateSalt: uuidv4Regex.test.bind(uuidv4Regex),
    n: 128,
    r: 8,
    p: 1,
    dkLen: 32,
  };

  versions[0.1] = {
    ...versions[0],

    n: 16384,
  };

  return versions[version];
};

export const idOSKeyDerivation = async ({ password, salt, version }) => {
  const { validateSalt, normalizePassword } = kdfConfig();

  if (validateSalt(salt) !== true) throw new Error("Invalid salt");
  password = normalizePassword(password);
  [password, salt] = [password, salt].map(Utf8Codec.encode);
  const { n, r, p, dkLen } = kdfConfig();

  return scrypt.scrypt(password, salt, n, r, p, dkLen);
};
