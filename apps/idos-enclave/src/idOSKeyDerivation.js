import scrypt from "scrypt-js";

const Config = {
  // UUID v4 format (idOS human IDs)
  uuidFormat: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,

  // Unicode normalization of input strigs
  // NFKC: compatibility decomposition followed by canonical composition
  unicodeNormalizationForm: "NFKC", 

  // CPU/RAM cost (higher = costlier)
  // n: iteration count
  // r: block size
  // p: parallelistm factor
  n: 16384,
  r: 8,
  p: 1,

  // Output size (bytes)
  dkLen: 32, // derived key length
};

const assertValidSalt = (str) => {
  if (Config.uuidFormat.test(str) !== true) throw new Error("Invalid salt");
};

const normalize = (str) => {
  return str.normalize(Config.unicodeNormalizationForm);
};

const bytesFrom = (str) => {
  return new TextEncoder().encode(str);
}

export const idOSKeyDerivation = async (password, salt) => {
  assertValidSalt(salt);

  const { n, r, p, dkLen } = Config;

  [password, salt] = [password, salt].map(str => bytesFrom(normalize(str)));

  return await scrypt.scrypt(password, salt, n, r, p, dkLen);
};
